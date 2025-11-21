import { BaseAgent } from './base.agent'
import { AnalyticsService } from '@/lib/services/analytics.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { insightService, type ActiveInsight } from '@/lib/services/insight.service'
import { memoryService, type ActiveMemory } from '@/lib/services/memory.service'
import { MemoryConsolidatorAgent } from './memory-consolidator.agent'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import type { CycleTrendAnalysis, VolumeTrend, MentalReadinessTrend, ConsistencyAnalysis, MuscleBalanceTrend } from '@/lib/types/cycle-trends.types'
import type { Database } from '@/lib/types/database.types'
import { MALE_STANDARDS, FEMALE_STANDARDS, LIFT_NAME_MAPPINGS, type ExperienceLevel, type StrengthStandard } from '@/lib/constants/strength-standards'

type WorkoutInsight = Database['public']['Tables']['workout_insights']['Row']
type UserMemoryEntry = Database['public']['Tables']['user_memory_entries']['Row']
type CycleCompletion = Database['public']['Tables']['cycle_completions']['Row']

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
  // NEW: Multi-cycle trend analysis
  cycleTrends?: CycleTrendAnalysis
  cycleCount?: number
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
5. Personalize feedback using the user's first name when available

Guidelines:
- Use specific numbers and percentages when possible
- Reference time frames (e.g., "over the last 4 weeks")
- Keep insights concise and clear
- Focus on what's working AND what needs attention
- Recommendations should be immediately actionable
- Consider the user's training approach and weak points
- Be encouraging but realistic
- When first name is provided, use it naturally throughout (e.g., "Marco has made excellent progress" instead of "You have made excellent progress")
- Compare user's performance to strength standards when bodyweight is available
- Celebrate achievements relative to their strength level (beginner, intermediate, advanced, elite)

