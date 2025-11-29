'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Progressive target data for pre-populating exercise values
 */
export interface ProgressiveTarget {
  weight: number
  reps: number
  hasHistory: boolean
  lastPerformedAt: string | null
  basedOnSets: number // How many sets this is based on
}

/**
 * Get progressive overload target for an exercise based on history
 * Used when swapping/adding exercises to use historical data
 *
 * @param exerciseName - The exercise name to search for (case-insensitive)
 * @param repRange - The target rep range for progression calculation
 * @returns Progressive target with weight and reps
 */
export async function getProgressiveTargetAction(
  exerciseName: string,
  repRange: [number, number] = [8, 12]
): Promise<{ success: boolean; data?: ProgressiveTarget; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: true,
        data: {
          weight: 0,
          reps: repRange[0],
          hasHistory: false,
          lastPerformedAt: null,
          basedOnSets: 0,
        }
      }
    }

    // Query last 5 completed working sets for this exercise
    const { data: setLogs, error: queryError } = await supabase
      .from('sets_log')
      .select(`
        weight_actual,
        reps_actual,
        rir_actual,
        workouts!inner (
          user_id,
          status,
          completed_at
        )
      `)
      .ilike('exercise_name', exerciseName)
      .eq('workouts.user_id', user.id)
      .eq('workouts.status', 'completed')
      .eq('set_type', 'working')
      .eq('skipped', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (queryError) {
      console.error('[getProgressiveTargetAction] Query error:', queryError)
      return {
        success: true,
        data: {
          weight: 0,
          reps: repRange[0],
          hasHistory: false,
          lastPerformedAt: null,
          basedOnSets: 0,
        }
      }
    }

    if (!setLogs || setLogs.length === 0) {
      return {
        success: true,
        data: {
          weight: 0,
          reps: repRange[0],
          hasHistory: false,
          lastPerformedAt: null,
          basedOnSets: 0,
        }
      }
    }

    // Get most recent completed set for progressive overload calculation
    const lastSet = setLogs[0]
    const workout = lastSet.workouts as unknown as { completed_at: string }
    const lastWeight = lastSet.weight_actual || 0
    const lastReps = lastSet.reps_actual || repRange[0]
    const lastRir = lastSet.rir_actual ?? 3 // Default to 3 RIR if not recorded

    // Progressive overload logic (same as workout-generator.service.ts)
    let targetWeight = lastWeight
    let targetReps = lastReps

    if (lastRir < 2 || lastReps >= repRange[1]) {
      // Close to failure or at top of rep range -> increase weight
      const increment = lastWeight >= 40 ? 2.5 : 1.25
      targetWeight = Math.round((lastWeight + increment) * 4) / 4
      targetReps = repRange[0]
    } else if (lastReps < repRange[1]) {
      // Room to add reps -> add 1-2 reps
      targetReps = Math.min(lastReps + 1, repRange[1])
      targetWeight = lastWeight
    } else {
      // At top of range with good RIR -> small weight increase
      targetWeight = Math.round((lastWeight + 1.25) * 4) / 4
      targetReps = repRange[0]
    }

    return {
      success: true,
      data: {
        weight: targetWeight,
        reps: targetReps,
        hasHistory: true,
        lastPerformedAt: workout.completed_at,
        basedOnSets: setLogs.length,
      }
    }
  } catch (error) {
    console.error('[getProgressiveTargetAction] Unexpected error:', error)
    return {
      success: true,
      data: {
        weight: 0,
        reps: repRange[0],
        hasHistory: false,
        lastPerformedAt: null,
        basedOnSets: 0,
      }
    }
  }
}

/**
 * Session data for an exercise history entry
 */
export interface ExerciseSession {
  workoutId: string
  completedAt: string
  sets: Array<{
    setNumber: number
    weight: number | null
    reps: number | null
    rir: number | null
  }>
}

/**
 * Personal best records for an exercise
 */
export interface PersonalBest {
  maxWeight: number | null
  maxWeightDate: string | null
  maxVolume: number | null  // Total volume of best session (sum of all sets)
  maxVolumeDate: string | null
}

/**
 * Exercise history data returned from the server action
 */
export interface ExerciseHistoryData {
  exerciseName: string
  sessions: ExerciseSession[]
  personalBest: PersonalBest
  lastPerformedAt: string | null
  totalSessionsCount: number
}

