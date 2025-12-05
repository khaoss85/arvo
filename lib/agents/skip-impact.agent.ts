import { BaseAgent } from './base.agent'
import type { Locale } from '@/i18n'

/**
 * Skip Impact Agent - Ultra-fast evaluation of skipping an exercise
 *
 * Uses gpt-5-nano with NO reasoning for sub-second response times.
 * GPT-5.1 introduced 'none' as the fastest setting (faster than 'minimal').
 * Provides brief impact assessment to help users make informed decisions.
 */

export interface SkipImpactInput {
  exerciseName: string
  exerciseIndex: number
  totalExercises: number
  completedSetsCount: number
  targetSets: number
  targetWeight: number
  targetReps: [number, number]
  primaryMuscles: string[]
  workoutType: string
  // Context about what's already been done
  completedExercises: Array<{
    name: string
    primaryMuscles: string[]
    completedSets: number
  }>
  remainingExercises: Array<{
    name: string
    primaryMuscles: string[]
    targetSets: number
  }>
}

export interface SkipImpactOutput {
  recommendation: 'ok_to_skip' | 'consider_completing' | 'not_recommended'
  impactSummary: string  // Max 50 words, gym-friendly
  volumeLossKg: number
  muscleGroupCoverage: string  // e.g., "chest: 80% covered by other exercises"
}

export class SkipImpactAgent extends BaseAgent {
  // Use gpt-5-nano for ultra-fast responses
  protected model = 'gpt-5-nano'
  // NO reasoning for maximum speed - GPT-5.1's fastest setting
  protected reasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high' = 'none'
  // LOW verbosity for concise, quick responses (per GPT-5.1 docs)
  protected verbosity: 'low' | 'medium' | 'high' = 'low'

  get systemPrompt(): string {
    return `You are a gym training assistant evaluating the impact of skipping an exercise mid-workout.

Your job is to provide a BRIEF, ACTIONABLE assessment to help the user decide.

RESPONSE FORMAT (JSON only):
{
  "recommendation": "ok_to_skip" | "consider_completing" | "not_recommended",
  "impactSummary": "...", // MAX 50 words, gym-friendly
  "volumeLossKg": number, // estimated volume loss in kg
  "muscleGroupCoverage": "..." // e.g., "Chest: 75% covered"
}

DECISION LOGIC:
- "ok_to_skip": User has done significant work on this muscle group already, or it's minor/accessory
- "consider_completing": Some impact but manageable, mention what would be lost
- "not_recommended": This is the only/main exercise for a key muscle group, skipping would significantly impact workout quality

Keep responses SHORT and DIRECT. User is in the gym and needs quick info.`
  }

  // Override language instruction to specify SkipImpactOutput fields
  protected override getLanguageInstruction(targetLanguage: Locale = 'en'): string {
    if (targetLanguage === 'it') {
      return `

🇮🇹 ISTRUZIONI LINGUA: DEVI rispondere in italiano. Usa linguaggio naturale da palestra. I seguenti campi JSON devono essere in italiano:
- impactSummary (es: "Saltare ridurrà il volume sul petto. Altri esercizi coprono già questo gruppo.")
- muscleGroupCoverage (es: "Petto: coperto al 75% dagli esercizi completati")

Usa termini italiani per i muscoli: petto, dorso, spalle, bicipiti, tricipiti, quadricipiti, femorali, glutei, polpacci, addominali.`
    }
    return '' // English is default, no extra instruction needed
  }

  async evaluate(input: SkipImpactInput, locale: Locale = 'en'): Promise<SkipImpactOutput> {
    // Calculate basic metrics
    const avgReps = (input.targetReps[0] + input.targetReps[1]) / 2
    const remainingSets = input.targetSets - input.completedSetsCount
    const volumeLoss = input.targetWeight * avgReps * remainingSets

    // Build context about muscle coverage
    const primaryMuscle = input.primaryMuscles[0] || 'unknown'
    const exercisesForSameMuscle = [
      ...input.completedExercises.filter(e =>
        e.primaryMuscles.some(m => input.primaryMuscles.includes(m))
      ),
      ...input.remainingExercises.filter(e =>
        e.primaryMuscles.some(m => input.primaryMuscles.includes(m))
      )
    ]

    const userPrompt = `
EXERCISE TO SKIP: ${input.exerciseName}
Position: ${input.exerciseIndex + 1}/${input.totalExercises}
Progress: ${input.completedSetsCount}/${input.targetSets} sets done
Target: ${input.targetSets} sets × ${input.targetReps[0]}-${input.targetReps[1]} reps @ ${input.targetWeight}kg
Primary muscles: ${input.primaryMuscles.join(', ')}
Workout type: ${input.workoutType}

ALREADY COMPLETED EXERCISES (for same muscle groups):
${input.completedExercises
  .filter(e => e.primaryMuscles.some(m => input.primaryMuscles.includes(m)))
  .map(e => `- ${e.name}: ${e.completedSets} sets (${e.primaryMuscles.join(', ')})`)
  .join('\n') || 'None'}

REMAINING EXERCISES (for same muscle groups):
${input.remainingExercises
  .filter(e => e.primaryMuscles.some(m => input.primaryMuscles.includes(m)))
  .map(e => `- ${e.name}: ${e.targetSets} sets planned (${e.primaryMuscles.join(', ')})`)
  .join('\n') || 'None'}

Estimated volume loss if skipped: ~${Math.round(volumeLoss)}kg

Provide your assessment.`

    try {
      const result = await this.complete<SkipImpactOutput>(userPrompt, locale)

      // Ensure volumeLossKg is set
      if (!result.volumeLossKg) {
        result.volumeLossKg = Math.round(volumeLoss)
      }

      return result
    } catch (error) {
      console.error('[SkipImpactAgent] Error:', error)

      // Fallback response if AI fails
      return {
        recommendation: 'ok_to_skip',
        impactSummary: `Skipping will lose ~${Math.round(volumeLoss)}kg volume. ${exercisesForSameMuscle.length > 0 ? 'Other exercises cover this muscle group.' : 'This is the only exercise for this muscle group.'}`,
        volumeLossKg: Math.round(volumeLoss),
        muscleGroupCoverage: `${primaryMuscle}: ${exercisesForSameMuscle.length > 0 ? 'partially covered' : 'not covered'} by other exercises`
      }
    }
  }
}
