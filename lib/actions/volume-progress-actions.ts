'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { calculateMuscleGroupVolumes, type WorkoutExercise } from '@/lib/utils/workout-helpers'
import type { Workout } from '@/lib/types/schemas'
import type { Database } from '@/lib/types/database.types'

/**
 * Volume progress for a single muscle group
 */
export interface MuscleVolumeProgress {
  muscle: string
  target: number      // Total sets target for the cycle
  current: number     // Sets completed so far in the cycle
  percentage: number  // (current / target) * 100
}

/**
 * Get volume progress for all main muscle groups in current split cycle
 * Returns progress ordered by importance (highest target first)
 */
export async function getVolumeProgressAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId)

    if (!splitPlan) {
      return {
        success: false,
        error: 'No active split plan found'
      }
    }

    // Get volume distribution (target totals for the cycle)
    const rawVolumeDistribution = splitPlan.volume_distribution as Record<string, number>

    // Aggregate granular muscles into parent muscles for consistent display
    // This ensures UI shows "shoulders: 18" instead of "shoulders_rear: 4, shoulders_side: 8, shoulders_front: 6"
    const MUSCLE_AGGREGATION_MAP: Record<string, string> = {
      'shoulders_front': 'shoulders',
      'shoulders_side': 'shoulders',
      'shoulders_rear': 'shoulders',
      'chest_upper': 'chest',
      'chest_lower': 'chest',
      'triceps_long': 'triceps',
      'triceps_lateral': 'triceps',
      'triceps_medial': 'triceps',
      'biceps_long': 'biceps',
      'biceps_short': 'biceps',
    }

    const volumeDistribution: Record<string, number> = {}
    for (const [muscle, sets] of Object.entries(rawVolumeDistribution)) {
      const parentMuscle = MUSCLE_AGGREGATION_MAP[muscle] || muscle
      volumeDistribution[parentMuscle] = (volumeDistribution[parentMuscle] || 0) + sets
    }

    // Get all completed workouts for current split cycle
    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlan.id)
      .eq('status', 'completed')

    if (workoutsError) {
      console.error('Error fetching completed workouts:', workoutsError)
      return {
        success: false,
        error: 'Failed to fetch completed workouts'
      }
    }

    type WorkoutRow = Database['public']['Tables']['workouts']['Row']
    const typedWorkouts = (completedWorkouts || []) as WorkoutRow[]

    // Calculate total volume completed so far in the cycle
    const totalVolumeByMuscle: Record<string, number> = {}

    if (typedWorkouts.length > 0) {
      for (const workout of typedWorkouts) {
        // Extract exercises from workout
        const exercises = workout.exercises as any[] || []

        // Convert to WorkoutExercise format
        const workoutExercises: WorkoutExercise[] = exercises.map(ex => ({
          name: ex.name || ex.exercise?.name || 'Unknown',
          sets: ex.completedSets?.length || ex.sets || 0,
          primaryMuscles: ex.primaryMuscles || ex.exercise?.primaryMuscles || [],
          secondaryMuscles: ex.secondaryMuscles || ex.exercise?.secondaryMuscles || []
        }))

        // Calculate volume per muscle for this workout
        const muscleVolumes = calculateMuscleGroupVolumes(workoutExercises)

        // Add to total volume
        for (const [muscle, breakdown] of Object.entries(muscleVolumes)) {
          totalVolumeByMuscle[muscle] = (totalVolumeByMuscle[muscle] || 0) + breakdown.total
        }
      }
    }

    // Build progress data for each muscle group
    const progressData: MuscleVolumeProgress[] = []

    for (const [muscle, target] of Object.entries(volumeDistribution)) {
      // Skip muscles with no target
      if (target <= 0) continue

      const current = totalVolumeByMuscle[muscle] || 0
      const percentage = target > 0 ? Math.round((current / target) * 100) : 0

      progressData.push({
        muscle,
        target,
        current,
        percentage
      })
    }

    // Sort by target volume (descending) to show most important muscles first
    progressData.sort((a, b) => b.target - a.target)

    // Take only top 6-8 muscle groups (main focus of the split)
    const topMuscles = progressData.slice(0, 8)

    return {
      success: true,
      data: topMuscles
    }
  } catch (error: any) {
    console.error('Error getting volume progress:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get volume progress'
    }
  }
}
