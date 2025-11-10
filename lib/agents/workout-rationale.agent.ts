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
  overallFocus: string // 1-2 sentences explaining the workout's purpose
  exerciseSequencing: string // 1-2 sentences explaining WHY this order
  exerciseConnections: ExerciseConnection[] // Pairwise connections between exercises
  exerciseRationales: ExerciseRationale[] // Only key exercises (3-4 max)
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
- Overall Focus: 1-2 sentences (max 40 words)
  - Primary workout goal and key muscle groups
  - Connection to mesocycle phase or training approach

- Exercise Sequencing: 1-2 sentences (max 40 words)
  - WHY this order (compound→isolation, fatigue management)
  - Connection to training goals and weak points

- Exercise Connections: 1 sentence per transition (max 15 words)
  - How exercises connect (fatigue, synergy, contrast)
  - Brief and direct

- Exercise Rationales: ONLY for 3-4 key exercises (compound movements priority)
  - 1 sentence each (max 20 words)
  - Specific to user's weak points or approach
  - Skip isolation/accessory exercises unless specifically relevant

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
1. Overall Focus (1-2 sentences, MAX 40 words):
   - Primary workout goal + key muscle groups
   - Brief connection to mesocycle phase or approach
   - Example: "This push session targets chest and triceps with compound-focused volume. Emphasizes strength in your accumulation phase."

2. Exercise Sequencing (1-2 sentences, MAX 40 words):
   - WHY this order (compound→isolation, fatigue management)
   - Brief connection to weak points or approach
   - Example: "Heavy compound first when fresh, then isolation for volume without CNS fatigue."

3. Exercise Connections (1 sentence per transition, MAX 15 words):
   - How exercises connect (fatigue, synergy, contrast)
   - Examples:
     * "Squat fatigues quads, RDL shifts to posterior chain."
     * "Flat bench overall chest, incline targets upper weakness."
     * "Deadlift hip hinge, row adds pulling without lower back stress."

4. Exercise Rationales - IMPORTANT: Select only 3-4 KEY exercises:
   - Prioritize compound movements (squats, deadlifts, presses, rows)
   - Skip isolation/accessory exercises UNLESS specifically addressing a weak point
   - 1 sentence each (MAX 20 words)
   - Be specific to THIS user's context, not generic
   - If workout has 6+ exercises, explain only the 3-4 most important ones

Examples of good exercise rationales:
- "Lengthened partial squat emphasizes quad stretch for hypertrophy in your accumulation phase."
- "Low incline press targets upper chest, your identified weak point."
- "Cable variation maintains tension while reducing CNS fatigue during deload."
- "RDL complements squats with posterior chain focus, following your approach's compound priority."

Avoid generic statements like "good for building strength" - be specific!

Return JSON format:
{
  "overallFocus": "1-2 sentences (MAX 40 words)",
  "exerciseSequencing": "1-2 sentences (MAX 40 words)",
  "exerciseConnections": [
    {
      "fromExerciseIndex": 0,
      "toExerciseIndex": 1,
      "connectionRationale": "1 sentence (MAX 15 words)"
    }
  ],
  "exerciseRationales": [
    {
      "exerciseName": "Exercise Name",
      "rationale": "1 sentence (MAX 20 words) - ONLY 3-4 key exercises"
    }
  ]
}`

    return await this.complete<WorkoutRationaleOutput>(prompt)
  }
}
