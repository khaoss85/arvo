'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import { SplitPlanService } from '@/lib/services/split-plan.service'

/**
 * Cycle stats optimized for timeline dashboard card
 */
export interface CycleStatsForTimeline {
  currentStats: {
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds: number
    volumeByMuscleGroup: Record<string, number>
    setsByMuscleGroup: Record<string, number>
  }
  comparison: {
    volumeDelta: number // percentage
    workoutsDelta: number
    setsDelta: number
    durationDelta?: number
  } | null
  targetVolumeDistribution: Record<string, number>
  previousVolumeByMuscleGroup: Record<string, number> | null
}

/**
 * Historical cycle stats for progress page analysis
 */
export interface HistoricalCycleStats {
  cycles: Array<{
    id: string
    cycleNumber: number
    completedAt: string
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds: number
    volumeByMuscleGroup: Record<string, number>
    setsByMuscleGroup: Record<string, number>
    splitType: string
  }>
  currentCycleStats: {
    cycleNumber: number
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds: number
    volumeByMuscleGroup: Record<string, number>
    setsByMuscleGroup: Record<string, number>
    targetVolumeDistribution: Record<string, number>
  } | null
}

/**
 * Get current cycle stats optimized for timeline card
 * Returns minimal data needed for MuscleDistributionCard in timeline
 */
export async function getCurrentCycleStatsAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_split_plan_id, cycles_completed")
      .eq("user_id", userId)
      .single()

    if (!profile?.active_split_plan_id) {
      return {
        success: false,
        error: 'No active split plan found'
      }
    }

    // Get split plan for target volume distribution
    const splitPlan = await SplitPlanService.getActiveServer(userId)
    if (!splitPlan) {
      return {
        success: false,
        error: 'Failed to get split plan'
      }
    }

    // Calculate current cycle stats
    const currentStats = await CycleStatsService.calculateCycleStats(
      userId,
      profile.active_split_plan_id
    )

    // Get comparison with previous cycle
    const comparison = await CycleStatsService.getComparisonWithPreviousCycle(
      currentStats,
      userId
    )

    // Get previous cycle for muscle group comparison
    const previousCycle = await CycleStatsService.getLastCycleCompletion(userId)

    return {
      success: true,
      data: {
        currentStats: {
          totalVolume: currentStats.totalVolume,
          totalWorkouts: currentStats.totalWorkoutsCompleted,
          totalSets: currentStats.totalSets,
          totalDurationSeconds: currentStats.totalDurationSeconds,
          volumeByMuscleGroup: currentStats.volumeByMuscleGroup,
          setsByMuscleGroup: currentStats.setsByMuscleGroup,
        },
        comparison,
        targetVolumeDistribution: splitPlan.volume_distribution as Record<string, number>,
        previousVolumeByMuscleGroup: (previousCycle?.volume_by_muscle_group as Record<string, number>) || null,
      }
    }
  } catch (error) {
    console.error('Error getting current cycle stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cycle stats'
    }
  }
}

/**
 * Get historical cycle stats for progress page
 * Returns last N completed cycles + current cycle progress
 */
export async function getHistoricalCycleStatsAction(
  userId: string,
  limit: number = 6
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get completed cycles
    const completedCycles = await CycleStatsService.getAllCycleCompletions(userId)
    const recentCycles = completedCycles.slice(0, limit)

    // Transform to simplified format
    const cycles = recentCycles.map((cycle) => ({
      id: cycle.id,
      cycleNumber: cycle.cycle_number,
      completedAt: cycle.completed_at,
      totalVolume: cycle.total_volume,
      totalWorkouts: cycle.total_workouts_completed,
      totalSets: cycle.total_sets,
      totalDurationSeconds: cycle.total_duration_seconds || 0,
      volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
      setsByMuscleGroup: (cycle.sets_by_muscle_group as Record<string, number>) || (cycle.volume_by_muscle_group as Record<string, number>) || {},
      splitType: 'completed', // Could fetch split plan name if needed
    }))

    // Get current cycle stats
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_split_plan_id, cycles_completed")
      .eq("user_id", userId)
      .single()

    let currentCycleStats = null

    if (profile?.active_split_plan_id) {
      const splitPlan = await SplitPlanService.getActiveServer(userId)
      const currentStats = await CycleStatsService.calculateCycleStats(
        userId,
        profile.active_split_plan_id
      )

      if (splitPlan) {
        currentCycleStats = {
          cycleNumber: (profile.cycles_completed || 0) + 1,
          totalVolume: currentStats.totalVolume,
          totalWorkouts: currentStats.totalWorkoutsCompleted,
          totalSets: currentStats.totalSets,
          totalDurationSeconds: currentStats.totalDurationSeconds,
          volumeByMuscleGroup: currentStats.volumeByMuscleGroup,
          setsByMuscleGroup: currentStats.setsByMuscleGroup,
          targetVolumeDistribution: splitPlan.volume_distribution as Record<string, number>,
        }
      }
    }

    return {
      success: true,
      data: {
        cycles,
        currentCycleStats,
      }
    }
  } catch (error) {
    console.error('Error getting historical cycle stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get historical cycle stats'
    }
  }
}

/**
 * Get all completed cycles for a user (for dropdown selection)
 */
export async function getAllCycleCompletionsAction(userId: string) {
  try {
    const cycles = await CycleStatsService.getAllCycleCompletions(userId)

    return {
      success: true,
      data: cycles.map((cycle) => ({
        id: cycle.id,
        cycleNumber: cycle.cycle_number,
        completedAt: cycle.completed_at,
        totalVolume: cycle.total_volume,
        totalWorkouts: cycle.total_workouts_completed,
        totalSets: cycle.total_sets,
        totalDurationSeconds: cycle.total_duration_seconds || 0,
        volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
        setsByMuscleGroup: (cycle.sets_by_muscle_group as Record<string, number>) || (cycle.volume_by_muscle_group as Record<string, number>) || {},
        avgMentalReadiness: cycle.avg_mental_readiness,
      }))
    }
  } catch (error) {
    console.error('Error getting all cycle completions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cycle completions'
    }
  }
}

/**
 * Get a specific cycle completion by ID
 */
export async function getCycleCompletionByIdAction(cycleId: string) {
  try {
    const cycle = await CycleStatsService.getCycleCompletion(cycleId)

    if (!cycle) {
      return {
        success: false,
        error: 'Cycle not found'
      }
    }

    return {
      success: true,
      data: {
        id: cycle.id,
        cycleNumber: cycle.cycle_number,
        completedAt: cycle.completed_at,
        totalVolume: cycle.total_volume,
        totalWorkouts: cycle.total_workouts_completed,
        totalSets: cycle.total_sets,
        totalDurationSeconds: cycle.total_duration_seconds || 0,
        volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
        setsByMuscleGroup: (cycle.sets_by_muscle_group as Record<string, number>) || (cycle.volume_by_muscle_group as Record<string, number>) || {},
        avgMentalReadiness: cycle.avg_mental_readiness,
      }
    }
  } catch (error) {
    console.error('Error getting cycle completion by ID:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cycle completion'
    }
  }
}
