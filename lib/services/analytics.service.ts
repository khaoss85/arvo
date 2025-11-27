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

  /**
   * Get E1RM trend analysis for powerlifting
   * Useful for tracking progress in competition lifts (SBD)
   * Uses simple linear regression to determine trend direction
   */
  static async getE1RMTrend(
    userId: string,
    exerciseName: string,
    weeks: number = 8
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'plateau' | 'insufficient_data'
    percentChange: number
    dataPoints: Array<{ date: string; e1rm: number }>
    currentE1RM: number | null
    peakE1RM: number | null
    peakDate: string | null
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - weeks * 7)

    const supabase = getSupabaseBrowserClient()

    // Query sets by exercise name pattern (case-insensitive)
    const { data, error } = await supabase
      .from('sets_log')
      .select(`
        weight_actual,
        reps_actual,
        created_at,
        workouts!inner(user_id, completed_at)
      `)
      .eq('workouts.user_id', userId)
      .ilike('exercise_name', `%${exerciseName}%`)
      .gte('workouts.completed_at', startDate.toISOString())
      .not('weight_actual', 'is', null)
      .not('reps_actual', 'is', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[AnalyticsService] Error fetching E1RM trend:', error)
      return {
        trend: 'insufficient_data',
        percentChange: 0,
        dataPoints: [],
        currentE1RM: null,
        peakE1RM: null,
        peakDate: null
      }
    }

    if (!data || data.length < 3) {
      return {
        trend: 'insufficient_data',
        percentChange: 0,
        dataPoints: [],
        currentE1RM: null,
        peakE1RM: null,
        peakDate: null
      }
    }

    // Calculate E1RM for each workout (best set per workout)
    const byWorkout = new Map<string, { e1rm: number; date: string }>()

    data.forEach((set: any) => {
      const workoutDate = (set.workouts as any)?.completed_at || set.created_at
      const dateKey = new Date(workoutDate).toISOString().split('T')[0]
      const e1rm = this.calculateE1RM(set.weight_actual, set.reps_actual)

      const existing = byWorkout.get(dateKey)
      if (!existing || e1rm > existing.e1rm) {
        byWorkout.set(dateKey, { e1rm: Math.round(e1rm * 10) / 10, date: dateKey })
      }
    })

    const dataPoints = Array.from(byWorkout.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (dataPoints.length < 3) {
      return {
        trend: 'insufficient_data',
        percentChange: 0,
        dataPoints,
        currentE1RM: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].e1rm : null,
        peakE1RM: null,
        peakDate: null
      }
    }

    // Find peak
    const peak = dataPoints.reduce((max, dp) => dp.e1rm > max.e1rm ? dp : max, dataPoints[0])

    // Calculate percent change (first vs last)
    const firstE1RM = dataPoints[0].e1rm
    const lastE1RM = dataPoints[dataPoints.length - 1].e1rm
    const percentChange = ((lastE1RM - firstE1RM) / firstE1RM) * 100

    // Simple linear regression to determine trend
    // y = mx + b, where m is the slope
    const n = dataPoints.length
    const xValues = dataPoints.map((_, i) => i) // 0, 1, 2, ...
    const yValues = dataPoints.map(dp => dp.e1rm)

    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

    // Determine trend based on slope relative to average E1RM
    const avgE1RM = sumY / n
    const slopePercentage = (slope / avgE1RM) * 100 * n // Normalized slope per data point

    let trend: 'increasing' | 'decreasing' | 'plateau'
    if (slopePercentage > 2) {
      trend = 'increasing'
    } else if (slopePercentage < -2) {
      trend = 'decreasing'
    } else {
      trend = 'plateau'
    }

    return {
      trend,
      percentChange: Math.round(percentChange * 10) / 10,
      dataPoints,
      currentE1RM: lastE1RM,
      peakE1RM: peak.e1rm,
      peakDate: peak.date
    }
  }

  /**
   * Get competition lift summary (Squat, Bench, Deadlift) for powerlifters
   * Calculates total and individual lift trends
   */
  static async getCompetitionLiftSummary(
    userId: string,
    weeks: number = 8
  ): Promise<{
    squat: { currentE1RM: number | null; trend: string; percentChange: number }
    bench: { currentE1RM: number | null; trend: string; percentChange: number }
    deadlift: { currentE1RM: number | null; trend: string; percentChange: number }
    total: number | null
    totalTrend: 'increasing' | 'decreasing' | 'plateau' | 'insufficient_data'
  }> {
    const [squatTrend, benchTrend, deadliftTrend] = await Promise.all([
      this.getE1RMTrend(userId, 'squat', weeks),
      this.getE1RMTrend(userId, 'bench press', weeks),
      this.getE1RMTrend(userId, 'deadlift', weeks)
    ])

    // Calculate total (only if all three lifts have data)
    const total = (squatTrend.currentE1RM && benchTrend.currentE1RM && deadliftTrend.currentE1RM)
      ? Math.round(squatTrend.currentE1RM + benchTrend.currentE1RM + deadliftTrend.currentE1RM)
      : null

    // Determine overall trend
    const trends = [squatTrend.trend, benchTrend.trend, deadliftTrend.trend]
    const increasingCount = trends.filter(t => t === 'increasing').length
    const decreasingCount = trends.filter(t => t === 'decreasing').length

    let totalTrend: 'increasing' | 'decreasing' | 'plateau' | 'insufficient_data'
    if (trends.every(t => t === 'insufficient_data')) {
      totalTrend = 'insufficient_data'
    } else if (increasingCount >= 2) {
      totalTrend = 'increasing'
    } else if (decreasingCount >= 2) {
      totalTrend = 'decreasing'
    } else {
      totalTrend = 'plateau'
    }

    return {
      squat: {
        currentE1RM: squatTrend.currentE1RM,
        trend: squatTrend.trend,
        percentChange: squatTrend.percentChange
      },
      bench: {
        currentE1RM: benchTrend.currentE1RM,
        trend: benchTrend.trend,
        percentChange: benchTrend.percentChange
      },
      deadlift: {
        currentE1RM: deadliftTrend.currentE1RM,
        trend: deadliftTrend.trend,
        percentChange: deadliftTrend.percentChange
      },
      total,
      totalTrend
    }
  }

}
