'use server'

/**
 * Server Actions for Booking Waitlist
 * Handles waitlist management and AI-driven prioritization
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  BookingWaitlistEntry,
  InsertBookingWaitlistEntry,
  UpdateBookingWaitlistEntry,
  BookingWaitlistStatus,
  WaitlistCandidate,
} from '@/lib/types/schemas'

// Offer expiry time in hours
const OFFER_EXPIRY_HOURS = 4

// =====================================================
// Waitlist Entry Management
// =====================================================

/**
 * Add a client to the waitlist
 */
export async function addToWaitlistAction(
  entry: InsertBookingWaitlistEntry
): Promise<{ entry?: BookingWaitlistEntry; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Clients can add themselves, coaches can add their clients
    if (entry.client_id !== user.id && entry.coach_id !== user.id) {
      return { error: 'Cannot add others to waitlist' }
    }

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .insert(entry as any)
      .select()
      .single()

    if (error) {
      console.error('[WaitlistActions] Error adding to waitlist:', error)
      if (error.code === '23505') {
        return { error: 'Already on the waitlist' }
      }
      return { error: 'Failed to add to waitlist' }
    }

    return { entry: data as unknown as BookingWaitlistEntry }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get waitlist entries for a coach
 */
export async function getCoachWaitlistAction(
  coachId: string,
  status?: BookingWaitlistStatus
): Promise<{ entries: BookingWaitlistEntry[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

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
      console.error('[WaitlistActions] Error fetching waitlist:', error)
      return { entries: [], error: 'Failed to fetch waitlist' }
    }

    return { entries: (data || []) as unknown as BookingWaitlistEntry[] }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { entries: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get a client's waitlist entry
 */
export async function getClientWaitlistEntryAction(
  coachId: string,
  clientId: string
): Promise<{ entry: BookingWaitlistEntry | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { entry: null }
      }
      console.error('[WaitlistActions] Error fetching entry:', error)
      return { entry: null, error: 'Failed to fetch entry' }
    }

    return { entry: data as unknown as BookingWaitlistEntry }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { entry: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a waitlist entry
 */
export async function updateWaitlistEntryAction(
  entryId: string,
  updates: UpdateBookingWaitlistEntry
): Promise<{ entry?: BookingWaitlistEntry; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update(updates as any)
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('[WaitlistActions] Error updating entry:', error)
      return { error: 'Failed to update entry' }
    }

    return { entry: data as unknown as BookingWaitlistEntry }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel a waitlist entry
 */
export async function cancelWaitlistEntryAction(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('booking_waitlist_entries')
      .update({ status: 'cancelled' })
      .eq('id', entryId)

    if (error) {
      console.error('[WaitlistActions] Error cancelling entry:', error)
      return { success: false, error: 'Failed to cancel entry' }
    }

    return { success: true }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// Slot Matching Actions
// =====================================================

/**
 * Find candidates for a specific slot
 */
export async function getWaitlistCandidatesAction(
  coachId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ candidates: WaitlistCandidate[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('find_booking_waitlist_candidates', {
      p_coach_id: coachId,
      p_date: date,
      p_start_time: startTime,
      p_end_time: endTime,
    })

    if (error) {
      console.error('[WaitlistActions] Error finding candidates:', error)
      return { candidates: [], error: 'Failed to find candidates' }
    }

    const candidates: WaitlistCandidate[] = (data || []).map((row: any) => ({
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

    return { candidates }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { candidates: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get candidates for a cancelled booking's slot
 */
export async function getCandidatesForCancelledSlotAction(
  bookingId: string
): Promise<{ candidates: WaitlistCandidate[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_waitlist_for_cancelled_slot', {
      p_booking_id: bookingId,
    })

    if (error) {
      console.error('[WaitlistActions] Error getting cancelled slot candidates:', error)
      return { candidates: [], error: 'Failed to get candidates' }
    }

    const candidates: WaitlistCandidate[] = (data || []).map((row: any) => ({
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

    return { candidates }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { candidates: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// Offer Management Actions
// =====================================================

/**
 * Notify a waitlist candidate about an available slot
 */
export async function notifyWaitlistCandidateAction(
  entryId: string,
  slotDetails: { date: string; startTime: string; endTime: string }
): Promise<{ entry?: BookingWaitlistEntry; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

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
      console.error('[WaitlistActions] Error notifying candidate:', error)
      return { error: 'Failed to notify candidate' }
    }

    return { entry: data as unknown as BookingWaitlistEntry }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Respond to a waitlist offer (accept or decline)
 */
export async function respondToWaitlistOfferAction(
  entryId: string,
  accept: boolean
): Promise<{ entry?: BookingWaitlistEntry; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const newStatus: BookingWaitlistStatus = accept ? 'booked' : 'active'

    const updates: Record<string, any> = {
      status: newStatus,
      responded_at: new Date().toISOString(),
    }

    // Reset notification fields if declined
    if (!accept) {
      updates.notified_at = null
      updates.response_deadline = null
      updates.ai_score_reason = null
    }

    const { data, error } = await supabase
      .from('booking_waitlist_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('[WaitlistActions] Error responding to offer:', error)
      return { error: 'Failed to respond to offer' }
    }

    return { entry: data as unknown as BookingWaitlistEntry }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// =====================================================
// Client-Facing Actions
// =====================================================

/**
 * Join the waitlist for a coach (client action)
 */
export async function joinWaitlistAction(
  coachId: string,
  preferences: {
    preferred_days?: number[]
    preferred_time_start?: string
    preferred_time_end?: string
    urgency_level?: number
    notes?: string
    package_id?: string
  }
): Promise<{ entry?: BookingWaitlistEntry; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const entry: InsertBookingWaitlistEntry = {
      coach_id: coachId,
      client_id: user.id,
      preferred_days: preferences.preferred_days || [],
      preferred_time_start: preferences.preferred_time_start || null,
      preferred_time_end: preferences.preferred_time_end || null,
      urgency_level: preferences.urgency_level || 50,
      notes: preferences.notes || null,
      package_id: preferences.package_id || null,
      status: 'active',
    }

    return addToWaitlistAction(entry)
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get the active count of waitlist entries for a coach
 */
export async function getWaitlistCountAction(
  coachId: string
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { count, error } = await supabase
      .from('booking_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'active')

    if (error) {
      console.error('[WaitlistActions] Error counting entries:', error)
      return { count: 0, error: 'Failed to count entries' }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('[WaitlistActions] Unexpected error:', error)
    return { count: 0, error: 'An unexpected error occurred' }
  }
}
