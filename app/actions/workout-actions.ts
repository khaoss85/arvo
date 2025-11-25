'use server'

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
        completed: true,
        completed_at: new Date().toISOString(),
        total_sets: stats.totalSets || 0,
        total_volume: stats.totalVolume || 0,
      })
      .eq('id', workoutId)

    if (updateError) {
      console.error('[markWorkoutCompletedAction] Failed to update workout:', updateError)
      return {
        success: false,
        error: 'Failed to mark workout as completed'
      }
    }

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
