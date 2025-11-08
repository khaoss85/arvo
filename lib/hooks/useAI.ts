import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProgressionCalculator, type ProgressionInput } from '@/lib/agents/progression-calculator.agent'
import { generateWorkoutAction } from '@/app/actions/ai-actions'
import { workoutKeys } from './use-workouts'

/**
 * Hook for getting AI-powered progression suggestions
 * Returns suggestion for next set based on previous set performance
 */
export function useProgressionSuggestion() {
  return useMutation({
    mutationFn: async (input: ProgressionInput) => {
      const calculator = new ProgressionCalculator()
      return calculator.suggestNextSet(input)
    },
    onError: (error) => {
      console.error('Progression suggestion error:', error)
    }
  })
}

/**
 * Hook for generating AI-powered workouts
 * Creates a complete workout based on user profile and training approach
 */
export function useGenerateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await generateWorkoutAction(userId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate workout')
      }
      return result.workout
    },
    onSuccess: (data) => {
      // Invalidate workout queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: workoutKeys.list(data.user_id || undefined)
      })
      queryClient.invalidateQueries({
        queryKey: workoutKeys.upcoming(data.user_id || undefined)
      })
    },
    onError: (error) => {
      console.error('Workout generation error:', error)
    }
  })
}
