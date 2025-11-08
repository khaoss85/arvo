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

  async summarizeWorkout(input: WorkoutSummaryInput): Promise<WorkoutSummaryOutput> {
    const approach = await this.knowledge.loadApproach(input.approachId)
    const context = this.knowledge.formatContextForAI(approach, 'progression')

    // Calculate some quick stats
    const durationMinutes = Math.round(input.totalDuration / 60)
    const completionRate = input.exercises.reduce((sum, e) => sum + e.completedSets, 0) /
                           input.exercises.reduce((sum, e) => sum + e.sets, 0)

    const prompt = `Provide immediate feedback on this just-completed workout:

Workout Type: ${input.workoutType}
Duration: ${durationMinutes} minutes
Total Volume: ${input.totalVolume} kg
Completion Rate: ${Math.round(completionRate * 100)}%

Exercises Completed:
${input.exercises.map(e =>
  `- ${e.name}: ${e.completedSets}/${e.sets} sets, ${e.totalVolume}kg total volume, avg RIR ${e.avgRIR.toFixed(1)}`
).join('\n')}

Training Approach Context:
${context}

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

    return await this.complete<WorkoutSummaryOutput>(prompt)
  }
}
