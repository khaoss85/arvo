import { useQuery } from '@tanstack/react-query'
import {
  getCurrentCycleStatsAction,
  getHistoricalCycleStatsAction,
  getAllCycleCompletionsAction,
  getCycleCompletionByIdAction
} from '@/app/actions/cycle-stats-actions'

export const cycleStatsKeys = {
  all: ['cycleStats'] as const,
  current: (userId: string) => [...cycleStatsKeys.all, 'current', userId] as const,
  historical: (userId: string, limit: number) => [...cycleStatsKeys.all, 'historical', userId, limit] as const,
  allCompletions: (userId: string) => [...cycleStatsKeys.all, 'allCompletions', userId] as const,
  cycleById: (cycleId: string) => [...cycleStatsKeys.all, 'cycleById', cycleId] as const,
  multipleCycles: (cycleIds: string[]) => [...cycleStatsKeys.all, 'multiple', ...cycleIds.sort()] as const,
}

/**
 * Hook for current cycle stats (timeline dashboard)
 * Provides current cycle metrics, comparison with previous cycle, and target distribution
 */
export function useCurrentCycleStats(userId: string | undefined) {
  return useQuery({
    queryKey: cycleStatsKeys.current(userId || ''),
    queryFn: async () => {
      const result = await getCurrentCycleStatsAction(userId!)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get cycle stats')
      }
      return result.data
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes (updates after workouts)
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: true, // Refetch when user returns to app
  })
}

/**
 * Hook for historical cycle stats (progress page)
 * Provides last N completed cycles + current cycle progress
 */
export function useHistoricalCycleStats(
  userId: string | undefined,
  limit: number = 6
) {
  return useQuery({
    queryKey: cycleStatsKeys.historical(userId || '', limit),
    queryFn: async () => {
      const result = await getHistoricalCycleStatsAction(userId!, limit)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get historical cycle stats')
      }
      return result.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refetch historical data on focus
  })
}

/**
 * Hook for all completed cycles (for dropdown selection)
 * Returns all completed cycles for a user
 */
export function useAllCycleCompletions(userId: string | undefined) {
  return useQuery({
    queryKey: cycleStatsKeys.allCompletions(userId || ''),
    queryFn: async () => {
      const result = await getAllCycleCompletionsAction(userId!)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get cycle completions')
      }
      return result.data
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (completed cycles don't change often)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for a specific cycle completion by ID
 * Used for detailed cycle comparison
 */
export function useCycleCompletionById(cycleId: string | null | undefined) {
  return useQuery({
    queryKey: cycleStatsKeys.cycleById(cycleId || ''),
    queryFn: async () => {
      const result = await getCycleCompletionByIdAction(cycleId!)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get cycle completion')
      }
      return result.data
    },
    enabled: !!cycleId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for fetching multiple cycles by IDs
 * Used for dual-cycle comparison mode
 */
export function useMultipleCycles(cycleIds: (string | null)[] | undefined) {
  const validIds = cycleIds?.filter((id): id is string => !!id) || []

  return useQuery({
    queryKey: cycleStatsKeys.multipleCycles(validIds),
    queryFn: async () => {
      const results = await Promise.all(
        validIds.map(id => getCycleCompletionByIdAction(id))
      )

      const cycles = results
        .filter(result => result.success && result.data)
        .map(result => result.data!)

      return cycles
    },
    enabled: validIds.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  })
}
