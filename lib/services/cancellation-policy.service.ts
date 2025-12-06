/**
 * Cancellation Policy Service
 * Handles coach cancellation policies and late cancellation processing
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  CoachCancellationPolicy,
  InsertCoachCancellationPolicy,
  UpdateCoachCancellationPolicy,
  CancellationStatus,
  Booking,
} from '@/lib/types/schemas'

export class CancellationPolicyService {
  /**
   * Get the cancellation policy for a coach
   */
  static async getPolicy(coachId: string): Promise<CoachCancellationPolicy | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .select('*')
      .eq('coach_id', coachId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('[CancellationPolicyService] Error fetching policy:', error)
      throw new Error('Failed to fetch cancellation policy')
    }

    return data as unknown as CoachCancellationPolicy
  }

  /**
   * Create or update the cancellation policy for a coach
   */
  static async upsertPolicy(
    coachId: string,
    policy: Partial<InsertCoachCancellationPolicy>
  ): Promise<CoachCancellationPolicy> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .upsert({
        coach_id: coachId,
        ...policy,
      } as any, {
        onConflict: 'coach_id'
      })
      .select()
      .single()

    if (error) {
      console.error('[CancellationPolicyService] Error upserting policy:', error)
      throw new Error('Failed to save cancellation policy')
    }

    return data as unknown as CoachCancellationPolicy
  }

  /**
   * Update an existing policy
   */
  static async updatePolicy(
    coachId: string,
    updates: UpdateCoachCancellationPolicy
  ): Promise<CoachCancellationPolicy> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('coach_cancellation_policies')
      .update(updates as any)
      .eq('coach_id', coachId)
      .select()
      .single()

    if (error) {
      console.error('[CancellationPolicyService] Error updating policy:', error)
      throw new Error('Failed to update cancellation policy')
    }

    return data as unknown as CoachCancellationPolicy
  }

  /**
   * Check if a cancellation would be late based on coach policy
   * Uses the database function check_cancellation_status
   */
  static async checkCancellationStatus(bookingId: string): Promise<CancellationStatus> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('check_cancellation_status', {
      p_booking_id: bookingId,
    })

    if (error) {
      console.error('[CancellationPolicyService] Error checking cancellation status:', error)
      throw new Error('Failed to check cancellation status')
    }

    if (!data || data.length === 0) {
      throw new Error('Booking not found')
    }

    const row = data[0]
    return {
      isLate: row.is_late,
      hoursUntilBooking: row.hours_until_booking,
      willChargeSession: row.will_charge_session,
      policyHours: row.policy_hours,
    }
  }

  /**
   * Process a booking cancellation with policy enforcement
   * Uses the database function process_booking_cancellation
   */
  static async processCancellation(
    bookingId: string,
    reason?: string,
    cancelledBy: 'coach' | 'client' = 'client'
  ): Promise<{ bookingId: string; wasLate: boolean; sessionCharged: boolean; hoursBefore: number }> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('process_booking_cancellation', {
      p_booking_id: bookingId,
      p_reason: reason,
      p_cancelled_by: cancelledBy,
    })

    if (error) {
      console.error('[CancellationPolicyService] Error processing cancellation:', error)
      throw new Error(error.message || 'Failed to process cancellation')
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to process cancellation')
    }

    const row = data[0]
    return {
      bookingId: row.booking_id,
      wasLate: row.was_late,
      sessionCharged: row.session_charged,
      hoursBefore: row.hours_before,
    }
  }

  /**
   * Get the default policy values (used when coach has no policy)
   */
  static getDefaultPolicy(): Omit<CoachCancellationPolicy, 'id' | 'coach_id' | 'created_at' | 'updated_at'> {
    return {
      free_cancellation_hours: 24,
      late_cancel_charges_session: true,
      late_cancel_refund_percentage: 0,
      policy_summary_en: null,
      policy_summary_it: null,
    }
  }

  /**
   * Generate a human-readable policy summary
   */
  static generatePolicySummary(
    policy: Pick<CoachCancellationPolicy, 'free_cancellation_hours' | 'late_cancel_charges_session'>,
    language: 'en' | 'it' = 'it'
  ): string {
    const hours = policy.free_cancellation_hours

    if (language === 'it') {
      if (policy.late_cancel_charges_session) {
        return `Cancellazione gratuita fino a ${hours}h prima. Dopo, la sessione viene scalata dal pacchetto.`
      }
      return `Cancellazione gratuita fino a ${hours}h prima della sessione.`
    }

    // English
    if (policy.late_cancel_charges_session) {
      return `Free cancellation up to ${hours}h before. After that, the session will be deducted from your package.`
    }
    return `Free cancellation up to ${hours}h before the session.`
  }

  /**
   * Format the cancellation warning message for the UI
   */
  static formatCancellationWarning(
    status: CancellationStatus,
    language: 'en' | 'it' = 'it'
  ): string {
    if (!status.isLate) {
      if (language === 'it') {
        return `Puoi cancellare gratuitamente (${Math.round(status.hoursUntilBooking)}h prima della sessione).`
      }
      return `You can cancel for free (${Math.round(status.hoursUntilBooking)}h before the session).`
    }

    if (status.willChargeSession) {
      if (language === 'it') {
        return `Attenzione: Cancellando ora (${Math.round(status.hoursUntilBooking)}h prima), la sessione verrà scalata dal pacchetto.`
      }
      return `Warning: Cancelling now (${Math.round(status.hoursUntilBooking)}h before) will deduct the session from your package.`
    }

    if (language === 'it') {
      return `Questa è una cancellazione tardiva (${Math.round(status.hoursUntilBooking)}h prima), ma non verrà applicata alcuna penale.`
    }
    return `This is a late cancellation (${Math.round(status.hoursUntilBooking)}h before), but no penalty will be applied.`
  }
}
