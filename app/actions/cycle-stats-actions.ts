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
    splitType: string
  }>
  currentCycleStats: {
    cycleNumber: number
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds: number
    volumeByMuscleGroup: Record<string, number>
    targetVolumeDistribution: Record<string, number>
  } | null
}

/**
 * Get current cycle stats optimized for timeline card
 * Returns minimal data needed for MuscleDistributionCard in timeline
 */
export async function getCurrentCycleStatsAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient() as any

    // Get user profile
    const { data: profile } = (await supabase
      .from("user_profiles")
      .select("active_split_plan_id, cycles_completed")
      .eq("user_id", userId)
      .single()) as any

    if (!profile?.active_split_plan_id) {
      return {
        success: false,
        error: 'No active split plan found'
      }
    }

    // Get split plan for target volume distribution
    const splitPlan = await SplitPlanService.getActiveServer(userId) as any
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
    ) as any

    // Get comparison with previous cycle
    const comparison = await CycleStatsService.getComparisonWithPreviousCycle(
      currentStats,
      userId
    ) as any

    // Get previous cycle for muscle group comparison
    const previousCycle = await CycleStatsService.getLastCycleCompletion(userId) as any

    return {
      success: true,
      data: {
        currentStats: {
          totalVolume: currentStats.totalVolume,
          totalWorkouts: currentStats.totalWorkoutsCompleted,
          totalSets: currentStats.totalSets,
          totalDurationSeconds: currentStats.totalDurationSeconds,
          volumeByMuscleGroup: currentStats.volumeByMuscleGroup,
        },
        comparison,
        targetVolumeDistribution: splitPlan.volume_distribution as Record<string, number>,
        previousVolumeByMuscleGroup: (previousCycle?.volume_by_muscle_group as Record<string, number>) || null,
      }
    }
  } catch (error: any) {
    console.error('Error getting current cycle stats:', error) as any
    return {
      success: false,
      error: error?.message || 'Failed to get cycle stats'
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
    const supabase = await getSupabaseServerClient() as any

    // Get completed cycles
    const completedCycles = await CycleStatsService.getAllCycleCompletions(userId) as any
    const recentCycles = completedCycles.slice(0, limit) as any

    // Transform to simplified format
    const cycles = recentCycles.map((cycle: any) => ({
      id: cycle.id,
      cycleNumber: cycle.cycle_number,
      completedAt: cycle.completed_at,
      totalVolume: cycle.total_volume,
      totalWorkouts: cycle.total_workouts_completed,
      totalSets: cycle.total_sets,
      totalDurationSeconds: cycle.total_duration_seconds || 0,
      volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
      splitType: 'completed', // Could fetch split plan name if needed
    })) as any

    // Get current cycle stats
    const { data: profile } = (await supabase
      .from("user_profiles")
      .select("active_split_plan_id, cycles_completed")
      .eq("user_id", userId)
      .single()) as any

    let currentCycleStats = null

    if (profile?.active_split_plan_id) {
      const splitPlan = await SplitPlanService.getActiveServer(userId) as any
      const currentStats = await CycleStatsService.calculateCycleStats(
        userId,
        profile.active_split_plan_id
      ) as any

      if (splitPlan) {
        currentCycleStats = {
          cycleNumber: (profile.cycles_completed || 0) + 1,
          totalVolume: currentStats.totalVolume,
          totalWorkouts: currentStats.totalWorkoutsCompleted,
          totalSets: currentStats.totalSets,
          totalDurationSeconds: currentStats.totalDurationSeconds,
          volumeByMuscleGroup: currentStats.volumeByMuscleGroup,
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
  } catch (error: any) {
    console.error('Error getting historical cycle stats:', error) as any
    return {
      success: false,
      error: error?.message || 'Failed to get historical cycle stats'
    }
  }
}

/**
 * Get all completed cycles for a user (for dropdown selection) as any
 */
export async function getAllCycleCompletionsAction(userId: string) {
  try {
    const cycles = await CycleStatsService.getAllCycleCompletions(userId) as any

    return {
      success: true,
      data: cycles.map((cycle: any) => ({
        id: cycle.id,
        cycleNumber: cycle.cycle_number,
        completedAt: cycle.completed_at,
        totalVolume: cycle.total_volume,
        totalWorkouts: cycle.total_workouts_completed,
        totalSets: cycle.total_sets,
        totalDurationSeconds: cycle.total_duration_seconds || 0,
        volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
        avgMentalReadiness: cycle.avg_mental_readiness,
      })) as any
    }
  } catch (error: any) {
    console.error('Error getting all cycle completions:', error) as any
    return {
      success: false,
      error: error?.message || 'Failed to get cycle completions'
    }
  }
}

/**
 * Get a specific cycle completion by ID
 */
export async function getCycleCompletionByIdAction(cycleId: string) {
  try {
    const cycle = await CycleStatsService.getCycleCompletion(cycleId) as any

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
        avgMentalReadiness: cycle.avg_mental_readiness,
      }
    }
  } catch (error: any) {
    console.error('Error getting cycle completion by ID:', error) as any
    return {
      success: false,
      error: error?.message || 'Failed to get cycle completion'
    }
  }
}
