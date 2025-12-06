/**
 * Coach Block Service
 * Handles personal blocks for coach unavailability periods
 * (competitions, travel, study, personal time, etc.)
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  CoachBlock,
  InsertCoachBlock,
  UpdateCoachBlock,
  BlockConflict,
  CoachBlockType,
} from '@/lib/types/schemas'

export class CoachBlockService {
  /**
   * Get all blocks for a coach within an optional date range
   */
  static async getBlocks(
    coachId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CoachBlock[]> {
    const supabase = getSupabaseBrowserClient()

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
      console.error('[CoachBlockService] Error fetching blocks:', error)
      throw new Error('Failed to fetch coach blocks')
    }

    return (data || []) as unknown as CoachBlock[]
  }

  /**
   * Get a single block by ID
   */
  static async getBlock(blockId: string): Promise<CoachBlock | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_blocks')
      .select('*')
      .eq('id', blockId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('[CoachBlockService] Error fetching block:', error)
      throw new Error('Failed to fetch coach block')
    }

    return data as unknown as CoachBlock
  }

  /**
   * Create a new coach block
   */
  static async createBlock(block: InsertCoachBlock): Promise<CoachBlock> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_blocks')
      .insert(block as any)
      .select()
      .single()

    if (error) {
      console.error('[CoachBlockService] Error creating block:', error)
      throw new Error('Failed to create coach block')
    }

    return data as unknown as CoachBlock
  }

  /**
   * Update an existing block
   */
  static async updateBlock(
    blockId: string,
    updates: UpdateCoachBlock
  ): Promise<CoachBlock> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_blocks')
      .update(updates as any)
      .eq('id', blockId)
      .select()
      .single()

    if (error) {
      console.error('[CoachBlockService] Error updating block:', error)
      throw new Error('Failed to update coach block')
    }

    return data as unknown as CoachBlock
  }

  /**
   * Delete a block
   */
  static async deleteBlock(blockId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('coach_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('[CoachBlockService] Error deleting block:', error)
      throw new Error('Failed to delete coach block')
    }
  }

  /**
   * Find bookings that would conflict with a proposed block
   * Uses the database function get_block_conflicts
   */
  static async findConflicts(
    coachId: string,
    startDate: string,
    endDate: string,
    startTime?: string | null,
    endTime?: string | null
  ): Promise<BlockConflict[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('get_block_conflicts', {
      p_coach_id: coachId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_start_time: startTime ?? undefined,
      p_end_time: endTime ?? undefined,
    })

    if (error) {
      console.error('[CoachBlockService] Error finding conflicts:', error)
      throw new Error('Failed to find block conflicts')
    }

    return (data || []) as BlockConflict[]
  }

  /**
   * Check if a specific date/time is blocked
   * Uses the database function is_coach_blocked
   */
  static async isBlocked(
    coachId: string,
    date: string,
    startTime?: string | null,
    endTime?: string | null
  ): Promise<{ blocked: boolean; block?: CoachBlock }> {
    const supabase = getSupabaseBrowserClient()

    // First check using the RPC function
    const { data: isBlocked, error } = await supabase.rpc('is_coach_blocked', {
      p_coach_id: coachId,
      p_date: date,
      p_start_time: startTime ?? undefined,
      p_end_time: endTime ?? undefined,
    })

    if (error) {
      console.error('[CoachBlockService] Error checking if blocked:', error)
      throw new Error('Failed to check if coach is blocked')
    }

    if (!isBlocked) {
      return { blocked: false }
    }

    // If blocked, fetch the actual block for display purposes
    const blocks = await this.getBlocks(coachId, date, date)
    const matchingBlock = blocks.find((block) => {
      // Check if date is within block range
      if (date < block.start_date || date > block.end_date) {
        return false
      }

      // Full day block
      if (!block.start_time || !block.end_time) {
        return true
      }

      // Partial day block - check time overlap
      if (startTime && endTime) {
        return startTime < block.end_time && endTime > block.start_time
      }

      // If no specific time requested, any block on this day matches
      return true
    })

    return { blocked: true, block: matchingBlock }
  }

  /**
   * Get blocks for a specific date (for calendar display)
   */
  static async getBlocksForDate(
    coachId: string,
    date: string
  ): Promise<CoachBlock[]> {
    return this.getBlocks(coachId, date, date)
  }

  /**
   * Get blocks for a week (for calendar display)
   */
  static async getBlocksForWeek(
    coachId: string,
    weekStartDate: string,
    weekEndDate: string
  ): Promise<CoachBlock[]> {
    return this.getBlocks(coachId, weekStartDate, weekEndDate)
  }

  /**
   * Get block type display label
   */
  static getBlockTypeLabel(
    blockType: CoachBlockType,
    customReason?: string | null
  ): string {
    switch (blockType) {
      case 'competition':
        return 'Gara'
      case 'travel':
        return 'Viaggio'
      case 'study':
        return 'Studio'
      case 'personal':
        return 'Personale'
      case 'custom':
        return customReason || 'Altro'
      default:
        return blockType
    }
  }

  /**
   * Get block type icon name (for UI)
   */
  static getBlockTypeIcon(blockType: CoachBlockType): string {
    switch (blockType) {
      case 'competition':
        return 'Trophy'
      case 'travel':
        return 'Plane'
      case 'study':
        return 'BookOpen'
      case 'personal':
        return 'User'
      case 'custom':
        return 'Calendar'
      default:
        return 'Calendar'
    }
  }

  /**
   * Format block duration for display
   */
  static formatBlockDuration(block: CoachBlock): string {
    if (block.start_date === block.end_date) {
      // Single day
      if (!block.start_time || !block.end_time) {
        return 'Giornata intera'
      }
      return `${block.start_time.slice(0, 5)} - ${block.end_time.slice(0, 5)}`
    }

    // Multi-day
    const startParts = block.start_date.split('-')
    const endParts = block.end_date.split('-')
    const startFormatted = `${startParts[2]}/${startParts[1]}`
    const endFormatted = `${endParts[2]}/${endParts[1]}`

    if (!block.start_time || !block.end_time) {
      return `${startFormatted} - ${endFormatted}`
    }

    return `${startFormatted} ${block.start_time.slice(0, 5)} - ${endFormatted} ${block.end_time.slice(0, 5)}`
  }
}
