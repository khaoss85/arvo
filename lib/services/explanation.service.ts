import 'server-only'
import { getOpenAIClient } from '@/lib/ai/client'
import { KnowledgeEngine } from '@/lib/knowledge/engine'
import type { Locale } from '@/i18n'

export type ExplanationType =
  | 'exercise_order'
  | 'weight_selection'
  | 'set_progression'
  | 'substitution'
  | 'exercise_selection'

export interface ExplanationContext {
  exerciseName?: string
  position?: number
  exerciseType?: 'compound' | 'isolation'
  weight?: number
  reps?: number
  rir?: number
  lastPerformance?: string
  weakPoints?: string[]
  rationale?: string
  [key: string]: any
}

/**
 * ExplanationService
 *
 * Provides simple, concise AI explanations for training decisions.
 * Uses GPT-5 Responses API with low reasoning effort for quick, user-friendly explanations.
 */
export class ExplanationService {
  private static openai = getOpenAIClient()
  private static knowledge = new KnowledgeEngine()

  /**
   * Generate a concise explanation for a training decision
   *
   * @param type - Type of decision to explain
   * @param context - Context data for the explanation
   * @param approachId - Training approach ID
   * @param targetLanguage - Target language for explanation (en or it)
   * @returns Concise explanation (1-2 sentences)
   */
  static async explainDecision(
    type: ExplanationType,
    context: ExplanationContext,
    approachId: string,
    targetLanguage: Locale = 'en'
  ): Promise<string> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const approach = await this.knowledge.loadApproach(approachId)
        const basePrompt = this.buildExplanationPrompt(type, context, approach)

        // Add language instruction
        const languageInstruction = targetLanguage === 'it'
          ? '\n\n🇮🇹 LANGUAGE: Respond in Italian (italiano). Keep it natural and concise for gym use.'
          : '\n\n🇬🇧 LANGUAGE: Respond in English.'

        const prompt = basePrompt + languageInstruction

        console.log(`[ExplanationService] Generating ${type} explanation (attempt ${attempt}/${maxRetries})`, {
          exerciseName: context.exerciseName,
          approachId,
          targetLanguage,
          contextKeys: Object.keys(context)
        })

        const response = await this.openai.responses.create({
          model: 'gpt-5-mini',
          input: prompt,
          reasoning: { effort: 'low' },      // Simple explanations don't need deep reasoning
          text: { verbosity: 'low' }         // Keep it concise for mobile UI
        })

        const explanation = response.output_text.trim()
        console.log(`[ExplanationService] Successfully generated ${type} explanation`, {
          length: explanation.length,
          preview: explanation.substring(0, 50)
        })

