'use server'

/**
 * Server Actions for Cancellation Policies
 * Handles coach cancellation policy management and processing
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  CoachCancellationPolicy,
  InsertCoachCancellationPolicy,
  UpdateCoachCancellationPolicy,
  CancellationStatus,
} from '@/lib/types/schemas'

// =====================================================
// Policy Management Actions
// =====================================================

/**
 * Get the cancellation policy for a coach
 */
export async function getCancellationPolicyAction(
  coachId: string
): Promise<{ policy: CoachCancellationPolicy | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .select('*')
      .eq('coach_id', coachId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { policy: null }
      }
      console.error('[CancellationPolicyActions] Error fetching policy:', error)
      return { policy: null, error: 'Failed to fetch policy' }
    }

    return { policy: data as unknown as CoachCancellationPolicy }
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { policy: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Save (create or update) the cancellation policy for a coach
 */
export async function saveCancellationPolicyAction(
  policy: InsertCoachCancellationPolicy
): Promise<{ policy?: CoachCancellationPolicy; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify the user is authenticated and is the coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (policy.coach_id !== user.id) {
      return { error: 'Cannot modify policies for other coaches' }
    }

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .upsert(policy as any, { onConflict: 'coach_id' })
      .select()
      .single()

    if (error) {
      console.error('[CancellationPolicyActions] Error saving policy:', error)
      return { error: 'Failed to save policy' }
    }

    return { policy: data as unknown as CoachCancellationPolicy }
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing cancellation policy
 */
export async function updateCancellationPolicyAction(
  coachId: string,
  updates: UpdateCoachCancellationPolicy
): Promise<{ policy?: CoachCancellationPolicy; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify the user is authenticated and is the coach
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (coachId !== user.id) {
      return { error: 'Cannot modify policies for other coaches' }
    }

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .update(updates as any)
      .eq('coach_id', coachId)
      .select()
      .single()

    if (error) {
      console.error('[CancellationPolicyActions] Error updating policy:', error)
      return { error: 'Failed to update policy' }
    }

    return { policy: data as unknown as CoachCancellationPolicy }
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// =====================================================
// Cancellation Processing Actions
// =====================================================

/**
 * Check if a cancellation would be late based on coach policy
 */
export async function checkCancellationStatusAction(
  bookingId: string
): Promise<{ status?: CancellationStatus; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('check_cancellation_status', {
      p_booking_id: bookingId,
    })

    if (error) {
      console.error('[CancellationPolicyActions] Error checking status:', error)
      return { error: 'Failed to check cancellation status' }
    }

    if (!data || data.length === 0) {
      return { error: 'Booking not found' }
    }

    const row = data[0]
    return {
      status: {
        isLate: row.is_late,
        hoursUntilBooking: row.hours_until_booking,
        willChargeSession: row.will_charge_session,
        policyHours: row.policy_hours,
      },
    }
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Process a booking cancellation with policy enforcement
 */
export async function cancelBookingWithPolicyAction(
  bookingId: string,
  reason?: string,
  cancelledBy: 'coach' | 'client' = 'client'
): Promise<{
  result?: {
    bookingId: string
    wasLate: boolean
    sessionCharged: boolean
    hoursBefore: number
  }
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('process_booking_cancellation', {
      p_booking_id: bookingId,
      p_reason: reason,
      p_cancelled_by: cancelledBy,
    })

    if (error) {
      console.error('[CancellationPolicyActions] Error processing cancellation:', error)
      return { error: error.message || 'Failed to process cancellation' }
    }

    if (!data || data.length === 0) {
      return { error: 'Failed to process cancellation' }
    }

    const row = data[0]
    return {
      result: {
        bookingId: row.booking_id,
        wasLate: row.was_late,
        sessionCharged: row.session_charged,
        hoursBefore: row.hours_before,
      },
    }
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get policy for the current coach (authenticated user)
 */
export async function getMyPolicyAction(): Promise<{
  policy: CoachCancellationPolicy | null
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { policy: null, error: 'Not authenticated' }
    }

    return getCancellationPolicyAction(user.id)
  } catch (error) {
    console.error('[CancellationPolicyActions] Unexpected error:', error)
    return { policy: null, error: 'An unexpected error occurred' }
  }
}
