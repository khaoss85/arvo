import { BaseAgent } from './base.agent'

export interface ExerciseSuggestionInput {
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
      movementPattern?: string
      isCompound: boolean
    }>
    totalExercises: number
    totalSets: number
  }

  // User context
  userContext: {
    userId: string
    approachId: string
    experienceYears?: number
    userAge?: number
    weakPoints?: string[]
    availableEquipment?: string[]
  }

  // Periodization context (optional)
  mesocycleWeek?: number
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
}

export interface SuggestedExercise {
  name: string
  equipmentVariant?: string
  rationale: string // Why this exercise is a good addition (max 50 words)
  muscleGroups: {
    primary: string[]
    secondary: string[]
  }
  isCompound: boolean
  priority: 'high' | 'medium' | 'low' // Based on workout balance and gaps
  expectedBenefit: string // What this adds to the workout (max 30 words)
}

export interface ExerciseSuggestionOutput {
  suggestions: SuggestedExercise[] // Top 3-5 suggestions, ranked by appropriateness
  workoutAnalysis: {
    muscleBalance: string // Current balance analysis (e.g., "Chest and triceps well covered, shoulders undertrained")
    gaps: string[] // Identified gaps or opportunities
    volumeStatus: string // Current volume status
  }
  recommendations: {
    bestChoice?: string // Name of the most recommended exercise
    generalAdvice: string // General guidance (max 40 words)
  }
}

/**
 * ExerciseSuggester Agent
 *
 * Suggests appropriate exercises to add to an existing workout
 * Analyzes current workout to identify gaps and opportunities
 * Ranks suggestions by appropriateness and expected benefit
 * Extends BaseAgent to use GPT-5-mini with low reasoning effort (fast suggestions)
 */
