import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Analytics Service
 * Provides data aggregation and calculations for progress tracking
 */
export class AnalyticsService {
  /**
   * Calculate estimated 1RM using Epley formula
   * Formula: weight × (1 + reps/30)
   */
  static calculateE1RM(weight: number, reps: number): number {
    if (reps === 1) return weight
    return weight * (1 + reps / 30)
  }

  /**
   * Get exercise progress over time
   * Returns time-series data with e1RM calculations
   */
  static async getExerciseProgress(
    userId: string,
    exerciseId: string,
    days: number = 30
  ): Promise<Array<{
    date: string
    weight: number
    reps: number
    e1rm: number
    volume: number
    rir: number
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('sets_log')
      .select(`
        *,
        workouts!inner(user_id, completed_at)
      `)
      .eq('exercise_id', exerciseId)
      .eq('workouts.user_id', userId)
      .gte('workouts.completed_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch exercise progress: ${error.message}`)
    if (!data || data.length === 0) return []

    // Group by workout and find best set per workout
    const byWorkout = new Map<string, any>()
    data.forEach((set: any) => {
      const workoutId = set.workout_id
      if (!byWorkout.has(workoutId)) {
        byWorkout.set(workoutId, [])
      }
      byWorkout.get(workoutId)!.push(set)
    })

    // Calculate stats for each workout
    const progressData = Array.from(byWorkout.entries()).map(([_workoutId, sets]) => {
      // Find best set by e1RM
      const bestSet = sets.reduce((max: any, set: any) => {
        const maxE1RM = this.calculateE1RM(max.weight_actual || 0, max.reps_actual || 0)
        const setE1RM = this.calculateE1RM(set.weight_actual || 0, set.reps_actual || 0)
        return setE1RM > maxE1RM ? set : max
      })

      // Calculate total volume for this exercise in this workout
      const volume = sets.reduce((sum: number, set: any) =>
        sum + (set.weight_actual || 0) * (set.reps_actual || 0), 0
      )

      return {
        date: (bestSet.workouts as any).completed_at || bestSet.created_at,
        weight: bestSet.weight_actual || 0,
        reps: bestSet.reps_actual || 0,
        e1rm: this.calculateE1RM(bestSet.weight_actual || 0, bestSet.reps_actual || 0),
        volume,
        rir: bestSet.rir_actual || 0
      }
    })

    // Sort by date
    return progressData.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }

  /**
   * Get all personal records for a user
   * Returns best e1RM for each exercise
   */
  static async getPersonalRecords(
    userId: string
  ): Promise<Array<{
    exerciseId: string
    exerciseName: string
    weight: number
    reps: number
    e1rm: number
    date: string
    volume: number
  }>> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('sets_log')
      .select(`
        *,
        workouts!inner(user_id)
      `)
      .eq('workouts.user_id', userId)
      .not('weight_actual', 'is', null)
      .not('reps_actual', 'is', null)

    if (error) throw new Error(`Failed to fetch personal records: ${error.message}`)
    if (!data || data.length === 0) return []

    // Group by exercise name and find best e1RM for each
    const prsByExercise = new Map<string, any>()

    data.forEach((set: any) => {
      const exerciseName = set.exercise_name
      const e1rm = this.calculateE1RM(set.weight_actual, set.reps_actual)
      const volume = set.weight_actual * set.reps_actual

      const current = prsByExercise.get(exerciseName)
      if (!current || e1rm > current.e1rm) {
        prsByExercise.set(exerciseName, {
          exerciseId: set.exercise_id || exerciseName, // Use exercise_id if available, fallback to name
          exerciseName: exerciseName,
          weight: set.weight_actual,
          reps: set.reps_actual,
          e1rm,
          volume,
          date: set.created_at
        })
      }
    })

    return Array.from(prsByExercise.values())
      .sort((a, b) => b.e1rm - a.e1rm) // Sort by e1RM descending
  }

