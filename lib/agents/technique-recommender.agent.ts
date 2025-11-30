import { BaseAgent } from './base.agent'
import type { TechniqueType, TechniqueConfig, TECHNIQUE_COMPATIBILITY } from '@/lib/types/advanced-techniques'

// =============================================================================
// Input Types
// =============================================================================

export interface TechniqueRecommendationInput {
  exerciseInfo: {
    name: string
    muscleGroups: {
      primary: string[]
      secondary: string[]
    }
    equipmentType?: string
    isCompound: boolean
    positionInWorkout: number // 1-indexed
    totalExercises: number
  }

  workoutContext: {
    workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
    totalVolume: number // total sets in workout
    exercisesWithTechniques: number // how many exercises already have techniques
  }

  userContext: {
    experienceYears: number
    currentPhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
    approachName?: string
    recentFatigueLevel?: number // 1-5 scale (from mental readiness)
    mentalReadiness?: number // 1-5 scale
  }
}

export interface TechniqueValidationInput extends TechniqueRecommendationInput {
  chosenTechnique: TechniqueType
}

// =============================================================================
// Output Types
// =============================================================================

export interface TechniqueRecommendation {
  technique: TechniqueType
  score: number // 0-100 recommendation score
  rationale: string // Short explanation (max 30 words)
  suggestedConfig?: Partial<TechniqueConfig>
}

export interface TechniqueRecommendationOutput {
  recommendations: TechniqueRecommendation[]
  notRecommended: Array<{
    technique: TechniqueType
    reason: string // Short reason why not recommended (max 20 words)
  }>
  generalAdvice?: string // Optional general advice (max 40 words)
}

export interface TechniqueValidationOutput {
  validation: 'approved' | 'caution' | 'not_recommended'
  reasoning: string // Short explanation (max 40 words)
  alternative?: {
    technique: TechniqueType
    reason: string // Why this would be better (max 25 words)
  }
}

// =============================================================================
// Agent Implementation
// =============================================================================

/**
 * TechniqueRecommenderAgent
 *
 * Recommends and validates advanced training techniques for exercises.
 * Uses gpt-5-mini with low reasoning for fast responses (<2s).
 *
 * Features:
 * - Recommends techniques based on exercise type, user experience, and context
 * - Validates user choices when they select non-recommended techniques
 * - Considers fatigue, training phase, and workout position
 */
