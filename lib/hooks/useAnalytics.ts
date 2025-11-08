import { useQuery } from '@tanstack/react-query'
import { AnalyticsService } from '@/lib/services/analytics.service'
import { generateInsightsAction } from '@/app/actions/analytics-actions'

/**
 * Query keys for analytics
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  progress: (userId: string, exerciseId: string, days: number) =>
    [...analyticsKeys.all, 'progress', userId, exerciseId, days] as const,
  prs: (userId: string) =>
    [...analyticsKeys.all, 'prs', userId] as const,
  volume: (userId: string, days: number) =>
    [...analyticsKeys.all, 'volume', userId, days] as const,
  frequency: (userId: string, days: number) =>
    [...analyticsKeys.all, 'frequency', userId, days] as const,
  insights: (userId: string, days: number) =>
    [...analyticsKeys.all, 'insights', userId, days] as const,
  avgDuration: (userId: string, days: number) =>
    [...analyticsKeys.all, 'avgDuration', userId, days] as const,
}

/**
 * Hook for exercise progress data
 * Returns time-series data with e1RM calculations
 */
export function useExerciseProgress(
  userId: string | undefined,
  exerciseId: string,
  days: number = 30
) {
  return useQuery({
    queryKey: analyticsKeys.progress(userId || '', exerciseId, days),
    queryFn: () => AnalyticsService.getExerciseProgress(userId!, exerciseId, days),
    enabled: !!userId && !!exerciseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for personal records
 * Returns all-time PRs for each exercise
 */
export function usePersonalRecords(userId: string | undefined) {
  return useQuery({
    queryKey: analyticsKeys.prs(userId || ''),
    queryFn: () => AnalyticsService.getPersonalRecords(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for volume analytics
 * Returns weekly volume aggregations
 */
export function useVolumeAnalytics(
  userId: string | undefined,
  days: number = 30
) {
  return useQuery({
    queryKey: analyticsKeys.volume(userId || '', days),
    queryFn: () => AnalyticsService.getVolumeAnalytics(userId!, days),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for workout frequency data
 * Returns daily workout counts for heatmap
 */
export function useWorkoutFrequency(
  userId: string | undefined,
  days: number = 90
) {
  return useQuery({
    queryKey: analyticsKeys.frequency(userId || '', days),
    queryFn: () => AnalyticsService.getWorkoutFrequency(userId!, days),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook for AI-generated insights
 * Analyzes training data and provides personalized recommendations
 */
export function useAIInsights(
  userId: string | undefined,
  days: number = 30
) {
  return useQuery({
    queryKey: analyticsKeys.insights(userId || '', days),
    queryFn: async () => {
      const result = await generateInsightsAction(userId!, days)
      if (!result.success || !result.insights) {
        throw new Error(result.error || 'Failed to generate insights')
      }
      return result.insights
    },
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour (expensive AI call)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1, // Only retry once for AI calls
  })
}

/**
 * Hook for average workout duration
 */
export function useAverageWorkoutDuration(
  userId: string | undefined,
  days: number = 30
) {
  return useQuery({
    queryKey: analyticsKeys.avgDuration(userId || '', days),
    queryFn: () => AnalyticsService.getAverageWorkoutDuration(userId!, days),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}
