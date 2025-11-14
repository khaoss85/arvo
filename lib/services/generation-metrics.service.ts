import { getSupabaseServerClient } from '@/lib/supabase/server'

export interface GenerationContext {
  type: 'workout' | 'onboarding'
  targetCycleDay?: number
  [key: string]: any
}

export interface GenerationMetric {
  id: string
  user_id: string
  request_id: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  success: boolean
  context: GenerationContext
  created_at: string
}

export class GenerationMetricsService {
  /**
   * Start tracking a new workout generation
   */
  static async startGeneration(
    userId: string,
    requestId: string,
    context: GenerationContext = { type: 'workout' }
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()

      const { error } = await supabase
        .from('workout_generation_metrics')
        .insert({
          user_id: userId,
          request_id: requestId,
          started_at: new Date().toISOString(),
          context,
        })

      if (error) {
        console.error('[GenerationMetrics] Failed to start tracking:', error)
      }
    } catch (error) {
      console.error('[GenerationMetrics] Error starting tracking:', error)
    }
  }

  /**
   * Complete tracking for a workout generation
   */
  static async completeGeneration(
    requestId: string,
    success: boolean = true
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()

      // Get the FIRST started_at timestamp (earliest) to calculate duration
      // Use limit(1) instead of single() to handle duplicate entries gracefully
      const { data: metrics, error: fetchError } = await supabase
        .from('workout_generation_metrics')
        .select('started_at')
        .eq('request_id', requestId)
        .order('started_at', { ascending: true })
        .limit(1)

      if (fetchError || !metrics || metrics.length === 0) {
        console.error(
          '[GenerationMetrics] Failed to fetch metric for completion:',
          fetchError
        )
        return
      }

      const metric = metrics[0]
      const startedAt = new Date(metric.started_at)
      const completedAt = new Date()
      const durationMs = completedAt.getTime() - startedAt.getTime()

      // Update ALL rows with this request_id (handles duplicates if they exist)
      const { error: updateError } = await supabase
        .from('workout_generation_metrics')
        .update({
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          success,
        })
        .eq('request_id', requestId)

      if (updateError) {
        console.error('[GenerationMetrics] Failed to complete tracking:', updateError)
      }
    } catch (error) {
      console.error('[GenerationMetrics] Error completing tracking:', error)
    }
  }

  /**
   * Get estimated duration for a user based on historical data
   * Returns duration in milliseconds, or null if no data available
   */
  static async getEstimatedDuration(
    userId: string,
    context: GenerationContext = { type: 'workout' }
  ): Promise<number | null> {
    try {
      const supabase = await getSupabaseServerClient()

      // Get last 10 successful generations for this user with same context type
      const { data: metrics, error } = await supabase
        .from('workout_generation_metrics')
        .select('duration_ms')
        .eq('user_id', userId)
        .eq('success', true)
        .not('duration_ms', 'is', null)
        .eq('context->>type', context.type)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (error || !metrics || metrics.length === 0) {
        // Fallback: return default estimates based on type
        return context.type === 'onboarding' ? 60000 : 90000 // 60s or 90s
      }

      // Calculate weighted average (more recent = higher weight)
      let totalWeight = 0
      let weightedSum = 0

      metrics.forEach((metric: { duration_ms: number | null }, index: number) => {
        if (metric.duration_ms) {
          const weight = metrics.length - index // More recent = higher weight
          weightedSum += metric.duration_ms * weight
          totalWeight += weight
        }
      })

      if (totalWeight === 0) {
        return context.type === 'onboarding' ? 60000 : 90000
      }

      return Math.round(weightedSum / totalWeight)
    } catch (error) {
      console.error('[GenerationMetrics] Error getting estimated duration:', error)
      // Return fallback estimate
      return context.type === 'onboarding' ? 60000 : 90000
    }
  }

  /**
   * Get average successful duration for recent generations
   * Useful for displaying stats
   */
  static async getAverageSuccessfulDuration(
    userId: string,
    limit: number = 20
  ): Promise<number | null> {
    try {
      const supabase = await getSupabaseServerClient()

      const { data: metrics, error } = await supabase
        .from('workout_generation_metrics')
        .select('duration_ms')
        .eq('user_id', userId)
        .eq('success', true)
        .not('duration_ms', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit)

      if (error || !metrics || metrics.length === 0) {
        return null
      }

      const sum = metrics.reduce((acc: number, m: { duration_ms: number | null }) => acc + (m.duration_ms || 0), 0)
      return Math.round(sum / metrics.length)
    } catch (error) {
      console.error('[GenerationMetrics] Error getting average duration:', error)
      return null
    }
  }

  /**
   * Get recent metrics for a user (useful for debugging/analytics)
   */
  static async getRecentMetrics(
    userId: string,
    limit: number = 10
  ): Promise<GenerationMetric[]> {
    try {
      const supabase = await getSupabaseServerClient()

      const { data: metrics, error } = await supabase
        .from('workout_generation_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !metrics) {
        return []
      }

      return metrics as GenerationMetric[]
    } catch (error) {
      console.error('[GenerationMetrics] Error getting recent metrics:', error)
      return []
    }
  }
}