/**
 * Get exercise history for a specific exercise by name
 * Returns last N sessions with sets, personal bests, and progression data
 *
 * @param exerciseName - The exercise name to search for (case-insensitive)
 * @param limit - Maximum number of sessions to return (default: 5)
 * @returns Exercise history data including sessions and personal bests
 */
export async function getExerciseHistoryAction(
  exerciseName: string,
  limit: number = 5
): Promise<{ success: boolean; data?: ExerciseHistoryData; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Query sets_log for this exercise, joining with workouts for user_id and completed_at
    const { data: setLogs, error: queryError } = await supabase
      .from('sets_log')
      .select(`
        id,
        workout_id,
        exercise_name,
        set_number,
        weight_actual,
        reps_actual,
        rir_actual,
        set_type,
        skipped,
        workouts!inner (
          id,
          user_id,
          status,
          completed_at
        )
      `)
      .ilike('exercise_name', exerciseName)
      .eq('workouts.user_id', user.id)
      .eq('workouts.status', 'completed')
      .eq('set_type', 'working')
      .eq('skipped', false)
      .order('created_at', { ascending: false })
      .limit(100) // Get enough sets to cover multiple sessions

    if (queryError) {
      console.error('[getExerciseHistoryAction] Query error:', queryError)
      return {
        success: false,
        error: 'Failed to fetch exercise history'
      }
    }

    if (!setLogs || setLogs.length === 0) {
      return {
        success: true,
        data: {
          exerciseName,
          sessions: [],
          personalBest: {
            maxWeight: null,
            maxWeightDate: null,
            maxVolume: null,
            maxVolumeDate: null,
          },
          lastPerformedAt: null,
          totalSessionsCount: 0,
        }
      }
    }

    // Group sets by workout
    const workoutMap = new Map<string, {
      workoutId: string
      completedAt: string
      sets: Array<{
        setNumber: number
        weight: number | null
        reps: number | null
        rir: number | null
      }>
    }>()

    // Track personal bests
    let maxWeight = 0
    let maxWeightDate: string | null = null
    let maxVolume = 0
    let maxVolumeDate: string | null = null

    // Process each set log
    for (const log of setLogs) {
      const workout = log.workouts as unknown as { id: string; completed_at: string }
      const workoutId = workout.id
      const completedAt = workout.completed_at

      // Initialize workout entry if not exists
      if (!workoutMap.has(workoutId)) {
        workoutMap.set(workoutId, {
          workoutId,
          completedAt,
          sets: []
        })
      }

      // Add set to workout
      workoutMap.get(workoutId)!.sets.push({
        setNumber: log.set_number ?? 0,
        weight: log.weight_actual,
        reps: log.reps_actual,
        rir: log.rir_actual,
      })

      // Track max weight personal best
      const weight = log.weight_actual ?? 0

      if (weight > maxWeight) {
        maxWeight = weight
        maxWeightDate = completedAt
      }
    }

    // Calculate max session volume (sum of all sets in a session)
    Array.from(workoutMap.values()).forEach(session => {
      const sessionVolume = session.sets.reduce((sum, set) => {
        return sum + ((set.weight ?? 0) * (set.reps ?? 0))
      }, 0)

      if (sessionVolume > maxVolume) {
        maxVolume = sessionVolume
        maxVolumeDate = session.completedAt
      }
    })

    // Convert map to sorted array and limit to requested sessions
    const sessions = Array.from(workoutMap.values())
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    // Get total sessions count before limiting
    const totalSessionsCount = sessions.length

    // Limit sessions
    const limitedSessions = sessions.slice(0, limit)

    // Sort sets within each session
    limitedSessions.forEach(session => {
      session.sets.sort((a, b) => a.setNumber - b.setNumber)
    })

    return {
      success: true,
      data: {
        exerciseName: setLogs[0].exercise_name,
        sessions: limitedSessions,
        personalBest: {
          maxWeight: maxWeight > 0 ? maxWeight : null,
          maxWeightDate,
          maxVolume: maxVolume > 0 ? maxVolume : null,
          maxVolumeDate,
        },
        lastPerformedAt: sessions[0]?.completedAt ?? null,
        totalSessionsCount,
      }
    }
  } catch (error) {
    console.error('[getExerciseHistoryAction] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