Format your response as JSON with these keys:
- summary: 2-3 sentence overview of progress
- strengths: Array of 3 specific strengths observed
- improvements: Array of 3 areas that need attention
- recommendations: Array of 3 actionable recommendations
- nextFocus: Single sentence about what to prioritize this week`
  }

  /**
   * Calculate strength level comparison to standards
   * @returns Object with lift-specific strength levels and overall assessment
   */
  private calculateStrengthLevel(
    prs: Array<{ exerciseName: string; weight: number; reps: number; e1rm: number; exerciseId: string }>,
    bodyweight: number | null,
    gender: string | null
  ): {
    liftComparisons: Array<{
      exercise: string
      e1rm: number
      level: ExperienceLevel
      ratio: number
      nextLevel: ExperienceLevel | null
      gapToNext: number | null
    }>
    overallLevel: ExperienceLevel
  } | null {
    if (!bodyweight || bodyweight <= 0 || prs.length === 0) {
      return null
    }

    const standards = gender === 'female' ? FEMALE_STANDARDS : MALE_STANDARDS
    const liftComparisons: Array<{
      exercise: string
      e1rm: number
      level: ExperienceLevel
      ratio: number
      nextLevel: ExperienceLevel | null
      gapToNext: number | null
    }> = []

    // Map each PR to a standard lift type and calculate level
    for (const pr of prs.slice(0, 10)) { // Top 10 exercises
      let liftType: keyof typeof LIFT_NAME_MAPPINGS | null = null
      const lowerName = pr.exerciseName.toLowerCase()

      // Find matching lift type
      for (const [type, patterns] of Object.entries(LIFT_NAME_MAPPINGS)) {
        if (patterns.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
          liftType = type as keyof typeof LIFT_NAME_MAPPINGS
          break
        }
      }

      if (!liftType) continue // Skip if not a standard lift

      const ratio = pr.e1rm / bodyweight
      let level: ExperienceLevel = 'beginner'
      let nextLevel: ExperienceLevel | null = null
      let gapToNext: number | null = null

      // Determine level by comparing ratio to standards
      for (let i = standards.length - 1; i >= 0; i--) {
        const standard = standards[i]
        const threshold = standard[liftType as keyof StrengthStandard] as number

        if (ratio >= threshold) {
          level = standard.level
          // Find next level if not already elite
          if (i < standards.length - 1) {
            nextLevel = standards[i + 1].level
            const nextThreshold = standards[i + 1][liftType as keyof StrengthStandard] as number
            gapToNext = ((nextThreshold - ratio) * bodyweight)
          }
          break
        }
      }

      liftComparisons.push({
        exercise: pr.exerciseName,
        e1rm: pr.e1rm,
        level,
        ratio,
        nextLevel,
        gapToNext
      })
    }

    if (liftComparisons.length === 0) return null

    // Calculate overall level (most conservative - lowest level among tracked lifts)
    const levelOrder: ExperienceLevel[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']
    const minLevelIndex = Math.min(
      ...liftComparisons.map(comp => levelOrder.indexOf(comp.level))
    )
    const overallLevel = levelOrder[minLevelIndex]

    return {
      liftComparisons,
      overallLevel
    }
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

      // Load cycle history for multi-cycle trend analysis
      let cycleHistory: CycleCompletion[] = []
      let cycleTrends: CycleTrendAnalysis | null = null

      try {
        if (profile.active_split_plan_id) {
          cycleHistory = await CycleStatsService.getAllCycleCompletions(userId)

          if (cycleHistory.length >= 2) {
            // Calculate multi-cycle trends
            cycleTrends = this.calculateCycleTrends(cycleHistory)
            console.log(`[InsightsGenerator] Loaded ${cycleHistory.length} cycles for trend analysis`)
          }
        }
      } catch (error) {
        console.error('[InsightsGenerator] Failed to load cycle history (non-critical):', error)
        // Continue without cycle analysis - non-critical
      }

      // Build demographic context
      const demographics = {
        firstName: profile.first_name || null,
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

      // Calculate strength level comparison to standards
      const strengthLevel = this.calculateStrengthLevel(
        topExercises,
        profile.weight,
        profile.gender
      )

      // Run memory consolidation to detect patterns
      let consolidationResult: any = null
      try {
        // Fetch recent workout history for pattern detection
        const { data: recentWorkouts } = await this.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
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

      const prompt = `Analyze this training data and provide insights${demographics.firstName ? ` for ${demographics.firstName}` : ''}:

TIME PERIOD: ${context.timeframe}
TRAINING APPROACH: ${context.trainingApproach}
TARGETED WEAK POINTS: ${context.weakPoints.join(', ') || 'None specified'}

USER DEMOGRAPHICS:
${demographics.firstName ? `- Name: ${demographics.firstName}` : ''}
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

${strengthLevel ? `
=== STRENGTH LEVEL COMPARISON TO STANDARDS ===

Overall Strength Classification: **${strengthLevel.overallLevel.toUpperCase()}** (based on ${demographics.gender} standards)

Lift-by-Lift Breakdown:
${strengthLevel.liftComparisons.map(comp => `
- **${comp.exercise}**: ${comp.level.toUpperCase()} level
  • Current e1RM: ${Math.round(comp.e1rm)}kg (${comp.ratio.toFixed(2)}x bodyweight)
  ${comp.nextLevel && comp.gapToNext ? `• To reach ${comp.nextLevel}: Add ~${Math.round(comp.gapToNext)}kg to your 1RM` : '• Already at ELITE level - exceptional strength!'}
`).join('')}

IMPORTANT INSTRUCTIONS FOR STRENGTH BASELINE:
- Use this classification to set realistic expectations and celebrate achievements
- Reference specific lifts when providing feedback (e.g., "${demographics.firstName || 'You'} ${demographics.firstName ? 'has' : 'have'} reached intermediate level on bench press")
- When suggesting progression, consider their current level (beginners progress faster, advanced lifters slower)
- Highlight any lifts that are significantly ahead/behind others as potential focus areas
- Use encouraging language for their current level while providing actionable next steps
${strengthLevel.overallLevel === 'beginner' || strengthLevel.overallLevel === 'novice' ? '- Emphasize that rapid progress is normal at this stage - leverage newbie gains!' : ''}
${strengthLevel.overallLevel === 'intermediate' || strengthLevel.overallLevel === 'advanced' ? '- Acknowledge that progress slows at this level - patience and consistency are key' : ''}
${strengthLevel.overallLevel === 'elite' ? '- Recognize exceptional achievement - focus on maintaining strength and injury prevention' : ''}
` : ''}

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

