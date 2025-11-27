import { useMutation } from '@tanstack/react-query'
import { getApproachRecommendationAction } from '@/app/actions/approach-actions'
import type { ApproachRecommendationInput, ApproachRecommendationOutput } from '@/lib/agents/approach-recommender.agent'

/**
 * Hook for getting AI-powered approach recommendations
 * Returns the best training approach based on user profile and goals
 */
export function useApproachRecommendation() {
  return useMutation({
    mutationFn: async (input: ApproachRecommendationInput): Promise<ApproachRecommendationOutput | null> => {
      const result = await getApproachRecommendationAction(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get approach recommendation')
      }
      return result.recommendation || null
    },
    onError: (error) => {
      console.error('Approach recommendation error:', error)
    }
  })
}
