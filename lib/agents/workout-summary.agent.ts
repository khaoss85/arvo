import { BaseAgent } from './base.agent'

export interface WorkoutSummaryInput {
  exercises: Array<{
    name: string
    sets: number
    totalVolume: number
    avgRIR: number
    completedSets: number
  }>
  totalDuration: number        // in seconds
  totalVolume: number          // in kg
  workoutType: string
  approachId: string
  // User demographics for personalized feedback
  userAge?: number | null
  userGender?: 'male' | 'female' | 'other' | null
  experienceYears?: number | null
  // Mental readiness tracking
  mentalReadinessOverall?: number  // 1-5 scale (1=Drained, 5=Locked In)
  // Periodization context
  mesocycleWeek?: number | null
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition' | null
}

export interface WorkoutSummaryOutput {
  overallPerformance: 'excellent' | 'good' | 'fair' | 'needs_improvement'
  keyHighlights: string[]          // 2-3 standout achievements
  immediateInsights: string[]      // 2-3 quick observations
  recoveryRecommendation: string   // Rest advice for next session
  motivationalMessage: string      // Encouraging closing statement
}

/**
 * WorkoutSummary Agent
 *
 * Provides immediate post-workout feedback and encouragement
 * Different from InsightsGenerator which analyzes trends over time
 * This focuses on the workout just completed
 */
export class WorkoutSummaryAgent extends BaseAgent {
  get systemPrompt(): string {
    return `You are a fitness coach providing immediate post-workout feedback.

Be encouraging, specific, and actionable.
Focus on what the user just accomplished today.
Keep it brief and motivating - they just finished training!

Guidelines:
- Celebrate specific achievements (volume, consistency, form maintenance)
- Note areas that went particularly well
- Provide practical recovery advice
- End with an encouraging, personalized message
- Be honest but always constructive
- Reference the training approach principles`
  }

  async summarizeWorkout(input: WorkoutSummaryInput, targetLanguage?: 'en' | 'it'): Promise<WorkoutSummaryOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'progression')

    // Calculate some quick stats
    const durationMinutes = Math.round(input.totalDuration / 60)
    const completionRate = input.exercises.reduce((sum, e) => sum + e.completedSets, 0) /
                           input.exercises.reduce((sum, e) => sum + e.sets, 0)

    const demographicContext = input.userAge || input.userGender || input.experienceYears
      ? `
User Demographics:
- Age: ${input.userAge ? `${input.userAge} years old` : 'Not specified'}
- Gender: ${input.userGender || 'Not specified'}
- Training Experience: ${input.experienceYears ? `${input.experienceYears} years` : 'Not specified'}
`
      : ''

    const mentalReadinessLabels = {
      1: 'Drained (😫)',
      2: 'Struggling (😕)',
      3: 'Neutral (😐)',
      4: 'Engaged (🙂)',
      5: 'Locked In (🔥)'
    }

    const mentalReadinessContext = input.mentalReadinessOverall
      ? `
Mental State: ${mentalReadinessLabels[input.mentalReadinessOverall as keyof typeof mentalReadinessLabels]} - rated ${input.mentalReadinessOverall}/5
`
      : ''

    const prompt = `Provide immediate feedback on this just-completed workout:

Workout Type: ${input.workoutType}
Duration: ${durationMinutes} minutes
Total Volume: ${input.totalVolume} kg
Completion Rate: ${Math.round(completionRate * 100)}%
${mentalReadinessContext}
Exercises Completed:
${input.exercises.map(e =>
  `- ${e.name}: ${e.completedSets}/${e.sets} sets, ${e.totalVolume}kg total volume, avg RIR ${e.avgRIR.toFixed(1)}`
).join('\n')}
${demographicContext}
Training Approach Context:
${context}

${input.mesocyclePhase && approach.periodization ? `
=== PERIODIZATION CONTEXT ===
Current Mesocycle: Week ${input.mesocycleWeek || '?'} - ${input.mesocyclePhase.toUpperCase()} Phase

${input.mesocyclePhase === 'accumulation' ? `
Phase Focus: Volume accumulation - building work capacity
${input.mesocycleWeek && input.mesocycleWeek >= 3 ? '- Consider transitioning to intensification phase soon' : ''}
` : ''}
${input.mesocyclePhase === 'intensification' ? `
Phase Focus: Intensity and quality
${input.mesocycleWeek && input.mesocycleWeek >= (approach.periodization.mesocycleLength || 6) - 1 ? `
⚠️ APPROACHING DELOAD: Week ${input.mesocycleWeek}/${approach.periodization.mesocycleLength || 6}
IMPORTANT: Recommend deload next week. User has been training hard and needs recovery.
- Deload frequency: ${approach.periodization.deloadPhase?.frequency || 'Every 6 weeks'}
- Volume reduction: ${approach.periodization.deloadPhase?.volumeReduction || '50%'}
` : ''}
` : ''}
${input.mesocyclePhase === 'deload' ? `
Phase Focus: Active recovery and supercompensation
- This is INTENTIONALLY lighter - celebrate completion, not intensity
- Focus feedback on movement quality and recovery benefits
- Prepare user mentally for next mesocycle starting soon
` : ''}
` : ''}

When providing feedback:
${input.userAge ? `- Consider that the user is ${input.userAge} years old when recommending recovery time (older athletes may need more recovery)` : ''}
${input.experienceYears ? `- Adjust feedback for ${input.experienceYears} years of training experience` : ''}
${input.mentalReadinessOverall ? `- IMPORTANT: The user reported a mental readiness of ${input.mentalReadinessOverall}/5 (${mentalReadinessLabels[input.mentalReadinessOverall as keyof typeof mentalReadinessLabels]}). Factor this into your feedback and recovery recommendations. Low mental readiness may indicate need for deload or extra recovery even if physical performance was good.` : ''}
- Provide practical, actionable recovery recommendations

Provide encouraging, specific feedback on today's performance.

Required JSON structure:
{
  "overallPerformance": "excellent" | "good" | "fair" | "needs_improvement",
  "keyHighlights": ["2-3 specific achievements today"],
  "immediateInsights": ["2-3 quick observations about the session"],
  "recoveryRecommendation": "specific rest/recovery advice for next session",
  "motivationalMessage": "encouraging personal message to end on"
}
`

    return await this.complete<WorkoutSummaryOutput>(prompt, targetLanguage)
  }
}
