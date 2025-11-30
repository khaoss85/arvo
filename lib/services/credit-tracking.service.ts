/**
 * CreditTrackingService
 * Manages credit/token tracking for AI resource consumption.
 */

import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type CreditOperationType =
  | 'workout_generation'
  | 'split_generation'
  | 'audio_script_generation'
  | 'tts_synthesis'
  | 'embedding_generation'
  | 'exercise_substitution'
  | 'approach_recommendation'
  | 'insight_generation'
  | 'memory_consolidation'
  | 'technique_recommendation'
  | 'weight_estimation'
  | 'modification_validation'
  | 'other'

export interface CreditUsageInput {
  userId: string
  operationType: CreditOperationType
  creditsUsed: number
  tokensInput?: number
  tokensOutput?: number
  tokensReasoning?: number
  charactersProcessed?: number
  modelUsed?: string
  agentName?: string
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high'
  requestId?: string
  workoutId?: string
  metadata?: Record<string, any>
}

// Pricing per operation type (credits per request, for estimation)
const CREDIT_PRICING: Record<CreditOperationType, { credits: number; usdPer1kTokens: number }> = {
  workout_generation: { credits: 50, usdPer1kTokens: 0.03 },
  split_generation: { credits: 75, usdPer1kTokens: 0.05 },
  audio_script_generation: { credits: 20, usdPer1kTokens: 0.015 },
  tts_synthesis: { credits: 10, usdPer1kTokens: 0.015 }, // per 1k chars
  embedding_generation: { credits: 2, usdPer1kTokens: 0.00002 },
  exercise_substitution: { credits: 15, usdPer1kTokens: 0.01 },
  approach_recommendation: { credits: 25, usdPer1kTokens: 0.02 },
  insight_generation: { credits: 10, usdPer1kTokens: 0.008 },
  memory_consolidation: { credits: 5, usdPer1kTokens: 0.004 },
  technique_recommendation: { credits: 10, usdPer1kTokens: 0.008 },
  weight_estimation: { credits: 8, usdPer1kTokens: 0.006 },
  modification_validation: { credits: 5, usdPer1kTokens: 0.004 },
  other: { credits: 10, usdPer1kTokens: 0.008 },
}

// Map agent names to operation types
const AGENT_TO_OPERATION: Record<string, CreditOperationType> = {
  ExerciseSelectorAgent: 'workout_generation',
  SplitPlannerAgent: 'split_generation',
  AudioScriptGeneratorAgent: 'audio_script_generation',
  EmbeddingService: 'embedding_generation',
  ExerciseSubstitutionAgent: 'exercise_substitution',
  ApproachRecommenderAgent: 'approach_recommendation',
  InsightGeneratorAgent: 'insight_generation',
  MemoryConsolidationAgent: 'memory_consolidation',
  TechniqueRecommenderAgent: 'technique_recommendation',
  WeightEstimatorAgent: 'weight_estimation',
  WorkoutModificationValidator: 'modification_validation',
  ReorderValidator: 'modification_validation',
  ExerciseAdditionValidator: 'modification_validation',
  SplitTypeChangeValidator: 'modification_validation',
}

export class CreditTrackingService {
  /**
   * Record credit usage for an operation (server-side, bypasses RLS)
   */
  static async recordUsage(input: CreditUsageInput): Promise<string | null> {
    try {
      const supabase = getSupabaseAdmin()

      // Calculate estimated USD cost
      const pricing = CREDIT_PRICING[input.operationType] || CREDIT_PRICING.other
      let estimatedCostUsd = 0

      if (input.tokensInput || input.tokensOutput) {
        const totalTokens = (input.tokensInput || 0) + (input.tokensOutput || 0)
        estimatedCostUsd = (totalTokens / 1000) * pricing.usdPer1kTokens
      } else if (input.charactersProcessed && input.operationType === 'tts_synthesis') {
        estimatedCostUsd = (input.charactersProcessed / 1000) * 0.015
      } else {
        // Fallback: estimate from credits
        estimatedCostUsd = input.creditsUsed * 0.001
      }

      const { data, error } = await supabase
        .from('credit_usage')
        .insert({
          user_id: input.userId,
          operation_type: input.operationType,
          credits_used: input.creditsUsed,
          tokens_input: input.tokensInput || null,
          tokens_output: input.tokensOutput || null,
          tokens_reasoning: input.tokensReasoning || null,
          characters_processed: input.charactersProcessed || null,
          estimated_cost_usd: estimatedCostUsd,
          model_used: input.modelUsed || null,
          agent_name: input.agentName || null,
          reasoning_effort: input.reasoningEffort || null,
          request_id: input.requestId || null,
          workout_id: input.workoutId || null,
          metadata: input.metadata || {},
        })
        .select('id')
        .single()

      if (error) {
        console.error('[CreditTrackingService] Failed to record usage:', error)
        return null
      }

      return data?.id || null
    } catch (error) {
      console.error('[CreditTrackingService] Error recording usage:', error)
      return null
    }
  }

  /**
   * Get total credits consumed by a user
   */
  static async getUserTotalCredits(userId: string): Promise<number> {
    try {
      const supabase = getSupabaseAdmin()

      const { data, error } = await supabase
        .from('credit_usage')
        .select('credits_used')
        .eq('user_id', userId)

      if (error || !data) return 0

      return data.reduce((sum, row) => sum + Number(row.credits_used), 0)
    } catch (error) {
      console.error('[CreditTrackingService] Error getting user total:', error)
      return 0
    }
  }

  /**
   * Get credits for an operation type (for pre-check)
   */
  static getCreditsForOperation(operationType: CreditOperationType): number {
    return CREDIT_PRICING[operationType]?.credits || 10
  }

  /**
   * Map agent class name to operation type
   */
  static getOperationTypeForAgent(agentName: string): CreditOperationType {
    return AGENT_TO_OPERATION[agentName] || 'other'
  }

  /**
   * Calculate credits based on token usage
   */
  static calculateCreditsFromTokens(
    operationType: CreditOperationType,
    tokensInput: number,
    tokensOutput: number,
    tokensReasoning?: number
  ): number {
    // Base credits for the operation
    const baseCredits = CREDIT_PRICING[operationType]?.credits || 10

    // Add extra credits for heavy token usage
    const totalTokens = tokensInput + tokensOutput + (tokensReasoning || 0)

    // Scale: 1 extra credit per 500 tokens over 2000
    const extraCredits = totalTokens > 2000 ? Math.floor((totalTokens - 2000) / 500) : 0

    return baseCredits + extraCredits
  }
}
