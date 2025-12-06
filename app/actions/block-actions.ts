'use server'

/**
 * Server Actions for Coach Blocks
 * Handles personal blocks for unavailability periods
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  CoachBlock,
  InsertCoachBlock,
  UpdateCoachBlock,
  BlockConflict,
} from '@/lib/types/schemas'

// =====================================================
// Block Management Actions
// =====================================================

/**
 * Get blocks for a coach within an optional date range
 */
export async function getBlocksAction(
  coachId: string,
  startDate?: string,
  endDate?: string
): Promise<{ blocks: CoachBlock[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    let query = supabase
      .from('coach_blocks')
      .select('*')
      .eq('coach_id', coachId)
      .order('start_date', { ascending: true })

    if (startDate) {
      query = query.gte('end_date', startDate)
    }
    if (endDate) {
      query = query.lte('start_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('[BlockActions] Error fetching blocks:', error)
      return { blocks: [], error: 'Failed to fetch blocks' }
    }

    return { blocks: (data || []) as unknown as CoachBlock[] }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { blocks: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new coach block
 */
export async function createBlockAction(
  block: InsertCoachBlock
): Promise<{ block?: CoachBlock; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify the user is authenticated and is the coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Ensure the block is for the current user
    if (block.coach_id !== user.id) {
      return { error: 'Cannot create blocks for other coaches' }
    }

    const { data, error } = await supabase
      .from('coach_blocks')
      .insert(block as any)
      .select()
      .single()

    if (error) {
      console.error('[BlockActions] Error creating block:', error)
      return { error: 'Failed to create block' }
    }

    return { block: data as unknown as CoachBlock }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing block
 */
export async function updateBlockAction(
  blockId: string,
  updates: UpdateCoachBlock
): Promise<{ block?: CoachBlock; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('coach_blocks')
      .update(updates as any)
      .eq('id', blockId)
      .select()
      .single()

    if (error) {
      console.error('[BlockActions] Error updating block:', error)
      return { error: 'Failed to update block' }
    }

    return { block: data as unknown as CoachBlock }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a block
 */
export async function deleteBlockAction(
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('coach_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('[BlockActions] Error deleting block:', error)
      return { success: false, error: 'Failed to delete block' }
    }

    return { success: true }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Find bookings that would conflict with a proposed block
 */
export async function findBlockConflictsAction(
  coachId: string,
  startDate: string,
  endDate: string,
  startTime?: string | null,
  endTime?: string | null
): Promise<{ conflicts: BlockConflict[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_block_conflicts', {
      p_coach_id: coachId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_start_time: startTime ?? undefined,
      p_end_time: endTime ?? undefined,
    })

    if (error) {
      console.error('[BlockActions] Error finding conflicts:', error)
      return { conflicts: [], error: 'Failed to find conflicts' }
    }

    return { conflicts: (data || []) as BlockConflict[] }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { conflicts: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Check if a specific date/time is blocked
 */
export async function isBlockedAction(
  coachId: string,
  date: string,
  startTime?: string | null,
  endTime?: string | null
): Promise<{ blocked: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('is_coach_blocked', {
      p_coach_id: coachId,
      p_date: date,
      p_start_time: startTime ?? undefined,
      p_end_time: endTime ?? undefined,
    })

    if (error) {
      console.error('[BlockActions] Error checking if blocked:', error)
      return { blocked: false, error: 'Failed to check block status' }
    }

    return { blocked: data || false }
  } catch (error) {
    console.error('[BlockActions] Unexpected error:', error)
    return { blocked: false, error: 'An unexpected error occurred' }
  }
}
