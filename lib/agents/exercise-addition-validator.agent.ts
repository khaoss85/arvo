import { BaseAgent } from './base.agent'

export interface ExerciseAdditionInput {
  // Exercise being added
  exerciseToAdd: {
    name: string
    equipmentVariant?: string
    muscleGroups: {
      primary: string[]
      secondary: string[]
    }
    movementPattern?: string
    romEmphasis?: 'lengthened' | 'shortened' | 'full_range'
    stimulusToFatigueRatio?: 'high' | 'moderate' | 'low'
    isCompound: boolean
  }

  // Current workout context
  currentWorkout: {
    workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
    existingExercises: Array<{
      name: string
      sets: number
      muscleGroups: {
        primary: string[]
        secondary: string[]
      }
    }>
    totalExercises: number
    totalSets: number
    totalVolume: number // estimated total volume
    currentWeeklyVolumeByMuscle?: Record<string, number>
    mesocycleWeek?: number
    mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
  }

  // User context
  userContext: {
    userId: string
    approachId: string
    experienceYears?: number
    userAge?: number
    weakPoints?: string[]
  }
}

export interface ExerciseAdditionOutput {
  validation: 'approved' | 'caution' | 'rejected'

  // Primary reasoning (1-2 sentences, gym-friendly, max 40 words)
  reasoning: string

  // Specific warnings (if caution/rejected)
  warnings: {
    type: 'volume_overlap' | 'fatigue' | 'balance' | 'experience' | 'recovery' | 'redundancy'
    severity: 'low' | 'medium' | 'high'
    message: string // Short, actionable (max 25 words)
  }[]

  // Recommendations
  suggestions: {
    alternative?: string // e.g., "Consider adding this in next workout instead" (max 40 words)
    placement?: string // e.g., "Place this after compound movements" (max 30 words)
    educationalNote?: string // Brief approach context (1 sentence, max 30 words)
  }

  // Context for user decision
  workoutBalance?: {
    muscleOverlap: string // e.g., "Chest already has 4 exercises (12 sets)"
    fatigueEstimate: string // e.g., "Total fatigue: moderate to high"
    phaseAlignment: string // e.g., "Accumulation phase supports additional exercises"
  }
}

/**
 * ExerciseAdditionValidator Agent
 *
 * Validates if adding a new exercise to a workout is appropriate
 * Analyzes muscle overlap, fatigue, workout balance, and experience level
 * Extends BaseAgent to use GPT-5-mini with medium reasoning effort
 */
