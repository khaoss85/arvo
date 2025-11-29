import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/database.types'
import type {
  TechniqueType,
  TechniqueConfig,
  TechniqueExecutionResult,
  TechniqueStats,
  TechniqueEffectiveness,
} from '@/lib/types/advanced-techniques'

export interface LogTechniqueExecutionInput {
  userId: string
  workoutId?: string
  exerciseName: string
  techniqueType: TechniqueType
  techniqueConfig: TechniqueConfig
  executionResult?: TechniqueExecutionResult
}

export interface TechniqueHistoryEntry {
  id: string
  exerciseName: string
  techniqueType: TechniqueType
  techniqueConfig: TechniqueConfig
  executionResult: TechniqueExecutionResult | null
  completedAt: Date
}

class TechniqueAnalyticsService {
  /**
   * Log a technique execution to the analytics table
   */
  async logTechniqueExecution(
    supabase: SupabaseClient<Database>,
    input: LogTechniqueExecutionInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const insertData: Database['public']['Tables']['technique_analytics']['Insert'] = {
        user_id: input.userId,
        workout_id: input.workoutId || null,
        exercise_name: input.exerciseName,
        technique_type: input.techniqueType,
        technique_config: input.techniqueConfig as unknown as Json,
        execution_result: input.executionResult
          ? (input.executionResult as unknown as Json)
          : null,
        completed_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('technique_analytics')
        .insert(insertData)

      if (error) {
        console.error('[TechniqueAnalytics] Error logging execution:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      console.error('[TechniqueAnalytics] Unexpected error:', err)
      return { success: false, error: 'Unexpected error logging technique' }
    }
  }

  /**
   * Get user's technique usage statistics
   */
  async getUserTechniqueStats(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<TechniqueStats> {
    const { data, error } = await supabase
      .from('technique_analytics')
      .select('technique_type, execution_result')
      .eq('user_id', userId)

    // Default empty stats
    const emptyStats: TechniqueStats = {
      usageCounts: {} as Record<TechniqueType, number>,
      completionRates: {} as Record<TechniqueType, number>,
      mostUsedTechnique: null,
      totalTechniquesApplied: 0,
    }

    if (error || !data) {
      console.error('[TechniqueAnalytics] Error fetching stats:', error)
      return emptyStats
    }

    const rows = data
    const totalTechniquesApplied = rows.length

    // Count by technique type
    const usageCounts: Record<string, number> = {}
    const completedCounts: Record<string, number> = {}

    for (const row of rows) {
      const type = row.technique_type as TechniqueType
      usageCounts[type] = (usageCounts[type] || 0) + 1

      // Check if execution was completed
      const result = row.execution_result as TechniqueExecutionResult | null
      if (result?.completedFully) {
        completedCounts[type] = (completedCounts[type] || 0) + 1
      }
    }

    // Calculate completion rates
    const completionRates: Record<string, number> = {}
    for (const type of Object.keys(usageCounts)) {
      completionRates[type] = usageCounts[type] > 0
        ? (completedCounts[type] || 0) / usageCounts[type]
        : 0
    }

    // Find most used technique
    let mostUsedTechnique: TechniqueType | null = null
    let maxCount = 0
    for (const [type, count] of Object.entries(usageCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostUsedTechnique = type as TechniqueType
      }
    }

    return {
      usageCounts: usageCounts as Record<TechniqueType, number>,
      completionRates: completionRates as Record<TechniqueType, number>,
      mostUsedTechnique,
      totalTechniquesApplied,
    }
  }

  /**
   * Get most effective techniques for a specific muscle group
   */
  async getEffectiveTechniques(
    supabase: SupabaseClient<Database>,
    userId: string,
    muscleGroup?: string
  ): Promise<TechniqueEffectiveness[]> {
    const { data, error } = await supabase
      .from('technique_analytics')
      .select('technique_type, exercise_name, execution_result')
      .eq('user_id', userId)

    if (error || !data) {
      return []
    }

    // Group by technique type
    const effectivenessMap: Record<string, { total: number; completed: number }> = {}

    for (const row of data) {
      const type = row.technique_type
      if (!effectivenessMap[type]) {
        effectivenessMap[type] = { total: 0, completed: 0 }
      }
      effectivenessMap[type].total++

      const result = row.execution_result as TechniqueExecutionResult | null
      if (result?.completedFully) {
        effectivenessMap[type].completed++
      }
    }

    return Object.entries(effectivenessMap)
      .map(([type, counts]) => ({
        techniqueType: type as TechniqueType,
        muscleGroup: muscleGroup || 'all', // Default to 'all' if not filtered
        timesUsed: counts.total,
        completionRate: counts.total > 0 ? counts.completed / counts.total : 0,
      }))
      .sort((a, b) => b.timesUsed - a.timesUsed)
  }

  /**
   * Get technique history for a user
   */
  async getTechniqueHistory(
    supabase: SupabaseClient<Database>,
    userId: string,
    options?: {
      techniqueType?: TechniqueType
      exerciseName?: string
      limit?: number
    }
  ): Promise<TechniqueHistoryEntry[]> {
    let query = supabase
      .from('technique_analytics')
      .select('id, exercise_name, technique_type, technique_config, execution_result, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (options?.techniqueType) {
      query = query.eq('technique_type', options.techniqueType)
    }

    if (options?.exerciseName) {
      query = query.eq('exercise_name', options.exerciseName)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('[TechniqueAnalytics] Error fetching history:', error)
      return []
    }

    return data.map(row => ({
      id: row.id,
      exerciseName: row.exercise_name,
      techniqueType: row.technique_type as TechniqueType,
      techniqueConfig: row.technique_config as unknown as TechniqueConfig,
      executionResult: row.execution_result as unknown as TechniqueExecutionResult | null,
      completedAt: new Date(row.completed_at || new Date()),
    }))
  }

  /**
   * Get recent technique executions for an exercise
   */
  async getRecentTechniqueForExercise(
    supabase: SupabaseClient<Database>,
    userId: string,
    exerciseName: string,
    limit: number = 5
  ): Promise<TechniqueHistoryEntry[]> {
    return this.getTechniqueHistory(supabase, userId, {
      exerciseName,
      limit,
    })
  }

  /**
   * Get technique usage counts with completion rates
   */
  async getTechniqueUsageCounts(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<Array<{
    techniqueType: TechniqueType
    count: number
    completionRate: number
  }>> {
    const { data, error } = await supabase
      .from('technique_analytics')
      .select('technique_type, execution_result')
      .eq('user_id', userId)

    if (error || !data) {
      console.error('[TechniqueAnalytics] Error fetching usage counts:', error)
      return []
    }

    // Group by technique type
    const countsMap: Record<string, { total: number; completed: number }> = {}

    for (const row of data) {
      const type = row.technique_type
      if (!countsMap[type]) {
        countsMap[type] = { total: 0, completed: 0 }
      }
      countsMap[type].total++

      const result = row.execution_result as TechniqueExecutionResult | null
      if (result?.completedFully) {
        countsMap[type].completed++
      }
    }

    return Object.entries(countsMap)
      .map(([type, counts]) => ({
        techniqueType: type as TechniqueType,
        count: counts.total,
        completionRate: counts.total > 0 ? counts.completed / counts.total : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }
}

// Export singleton instance
export const techniqueAnalyticsService = new TechniqueAnalyticsService()