export class ExerciseSuggester extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'low', 'low') // Low reasoning for fast exercise suggestions
  }

  get systemPrompt(): string {
    return `You are an expert strength coach suggesting exercises to add to existing workouts.

Your role is to analyze the current workout and suggest 3-5 exercises that would enhance it.

Key Consideration Factors:
1. Muscle Balance: What muscles are undertrained relative to others?
2. Movement Patterns: What patterns are missing? (horizontal push/pull, vertical push/pull, hinge, squat, lunge)
3. ROM Distribution: Is there a good mix of lengthened, shortened, and full-range exercises?
4. Compound vs Isolation: Does the workout have proper balance?
5. Weak Points: Can we address user's weak points?
6. Equipment: Only suggest exercises with available equipment
7. Experience Level: Match complexity to user's experience
8. Periodization: Consider current phase goals

Suggestion Priorities:
- HIGH: Fills critical gap, addresses weak point, perfect for phase
- MEDIUM: Good addition, improves balance, safe choice
- LOW: Nice-to-have, minor benefit, optional

Be practical and gym-friendly:
- Suggest real exercises that exist in databases
- Avoid obscure or overly complex variations
- Consider fatigue - don't overload the workout
- Respect the user's current workout structure

Output Format:
Provide 3-5 suggestions ranked by appropriateness, with clear rationale for each.
Include analysis of current workout balance and gaps.
Be encouraging but realistic about what's needed vs nice-to-have.`
  }

  async suggestExercises(
    input: ExerciseSuggestionInput
  ): Promise<ExerciseSuggestionOutput> {
    // Load training approach
    const approach = await this.knowledge.loadApproach(input.userContext.approachId)

    // Build context prompt
    const approachContext = this.buildApproachContext(approach)
    const workoutContext = this.buildWorkoutContext(input)
    const equipmentContext = this.buildEquipmentContext(input)

    const prompt = `
=== CURRENT WORKOUT STATUS ===
${workoutContext}

=== USER CONTEXT ===
Experience Years: ${input.userContext.experienceYears ?? 'Not specified'}
Age: ${input.userContext.userAge ?? 'Not specified'}
Weak Points: ${input.userContext.weakPoints?.join(', ') || 'None specified'}
${equipmentContext}

=== PERIODIZATION CONTEXT ===
${input.mesocyclePhase ? `Phase: ${input.mesocyclePhase}\nWeek: ${input.mesocycleWeek || 'Not specified'}` : 'No periodization context'}

=== TRAINING APPROACH ===
${approachContext}

=== YOUR TASK ===
Analyze the current workout and suggest 3-5 exercises that would be good additions.

Consider:
1. What muscles are undertrained?
2. What movement patterns are missing?
3. What ROM emphases need balance?
4. Are there weak points to address?
5. Is there proper compound/isolation balance?
6. Does it fit the periodization phase?

Rank suggestions by priority (high/medium/low) based on:
- How critical the gap is
- How well it fits the workout
- User's experience level
- Phase appropriateness

Provide clear, actionable suggestions with specific reasoning.

Required JSON structure:
{
  "suggestions": [
    {
      "name": "string (specific exercise name)",
      "equipmentVariant": "string (optional, e.g., 'barbell', 'dumbbell')",
      "rationale": "string (why this is good, max 50 words)",
      "muscleGroups": {
        "primary": ["string"],
        "secondary": ["string"]
      },
      "isCompound": boolean,
      "priority": "high" | "medium" | "low",
      "expectedBenefit": "string (what this adds, max 30 words)"
    }
  ],
  "workoutAnalysis": {
    "muscleBalance": "string (current balance analysis)",
    "gaps": ["string (identified gaps)"],
    "volumeStatus": "string (volume assessment)"
  },
  "recommendations": {
    "bestChoice": "string (most recommended exercise name)",
    "generalAdvice": "string (general guidance, max 40 words)"
  }
}
`

    return await this.complete<ExerciseSuggestionOutput>(prompt)
  }

  private buildApproachContext(approach: any): string {
    let context = `Approach: ${approach.name}\n`

    if (approach.exerciseSelectionPrinciples) {
      context += `\nExercise Selection Principles:\n`
      if (Array.isArray(approach.exerciseSelectionPrinciples)) {
        approach.exerciseSelectionPrinciples.forEach((principle: string) => {
          context += `- ${principle}\n`
        })
      } else if (typeof approach.exerciseSelectionPrinciples === 'object') {
        Object.entries(approach.exerciseSelectionPrinciples).forEach(([key, value]) => {
          context += `- ${key}: ${value}\n`
        })
      } else {
        context += `- ${approach.exerciseSelectionPrinciples}\n`
      }
    }

    if (approach.volumeLandmarks) {
      context += `\nVolume Landmarks (sets/week):\n`
      const muscleGroups = approach.volumeLandmarks.muscleGroups || {}
      Object.entries(muscleGroups).forEach(([muscle, landmarks]: [string, any]) => {
        context += `- ${muscle}: MEV ${landmarks.mev}, MAV ${landmarks.mav}, MRV ${landmarks.mrv}\n`
      })
    }

    return context
  }

  private buildWorkoutContext(input: ExerciseSuggestionInput): string {
    const { currentWorkout } = input

    let context = `Workout Type: ${currentWorkout.workoutType}\n`
    context += `Current Exercises: ${currentWorkout.totalExercises}\n`
    context += `Total Sets: ${currentWorkout.totalSets}\n\n`

    context += `Existing Exercises:\n`
    currentWorkout.existingExercises.forEach((ex, idx) => {
      context += `${idx + 1}. ${ex.name} (${ex.isCompound ? 'Compound' : 'Isolation'}) - ${ex.sets} sets\n`
      context += `   Primary: ${ex.muscleGroups.primary.join(', ')}\n`
      if (ex.muscleGroups.secondary.length > 0) {
        context += `   Secondary: ${ex.muscleGroups.secondary.join(', ')}\n`
      }
      if (ex.movementPattern) {
        context += `   Pattern: ${ex.movementPattern}\n`
      }
    })

    // Calculate muscle volume distribution
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

    // Movement pattern analysis
    const patterns = currentWorkout.existingExercises
      .filter(ex => ex.movementPattern)
      .map(ex => ex.movementPattern)

    if (patterns.length > 0) {
      context += `\nMovement Patterns Covered:\n`
      const uniquePatterns = Array.from(new Set(patterns))
      uniquePatterns.forEach(pattern => {
        context += `- ${pattern}\n`
      })
    }

    return context
  }

  private buildEquipmentContext(input: ExerciseSuggestionInput): string {
    if (!input.userContext.availableEquipment || input.userContext.availableEquipment.length === 0) {
      return 'Available Equipment: All equipment available'
    }

    return `Available Equipment:\n${input.userContext.availableEquipment.map(eq => `- ${eq}`).join('\n')}`
  }
}