${cycleTrends ? `
=== MULTI-CYCLE TREND ANALYSIS (${cycleHistory.length} Completed Cycles) ===

VOLUME PROGRESSION TREND:
- Trend: ${cycleTrends.volumeProgression.trend.toUpperCase()}
- Change per cycle: ${cycleTrends.volumeProgression.percentChangePerCycle > 0 ? '+' : ''}${cycleTrends.volumeProgression.percentChangePerCycle.toFixed(1)}%
- Average volume per cycle: ${Math.round(cycleTrends.volumeProgression.averageVolume)}kg
- Latest cycle volume: ${Math.round(cycleTrends.volumeProgression.latestVolume)}kg
- Cycles analyzed: ${cycleTrends.volumeProgression.cyclesAnalyzed}

MENTAL READINESS MULTI-CYCLE TREND:
- Trend: ${cycleTrends.mentalReadinessTrend.trend.toUpperCase()}
${cycleTrends.mentalReadinessTrend.average !== null ? `- Average across cycles: ${cycleTrends.mentalReadinessTrend.average.toFixed(1)}/5` : ''}
${cycleTrends.mentalReadinessTrend.latest !== null ? `- Latest cycle average: ${cycleTrends.mentalReadinessTrend.latest.toFixed(1)}/5` : ''}
${cycleTrends.mentalReadinessTrend.changeFromFirst !== null ? `- Change from first cycle: ${cycleTrends.mentalReadinessTrend.changeFromFirst > 0 ? '+' : ''}${cycleTrends.mentalReadinessTrend.changeFromFirst.toFixed(1)} points` : ''}

WORKOUT CONSISTENCY ACROSS CYCLES:
- Rating: ${cycleTrends.workoutConsistency.rating.toUpperCase()}
- Average workouts per cycle: ${cycleTrends.workoutConsistency.averageWorkoutsPerCycle.toFixed(1)}
- Coefficient of variation: ${cycleTrends.workoutConsistency.coefficientOfVariation.toFixed(1)}% (lower = more consistent)
- Latest cycle workouts: ${cycleTrends.workoutConsistency.latestCycleWorkouts}

MUSCLE GROUP BALANCE TRENDS:
${Object.entries(cycleTrends.muscleBalanceTrends)
  .sort(([, a], [, b]) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
  .slice(0, 8)
  .map(([muscle, trend]) =>
    `- ${muscle}: ${trend.trend.toUpperCase()} (${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}% change, avg ${Math.round(trend.averageVolume)} sets/cycle, latest ${Math.round(trend.latestVolume)} sets)`
  ).join('\n')}

RECENT CYCLE HISTORY (Last 3 cycles):
${cycleHistory.slice(0, 3).map(cycle => {
  const volumeByMuscle = cycle.volume_by_muscle_group as Record<string, number> || {}
  const topMuscles = Object.entries(volumeByMuscle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([muscle, vol]) => `${muscle} (${Math.round(vol)} sets)`)
    .join(', ')

  return `
Cycle #${cycle.cycle_number} (completed ${new Date(cycle.completed_at).toLocaleDateString()}):
  • Total Volume: ${Math.round(cycle.total_volume)}kg
  • Workouts Completed: ${cycle.total_workouts_completed}
  • Mental Readiness: ${cycle.avg_mental_readiness !== null ? cycle.avg_mental_readiness.toFixed(1) + '/5' : 'Not tracked'}
  • Top 3 Muscles: ${topMuscles || 'No data'}`
}).join('\n')}

CYCLE-BASED RECOMMENDATIONS:
${cycleTrends.recommendations.map(rec => `⚠️ ${rec}`).join('\n')}

IMPORTANT INSTRUCTIONS FOR CYCLE ANALYSIS:
- Compare current ${days}-day period to multi-cycle historical trends
- Identify if user is adapting well (volume ↑ + mental readiness stable/improving = good)
- Flag potential overtraining (volume ↑ + mental readiness ↓ = warning sign)
- Highlight muscle groups needing attention based on balance trends
- Reference specific cycle numbers and completion dates for context
- Use historical patterns to validate or question current period data
- Provide recommendations that account for long-term progression patterns

Example insight format:
"Over your last ${cycleHistory.length} cycles, volume has increased ${Math.abs(cycleTrends.volumeProgression.percentChangePerCycle).toFixed(1)}% per cycle while mental readiness ${cycleTrends.mentalReadinessTrend.trend === 'declining' ? 'declined' : cycleTrends.mentalReadinessTrend.trend === 'improving' ? 'improved' : 'stayed stable'}. This ${cycleTrends.mentalReadinessTrend.trend === 'declining' && cycleTrends.volumeProgression.trend === 'increasing' ? 'suggests accumulated fatigue - consider deload' : 'indicates healthy adaptation to training stress'}."
` : ''}

