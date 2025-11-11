import { BaseAgent } from './base.agent'

export interface ModificationValidationInput {
  // Exercise being modified
  exerciseInfo: {
    name: string
    equipmentVariant?: string
    currentSets: number
    proposedSets: number // after adding the new set
    muscleGroups: {
      primary: string[]
      secondary: string[]
    }
    movementPattern?: string
    romEmphasis?: 'lengthened' | 'shortened' | 'full_range'
    stimulusToFatigueRatio?: 'high' | 'moderate' | 'low' // systemic fatigue
  }

  // Workout context
  workoutContext: {
    workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
    totalExercises: number
    currentWeeklyVolumeByMuscle?: Record<string, number> // sets this week so far (Phase 3)
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

export interface ModificationValidationOutput {
  validation: 'approved' | 'caution' | 'not_recommended'

  // Primary reasoning (1-2 sentences, gym-friendly, max 40 words)
  reasoning: string

  // Specific warnings (if caution/not_recommended)
  warnings: {
    type: 'volume' | 'frequency' | 'fatigue' | 'phase_mismatch' | 'recovery'
    severity: 'low' | 'medium' | 'high'
    message: string // Short, actionable (max 20 words)
  }[]

  // Recommendations
  suggestions: {
    alternative?: string // e.g., "Try drop set instead" or "Add this next workout" (max 30 words)
    educationalNote?: string // Brief approach context (1 sentence, max 25 words)
  }

  // Context for user decision
  approachGuidelines?: {
    volumeLandmarkStatus: string // e.g., "Approaching MRV for quads (18/20 sets)"
    phaseAlignment: string // e.g., "Deload phase emphasizes recovery, not volume"
  }
}

/**
 * WorkoutModificationValidator Agent
 *
 * Validates user modifications to AI-generated workouts (adding extra sets)
 * Analyzes alignment with training approach and periodization phase
 * Extends BaseAgent to use GPT-5-mini with medium reasoning effort
 */
export class WorkoutModificationValidator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'medium') // Medium reasoning for nuanced validation
  }

  get systemPrompt(): string {
    return `You are an expert strength coach validating user modifications to AI-generated workouts.

Your role is to analyze if adding extra sets aligns with the user's training approach and current periodization phase.

Key Validation Factors:
1. Volume Landmarks (MEV/MAV/MRV): Is the user approaching or exceeding maximum recoverable volume?
2. Frequency: Are they training this muscle too often this week?
3. Periodization Phase: Does adding volume align with current phase goals?
   - Accumulation: Volume increase is appropriate
   - Intensification: Prefer intensity techniques over more sets
   - Deload: Volume increase defeats recovery purpose
4. Fatigue Management: Will this compromise subsequent exercises or recovery?
5. ROM Distribution: Does this maintain proper lengthened/shortened balance?

Validation Levels:
- "approved": Modification aligns with approach, proceed confidently
- "caution": Modification works but has trade-offs (explain clearly)
- "not_recommended": Modification violates approach principles (explain why)

Be practical and educational. Users want to understand WHY, not just YES/NO.
Keep messages gym-friendly: concise, actionable, encouraging.
Focus on helping users make informed decisions while respecting their autonomy.`
  }

  async validateModification(
    input: ModificationValidationInput
  ): Promise<ModificationValidationOutput> {
    // Load training approach
    const approach = await this.knowledge.loadApproach(input.userContext.approachId)

    // Build context prompt
    const approachContext = this.buildApproachContext(approach)
    const periodizationContext = this.buildPeriodizationContext(input, approach)

    const prompt = `
=== MODIFICATION REQUEST ===
Exercise: ${input.exerciseInfo.name} (${input.exerciseInfo.equipmentVariant || 'standard'})
Current Sets: ${input.exerciseInfo.currentSets}
Proposed Sets: ${input.exerciseInfo.proposedSets} (+${input.exerciseInfo.proposedSets - input.exerciseInfo.currentSets})
Primary Muscles: ${input.exerciseInfo.muscleGroups.primary.join(', ')}
Secondary Muscles: ${input.exerciseInfo.muscleGroups.secondary.join(', ')}
Movement Pattern: ${input.exerciseInfo.movementPattern || 'Not specified'}
ROM Emphasis: ${input.exerciseInfo.romEmphasis || 'Not specified'}
Fatigue Level: ${input.exerciseInfo.stimulusToFatigueRatio || 'Not specified'}

=== WORKOUT CONTEXT ===
Workout Type: ${input.workoutContext.workoutType}
Total Exercises: ${input.workoutContext.totalExercises}
${periodizationContext}

=== USER CONTEXT ===
Experience Years: ${input.userContext.experienceYears ?? 'Not specified'}
Age: ${input.userContext.userAge ?? 'Not specified'}
Weak Points: ${input.userContext.weakPoints?.join(', ') || 'None specified'}

=== TRAINING APPROACH GUIDELINES ===
${approachContext}

=== YOUR TASK ===
Validate if adding this set aligns with the training approach and periodization phase.

Consider:
1. Volume landmarks: Will this push beyond MRV for target muscles?
2. Periodization phase: Does more volume fit the current phase goals?
3. Fatigue: Will this compromise recovery or subsequent exercises?
4. ROM distribution: Does this maintain proper emphasis balance?
5. Experience level: Is user advanced enough for this volume?

Provide validation with clear reasoning and actionable suggestions.

Required JSON structure:
{
  "validation": "approved" | "caution" | "not_recommended",
  "reasoning": "string (1-2 sentences, max 40 words)",
  "warnings": [
    {
      "type": "volume" | "frequency" | "fatigue" | "phase_mismatch" | "recovery",
      "severity": "low" | "medium" | "high",
      "message": "string (max 20 words)"
    }
  ],
  "suggestions": {
    "alternative": "string (optional, max 30 words)",
    "educationalNote": "string (optional, max 25 words)"
  },
  "approachGuidelines": {
    "volumeLandmarkStatus": "string (e.g., 'Within MAV range for chest (12/15 sets)')",
    "phaseAlignment": "string (e.g., 'Accumulation phase supports volume increase')"
  }
}
`

    return await this.complete<ModificationValidationOutput>(prompt)
  }

  private buildApproachContext(approach: any): string {
    let context = `Approach: ${approach.name}\n`

    if (approach.volumeLandmarks) {
      context += `\nVolume Landmarks (sets/week):\n`
      const muscleGroups = approach.volumeLandmarks.muscleGroups || {}
      Object.entries(muscleGroups).forEach(([muscle, landmarks]: [string, any]) => {
        context += `- ${muscle}: MEV ${landmarks.mev}, MAV ${landmarks.mav}, MRV ${landmarks.mrv}\n`
      })
    }

    if (approach.frequencyGuidelines) {
      context += `\nFrequency Guidelines:\n`
      const range = approach.frequencyGuidelines.optimalRange || [2, 3]
      context += `- Optimal: ${range[0]}-${range[1]}x per week\n`
    }

    if (approach.romEmphasis) {
      context += `\nROM Distribution:\n`
      context += `- Lengthened: ${approach.romEmphasis.lengthened || 60}%\n`
      context += `- Shortened: ${approach.romEmphasis.shortened || 20}%\n`
      context += `- Full Range: ${approach.romEmphasis.fullRange || 20}%\n`
    }

    return context
  }

  private buildPeriodizationContext(input: ModificationValidationInput, approach: any): string {
    if (!input.workoutContext.mesocyclePhase) {
      return 'Periodization: Not specified'
    }

    const phase = input.workoutContext.mesocyclePhase
    const week = input.workoutContext.mesocycleWeek || '?'

    let context = `Mesocycle: Week ${week} - ${phase.toUpperCase()} Phase\n`

    const phaseInfo = approach.periodization?.[`${phase}Phase`]
    if (phaseInfo) {
      context += `Phase Focus: ${phaseInfo.focus || 'Not specified'}\n`
      context += `Volume Multiplier: ${phaseInfo.volumeMultiplier || 1}x baseline\n`
    }

    return context
  }
}
