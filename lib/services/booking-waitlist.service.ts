/**
 * Booking Waitlist Service
 * AI-driven waitlist prioritization for coaching slots
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  BookingWaitlistEntry,
  InsertBookingWaitlistEntry,
  UpdateBookingWaitlistEntry,
  BookingWaitlistStatus,
  WaitlistCandidate,
} from '@/lib/types/schemas'

// Response deadline: 4 hours to respond to an offer
const OFFER_EXPIRY_HOURS = 4

export class BookingWaitlistService {
  /**
   * Add a client to the waitlist
   */
  static async addToWaitlist(
    entry: InsertBookingWaitlistEntry
  ): Promise<BookingWaitlistEntry> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .insert(entry as any)
      .select()
      .single()

    if (error) {
      console.error('[BookingWaitlistService] Error adding to waitlist:', error)
      if (error.code === '23505') {
        throw new Error('Client is already on the waitlist')
      }
      throw new Error('Failed to add to waitlist')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Get waitlist entries for a coach
   */
  static async getCoachWaitlist(
    coachId: string,
    status?: BookingWaitlistStatus
  ): Promise<BookingWaitlistEntry[]> {
    const supabase = getSupabaseBrowserClient()

    let query = supabase
      .from('booking_waitlist_entries')
      .select('*')
      .eq('coach_id', coachId)
      .order('ai_priority_score', { ascending: false })
      .order('created_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[BookingWaitlistService] Error fetching waitlist:', error)
      throw new Error('Failed to fetch waitlist')
    }

    return (data || []) as unknown as BookingWaitlistEntry[]
  }

  /**
   * Get a client's waitlist entry for a specific coach
   */
  static async getClientWaitlistEntry(
    coachId: string,
    clientId: string
  ): Promise<BookingWaitlistEntry | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[BookingWaitlistService] Error fetching entry:', error)
      throw new Error('Failed to fetch waitlist entry')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Get a waitlist entry by ID
   */
  static async getEntry(entryId: string): Promise<BookingWaitlistEntry | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[BookingWaitlistService] Error fetching entry:', error)
      throw new Error('Failed to fetch waitlist entry')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Update a waitlist entry
   */
  static async updateEntry(
    entryId: string,
    updates: UpdateBookingWaitlistEntry
  ): Promise<BookingWaitlistEntry> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update(updates as any)
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('[BookingWaitlistService] Error updating entry:', error)
      throw new Error('Failed to update waitlist entry')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Cancel a waitlist entry
   */
  static async cancelEntry(entryId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('booking_waitlist_entries')
      .update({ status: 'cancelled' })
      .eq('id', entryId)

    if (error) {
      console.error('[BookingWaitlistService] Error cancelling entry:', error)
      throw new Error('Failed to cancel waitlist entry')
    }
  }

  /**
   * Find candidates for a specific slot
   * Uses the database function find_booking_waitlist_candidates
   */
  static async findCandidatesForSlot(
    coachId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<WaitlistCandidate[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('find_booking_waitlist_candidates', {
      p_coach_id: coachId,
      p_date: date,
      p_start_time: startTime,
      p_end_time: endTime,
    })

    if (error) {
      console.error('[BookingWaitlistService] Error finding candidates:', error)
      throw new Error('Failed to find waitlist candidates')
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      preferred_days: row.preferred_days,
      preferred_time_start: row.preferred_time_start,
      preferred_time_end: row.preferred_time_end,
      urgency_level: row.urgency_level,
      ai_priority_score: row.ai_priority_score,
      has_active_package: row.has_active_package,
      days_waiting: row.days_waiting,
    }))
  }

  /**
   * Get candidates for a cancelled booking slot
   * Uses the database function get_waitlist_for_cancelled_slot
   */
  static async getCandidatesForCancelledSlot(
    bookingId: string
  ): Promise<WaitlistCandidate[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('get_waitlist_for_cancelled_slot', {
      p_booking_id: bookingId,
    })

    if (error) {
      console.error('[BookingWaitlistService] Error getting cancelled slot candidates:', error)
      throw new Error('Failed to get waitlist candidates')
    }

    return (data || []).map((row: any) => ({
      id: row.waitlist_id,
      client_id: row.client_id,
      client_name: row.client_name,
      preferred_days: null,
      preferred_time_start: null,
      preferred_time_end: null,
      urgency_level: 0,
      ai_priority_score: row.priority_score,
      has_active_package: row.has_active_package,
      days_waiting: 0,
    }))
  }

  /**
   * Notify a waitlist candidate about an available slot
   */
  static async notifyCandidate(
    entryId: string,
    slotDetails: { date: string; startTime: string; endTime: string }
  ): Promise<BookingWaitlistEntry> {
    const supabase = getSupabaseBrowserClient()

    const responseDeadline = new Date()
    responseDeadline.setHours(responseDeadline.getHours() + OFFER_EXPIRY_HOURS)

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        response_deadline: responseDeadline.toISOString(),
        ai_score_reason: JSON.stringify(slotDetails),
      })
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('[BookingWaitlistService] Error notifying candidate:', error)
      throw new Error('Failed to notify candidate')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Respond to a waitlist offer (accept or decline)
   */
  static async respondToOffer(
    entryId: string,
    accept: boolean
  ): Promise<BookingWaitlistEntry> {
    const supabase = getSupabaseBrowserClient()

    const newStatus: BookingWaitlistStatus = accept ? 'booked' : 'active'

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        // Reset notification fields if declined
        ...(accept ? {} : {
          notified_at: null,
          response_deadline: null,
          ai_score_reason: null,
        }),
      })
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('[BookingWaitlistService] Error responding to offer:', error)
      throw new Error('Failed to respond to offer')
    }

    return data as unknown as BookingWaitlistEntry
  }

  /**
   * Expire pending offers that have passed their deadline
   * Returns the number of expired offers
   */
  static async processExpiredOffers(): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update({
        status: 'active', // Reset to active so they can receive new offers
        notified_at: null,
        response_deadline: null,
        ai_score_reason: null,
      })
      .eq('status', 'notified')
      .lt('response_deadline', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[BookingWaitlistService] Error expiring offers:', error)
      throw new Error('Failed to process expired offers')
    }

    return data?.length || 0
  }

  /**
   * Get the count of active waitlist entries for a coach
   */
  static async getActiveCount(coachId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count, error } = await supabase
      .from('booking_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'active')

    if (error) {
      console.error('[BookingWaitlistService] Error counting entries:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Format preferred days for display
   */
  static formatPreferredDays(
    days: number[],
    language: 'en' | 'it' = 'it'
  ): string {
    if (!days || days.length === 0) {
      return language === 'it' ? 'Qualsiasi giorno' : 'Any day'
    }

    const dayNames = language === 'it'
      ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return days.map(d => dayNames[d]).join(', ')
  }

  /**
   * Format time range for display
   */
  static formatTimeRange(
    startTime: string | null,
    endTime: string | null,
    language: 'en' | 'it' = 'it'
  ): string {
    if (!startTime) {
      return language === 'it' ? 'Qualsiasi orario' : 'Any time'
    }

    const start = startTime.slice(0, 5)
    const end = endTime ? endTime.slice(0, 5) : '23:59'

    return `${start} - ${end}`
  }
}
