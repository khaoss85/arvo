'use server'

/**
 * Server Actions for No-Show Tracking
 * Handles no-show statistics and alerts
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  ClientNoShowAlert,
  NoShowStats,
  PendingNoShowAlert,
} from '@/lib/types/schemas'

// =====================================================
// Statistics Actions
// =====================================================

/**
 * Get no-show statistics for a specific client
 */
export async function getClientNoShowStatsAction(
  coachId: string,
  clientId: string
): Promise<{ stats: NoShowStats; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_client_no_show_stats', {
      p_coach_id: coachId,
      p_client_id: clientId,
      p_sessions_to_analyze: 5,
    })

    if (error) {
      console.error('[NoShowTrackingActions] Error fetching stats:', error)
      return {
        stats: { no_show_count: 0, session_count: 0, no_show_rate: 0, exceeds_threshold: false },
        error: 'Failed to fetch statistics',
      }
    }

    if (!data || data.length === 0) {
      return {
        stats: { no_show_count: 0, session_count: 0, no_show_rate: 0, exceeds_threshold: false },
      }
    }

    const row = data[0]
    return {
      stats: {
        no_show_count: row.no_show_count,
        session_count: row.session_count,
        no_show_rate: row.no_show_rate,
        exceeds_threshold: row.exceeds_threshold,
      },
    }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return {
      stats: { no_show_count: 0, session_count: 0, no_show_rate: 0, exceeds_threshold: false },
      error: 'An unexpected error occurred',
    }
  }
}

// =====================================================
// Alert Management Actions
// =====================================================

/**
 * Get all pending (unacknowledged) alerts for a coach
 */
export async function getPendingNoShowAlertsAction(
  coachId: string
): Promise<{ alerts: PendingNoShowAlert[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_pending_no_show_alerts', {
      p_coach_id: coachId,
    })

    if (error) {
      console.error('[NoShowTrackingActions] Error fetching alerts:', error)
      return { alerts: [], error: 'Failed to fetch alerts' }
    }

    const alerts: PendingNoShowAlert[] = (data || []).map((row: any) => ({
      alert_id: row.alert_id,
      client_id: row.client_id,
      client_name: row.client_name,
      no_show_count: row.no_show_count,
      session_count: row.session_count,
      no_show_rate: parseFloat(row.no_show_rate),
      alert_created_at: row.alert_created_at,
    }))

    return { alerts }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return { alerts: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Acknowledge a no-show alert
 */
export async function acknowledgeNoShowAlertAction(
  alertId: string,
  notes?: string
): Promise<{ alert?: ClientNoShowAlert; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const updates: Record<string, any> = {
      acknowledged_at: new Date().toISOString(),
    }

    if (notes !== undefined) {
      updates.coach_notes = notes
    }

    const { data, error } = await supabase
      .from('client_no_show_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('[NoShowTrackingActions] Error acknowledging alert:', error)
      return { error: 'Failed to acknowledge alert' }
    }

    return { alert: data as unknown as ClientNoShowAlert }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Mark a booking as no-show and trigger threshold check
 */
export async function markNoShowWithTrackingAction(
  bookingId: string
): Promise<{ success: boolean; alertTriggered: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // First, get the booking to know coach and client IDs
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('coach_id, client_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return { success: false, alertTriggered: false, error: 'Booking not found' }
    }

    // Update booking status to no_show
    // The trigger will automatically check the threshold
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'no_show' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('[NoShowTrackingActions] Error marking no-show:', updateError)
      return { success: false, alertTriggered: false, error: 'Failed to mark as no-show' }
    }

    // Check if an alert was triggered (query the alerts table)
    const { data: alert } = await supabase
      .from('client_no_show_alerts')
      .select('id')
      .eq('coach_id', booking.coach_id)
      .eq('client_id', booking.client_id)
      .is('acknowledged_at', null)
      .single()

    return {
      success: true,
      alertTriggered: !!alert,
    }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return { success: false, alertTriggered: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get the count of pending alerts for the current coach
 */
export async function getPendingAlertCountAction(): Promise<{
  count: number
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { count: 0, error: 'Not authenticated' }
    }

    const { count, error } = await supabase
      .from('client_no_show_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .is('acknowledged_at', null)

    if (error) {
      console.error('[NoShowTrackingActions] Error counting alerts:', error)
      return { count: 0, error: 'Failed to count alerts' }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return { count: 0, error: 'An unexpected error occurred' }
  }
}

/**
 * Get alert for a specific client
 */
export async function getClientAlertAction(
  coachId: string,
  clientId: string
): Promise<{ alert: ClientNoShowAlert | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('client_no_show_alerts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { alert: null }
      }
      console.error('[NoShowTrackingActions] Error fetching client alert:', error)
      return { alert: null, error: 'Failed to fetch alert' }
    }

    return { alert: data as unknown as ClientNoShowAlert }
  } catch (error) {
    console.error('[NoShowTrackingActions] Unexpected error:', error)
    return { alert: null, error: 'An unexpected error occurred' }
  }
}