When providing insights:
- Consider age for recovery recommendations (older athletes may need more recovery)
- Use gender-specific strength standards when evaluating progress
- Reference relative strength (bodyweight ratios) when applicable to provide context
- Adjust expectations based on training experience level
${demographics.firstName ? `- IMPORTANT: Use "${demographics.firstName}" (first name) throughout your insights to personalize the feedback. Make it conversational and engaging.` : '- Use "you" throughout the insights to maintain engagement.'}
${context.mentalReadiness.hasData && context.mentalReadiness.average < 3 ? '- IMPORTANT: Low mental readiness is a key indicator - recommend deload or recovery focus even if physical metrics look good' : ''}
${context.mentalReadiness.hasData && context.mentalReadiness.trend === 'declining' ? '- IMPORTANT: Declining mental readiness trend suggests accumulated fatigue - prioritize recovery strategies' : ''}

Provide insights in JSON format with keys: summary, strengths (array of 3), improvements (array of 3), recommendations (array of 3), nextFocus (string).`

      const response = await this.complete<InsightsOutput>(prompt, targetLanguage)

      // Add insights and memories data to output
      return {
        ...response,
        activeInsights,
        consolidatedMemories: activeMemories,
        proposedResolutions: consolidationResult?.insightsToResolve || [],
        // Add cycle trends if available
        cycleTrends: cycleTrends || undefined,
        cycleCount: cycleHistory.length > 0 ? cycleHistory.length : undefined
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
        .eq('status', 'completed')
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

  /**
   * Calculate multi-cycle trends from cycle completion history
   */
  private calculateCycleTrends(cycleHistory: CycleCompletion[]): CycleTrendAnalysis {
    if (cycleHistory.length < 2) {
      return {
        volumeProgression: {
          trend: 'insufficient_data',
          percentChangePerCycle: 0,
          averageVolume: 0,
          latestVolume: 0,
          cyclesAnalyzed: cycleHistory.length
        },
        mentalReadinessTrend: {
          trend: 'insufficient_data',
          average: null,
          latest: null,
          changeFromFirst: null
        },
        workoutConsistency: {
          rating: 'inconsistent',
          averageWorkoutsPerCycle: 0,
          coefficientOfVariation: 0,
          latestCycleWorkouts: 0
        },
        muscleBalanceTrends: {},
        recommendations: []
      }
    }

    const volumeProgression = this.analyzeVolumeProgression(cycleHistory)
    const mentalReadinessTrend = this.analyzeMentalReadinessTrend(cycleHistory)
    const workoutConsistency = this.analyzeWorkoutConsistency(cycleHistory)
    const muscleBalanceTrends = this.analyzeMuscleBalance(cycleHistory)

    return {
      volumeProgression,
      mentalReadinessTrend,
      workoutConsistency,
      muscleBalanceTrends,
      recommendations: this.generateCycleTrendRecommendations({
        volumeProgression,
        mentalReadinessTrend,
        workoutConsistency,
        muscleBalanceTrends
      })
    }
  }

  /**
   * Analyze volume progression across cycles using linear regression
   */
  private analyzeVolumeProgression(cycles: CycleCompletion[]): VolumeTrend {
    const volumes = cycles.map(c => c.total_volume).reverse() // Oldest to newest

    // Calculate linear regression
    const n = volumes.length
    const xSum = (n * (n - 1)) / 2 // Sum of 0, 1, 2, ...n-1
    const ySum = volumes.reduce((sum, v) => sum + v, 0)
    const xySum = volumes.reduce((sum, v, i) => sum + i * v, 0)
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
    const avgVolume = ySum / n
    const percentChangePerCycle = avgVolume > 0 ? (slope / avgVolume) * 100 : 0

    return {
      trend: (percentChangePerCycle > 5 ? 'increasing'
        : percentChangePerCycle < -5 ? 'decreasing'
        : 'stable') as 'increasing' | 'decreasing' | 'stable' | 'insufficient_data',
      percentChangePerCycle,
      averageVolume: avgVolume,
      latestVolume: volumes[volumes.length - 1],
      cyclesAnalyzed: n
    }
  }

  /**
   * Analyze mental readiness trend across cycles
   */
  private analyzeMentalReadinessTrend(cycles: CycleCompletion[]): MentalReadinessTrend {
    const readinessValues = cycles
      .map(c => c.avg_mental_readiness)
      .filter((mr): mr is number => mr !== null)
      .reverse() // Oldest to newest

    if (readinessValues.length < 2) {
      return {
        trend: 'insufficient_data' as const,
        average: null,
        latest: null,
        changeFromFirst: null
      }
    }

    const average = readinessValues.reduce((sum, v) => sum + v, 0) / readinessValues.length
    const latest = readinessValues[readinessValues.length - 1]
    const first = readinessValues[0]
    const changeFromFirst = latest - first

    return {
      trend: (changeFromFirst > 0.5 ? 'improving'
        : changeFromFirst < -0.5 ? 'declining'
        : 'stable') as 'improving' | 'declining' | 'stable' | 'insufficient_data',
      average,
      latest,
      changeFromFirst
    }
  }

  /**
   * Analyze workout consistency across cycles
   */
  private analyzeWorkoutConsistency(cycles: CycleCompletion[]): ConsistencyAnalysis {
    const workoutCounts = cycles.map(c => c.total_workouts_completed)
    const average = workoutCounts.reduce((sum, c) => sum + c, 0) / workoutCounts.length
    const stdDev = Math.sqrt(
      workoutCounts.reduce((sum, c) => sum + Math.pow(c - average, 2), 0) / workoutCounts.length
    )
    const coefficientOfVariation = average > 0 ? (stdDev / average) * 100 : 0

    return {
      rating: (coefficientOfVariation < 15 ? 'excellent'
        : coefficientOfVariation < 25 ? 'good'
        : coefficientOfVariation < 35 ? 'moderate'
        : 'inconsistent') as 'excellent' | 'good' | 'moderate' | 'inconsistent',
      averageWorkoutsPerCycle: average,
      coefficientOfVariation,
      latestCycleWorkouts: workoutCounts[0] // Most recent is first
    }
  }

  /**
   * Analyze muscle balance trends across cycles
   */
  private analyzeMuscleBalance(cycles: CycleCompletion[]): Record<string, MuscleBalanceTrend> {
    const muscleBalanceTrends: Record<string, MuscleBalanceTrend> = {}

    // Get all muscle groups across all cycles
    const allMuscles = new Set<string>()
    cycles.forEach(cycle => {
      const volumeByMuscle = cycle.volume_by_muscle_group as Record<string, number>
      Object.keys(volumeByMuscle || {}).forEach(muscle => allMuscles.add(muscle))
    })

    // Analyze each muscle group
    allMuscles.forEach(muscle => {
      const volumes = cycles
        .map(c => {
          const volumeByMuscle = c.volume_by_muscle_group as Record<string, number>
          return volumeByMuscle?.[muscle] || 0
        })
        .reverse() // Oldest to newest

      const average = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
      const latest = volumes[volumes.length - 1]
      const first = volumes[0]
      const percentChange = first > 0 ? ((latest - first) / first) * 100 : 0

      muscleBalanceTrends[muscle] = {
        trend: (percentChange > 15 ? 'increasing'
          : percentChange < -15 ? 'decreasing'
          : 'stable') as 'increasing' | 'decreasing' | 'stable',
        averageVolume: average,
        latestVolume: latest,
        percentChange,
        cyclesAnalyzed: volumes.length
      }
    })

    return muscleBalanceTrends
  }

  /**
   * Generate recommendations based on cycle trends
   */
  private generateCycleTrendRecommendations(trends: {
    volumeProgression: VolumeTrend
    mentalReadinessTrend: MentalReadinessTrend
    workoutConsistency: ConsistencyAnalysis
    muscleBalanceTrends: Record<string, MuscleBalanceTrend>
  }): string[] {
    const recommendations: string[] = []

    // Volume recommendations
    if (trends.volumeProgression.trend === 'decreasing') {
      recommendations.push('Volume declining across cycles - consider addressing recovery or motivation')
    } else if (trends.volumeProgression.trend === 'increasing' &&
               trends.volumeProgression.percentChangePerCycle > 20) {
      recommendations.push('Volume increasing rapidly (+20%/cycle) - monitor recovery to avoid overtraining')
    }

    // Mental readiness recommendations
    if (trends.mentalReadinessTrend.trend === 'declining') {
      recommendations.push('Mental readiness declining across cycles - prioritize recovery and stress management')
    }

    // Critical warning for volume increase + mental readiness decline
    if (trends.volumeProgression.trend === 'increasing' &&
        trends.mentalReadinessTrend.trend === 'declining') {
      recommendations.push('CRITICAL: Volume increasing while mental readiness declining - deload recommended')
    }

    // Consistency recommendations
    if (trends.workoutConsistency.rating === 'inconsistent') {
      recommendations.push('Workout consistency variable - aim for more predictable training schedule')
    }

    // Muscle balance recommendations
    const muscleEntries = Object.entries(trends.muscleBalanceTrends)
    const increasingMuscles = muscleEntries.filter((entry): entry is [string, MuscleBalanceTrend] => entry[1].trend === 'increasing')
    const decreasingMuscles = muscleEntries.filter((entry): entry is [string, MuscleBalanceTrend] => entry[1].trend === 'decreasing')

    if (increasingMuscles.length > 0 && decreasingMuscles.length > 0) {
      const topIncreasing = increasingMuscles.sort((a, b) => b[1].percentChange - a[1].percentChange)[0]
      const topDecreasing = decreasingMuscles.sort((a, b) => a[1].percentChange - b[1].percentChange)[0]

      recommendations.push(
        `Muscle imbalance: ${topIncreasing[0]} increasing (${topIncreasing[1].percentChange.toFixed(0)}%) while ` +
        `${topDecreasing[0]} decreasing (${topDecreasing[1].percentChange.toFixed(0)}%)`
      )
    }

    return recommendations
  }
}