export class TechniqueRecommenderAgent extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, 'low', 'low') // Low reasoning for fast responses
    this.model = 'gpt-5-mini' // Fast model for <2s responses
  }

  get systemPrompt(): string {
    return `You are an expert strength coach specializing in advanced training techniques.

Your role is to recommend appropriate intensity techniques based on exercise context, user experience, and training phase.

TECHNIQUE KNOWLEDGE:
1. DROP SET: Reduce weight after failure, continue for more reps. Best for isolations, intermediate+.
2. REST-PAUSE: 10-15s pauses to extend sets. Works for any exercise, intermediate+.
3. SUPERSET: Two exercises back-to-back. Good for time efficiency, any level.
4. TOP SET + BACKOFF: Heavy top set followed by lighter volume sets. Compounds only, intermediate+.
5. MYO-REPS: Activation set + mini-sets with 3-5s rest. Isolations, advanced only.
6. GIANT SET: 3+ exercises in sequence. Time-efficient, intermediate+.
7. CLUSTER SET: Intra-set rest (15-30s) between small clusters. Compounds, advanced only.
8. PYRAMID: Progressive weight changes. Any exercise, beginner-friendly.

KEY FACTORS FOR RECOMMENDATIONS:
- Exercise type (compound vs isolation): Cluster sets and top-set-backoff need compounds; drop sets and myo-reps need isolations
- User experience: Beginners limited to superset/pyramid; advanced can use myo-reps/cluster sets
- Training phase: Intensification favors techniques; deload should avoid them
- Fatigue level: High fatigue = avoid demanding techniques (cluster sets, myo-reps)
- Workout position: Late exercises benefit from techniques that extend work with less load
- Existing techniques: Don't overload workout with too many techniques (max 2-3)

Be practical and educational. Keep messages gym-friendly and concise.`
  }

  /**
   * Get technique recommendations for an exercise
   */
  async recommend(
    input: TechniqueRecommendationInput
  ): Promise<TechniqueRecommendationOutput> {
    const experienceLevel = this.getExperienceLevel(input.userContext.experienceYears)
    const fatigueContext = this.buildFatigueContext(input.userContext)
    const phaseContext = this.buildPhaseContext(input.userContext.currentPhase)

    const prompt = `
=== TECHNIQUE RECOMMENDATION REQUEST ===

EXERCISE INFO:
- Name: ${input.exerciseInfo.name}
- Type: ${input.exerciseInfo.isCompound ? 'COMPOUND' : 'ISOLATION'}
- Primary muscles: ${input.exerciseInfo.muscleGroups.primary.join(', ')}
- Secondary muscles: ${input.exerciseInfo.muscleGroups.secondary.join(', ') || 'None'}
- Equipment: ${input.exerciseInfo.equipmentType || 'Standard'}
- Position in workout: ${input.exerciseInfo.positionInWorkout}/${input.exerciseInfo.totalExercises}

WORKOUT CONTEXT:
- Workout type: ${input.workoutContext.workoutType}
- Total volume: ${input.workoutContext.totalVolume} sets
- Exercises with techniques: ${input.workoutContext.exercisesWithTechniques}

USER CONTEXT:
- Experience: ${input.userContext.experienceYears} years (${experienceLevel})
- Approach: ${input.userContext.approachName || 'Not specified'}
${phaseContext}
${fatigueContext}

=== YOUR TASK ===
Recommend the best techniques for this exercise, considering all constraints.

For each recommended technique:
- Score from 0-100 (100 = perfect match)
- Brief rationale (max 30 words)
- Optional suggested config parameters

Also list techniques that are NOT recommended with short reasons.

Required JSON structure:
{
  "recommendations": [
    {
      "technique": "drop_set" | "rest_pause" | "superset" | "top_set_backoff" | "myo_reps" | "giant_set" | "cluster_set" | "pyramid",
      "score": number (0-100),
      "rationale": "string (max 30 words)",
      "suggestedConfig": { ... } // optional
    }
  ],
  "notRecommended": [
    {
      "technique": "string",
      "reason": "string (max 20 words)"
    }
  ],
  "generalAdvice": "string (max 40 words)" // optional
}

IMPORTANT:
- Maximum 3 recommendations, sorted by score descending
- Only recommend techniques appropriate for ${experienceLevel} level
- Consider exercise type constraints (compound vs isolation)
- If workout already has ${input.workoutContext.exercisesWithTechniques} techniques, be conservative
`

    return await this.complete<TechniqueRecommendationOutput>(prompt)
  }

  /**
   * Validate a user's technique choice
   * Used when user selects a technique that wasn't AI-recommended
   */
  async validateChoice(
    input: TechniqueValidationInput
  ): Promise<TechniqueValidationOutput> {
    const experienceLevel = this.getExperienceLevel(input.userContext.experienceYears)
    const fatigueContext = this.buildFatigueContext(input.userContext)
    const phaseContext = this.buildPhaseContext(input.userContext.currentPhase)

    const prompt = `
=== TECHNIQUE VALIDATION REQUEST ===

USER CHOSE: ${input.chosenTechnique.toUpperCase().replace('_', ' ')}

EXERCISE INFO:
- Name: ${input.exerciseInfo.name}
- Type: ${input.exerciseInfo.isCompound ? 'COMPOUND' : 'ISOLATION'}
- Primary muscles: ${input.exerciseInfo.muscleGroups.primary.join(', ')}
- Position in workout: ${input.exerciseInfo.positionInWorkout}/${input.exerciseInfo.totalExercises}

USER CONTEXT:
- Experience: ${input.userContext.experienceYears} years (${experienceLevel})
- Approach: ${input.userContext.approachName || 'Not specified'}
${phaseContext}
${fatigueContext}

WORKOUT CONTEXT:
- Exercises with techniques: ${input.workoutContext.exercisesWithTechniques}

=== YOUR TASK ===
Validate whether this technique choice is appropriate.

Validation levels:
- "approved": Good choice, proceed confidently
- "caution": Works but has trade-offs (explain clearly)
- "not_recommended": Poor fit for this exercise/context (explain why)

If not ideal, suggest a better alternative.

Required JSON structure:
{
  "validation": "approved" | "caution" | "not_recommended",
  "reasoning": "string (max 40 words)",
  "alternative": {  // only if caution or not_recommended
    "technique": "string",
    "reason": "string (max 25 words)"
  }
}

Be practical and educational. Help the user understand WHY.
`

    return await this.complete<TechniqueValidationOutput>(prompt)
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private getExperienceLevel(years: number): 'beginner' | 'intermediate' | 'advanced' {
    if (years < 1) return 'beginner'
    if (years < 3) return 'intermediate'
    return 'advanced'
  }

  private buildFatigueContext(userContext: TechniqueRecommendationInput['userContext']): string {
    if (userContext.mentalReadiness === undefined && userContext.recentFatigueLevel === undefined) {
      return ''
    }

    const readiness = userContext.mentalReadiness ?? userContext.recentFatigueLevel ?? 3
    let fatigueStatus = ''
    let guidance = ''

    if (readiness <= 2) {
      fatigueStatus = '😫 FATIGUED'
      guidance = 'Avoid demanding techniques (cluster sets, myo-reps). Prefer simpler options.'
    } else if (readiness <= 3) {
      fatigueStatus = '😐 MODERATE'
      guidance = 'Be conservative with technique selection.'
    } else {
      fatigueStatus = '🔥 FRESH'
      guidance = 'User is well-recovered, can handle demanding techniques.'
    }

    return `
FATIGUE STATUS:
- Mental Readiness: ${readiness}/5 (${fatigueStatus})
- Guidance: ${guidance}
`
  }

  private buildPhaseContext(phase?: string): string {
    if (!phase) return ''

    const phaseGuidance: Record<string, string> = {
      accumulation: 'Volume focus - techniques that add volume (drop sets, rest-pause) are appropriate',
      intensification: 'Intensity focus - techniques that increase intensity (cluster sets, top-set-backoff) fit well',
      deload: 'Recovery focus - AVOID advanced techniques, keep it simple',
      transition: 'Transitioning phases - moderate technique usage'
    }

    return `
TRAINING PHASE:
- Current: ${phase.toUpperCase()}
- Guidance: ${phaseGuidance[phase] || 'Standard technique selection'}
`
  }
}
