/**
 * Churn Risk Detection Service
 * Tracks client engagement patterns and alerts coaches about at-risk clients
 *
 * Triggers:
 * - Inactivity: 14+ days since last booking
 * - High cancellations: 50%+ cancellation rate on last 10 bookings
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Thresholds
export const INACTIVITY_THRESHOLD_DAYS = 14
export const CANCELLATION_THRESHOLD_RATE = 50
export const BOOKINGS_TO_ANALYZE = 10

export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ChurnRiskTrigger = 'inactivity' | 'high_cancellations' | 'combined'

export interface PendingChurnRiskAlert {
  alert_id: string
  client_id: string
  client_name: string
  days_since_last_booking: number
  cancellation_rate: number
  risk_level: ChurnRiskLevel
  risk_score: number
  primary_trigger: ChurnRiskTrigger
  suggested_actions: string[]
  created_at: string
}

export interface ChurnRiskStats {
  days_since_last_booking: number
  cancellation_count: number
  total_bookings: number
  cancellation_rate: number
  risk_score: number
  risk_level: ChurnRiskLevel
}

export class ChurnRiskService {
  static readonly INACTIVITY_THRESHOLD_DAYS = INACTIVITY_THRESHOLD_DAYS
  static readonly CANCELLATION_THRESHOLD_RATE = CANCELLATION_THRESHOLD_RATE

  /**
   * Check and trigger an alert if the client exceeds the churn risk threshold
   * Returns the alert ID if created/updated, null otherwise
   */
  static async checkAndTriggerAlert(
    coachId: string,
    clientId: string
  ): Promise<string | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('check_churn_risk_threshold', {
      p_coach_id: coachId,
      p_client_id: clientId,
    })

    if (error) {
      console.error('[ChurnRiskService] Error checking threshold:', error)
      throw new Error('Failed to check churn risk threshold')
    }

    return data // Returns UUID or null
  }

  /**
   * Get all pending (unacknowledged) alerts for a coach
   */
  static async getPendingAlerts(coachId: string): Promise<PendingChurnRiskAlert[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('get_pending_churn_risk_alerts', {
      p_coach_id: coachId,
    })

    if (error) {
      console.error('[ChurnRiskService] Error fetching pending alerts:', error)
      throw new Error('Failed to fetch pending alerts')
    }

    return (data || []).map((row: any) => ({
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
  }

  /**
   * Acknowledge an alert (coach has reviewed it)
   */
  static async acknowledgeAlert(
    alertId: string,
    notes?: string,
    action?: string
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient()

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
      console.error('[ChurnRiskService] Error acknowledging alert:', error)
      throw new Error('Failed to acknowledge alert')
    }
  }

  /**
   * Mark alert as resolved (client has returned or issue addressed)
   */
  static async resolveAlert(
    alertId: string,
    reason: string
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('client_churn_risk_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    if (error) {
      console.error('[ChurnRiskService] Error resolving alert:', error)
      throw new Error('Failed to resolve alert')
    }
  }

  /**
   * Get the count of pending alerts for a coach (for badge display)
   */
  static async getPendingAlertCount(coachId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count, error } = await supabase
      .from('client_churn_risk_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .is('resolved_at', null)
      .is('acknowledged_at', null)

    if (error) {
      console.error('[ChurnRiskService] Error counting alerts:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Get risk level badge color
   */
  static getRiskColor(level: ChurnRiskLevel): 'destructive' | 'warning' | 'secondary' | 'default' {
    switch (level) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  /**
   * Get trigger display text
   */
  static getTriggerText(
    trigger: ChurnRiskTrigger,
    daysSince: number,
    cancellationRate: number,
    language: 'en' | 'it' = 'it'
  ): string {
    if (language === 'it') {
      switch (trigger) {
        case 'inactivity':
          return `Non prenota da ${daysSince} giorni`
        case 'high_cancellations':
          return `${Math.round(cancellationRate)}% di cancellazioni`
        case 'combined':
          return `Inattivo da ${daysSince}gg + ${Math.round(cancellationRate)}% cancellazioni`
        default:
          return 'A rischio churn'
      }
    }

    switch (trigger) {
      case 'inactivity':
        return `No bookings for ${daysSince} days`
      case 'high_cancellations':
        return `${Math.round(cancellationRate)}% cancellation rate`
      case 'combined':
        return `Inactive ${daysSince}d + ${Math.round(cancellationRate)}% cancellations`
      default:
        return 'At churn risk'
    }
  }

  /**
   * Check all clients for a coach and trigger alerts where needed
   * Used by the cron job
   */
  static async checkAllClientsForCoach(coachId: string): Promise<{
    checked: number
    alertsCreated: number
  }> {
    const supabase = getSupabaseBrowserClient()

    // Get all active client relationships
    const { data: relationships, error } = await supabase
      .from('coach_client_relationships')
      .select('client_id')
      .eq('coach_id', coachId)
      .eq('status', 'active')

    if (error || !relationships) {
      console.error('[ChurnRiskService] Error fetching relationships:', error)
      return { checked: 0, alertsCreated: 0 }
    }

    let alertsCreated = 0

    for (const rel of relationships) {
      try {
        const alertId = await this.checkAndTriggerAlert(coachId, rel.client_id)
        if (alertId) {
          alertsCreated++
        }
      } catch (e) {
        console.error(`[ChurnRiskService] Error checking client ${rel.client_id}:`, e)
      }
    }

    return {
      checked: relationships.length,
      alertsCreated,
    }
  }
}
