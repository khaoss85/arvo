/**
 * Admin-only methods for GenerationQueueService
 * Uses service role key to bypass RLS
 * ONLY to be called from server-side code (Inngest workers, API routes)
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

type GenerationQueueEntry = Database['public']['Tables']['workout_generation_queue']['Row']

interface UpdateGenerationProgressInput {
  requestId: string
  progressPercent: number
  currentPhase: string
}

interface CompleteGenerationInput {
  requestId: string
  workoutId: string
}

interface FailGenerationInput {
  requestId: string
  errorMessage: string
}

interface CompleteSplitInput {
  requestId: string
  splitPlanId: string
}

export class GenerationQueueAdminService {
  /**
   * Mark generation as started (admin)
   * Bypasses RLS using service role key
   */
  static async markAsStarted(requestId: string): Promise<GenerationQueueEntry> {
    const supabase = getSupabaseAdmin()

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
      console.error('[GenerationQueueAdminService] Failed to mark as started:', error)
      throw new Error(`Failed to mark generation as started: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Update generation progress (admin)
   * Bypasses RLS using service role key
   */
  static async updateProgress(input: UpdateGenerationProgressInput): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('workout_generation_queue')
      .update({
        progress_percent: input.progressPercent,
        current_phase: input.currentPhase
      })
      .eq('request_id', input.requestId)

    if (error) {
      console.error('[GenerationQueueAdminService] Failed to update progress:', error)
      // Don't throw - progress updates are non-critical
    }
  }

  /**
   * Mark generation as completed (admin)
   * Bypasses RLS using service role key
   */
  static async markAsCompleted(input: CompleteGenerationInput): Promise<GenerationQueueEntry> {
    const supabase = getSupabaseAdmin()

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
      console.error('[GenerationQueueAdminService] Failed to mark as completed:', error)
      throw new Error(`Failed to mark generation as completed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Mark generation as failed (admin)
   * Bypasses RLS using service role key
   */
  static async markAsFailed(input: FailGenerationInput): Promise<GenerationQueueEntry> {
    const supabase = getSupabaseAdmin()

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
      console.error('[GenerationQueueAdminService] Failed to mark as failed:', error)
      throw new Error(`Failed to mark generation as failed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }

  /**
   * Mark split generation as completed (admin)
   * Bypasses RLS using service role key
   */
  static async markSplitAsCompleted(input: CompleteSplitInput): Promise<GenerationQueueEntry> {
    const supabase = getSupabaseAdmin()

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
      console.error('[GenerationQueueAdminService] Failed to mark split as completed:', error)
      throw new Error(`Failed to mark split generation as completed: ${error.message}`)
    }

    return data as GenerationQueueEntry
  }
}
