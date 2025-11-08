import 'server-only'
import { getOpenAIClient } from '@/lib/ai/client'
import { KnowledgeEngine } from '@/lib/knowledge/engine'

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
   * @returns Concise explanation (1-2 sentences)
   */
  static async explainDecision(
    type: ExplanationType,
    context: ExplanationContext,
    approachId: string
  ): Promise<string> {
    try {
      const approach = await this.knowledge.loadApproach(approachId)
      const prompt = this.buildExplanationPrompt(type, context, approach)

      const response = await this.openai.responses.create({
        model: 'gpt-5-mini',
        input: prompt,
        reasoning: { effort: 'low' },      // Simple explanations don't need deep reasoning
        text: { verbosity: 'low' }         // Keep it concise for mobile UI
      })

      return response.output_text.trim()
    } catch (error) {
      console.error('Failed to generate explanation:', error)
      return 'Based on training approach principles'
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
    const baseInstruction = 'Explain in 1-2 simple sentences. Be specific and practical. No technical jargon.'

    switch (type) {
      case 'exercise_selection':
        return `Why was "${context.exerciseName}" selected for this workout?

Training Approach: ${approach.name}
Priority Rules: ${approach.exerciseSelection?.priorityRules?.join(', ')}
User Weak Points: ${context.weakPoints?.join(', ') || 'None'}
${context.rationale ? `Original Rationale: ${context.rationale}` : ''}

${baseInstruction}`

      case 'exercise_order':
        return `Why is "${context.exerciseName}" placed at position ${context.position} in the workout?

Training Philosophy: ${approach.philosophy}
Exercise Type: ${context.exerciseType}
Priority Rules: ${approach.exerciseSelection?.priorityRules?.join(', ')}

${baseInstruction}`

      case 'weight_selection':
        return `Why ${context.weight}kg for ${context.exerciseName}?

Previous Performance: ${context.lastPerformance}
Approach Progression Priority: ${approach.progression?.priority}

${baseInstruction}`

      case 'set_progression':
        return `Why this progression for the next set?

Current Set: ${context.weight}kg × ${context.reps} reps @ RIR ${context.rir}
Training Approach: ${approach.name}
${context.rationale ? `Suggestion Rationale: ${context.rationale}` : ''}

${baseInstruction} Focus on the "why" not the "what".`

      case 'substitution':
        return `Why is "${context.exerciseName}" a good substitute?

Training Pattern: ${context.exerciseType}
Weak Points: ${context.weakPoints?.join(', ') || 'None'}
${context.rationale ? `Selection Rationale: ${context.rationale}` : ''}

${baseInstruction}`

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
    approachId: string
  ): Promise<string> {
    return this.explainDecision(
      'exercise_selection',
      { exerciseName, weakPoints, rationale },
      approachId
    )
  }

  /**
   * Explain why an exercise is in a specific position
   */
  static async explainExerciseOrder(
    exerciseName: string,
    position: number,
    exerciseType: 'compound' | 'isolation',
    approachId: string
  ): Promise<string> {
    return this.explainDecision(
      'exercise_order',
      { exerciseName, position, exerciseType },
      approachId
    )
  }

  /**
   * Explain a set progression suggestion
   */
  static async explainProgression(
    currentSet: { weight: number; reps: number; rir: number },
    suggestionRationale: string,
    approachId: string
  ): Promise<string> {
    return this.explainDecision(
      'set_progression',
      {
        weight: currentSet.weight,
        reps: currentSet.reps,
        rir: currentSet.rir,
        rationale: suggestionRationale
      },
      approachId
    )
  }
}