        return explanation
      } catch (error) {
        lastError = error
        console.error(`[ExplanationService] Attempt ${attempt}/${maxRetries} failed for ${type}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          exerciseName: context.exerciseName,
          approachId,
          context
        })

        // Wait before retry (exponential backoff: 500ms, 1s, 2s)
        if (attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt - 1) * 500
          console.log(`[ExplanationService] Retrying in ${waitMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitMs))
        }
      }
    }

    // All retries failed, return contextual fallback
    console.error(`[ExplanationService] All ${maxRetries} attempts failed for ${type}`, {
      finalError: lastError instanceof Error ? lastError.message : String(lastError)
    })
    return this.getFallbackExplanation(type, context)
  }

  /**
   * Get a contextual fallback explanation when AI fails
   */
  private static getFallbackExplanation(
    type: ExplanationType,
    context: ExplanationContext
  ): string {
    switch (type) {
      case 'exercise_selection':
        return context.weakPoints && context.weakPoints.length > 0
          ? `Targets ${context.weakPoints.join(' and ')} based on your training focus.`
          : 'Selected to match your training goals and approach.'

      case 'exercise_order':
        return context.exerciseType === 'compound'
          ? 'Compound exercises come first for maximum strength.'
          : 'Isolation work follows compounds for targeted development.'

      case 'weight_selection':
        return context.lastPerformance
          ? 'Progressive overload from your last session.'
          : 'Chosen based on your training history.'

      case 'set_progression':
        return context.rir && context.rir < 3
          ? 'Adjusting intensity based on your fatigue level.'
          : 'Progressing load for optimal stimulus.'

      case 'substitution':
        return 'Similar movement pattern and stimulus to the original.'

      default:
        return 'Based on training approach principles.'
    }
  }

  /**
   * Build a prompt for explaining a specific decision type
   */
  private static buildExplanationPrompt(
    type: ExplanationType,
    context: ExplanationContext,
    approach: any
  ): string {
    const baseInstruction = `Write 1 SHORT sentence (max 15 words) that explains WHY and WHY NOW.
Make it gym-friendly - something you'd quickly read between sets.
Use simple language, be specific about timing/reasoning.
Focus on practical value, not theory.`

    switch (type) {
      case 'exercise_selection':
        return `You're in the gym about to do "${context.exerciseName}". Explain WHY this exercise right now in your training.

Training Context:
- Approach: ${approach.name}
- Your focus areas: ${context.weakPoints?.join(', ') || 'General development'}
- Original reason: ${context.rationale || 'Follows training principles'}
- Priority: ${approach.exerciseSelection?.priorityRules?.[0] || 'Progressive overload'}

${baseInstruction}

Example good answers:
- "Targets your weak upper chest while you're fresh"
- "Heavy compound for strength gains in your accumulation phase"
- "Finishes quads after squats to maximize hypertrophy"

Your answer (1 sentence only):`

      case 'exercise_order':
        return `"${context.exerciseName}" is exercise #${context.position} in today's workout. Explain WHY it's placed here.

Context:
- Type: ${context.exerciseType} exercise
- Philosophy: ${approach.philosophy?.substring(0, 100)}
- Priority: ${approach.exerciseSelection?.priorityRules?.[0] || 'Not specified'}

${baseInstruction}

Example answers:
- "Goes first while you're fresh for heavy lifting"
- "Isolation after compounds to target fatigued muscle"
- "Placed here to pre-exhaust before main movement"

Your answer (1 sentence):`

      case 'weight_selection':
        return `Explain why ${context.weight}kg is the right weight NOW for ${context.exerciseName}.

Context:
- Last time: ${context.lastPerformance || 'First time doing this'}
- Progression goal: ${approach.progression?.priority || 'Progressive overload'}

${baseInstruction}

Example answers:
- "5kg heavier than last week for progressive overload"
- "Same weight to focus on better form today"
- "Lighter to account for accumulated fatigue"

Your answer (1 sentence):`

      case 'set_progression':
        return `You just did ${context.weight}kg × ${context.reps} @ RIR ${context.rir}. Explain WHY this progression for the next set.

Context:
- Approach: ${approach.name}
- AI reasoning: ${context.rationale || 'Standard progression'}
- Phase: ${approach.progression?.priority || 'Building strength'}

${baseInstruction}

Example answers:
- "Adding weight since you had 3+ reps left in the tank"
- "Keeping weight - hit target reps with good RIR"
- "Reducing reps to maintain intensity as fatigue builds"

Your answer (1 sentence):`

      case 'substitution':
        return `"${context.exerciseName}" is replacing another exercise. Explain WHY it's a good swap right now.

Context:
- Type: ${context.exerciseType}
- Your focus: ${context.weakPoints?.join(', ') || 'General development'}
- Reason: ${context.rationale || 'Equipment/preference'}

${baseInstruction}

Example answers:
- "Same movement pattern, targets your weak hamstrings"
- "Better machine available for your shoulder limitation"
- "Compound swap maintains strength stimulus"

Your answer (1 sentence):`

      default:
        return `Explain this training decision based on ${approach.name} principles:
                ${JSON.stringify(context)}

                ${baseInstruction}`
    }
  }

  /**
   * Explain why an exercise was selected for a workout
   */
  static async explainExerciseSelection(
    exerciseName: string,
    weakPoints: string[],
    rationale: string,
    approachId: string,
    targetLanguage: Locale = 'en'
  ): Promise<string> {
    return this.explainDecision(
      'exercise_selection',
      { exerciseName, weakPoints, rationale },
      approachId,
      targetLanguage
    )
  }

  /**
   * Explain why an exercise is in a specific position
   */
  static async explainExerciseOrder(
    exerciseName: string,
    position: number,
    exerciseType: 'compound' | 'isolation',
    approachId: string,
    targetLanguage: Locale = 'en'
  ): Promise<string> {
    return this.explainDecision(
      'exercise_order',
      { exerciseName, position, exerciseType },
      approachId,
      targetLanguage
    )
  }

  /**
   * Explain a set progression suggestion
   */
  static async explainProgression(
    currentSet: { weight: number; reps: number; rir: number },
    suggestionRationale: string,
    approachId: string,
    targetLanguage: Locale = 'en'
  ): Promise<string> {
    return this.explainDecision(
      'set_progression',
      {
        weight: currentSet.weight,
        reps: currentSet.reps,
        rir: currentSet.rir,
        rationale: suggestionRationale
      },
      approachId,
      targetLanguage
    )
  }
}
