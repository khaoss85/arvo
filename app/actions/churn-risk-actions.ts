'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { PendingChurnRiskAlert, ChurnRiskLevel, ChurnRiskTrigger } from '@/lib/services/churn-risk.service'

/**
 * Check and trigger churn risk alert for a specific client
 */
export async function checkChurnRiskAction(
  coachId: string,
  clientId: string
): Promise<{ alertId: string | null; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('check_churn_risk_threshold', {
      p_coach_id: coachId,
      p_client_id: clientId,
    })

    if (error) {
      console.error('[ChurnRiskActions] Error checking threshold:', error)
      return { alertId: null, error: error.message }
    }

    return { alertId: data }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { alertId: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all pending churn risk alerts for a coach
 */
export async function getPendingChurnAlertsAction(
  coachId: string
): Promise<{ alerts: PendingChurnRiskAlert[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_pending_churn_risk_alerts', {
      p_coach_id: coachId,
    })

    if (error) {
      console.error('[ChurnRiskActions] Error fetching alerts:', error)
      return { alerts: [], error: error.message }
    }

    const alerts: PendingChurnRiskAlert[] = (data || []).map((row: any) => ({
      alert_id: row.alert_id,
      client_id: row.client_id,
      client_name: row.client_name,
      days_since_last_booking: row.days_since_last_booking,
      cancellation_rate: parseFloat(row.cancellation_rate),
      risk_level: row.risk_level as ChurnRiskLevel,
      risk_score: parseFloat(row.risk_score),
      primary_trigger: row.primary_trigger as ChurnRiskTrigger,
      suggested_actions: row.suggested_actions || [],
      created_at: row.created_at,
    }))

    return { alerts }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { alerts: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Acknowledge a churn risk alert
 */
export async function acknowledgeChurnAlertAction(
  alertId: string,
  notes?: string,
  action?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const updates: Record<string, any> = {
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (notes !== undefined) {
      updates.coach_notes = notes
    }

    if (action !== undefined) {
      updates.action_taken = action
      updates.action_taken_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('client_churn_risk_alerts')
      .update(updates)
      .eq('id', alertId)

    if (error) {
      console.error('[ChurnRiskActions] Error acknowledging alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Resolve a churn risk alert (client has returned or issue addressed)
 */
export async function resolveChurnAlertAction(
  alertId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('client_churn_risk_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) {
      console.error('[ChurnRiskActions] Error resolving alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get count of pending alerts for a coach
 */
export async function getChurnAlertCountAction(
  coachId: string
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { count, error } = await supabase
      .from('client_churn_risk_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .is('resolved_at', null)
      .is('acknowledged_at', null)

    if (error) {
      console.error('[ChurnRiskActions] Error counting alerts:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { count: 0, error: 'An unexpected error occurred' }
  }
}

/**
 * Check all clients for a coach (used by cron job or manual trigger)
 */
export async function checkAllClientsChurnRiskAction(
  coachId: string
): Promise<{ checked: number; alertsCreated: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get all active client relationships
    const { data: relationships, error: relError } = await supabase
      .from('coach_client_relationships')
      .select('client_id')
      .eq('coach_id', coachId)
      .eq('status', 'active')

    if (relError || !relationships) {
      console.error('[ChurnRiskActions] Error fetching relationships:', relError)
      return { checked: 0, alertsCreated: 0, error: relError?.message }
    }

    let alertsCreated = 0

    for (const rel of relationships) {
      try {
        const { data: alertId } = await supabase.rpc('check_churn_risk_threshold', {
          p_coach_id: coachId,
          p_client_id: rel.client_id,
        })

        if (alertId) {
          alertsCreated++
        }
      } catch (e) {
        console.error(`[ChurnRiskActions] Error checking client ${rel.client_id}:`, e)
      }
    }

    return {
      checked: relationships.length,
      alertsCreated,
    }
  } catch (error) {
    console.error('[ChurnRiskActions] Unexpected error:', error)
    return { checked: 0, alertsCreated: 0, error: 'An unexpected error occurred' }
  }
}
