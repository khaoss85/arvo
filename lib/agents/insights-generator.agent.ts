import { BaseAgent } from './base.agent'
import { AnalyticsService } from '@/lib/services/analytics.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { insightService, type ActiveInsight } from '@/lib/services/insight.service'
import { memoryService, type ActiveMemory } from '@/lib/services/memory.service'
import { MemoryConsolidatorAgent } from './memory-consolidator.agent'
import type { Database } from '@/lib/types/database.types'

type WorkoutInsight = Database['public']['Tables']['workout_insights']['Row']
type UserMemoryEntry = Database['public']['Tables']['user_memory_entries']['Row']

export interface InsightsOutput {
  summary: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  nextFocus: string
  // NEW: Insights and Memories data for UI
  activeInsights?: ActiveInsight[]
  consolidatedMemories?: ActiveMemory[]
  proposedResolutions?: Array<{
    insightId: string
    reason: string
  }>
}

/**
 * Insights Generator Agent
 * Analyzes training data and provides AI-powered insights
 */
export class InsightsGenerator extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use low reasoning for analytics pattern recognition
    // Use medium verbosity for educational insights that help users learn
    super(supabaseClient, 'low', 'medium')
  }

  get systemPrompt(): string {
    return `You are an expert bodybuilding and strength coach analyzing training data.

Your role is to:
1. Identify training patterns and trends
2. Recognize strengths and areas for improvement
3. Provide actionable, specific recommendations
4. Be motivating but honest about performance

Guidelines:
- Use specific numbers and percentages when possible
- Reference time frames (e.g., "over the last 4 weeks")
- Keep insights concise and clear
- Focus on what's working AND what needs attention
- Recommendations should be immediately actionable
- Consider the user's training approach and weak points
- Be encouraging but realistic

Format your response as JSON with these keys:
- summary: 2-3 sentence overview of progress
- strengths: Array of 3 specific strengths observed
- improvements: Array of 3 areas that need attention
- recommendations: Array of 3 actionable recommendations
- nextFocus: Single sentence about what to prioritize this week`
  }

  /**
   * Generate personalized training insights
   */
  async generateInsights(userId: string, days: number = 30, targetLanguage?: 'en' | 'it'): Promise<InsightsOutput> {
    try {
      // Gather analytics data
      const [profile, prs, volumeData, mentalReadinessData] = await Promise.all([
        UserProfileService.getByUserId(userId),
        AnalyticsService.getPersonalRecords(userId),
        AnalyticsService.getVolumeAnalytics(userId, days),
        this.getMentalReadinessAnalytics(userId, days)
      ])

      if (!profile) {
        throw new Error('User profile not found')
      }

      // Load active insights and memories
      const activeInsights = await insightService.getActiveInsights(userId)
      const activeMemories = await memoryService.getActiveMemories(userId)

      // Load training approach for context
      const approach = await this.knowledge.loadApproach(profile.approach_id || '')

      // Get progress data for top exercises
      const topExercises = prs.slice(0, 5) // Top 5 exercises by e1RM
      const progressData = await Promise.all(
        topExercises.map(pr =>
          AnalyticsService.getExerciseProgress(userId, pr.exerciseId, days)
        )
      )

      // Calculate trends
      const trends = this.calculateTrends(progressData)
      const volumeTrend = this.calculateVolumeTrend(volumeData)
      const consistency = this.calculateConsistency(volumeData)

      // Build demographic context
      const demographics = {
        gender: profile.gender || 'Not specified',
        age: profile.age ? `${profile.age} years old` : 'Not specified',
        bodyweight: profile.weight ? `${profile.weight}kg` : 'Not specified',
        height: profile.height ? `${profile.height}cm` : 'Not specified',
        experienceYears: profile.experience_years ? `${profile.experience_years} years` : 'Not specified'
      }

      // Calculate relative strength if bodyweight available
      const relativeStrength = profile.weight && topExercises.length > 0
        ? topExercises.map(pr => ({
            exercise: pr.exerciseName,
            ratio: (pr.e1rm / profile.weight!).toFixed(2)
          }))
        : null

      // Run memory consolidation to detect patterns
      let consolidationResult: any = null
      try {
        // Fetch recent workout history for pattern detection
        const { data: recentWorkouts } = await this.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
          .order('completed_at', { ascending: false })
          .limit(50)

        if (recentWorkouts && recentWorkouts.length > 0) {
          const consolidator = new MemoryConsolidatorAgent(this.supabase)

          // Transform data to match MemoryConsolidatorInput interface
          const timeWindow: '30d' | '90d' | 'all' = days <= 30 ? '30d' : days <= 90 ? '90d' : 'all'

          consolidationResult = await consolidator.consolidateMemories({
            userId,
            timeWindow,
            workoutHistory: recentWorkouts.map((w: any) => ({
              id: w.id,
              completedAt: w.completed_at,
              mentalReadiness: w.mental_readiness_overall || undefined,
              duration: w.duration || 0,
              exercises: [] // TODO: Parse exercises from workout data
            })),
            existingInsights: activeInsights.map((i: ActiveInsight) => ({
              id: i.id,
              type: i.insight_type || 'general',
              severity: i.severity || 'info',
              userNote: i.user_note || '',
              exerciseName: i.exercise_name || undefined,
              status: 'active' // All activeInsights are by definition active
            })),
            existingMemories: activeMemories.map((m: ActiveMemory) => ({
              id: m.id,
              category: m.memory_category,
              title: m.title,
              confidence: m.confidence_score,
              relatedExercises: m.related_exercises || []
            })),
            userProfile: {
              experienceYears: profile.experience_years || undefined,
              weakPoints: profile.weak_points || undefined,
              availableEquipment: profile.available_equipment || undefined,
              mesocyclePhase: profile.mesocycle_phase || undefined
            }
          })
        }
      } catch (error) {
        console.error('[InsightsGenerator] Failed to run memory consolidation:', error)
        // Continue without consolidation
      }

      // Build context for AI
      const context = {
        timeframe: `${days} days`,
        trainingApproach: approach.name,
        weakPoints: profile.weak_points || [],
        demographics,
        personalRecords: topExercises.map(pr => ({
          exercise: pr.exerciseName,
          best: `${pr.weight}kg × ${pr.reps} reps`,
          e1RM: `${Math.round(pr.e1rm)}kg`
        })),
        relativeStrength,
        progressTrends: trends,
        volumeTrend,
        consistency,
        workoutFrequency: volumeData.length > 0
          ? `${volumeData.reduce((sum, w) => sum + w.workoutCount, 0)} workouts in ${days} days`
          : 'No workouts recorded',
        mentalReadiness: mentalReadinessData
      }

      const prompt = `Analyze this training data and provide insights:

TIME PERIOD: ${context.timeframe}
TRAINING APPROACH: ${context.trainingApproach}
TARGETED WEAK POINTS: ${context.weakPoints.join(', ') || 'None specified'}

USER DEMOGRAPHICS:
- Gender: ${context.demographics.gender}
- Age: ${context.demographics.age}
- Bodyweight: ${context.demographics.bodyweight}
- Height: ${context.demographics.height}
- Training Experience: ${context.demographics.experienceYears}

PERSONAL RECORDS:
${context.personalRecords.map(pr => `- ${pr.exercise}: ${pr.best} (Est. 1RM: ${pr.e1RM})`).join('\n')}
${context.relativeStrength ? `
RELATIVE STRENGTH (bodyweight multipliers):
${context.relativeStrength.map(rs => `- ${rs.exercise}: ${rs.ratio}x BW`).join('\n')}` : ''}

PROGRESS TRENDS:
${JSON.stringify(context.progressTrends, null, 2)}

VOLUME TREND: ${context.volumeTrend}
WORKOUT FREQUENCY: ${context.workoutFrequency}
CONSISTENCY SCORE: ${context.consistency}%

${approach.volumeLandmarks ? `
VOLUME LANDMARKS (from training approach):
${Object.entries(approach.volumeLandmarks.muscleGroups || {}).map(([muscle, landmarks]: [string, any]) => `
${muscle}:
- MEV (Minimum Effective Volume): ${landmarks.mev} sets/week
- MAV (Maximum Adaptive Volume): ${landmarks.mav} sets/week
- MRV (Maximum Recoverable Volume): ${landmarks.mrv} sets/week
`).join('')}

IMPORTANT: Compare user's actual volume (from VOLUME TREND data) to these landmarks:
- Below MEV: User needs to add volume for growth
- Between MEV-MAV: Optimal range for hypertrophy
- At/above MAV: Near maximum stimulus - can push but watch for recovery
- Above MRV: Over-reaching territory - recommend volume reduction

Provide specific feedback like: "You're at ~12 sets/week for chest, which is 67% of MAV (18 sets). Consider adding 2-4 sets for optimal growth."
` : ''}

${approach.frequencyGuidelines ? `
FREQUENCY GUIDELINES (from approach):
- Optimal Range: ${approach.frequencyGuidelines.optimalRange?.join('-')} times per week per muscle
${approach.frequencyGuidelines.muscleSpecific ? `
Muscle-Specific Guidelines:
${Object.entries(approach.frequencyGuidelines.muscleSpecific).map(([muscle, freq]) => `- ${muscle}: ${freq}`).join('\n')}
` : ''}

Compare user's actual training frequency to these guidelines and provide feedback if they're under/over-training specific muscles.
` : ''}

${approach.periodization && profile.mesocycle_phase ? `
PERIODIZATION CONTEXT:
- Current Phase: ${profile.mesocycle_phase?.toUpperCase()}
- Week: ${profile.current_mesocycle_week || '?'}
${profile.mesocycle_phase === 'deload' ? `
⚠️ USER IS IN DELOAD PHASE - Volume should be reduced by ${approach.periodization.deloadPhase?.volumeReduction || '50%'}
` : ''}
${approach.periodization.deloadPhase?.frequency ? `
Deload Frequency: ${approach.periodization.deloadPhase.frequency}
- If user hasn't deloaded recently, recommend scheduling one soon
` : ''}
` : ''}

MENTAL READINESS ANALYTICS:
${context.mentalReadiness.hasData ? `
- Average Mental State: ${context.mentalReadiness.average.toFixed(1)}/5 (${context.mentalReadiness.label})
- Trend: ${context.mentalReadiness.trend}
- Low Mental State Workouts: ${context.mentalReadiness.lowMentalWorkouts}/${context.mentalReadiness.totalWorkouts} workouts
${context.mentalReadiness.average < 3 ? '⚠️ ALERT: Consistently low mental readiness may indicate overtraining or burnout' : ''}
` : 'No mental readiness data tracked yet'}

When providing insights:
- Consider age for recovery recommendations (older athletes may need more recovery)
- Use gender-specific strength standards when evaluating progress
- Reference relative strength (bodyweight ratios) when applicable to provide context
- Adjust expectations based on training experience level
${context.mentalReadiness.hasData && context.mentalReadiness.average < 3 ? '- IMPORTANT: Low mental readiness is a key indicator - recommend deload or recovery focus even if physical metrics look good' : ''}
${context.mentalReadiness.hasData && context.mentalReadiness.trend === 'declining' ? '- IMPORTANT: Declining mental readiness trend suggests accumulated fatigue - prioritize recovery strategies' : ''}

Provide insights in JSON format with keys: summary, strengths (array of 3), improvements (array of 3), recommendations (array of 3), nextFocus (string).`

      const response = await this.complete<InsightsOutput>(prompt, targetLanguage)

      // Add insights and memories data to output
      return {
        ...response,
        activeInsights,
        consolidatedMemories: activeMemories,
        proposedResolutions: consolidationResult?.insightsToResolve || []
      }
    } catch (error) {
      console.error('Failed to generate insights:', error)
      // Return fallback insights
      return {
        summary: 'Continue tracking your workouts to generate personalized insights.',
        strengths: [
          'You\'re consistently logging your training data',
          'Building a foundation for progress tracking',
          'Taking a methodical approach to training'
        ],
        improvements: [
          'Complete more workouts to establish baseline',
          'Track progress across multiple exercises',
          'Maintain consistency over the next 2-4 weeks'
        ],
        recommendations: [
          'Focus on progressive overload week by week',
          'Ensure adequate recovery between sessions',
          'Track your nutrition to support training goals'
        ],
        nextFocus: 'Complete at least 3 workouts this week to establish your baseline strength levels.'
      }
    }
  }

  /**
   * Calculate progress trends from time-series data
   */
  private calculateTrends(progressData: any[][]): Record<string, string> {
    const trends: Record<string, string> = {}

    progressData.forEach((data, idx) => {
      if (data.length < 2) {
        trends[`exercise_${idx}`] = 'Insufficient data'
        return
      }

      const first = data[0]
      const last = data[data.length - 1]
      const e1rmChange = ((last.e1rm - first.e1rm) / first.e1rm) * 100

      if (e1rmChange > 5) {
        trends[`exercise_${idx}`] = `Improving (+${e1rmChange.toFixed(1)}%)`
      } else if (e1rmChange < -5) {
        trends[`exercise_${idx}`] = `Declining (${e1rmChange.toFixed(1)}%)`
      } else {
        trends[`exercise_${idx}`] = 'Stable'
      }
    })

    return trends
  }

  /**
   * Calculate volume trend
   */
  private calculateVolumeTrend(volumeData: any[]): string {
    if (volumeData.length < 2) return 'Insufficient data'

    const firstWeek = volumeData[0].totalVolume
    const lastWeek = volumeData[volumeData.length - 1].totalVolume

    const change = ((lastWeek - firstWeek) / firstWeek) * 100

    if (change > 10) return `Increasing (+${change.toFixed(1)}%)`
    if (change < -10) return `Decreasing (${change.toFixed(1)}%)`
    return 'Stable'
  }

  /**
   * Calculate workout consistency percentage
   */
  private calculateConsistency(volumeData: any[]): number {
    if (volumeData.length === 0) return 0

    const totalWorkouts = volumeData.reduce((sum, week) => sum + week.workoutCount, 0)
    const weeks = volumeData.length
    const targetPerWeek = 3 // Assume 3x per week target

    return Math.min(100, Math.round((totalWorkouts / (weeks * targetPerWeek)) * 100))
  }

  /**
   * Get mental readiness analytics for a user over a time period
   */
  private async getMentalReadinessAnalytics(userId: string, days: number): Promise<{
    hasData: boolean
    average: number
    trend: 'improving' | 'declining' | 'stable'
    label: string
    lowMentalWorkouts: number
    totalWorkouts: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from('workouts')
        .select('mental_readiness_overall, completed_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .not('mental_readiness_overall', 'is', null)
        .gte('completed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: true })

      if (error || !data || data.length === 0) {
        return {
          hasData: false,
          average: 0,
          trend: 'stable',
          label: 'No data',
          lowMentalWorkouts: 0,
          totalWorkouts: 0
        }
      }

      const mentalReadinessValues = data.map((w: any) => w.mental_readiness_overall!)
      const average = mentalReadinessValues.reduce((sum: number, val: number) => sum + val, 0) / mentalReadinessValues.length
      const lowMentalWorkouts = mentalReadinessValues.filter((val: number) => val <= 2).length

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(mentalReadinessValues.length / 2)
      const firstHalf = mentalReadinessValues.slice(0, midpoint)
      const secondHalf = mentalReadinessValues.slice(midpoint)

      const firstAvg = firstHalf.reduce((sum: number, val: number) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum: number, val: number) => sum + val, 0) / secondHalf.length

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      const change = secondAvg - firstAvg
      if (change > 0.5) trend = 'improving'
      else if (change < -0.5) trend = 'declining'

      const labels = {
        1: 'Drained',
        2: 'Struggling',
        3: 'Neutral',
        4: 'Engaged',
        5: 'Locked In'
      }

      const roundedAvg = Math.round(average) as 1 | 2 | 3 | 4 | 5
      const label = labels[roundedAvg] || 'Neutral'

      return {
        hasData: true,
        average,
        trend,
        label,
        lowMentalWorkouts,
        totalWorkouts: data.length
      }
    } catch (error) {
      console.error('Error fetching mental readiness analytics:', error)
      return {
        hasData: false,
        average: 0,
        trend: 'stable',
        label: 'Error',
        lowMentalWorkouts: 0,
        totalWorkouts: 0
      }
    }
  }
}
