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
 * Extends BaseAgent to use gpt-5-nano for cost-optimized validation
 */
export class WorkoutModificationValidator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'minimal', 'low') // Minimal reasoning for instant validation (30s timeout)
    this.model = 'gpt-5-nano' // Use nano model (-50% cost for simple validation)
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

    // 🔒 PRE-VALIDATION: Check if proposed sets would violate approach's per-exercise limit
    const vars = approach.variables as any
    const maxSetsPerExercise = vars?.setsPerExercise?.working
      || (vars?.sets?.range ? vars.sets.range[1] : null)

    if (maxSetsPerExercise && input.exerciseInfo.proposedSets > maxSetsPerExercise) {
      // Proposed sets exceed approach's per-exercise limit - REJECT immediately
      return {
        validation: 'not_recommended',
        reasoning: `${approach.name} limits exercises to ${maxSetsPerExercise} sets maximum. Proposed ${input.exerciseInfo.proposedSets} sets exceeds this constraint.`,
        warnings: [{
          type: 'volume',
          severity: 'high',
          message: `Approach constraint: ${approach.name} uses ${maxSetsPerExercise} sets max per exercise`
        }],
        suggestions: {
          alternative: `Instead of more sets, try: heavier weight, slower tempo, or advanced techniques (rest-pause, drop sets)`,
          educationalNote: `${approach.name} emphasizes intensity over volume - ${maxSetsPerExercise} sets is the maximum`
        },
        approachGuidelines: {
          volumeLandmarkStatus: `Current: ${input.exerciseInfo.currentSets} sets, Proposed: ${input.exerciseInfo.proposedSets} sets, Maximum: ${maxSetsPerExercise} sets`,
          phaseAlignment: `Cannot exceed approach's per-exercise limit regardless of phase`
        }
      }
    }

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
    const vars = approach.variables as any
    let context = `Approach: ${approach.name}\n`

    // Philosophy (CRITICAL - defines the approach)
    if (approach.philosophy) {
      context += `\nPhilosophy:\n${approach.philosophy}\n`
    }

    // Volume Constraints (CRITICAL for validation)
    context += `\nVolume Constraints (HARD LIMITS):\n`

    // Sets per exercise (THIS IS THE KEY CONSTRAINT FOR SET ADDITIONS)
    const setsPerExercise = vars?.setsPerExercise?.working
      || (vars?.sets?.range ? `${vars.sets.range[0]}-${vars.sets.range[1]}` : null)
    if (setsPerExercise) {
      context += `- Sets per exercise: ${setsPerExercise} working sets MAXIMUM\n`
      context += `  ⚠️ Adding sets beyond this limit violates the approach's core philosophy\n`
    }

    // Total sets per workout (for context)
    const totalSetsConstraint = vars?.sessionDuration?.totalSets
    if (totalSetsConstraint) {
      context += `- Total sets per workout: ${totalSetsConstraint[0]}-${totalSetsConstraint[1]} sets\n`
    }

    // Progression Notes (e.g., "Never add more sets - increase intensity instead")
    const progressionNotes = vars?.sets?.progressionNotes
    if (progressionNotes) {
      context += `\n⚠️ PROGRESSION RULE: ${progressionNotes}\n`
      context += `This rule explicitly defines how to progress WITHOUT adding more sets.\n`
    }

    // Volume Landmarks (if available)
    if (approach.volumeLandmarks) {
      context += `\nVolume Landmarks (sets/week):\n`
      const muscleGroups = approach.volumeLandmarks.muscleGroups || {}
      Object.entries(muscleGroups).forEach(([muscle, landmarks]: [string, any]) => {
        context += `- ${muscle}: MEV ${landmarks.mev}, MAV ${landmarks.mav}, MRV ${landmarks.mrv}\n`
      })
    }

    // Frequency Guidelines
    if (approach.frequencyGuidelines) {
      context += `\nFrequency Guidelines:\n`
      const range = approach.frequencyGuidelines.optimalRange || [2, 3]
      context += `- Optimal: ${range[0]}-${range[1]}x per week\n`
    }

    // ROM Distribution
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

  /**
   * Public method to build complete user context
   * Exposed to allow server actions to enrich user context before validation
   */
  async buildCompleteUserContext(userId: string) {
    return await this.knowledge.buildUserContext(userId)
  }

  /**
   * Validate split customization (swap days, toggle muscles, change variation)
   */
  async validateSplitChange(input: SplitChangeValidationInput): Promise<SplitChangeValidationOutput> {
    // Load training approach
    const approach = await this.knowledge.loadApproach(input.userContext.approachId)

    // Build context
    const approachContext = this.buildApproachContext(approach)

    // Build modification-specific context
    let modificationDetails = ''
    if (input.modificationType === 'swap_days') {
      modificationDetails = `
=== SWAP DAYS REQUEST ===
From: Day ${input.details.fromDay} - ${input.details.fromSession?.name || 'Unknown'} (${input.details.fromSession?.workoutType || 'Unknown'})
  Focus: ${input.details.fromSession?.focus?.join(', ') || 'None'}

To: Day ${input.details.toDay} - ${input.details.toSession?.name || 'Unknown'} (${input.details.toSession?.workoutType || 'Unknown'})
  Focus: ${input.details.toSession?.focus?.join(', ') || 'None'}

Cycle Length: ${input.splitContext.cycleDays} days
      `
    } else if (input.modificationType === 'toggle_muscle') {
      modificationDetails = `
=== ${input.details.action === 'add' ? 'ADD' : 'REMOVE'} MUSCLE REQUEST ===
Day ${input.details.cycleDay}: ${input.details.sessionName || 'Unknown'} (${input.details.workoutType || 'Unknown'})
Muscle Group: ${input.details.muscleGroup}
Current Focus: ${input.details.currentFocus?.join(', ') || 'None'}
New Focus: ${input.details.newFocus?.join(', ') || 'None'}

Cycle Length: ${input.splitContext.cycleDays} days
Current Weekly Frequency (${input.details.muscleGroup}): ${input.details.muscleGroup && input.splitContext.currentFrequencyMap?.[input.details.muscleGroup] || 0}x/week
      `
    } else if (input.modificationType === 'change_variation') {
      modificationDetails = `
=== CHANGE VARIATION REQUEST ===
Day ${input.details.cycleDay}: ${input.details.sessionName || 'Unknown'} (${input.details.workoutType || 'Unknown'})
From: Variation ${input.details.currentVariation}
To: Variation ${input.details.newVariation}

Cycle Length: ${input.splitContext.cycleDays} days
      `
    }

    const prompt = `
${modificationDetails}

=== USER CONTEXT ===
Experience Years: ${input.userContext.experienceYears ?? 'Not specified'}
Age: ${input.userContext.userAge ?? 'Not specified'}
Weak Points: ${input.userContext.weakPoints?.join(', ') || 'None specified'}
Mesocycle Week: ${input.userContext.mesocycleWeek ?? 'Not specified'}
Mesocycle Phase: ${input.userContext.mesocyclePhase ?? 'Not specified'}

=== TRAINING APPROACH GUIDELINES ===
${approachContext}

=== YOUR TASK ===
Validate if this split modification aligns with the training approach and user's goals.

For SWAP DAYS, consider:
1. Recovery: Will swapping reduce recovery time between similar muscle groups?
2. Frequency: Does swap maintain optimal frequency for all muscles?
3. Periodization: Does the swap fit the current phase?
4. Fatigue: Will consecutive intense sessions compromise performance?

For TOGGLE MUSCLE, consider:
1. Volume Landmarks: Will removing muscle drop below MEV? Will adding exceed MRV?
2. Frequency: Will the change violate frequency guidelines?
3. Weak Points: Does this align with user's weak point priorities?
4. Balance: Will the split remain balanced?

For CHANGE VARIATION, consider:
1. Periodization: Does the variation match the current phase/week?
2. Exercise Diversity: Will this maintain proper exercise variety?
3. Recovery: Does variation timing support adequate stimulus variation?

Provide concise, gym-friendly validation (max 50 words for reasoning).

Required JSON structure:
{
  "validation": "approved" | "caution" | "not_recommended",
  "rationale": "string (1-2 sentences, max 50 words, gym-friendly)",
  "warnings": ["string (max 20 words each)"],
  "suggestions": ["string (max 30 words each)"],
  "volumeImpact": {
    "muscleGroup": "string (optional)",
    "before": "number (optional)",
    "after": "number (optional)",
    "status": "string (optional, e.g., 'Within MAV range')"
  }
}
`

    return await this.complete<SplitChangeValidationOutput>(prompt)
  }
}

