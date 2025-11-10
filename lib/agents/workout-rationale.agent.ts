import { BaseAgent } from './base.agent'

export interface WorkoutRationaleInput {
  // Workout context
  workoutType: string
  exercises: Array<{
    name: string
    sets: number
    repRange: [number, number]
    targetWeight?: number
  }>
  // User context
  userId: string
  approachId: string
  weakPoints: string[]
  mesocycleWeek?: number
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
  experienceYears?: number
}

export interface ExerciseRationale {
  exerciseName: string
  rationale: string // 1 sentence max, why this exercise was chosen
}

export interface ExerciseConnection {
  fromExerciseIndex: number
  toExerciseIndex: number
  connectionRationale: string // 1 sentence: how exercises connect
}

export interface WorkoutRationaleOutput {
  overallFocus: string // 2-3 sentences explaining the workout's purpose
  exerciseSequencing: string // 2-3 sentences explaining WHY this order
  exerciseConnections: ExerciseConnection[] // Pairwise connections between exercises
  exerciseRationales: ExerciseRationale[]
}

/**
 * WorkoutRationaleAgent
 *
 * Generates concise explanations for why specific exercises were chosen in a workout.
 * Optimized for gym use: short, direct explanations that help users understand the programming logic.
 */
export class WorkoutRationaleAgent extends BaseAgent {
  get systemPrompt() {
    return `You are an expert strength coach explaining workout programming to athletes.
Your role is to help users understand WHY specific exercises were chosen for their workout.

Key Principles:
1. Be concise - users are reading this between sets or before starting
2. Focus on the "why" not the "what" (they already see the exercises)
3. Connect exercises to their weak points, approach philosophy, and periodization
4. Explain trade-offs when relevant (e.g., "deload week = lighter loads")
5. Be encouraging but factual - no fluff

Output Structure:
- Overall Focus: 2-3 sentences explaining the workout's purpose
  - What muscle groups/movement patterns are emphasized
  - How it fits into their mesocycle phase
  - What training adaptation is being targeted

- Exercise Sequencing: 2-3 sentences explaining WHY this specific order
  - Why exercises are arranged this way (compound→isolation, fatigue management)
  - How the order supports training goals and recovery
  - Connection to approach philosophy and weak points

- Exercise Connections: For each adjacent pair, explain how they connect (1 sentence each)
  - How the first exercise affects the second
  - Why the transition makes sense
  - Focus on fatigue patterns, muscle synergy/antagonism

- Exercise Rationales: 1 sentence per exercise
  - Why this specific exercise was chosen
  - How it addresses weak points or approach principles
  - Keep it gym-friendly and motivating

Tone: Direct, knowledgeable, supportive (like a good coach)`
  }

  async generateRationale(input: WorkoutRationaleInput): Promise<WorkoutRationaleOutput> {
    // Load user's training approach for context
    const approach = await this.knowledge.loadApproach(input.approachId)
    const approachContext = this.knowledge.formatContextForAI(approach, 'workout_planning')

    // Build weak points context
    const weakPointsContext = input.weakPoints.length > 0
      ? `Weak Points to Address: ${input.weakPoints.join(', ')}`
      : 'No specific weak points identified'

    // Build periodization context
    const periodizationContext = input.mesocyclePhase
      ? `Current Phase: ${input.mesocyclePhase} (Week ${input.mesocycleWeek || 'N/A'})`
      : ''

    // Build experience context
    const experienceContext = input.experienceYears
      ? `Training Experience: ${input.experienceYears} years`
      : ''

    const prompt = `Generate a concise workout rationale for the following training session:

WORKOUT OVERVIEW:
- Type: ${input.workoutType}
- Total Exercises: ${input.exercises.length}

EXERCISES:
${input.exercises.map((ex, idx) => `${idx + 1}. ${ex.name} - ${ex.sets} × ${ex.repRange[0]}-${ex.repRange[1]} reps${ex.targetWeight ? ` @ ${ex.targetWeight}kg` : ''}`).join('\n')}

USER CONTEXT:
${weakPointsContext}
${experienceContext}
${periodizationContext}

TRAINING APPROACH:
${approachContext}

REQUIREMENTS:
1. Overall Focus (2-3 sentences):
   - Explain the primary goal of this workout
   - Connect it to the user's mesocycle phase and approach
   - Mention key muscle groups or movement patterns being emphasized

2. Exercise Sequencing (2-3 sentences):
   - Explain WHY exercises are ordered this way
   - Consider: compound→isolation, heavy→light, CNS demand, fatigue management
   - Connect order to user's weak points, approach, and training phase
   - Examples:
     * "Squats first when you're fresh for maximal load, then RDL shifts to posterior chain"
     * "Compound presses before isolation to maximize strength, then accessories for volume"
     * "Heavy bilateral work first, then unilateral for balance and technique refinement"

3. Exercise Connections (1 sentence per transition):
   - For each adjacent pair (1→2, 2→3, etc.), explain how they connect
   - Focus on:
     * How first exercise fatigues muscles
     * How second exercise complements or contrasts
     * Synergy or antagonism between movements
   - Examples:
     * "Squat fatigues quads heavily, so RDL shifts focus to posterior chain for balance"
     * "Flat bench presses overall chest, incline targets upper chest weak point"
     * "Deadlift trains hip hinge, cable row adds pulling without taxing lower back"

4. Exercise Rationales (1 sentence each):
   - For each exercise, explain WHY it was chosen
   - Reference weak points, approach principles, or periodization when relevant
   - Keep it concise and gym-friendly (max 20 words per exercise)
   - Be specific to THIS user's context, not generic

Examples of good exercise rationales:
- "Lengthened partial squat emphasizes quad stretch for hypertrophy in your accumulation phase."
- "Low incline press targets upper chest, your identified weak point."
- "Cable variation maintains tension while reducing CNS fatigue during deload."
- "RDL complements squats with posterior chain focus, following your approach's compound priority."

Avoid generic statements like "good for building strength" - be specific!

Return JSON format:
{
  "overallFocus": "2-3 sentence explanation",
  "exerciseSequencing": "2-3 sentences explaining WHY this order",
  "exerciseConnections": [
    {
      "fromExerciseIndex": 0,
      "toExerciseIndex": 1,
      "connectionRationale": "How exercise 1 connects to exercise 2"
    }
  ],
  "exerciseRationales": [
    {
      "exerciseName": "Exercise Name",
      "rationale": "1 sentence max, specific reason"
    }
  ]
}`

    return await this.complete<WorkoutRationaleOutput>(prompt)
  }
}