export class ExerciseAdditionValidator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'medium') // Medium reasoning for nuanced validation
  }

  get systemPrompt(): string {
    return `You are an expert strength coach validating exercise additions to AI-generated workouts.

Your role is to analyze if adding a new exercise aligns with workout balance, recovery capacity, and training approach.

Key Validation Factors:
1. Muscle Overlap: Is the target muscle already trained with sufficient volume?
2. Fatigue Accumulation: Will this push systemic or local fatigue too high?
3. Workout Balance: Does this maintain proper muscle balance and movement patterns?
4. Experience Level: Is the user ready for this exercise complexity/volume?
5. Periodization Phase: Does adding this exercise fit current phase goals?
   - Accumulation: Additional exercises can build volume
   - Intensification: Focus on quality over quantity
   - Deload: Additional exercises defeat recovery purpose
6. Redundancy: Is this exercise too similar to existing ones?

Validation Levels:
- "approved": Exercise addition fits well, proceed confidently
- "caution": Exercise works but has trade-offs (explain clearly)
- "rejected": Exercise violates training principles (explain why)

Be practical and educational. Users want to understand WHY, not just YES/NO.
Keep messages gym-friendly: concise, actionable, encouraging.
Focus on helping users make informed decisions while respecting their autonomy.

IMPORTANT: Consider the ENTIRE workout when validating, not just one exercise in isolation.`
  }

  async validateExerciseAddition(
    input: ExerciseAdditionInput
  ): Promise<ExerciseAdditionOutput> {
    // Load training approach
    const approach = await this.knowledge.loadApproach(input.userContext.approachId)

    // 🔒 PRE-VALIDATION: Check if adding exercise would violate approach's total sets limit
    const vars = approach.variables as any
    const maxTotalSets = vars?.sessionDuration?.totalSets?.[1]

    if (maxTotalSets && input.currentWorkout.totalSets >= maxTotalSets) {
      // Workout is already at or exceeds max total sets - REJECT immediately
      const exerciseCount = input.currentWorkout.existingExercises.length
      return {
        validation: 'rejected',
        reasoning: `${approach.name} limits workouts to ${maxTotalSets} total sets maximum. Current workout already has ${input.currentWorkout.totalSets} sets.`,
        warnings: [{
          type: 'volume_overlap',
          severity: 'high',
          message: `Approach constraint: ${approach.name} uses ${maxTotalSets} sets max per workout`
        }],
        suggestions: {
          alternative: `Consider substituting an existing exercise instead of adding a new one`,
          educationalNote: `${approach.name} emphasizes intensity over volume - keep total sets within ${maxTotalSets}`
        },
        workoutBalance: {
          muscleOverlap: `Current: ${input.currentWorkout.totalSets} sets across ${exerciseCount} exercises`,
          fatigueEstimate: `Already at approach's maximum total sets`,
          phaseAlignment: `Cannot add exercises without exceeding approach limits`
        }
      }
    }

    // Build context prompt
    const approachContext = this.buildApproachContext(approach)
    const workoutContext = this.buildWorkoutContext(input)
    const periodizationContext = this.buildPeriodizationContext(input, approach)

    const prompt = `
=== EXERCISE ADDITION REQUEST ===
Exercise to Add: ${input.exerciseToAdd.name} (${input.exerciseToAdd.equipmentVariant || 'standard'})
Type: ${input.exerciseToAdd.isCompound ? 'Compound' : 'Isolation'}
Primary Muscles: ${input.exerciseToAdd.muscleGroups.primary.join(', ')}
Secondary Muscles: ${input.exerciseToAdd.muscleGroups.secondary.join(', ')}
Movement Pattern: ${input.exerciseToAdd.movementPattern || 'Not specified'}
ROM Emphasis: ${input.exerciseToAdd.romEmphasis || 'Not specified'}
Fatigue Level: ${input.exerciseToAdd.stimulusToFatigueRatio || 'Not specified'}

=== CURRENT WORKOUT STATUS ===
${workoutContext}

=== PERIODIZATION CONTEXT ===
${periodizationContext}

=== USER CONTEXT ===
Experience Years: ${input.userContext.experienceYears ?? 'Not specified'}
Age: ${input.userContext.userAge ?? 'Not specified'}
Weak Points: ${input.userContext.weakPoints?.join(', ') || 'None specified'}

=== TRAINING APPROACH GUIDELINES ===
${approachContext}

=== YOUR TASK ===
Validate if adding this exercise is appropriate for the current workout and user.

Consider:
1. Muscle Overlap: Are target muscles already trained sufficiently?
2. Fatigue: Will this exceed recoverable workload?
3. Balance: Does this maintain workout quality and muscle balance?
4. Redundancy: Is this too similar to existing exercises?
5. Experience: Is user ready for this volume/complexity?
6. Phase: Does this fit current periodization phase?

Provide validation with clear reasoning and actionable suggestions.

Required JSON structure:
{
  "validation": "approved" | "caution" | "rejected",
  "reasoning": "string (1-2 sentences, max 40 words)",
  "warnings": [
    {
      "type": "volume_overlap" | "fatigue" | "balance" | "experience" | "recovery" | "redundancy",
      "severity": "low" | "medium" | "high",
      "message": "string (max 25 words)"
    }
  ],
  "suggestions": {
    "alternative": "string (optional, max 40 words)",
    "placement": "string (optional, max 30 words)",
    "educationalNote": "string (optional, max 30 words)"
  },
  "workoutBalance": {
    "muscleOverlap": "string (e.g., 'Chest already has 4 exercises, 12 total sets')",
    "fatigueEstimate": "string (e.g., 'Total fatigue: moderate to high after 5 exercises')",
    "phaseAlignment": "string (e.g., 'Accumulation phase supports exercise additions')"
  }
}
`

    return await this.complete<ExerciseAdditionOutput>(prompt)
  }

  private buildApproachContext(approach: any): string {
    const vars = approach.variables as any
    let context = `Approach: ${approach.name}\n`

    // Philosophy (CRITICAL - defines the approach)
    if (approach.philosophy) {
      context += `\nPhilosophy:\n${approach.philosophy}\n`
    }

    // Volume Constraints (CRITICAL for validation)
    context += `\nVolume Constraints (HARD LIMITS):\n`

    // Sets per exercise
    const setsPerExercise = vars?.setsPerExercise?.working
      || (vars?.sets?.range ? `${vars.sets.range[0]}-${vars.sets.range[1]}` : null)
    if (setsPerExercise) {
      context += `- Sets per exercise: ${setsPerExercise} working sets\n`
    }

    // Total sets per workout (e.g., Heavy Duty: 6-8 max)
    const totalSetsConstraint = vars?.sessionDuration?.totalSets
    if (totalSetsConstraint) {
      context += `- TOTAL sets per workout: ${totalSetsConstraint[0]}-${totalSetsConstraint[1]} sets MAXIMUM\n`
      context += `  ⚠️ Adding exercises that exceed this limit violates the approach's core philosophy\n`
    }

    // Progression Notes (e.g., "Never add more sets")
    const progressionNotes = vars?.sets?.progressionNotes
    if (progressionNotes) {
      context += `- Progression Rule: ${progressionNotes}\n`
    }

    // Volume Landmarks (if available)
    if (approach.volumeLandmarks) {
      context += `\nVolume Landmarks (sets/week per muscle):\n`
      const muscleGroups = approach.volumeLandmarks.muscleGroups || {}
      Object.entries(muscleGroups).forEach(([muscle, landmarks]: [string, any]) => {
        context += `- ${muscle}: MEV ${landmarks.mev}, MAV ${landmarks.mav}, MRV ${landmarks.mrv}\n`
      })
    }

    // Frequency Guidelines
    if (approach.frequencyGuidelines) {
      context += `\nFrequency Guidelines:\n`
      const range = approach.frequencyGuidelines.optimalRange || [2, 3]
      context += `- Optimal: ${range[0]}-${range[1]}x per week per muscle\n`
    }

    // Exercise Selection Principles
    if (approach.exerciseSelectionPrinciples) {
      context += `\nExercise Selection Principles:\n`
      if (typeof approach.exerciseSelectionPrinciples === 'object') {
        context += JSON.stringify(approach.exerciseSelectionPrinciples, null, 2)
      } else {
        context += `- ${approach.exerciseSelectionPrinciples}\n`
      }
    }

    return context
  }

  private buildWorkoutContext(input: ExerciseAdditionInput): string {
    const { currentWorkout } = input

    let context = `Workout Type: ${currentWorkout.workoutType}\n`
    context += `Current Exercises: ${currentWorkout.totalExercises}\n`
    context += `Total Sets: ${currentWorkout.totalSets}\n\n`

    context += `Existing Exercises:\n`
    currentWorkout.existingExercises.forEach((ex, idx) => {
      context += `${idx + 1}. ${ex.name} - ${ex.sets} sets\n`
      context += `   Primary: ${ex.muscleGroups.primary.join(', ')}\n`
      if (ex.muscleGroups.secondary.length > 0) {
        context += `   Secondary: ${ex.muscleGroups.secondary.join(', ')}\n`
      }
    })

    // Calculate muscle volume
    const muscleVolume: Record<string, number> = {}
    currentWorkout.existingExercises.forEach(ex => {
      ex.muscleGroups.primary.forEach(muscle => {
        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + ex.sets
      })
    })

    context += `\nCurrent Volume by Muscle:\n`
    Object.entries(muscleVolume)
      .sort((a, b) => b[1] - a[1])
      .forEach(([muscle, sets]) => {
        context += `- ${muscle}: ${sets} sets\n`
      })

    return context
  }

  private buildPeriodizationContext(input: ExerciseAdditionInput, approach: any): string {
    const { currentWorkout } = input

    if (!currentWorkout.mesocyclePhase) {
      return 'No periodization context available'
    }

    let context = `Mesocycle Phase: ${currentWorkout.mesocyclePhase}\n`

    if (currentWorkout.mesocycleWeek) {
      context += `Week: ${currentWorkout.mesocycleWeek}\n`
    }

    // Add phase-specific guidelines from approach
    if (approach.periodization && approach.periodization[currentWorkout.mesocyclePhase]) {
      const phaseGuidelines = approach.periodization[currentWorkout.mesocyclePhase]
      context += `\nPhase Guidelines:\n`
      if (phaseGuidelines.volumeApproach) {
        context += `- Volume: ${phaseGuidelines.volumeApproach}\n`
      }
      if (phaseGuidelines.exerciseSelection) {
        context += `- Exercise Selection: ${phaseGuidelines.exerciseSelection}\n`
      }
    }

    return context
  }
}