/**
 * Input for split change validation
 */
export interface SplitChangeValidationInput {
  modificationType: 'swap_days' | 'toggle_muscle' | 'change_variation'

  details: {
    // For swap_days
    fromDay?: number
    toDay?: number
    fromSession?: {
      name: string
      workoutType: string
      focus: string[]
      variation: 'A' | 'B'
    }
    toSession?: {
      name: string
      workoutType: string
      focus: string[]
      variation: 'A' | 'B'
    }

    // For toggle_muscle
    cycleDay?: number
    sessionName?: string
    workoutType?: string
    muscleGroup?: string
    action?: 'add' | 'remove'
    currentFocus?: string[]
    newFocus?: string[]

    // For change_variation
    currentVariation?: 'A' | 'B'
    newVariation?: 'A' | 'B'
  }

  splitContext: {
    cycleDays: number
    currentFrequencyMap?: Record<string, number> // muscle -> frequency/week
    volumeDistribution?: Record<string, number> // muscle -> total sets/cycle
  }

  userContext: {
    userId: string
    approachId: string
    experienceYears?: number
    userAge?: number
    weakPoints?: string[]
    mesocycleWeek?: number
    mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
  }
}

/**
 * Output for split change validation
 */
export interface SplitChangeValidationOutput {
  validation: 'approved' | 'caution' | 'not_recommended'
  rationale: string // 1-2 sentences, max 50 words, gym-friendly
  warnings: string[] // Each max 20 words
  suggestions: string[] // Each max 30 words
  volumeImpact?: {
    muscleGroup?: string
    before?: number
    after?: number
    status?: string // e.g., "Within MAV range", "Below MEV", "Exceeds MRV"
  }
}
