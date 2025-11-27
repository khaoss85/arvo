'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Mark a workout as completed with stats (server action)
 *
 * @param workoutId - The workout ID
 * @param stats - Stats to save with the workout
 * @returns Success status and optional error message
 */
export async function markWorkoutCompletedAction(
  workoutId: string,
  stats: {
    totalSets?: number;
    totalVolume?: number;
    durationSeconds?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get the workout to verify it exists
    const { data: workout, error: fetchError } = await supabase
      .from('workouts')
      .select('id, status, user_id')
      .eq('id', workoutId)
      .single()

    if (fetchError || !workout) {
      console.error('[markWorkoutCompletedAction] Workout not found:', workoutId, fetchError)
      return {
        success: false,
        error: 'Workout not found'
      }
    }

    // If already completed, just return success
    if (workout.status === 'completed') {
      console.log('[markWorkoutCompletedAction] Workout already completed:', workoutId)
      return { success: true }
    }

    // Update the workout
    const { error: updateError } = await supabase
      .from('workouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_sets: stats.totalSets || 0,
        total_volume: stats.totalVolume || 0,
        duration_seconds: stats.durationSeconds || null,
      })
      .eq('id', workoutId)

    if (updateError) {
      console.error('[markWorkoutCompletedAction] Failed to update workout:', updateError)
      return {
        success: false,
        error: 'Failed to mark workout as completed'
      }
    }

    // Invalidate cache so dashboard shows updated status
    revalidatePath('/simple')
    revalidatePath('/dashboard')

    console.log('[markWorkoutCompletedAction] Successfully marked workout as completed:', workoutId)
    return { success: true }
  } catch (error) {
    console.error('[markWorkoutCompletedAction] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Revalidate dashboard cache (for use after browser-side workout completion)
 * Call this from client components after WorkoutService.markAsCompletedWithStats()
 */
export async function revalidateDashboardCacheAction(): Promise<{ success: boolean }> {
  revalidatePath('/dashboard')
  revalidatePath('/simple')
  return { success: true }
}

/**
 * Get set logs for multiple workouts (server action)
 * Used by WorkoutDetailsDrawer to show actual logged weights/reps
 */
export async function getSetLogsByWorkoutIdsAction(
  workoutIds: string[]
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    workout_id: string | null
    exercise_name: string
    set_number: number | null
    weight_actual: number | null
    reps_actual: number | null
    rir_actual: number | null
    set_type: string | null
    skipped: boolean
  }>
  error?: string
}> {
  try {
    if (!workoutIds.length) {
      return { success: true, data: [] }
    }

    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('sets_log')
      .select('id, workout_id, exercise_name, set_number, weight_actual, reps_actual, rir_actual, set_type, skipped')
      .in('workout_id', workoutIds)
      .order('set_number', { ascending: true })

    if (error) {
      console.error('[getSetLogsByWorkoutIdsAction] Failed to fetch set logs:', error)
      return {
        success: false,
        error: 'Failed to fetch set logs'
      }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[getSetLogsByWorkoutIdsAction] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