  /**
   * Get volume analytics over time
   * Returns weekly volume aggregations
   */
  static async getVolumeAnalytics(
    userId: string,
    days: number = 30
  ): Promise<Array<{
    weekStart: string
    totalVolume: number
    totalSets: number
    workoutCount: number
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = getSupabaseBrowserClient()

    // Get all completed workouts in the time range
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, completed_at, total_volume, total_sets')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: true })

    if (workoutsError) throw new Error(`Failed to fetch workouts: ${workoutsError.message}`)
    if (!workouts || workouts.length === 0) return []

    // Group by week
    const weeklyData = new Map<string, { totalVolume: number; totalSets: number; workoutCount: number }>()

    workouts.forEach(workout => {
      if (!workout.completed_at) return

      const date = new Date(workout.completed_at)
      // Get start of week (Monday)
      const dayOfWeek = date.getDay()
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(date.setDate(diff))
      weekStart.setHours(0, 0, 0, 0)
      const weekKey = weekStart.toISOString().split('T')[0]

      const existing = weeklyData.get(weekKey) || { totalVolume: 0, totalSets: 0, workoutCount: 0 }
      weeklyData.set(weekKey, {
        totalVolume: existing.totalVolume + (workout.total_volume || 0),
        totalSets: existing.totalSets + (workout.total_sets || 0),
        workoutCount: existing.workoutCount + 1
      })
    })

    return Array.from(weeklyData.entries())
      .map(([weekStart, data]) => ({ weekStart, ...data }))
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
  }

  /**
   * Get workout frequency for heatmap
   * Returns daily workout completion data
   */
  static async getWorkoutFrequency(
    userId: string,
    days: number = 90
  ): Promise<Array<{
    date: string
    count: number
    totalVolume: number
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('workouts')
      .select('completed_at, total_volume')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())

    if (error) throw new Error(`Failed to fetch workout frequency: ${error.message}`)
    if (!data || data.length === 0) return []

    // Group by date
    const byDate = new Map<string, { count: number; totalVolume: number }>()

    data.forEach(workout => {
      if (!workout.completed_at) return

      const date = new Date(workout.completed_at).toISOString().split('T')[0]
      const existing = byDate.get(date) || { count: 0, totalVolume: 0 }
      byDate.set(date, {
        count: existing.count + 1,
        totalVolume: existing.totalVolume + (workout.total_volume || 0)
      })
    })

    return Array.from(byDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  /**
   * Get average workout duration
   */
  static async getAverageWorkoutDuration(
    userId: string,
    days: number = 30
  ): Promise<number> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('workouts')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .not('duration_seconds', 'is', null)

    if (error) throw new Error(`Failed to fetch workout durations: ${error.message}`)
    if (!data || data.length === 0) return 0

    const total = data.reduce((sum, w) => sum + (w.duration_seconds || 0), 0)
    return Math.round(total / data.length)
  }

  /**
   * Get strength standards comparison
   * Compares user's lifts to general population standards
   */
  static getStrengthStandard(
    exerciseName: string,
    weight: number,
    bodyweight: number = 80 // kg
  ): 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite' {
    // Simplified standards for major lifts (per kg bodyweight)
    const standards: Record<string, number[]> = {
      'Squat': [0.75, 1.25, 1.75, 2.25, 2.75],
      'Deadlift': [1.0, 1.5, 2.0, 2.5, 3.0],
      'Bench Press': [0.5, 0.75, 1.25, 1.75, 2.25]
    }

    const ratio = weight / bodyweight
    const exerciseStandards = standards[exerciseName]

    if (!exerciseStandards) return 'intermediate' // Default for unknown exercises

    if (ratio < exerciseStandards[0]) return 'beginner'
    if (ratio < exerciseStandards[1]) return 'novice'
    if (ratio < exerciseStandards[2]) return 'intermediate'
    if (ratio < exerciseStandards[3]) return 'advanced'
    return 'elite'
  }

}
