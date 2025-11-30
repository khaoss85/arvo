/**
 * GenerationQueueService
 *
 * Manages database-backed workout generation queue to survive mobile standby and server restarts.
 * Provides CRUD operations and status tracking for workout generation requests.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export type GenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface GenerationQueueEntry {
  id: string
  user_id: string
  request_id: string
  status: GenerationStatus
  target_cycle_day: number | null
  progress_percent: number
  current_phase: string | null
  workout_id: string | null
  split_plan_id: string | null
  error_message: string | null
  context: Record<string, any>
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateGenerationQueueInput {
  userId: string
  requestId: string
  targetCycleDay?: number | null
  context?: Record<string, any>
}

export interface UpdateGenerationProgressInput {
  requestId: string
  progressPercent: number
  currentPhase: string
}

export interface CompleteGenerationInput {
  requestId: string
  workoutId: string
}

export interface FailGenerationInput {
  requestId: string
  errorMessage: string
}

export interface CompleteSplitInput {
  requestId: string
  splitPlanId: string
}

export class GenerationQueueService {
  /**
   * Create a new generation queue entry (client-side)
   */
  static async create(input: CreateGenerationQueueInput): Promise<GenerationQueueEntry> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .insert({
        user_id: input.userId,
        request_id: input.requestId,
        target_cycle_day: input.targetCycleDay ?? null,
        status: 'pending',
        progress_percent: 0,
        context: input.context ?? {}
      })
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to create queue entry:', error)
      throw new Error(`Failed to create generation queue entry: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Create a new generation queue entry (server-side)
   */
  static async createServer(input: CreateGenerationQueueInput): Promise<GenerationQueueEntry> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .insert({
        user_id: input.userId,
        request_id: input.requestId,
        target_cycle_day: input.targetCycleDay ?? null,
        status: 'pending',
        progress_percent: 0,
        context: input.context ?? {}
      })
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to create queue entry (server):', error)
      throw new Error(`Failed to create generation queue entry: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Get generation queue entry by request ID (client-side)
   */
  static async getByRequestId(requestId: string): Promise<GenerationQueueEntry | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('[GenerationQueueService] Failed to get queue entry:', error)
      throw new Error(`Failed to get generation queue entry: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Get generation queue entry by request ID (server-side)
   */
  static async getByRequestIdServer(requestId: string): Promise<GenerationQueueEntry | null> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('[GenerationQueueService] Failed to get queue entry (server):', error)
      throw new Error(`Failed to get generation queue entry: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Get active generation for user (pending or in_progress)
   * Used to resume interrupted generations
   */
  static async getActiveGeneration(userId: string): Promise<GenerationQueueEntry | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[GenerationQueueService] Failed to get active generation:', error)
      return null // Don't throw, just return null
    }

    return data as GenerationQueueEntry | null
  }

  /**
   * Get active generation for user (pending or in_progress) - SERVER-SIDE
   * Used to prevent duplicate concurrent generations server-side
   * @param userId - User ID to check for active generations
   * @returns Active generation if exists, null otherwise
   */
  static async getActiveGenerationServer(userId: string): Promise<GenerationQueueEntry | null> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No active generation
      }
      console.error('[GenerationQueueService] Failed to get active generation (server):', error)
      return null // Don't throw, just return null for safety
    }

    return data as GenerationQueueEntry
  }

  /**
   * Check if there's an active generation for any of the specified cycle days
   * Used to prevent day swapping while generation is in progress
   */
  static async getActiveGenerationForDaysServer(
    userId: string,
    cycleDays: number[]
  ): Promise<GenerationQueueEntry | null> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('user_id', userId)
      .in('target_cycle_day', cycleDays)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[GenerationQueueService] Failed to check generation for days:', error)
      return null
    }

    return data as GenerationQueueEntry | null
  }

  /**
   * Mark generation as started (server-side)
   * Uses server client with user authentication (for SSE stream endpoint)
   */
  static async markAsStarted(requestId: string): Promise<GenerationQueueEntry> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        progress_percent: 0,
        current_phase: 'Starting generation...'
      })
      .eq('request_id', requestId)
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to mark as started:', error)
      throw new Error(`Failed to mark generation as started: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Update generation progress (server-side)
   * Uses server client with user authentication (for SSE stream endpoint)
   */
  static async updateProgress(input: UpdateGenerationProgressInput): Promise<void> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('workout_generation_queue')
      .update({
        progress_percent: input.progressPercent,
        current_phase: input.currentPhase
      })
      .eq('request_id', input.requestId)

    if (error) {
      console.error('[GenerationQueueService] Failed to update progress:', error)
      // Don't throw - progress updates are non-critical
    }
  }

  /**
   * Mark generation as completed (server-side)
   * Uses server client with user authentication (for SSE stream endpoint)
   */
  static async markAsCompleted(input: CompleteGenerationInput): Promise<GenerationQueueEntry> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .update({
        status: 'completed',
        progress_percent: 100,
        current_phase: 'Generation complete',
        workout_id: input.workoutId,
        completed_at: new Date().toISOString()
      })
      .eq('request_id', input.requestId)
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to mark as completed:', error)
      throw new Error(`Failed to mark generation as completed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Mark generation as failed (server-side)
   * Uses server client with user authentication (for SSE stream endpoint)
   */
  static async markAsFailed(input: FailGenerationInput): Promise<GenerationQueueEntry> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .update({
        status: 'failed',
        error_message: input.errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('request_id', input.requestId)
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to mark as failed:', error)
      throw new Error(`Failed to mark generation as failed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Mark split generation as completed (server-side)
   */
  static async markSplitAsCompleted(input: CompleteSplitInput): Promise<GenerationQueueEntry> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .update({
        status: 'completed',
        progress_percent: 100,
        current_phase: 'Split generation complete',
        split_plan_id: input.splitPlanId,
        completed_at: new Date().toISOString()
      })
      .eq('request_id', input.requestId)
      .select()
      .single()

    if (error) {
      console.error('[GenerationQueueService] Failed to mark split as completed:', error)
      throw new Error(`Failed to mark split generation as completed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Get recent generations for user (for history/debugging)
   */
  static async getRecentGenerations(userId: string, limit = 10): Promise<GenerationQueueEntry[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[GenerationQueueService] Failed to get recent generations:', error)
      return []
    }

    return data as GenerationQueueEntry[]
  }

  /**
   * Cleanup old generations (called by cron job or manually)
   * Server-side only
   */
  static async cleanup(): Promise<{ deletedCount: number }> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.rpc('cleanup_old_generations')

    if (error) {
      console.error('[GenerationQueueService] Failed to cleanup old generations:', error)
      throw new Error(`Failed to cleanup old generations: ${error.message}`)
    }

    // Note: The RPC function doesn't return a count, but we could enhance it to do so
    return { deletedCount: 0 }
  }
}
