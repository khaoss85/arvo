/**
 * No-Show Tracking Service
 * Tracks client no-show patterns and alerts coaches when threshold exceeded
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  ClientNoShowAlert,
  NoShowStats,
  PendingNoShowAlert,
  UpdateClientNoShowAlert,
} from '@/lib/types/schemas'

export class NoShowTrackingService {
  // Alert threshold: 2/5 = 40%
  static readonly ALERT_THRESHOLD_RATE = 40
  static readonly SESSIONS_TO_ANALYZE = 5

  /**
   * Get no-show statistics for a specific client
   * Uses the database function get_client_no_show_stats
   */
  static async getClientNoShowStats(
    coachId: string,
    clientId: string
  ): Promise<NoShowStats> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('get_client_no_show_stats', {
      p_coach_id: coachId,
      p_client_id: clientId,
      p_sessions_to_analyze: this.SESSIONS_TO_ANALYZE,
    })

    if (error) {
      console.error('[NoShowTrackingService] Error fetching stats:', error)
      throw new Error('Failed to fetch no-show statistics')
    }

    if (!data || data.length === 0) {
      return {
        no_show_count: 0,
        session_count: 0,
        no_show_rate: 0,
        exceeds_threshold: false,
      }
    }

    const row = data[0]
    return {
      no_show_count: row.no_show_count,
      session_count: row.session_count,
      no_show_rate: row.no_show_rate,
      exceeds_threshold: row.exceeds_threshold,
    }
  }

  /**
   * Check and trigger an alert if the client exceeds the no-show threshold
   * Uses the database function check_no_show_threshold
   * Returns the alert ID if created, null otherwise
   */
  static async checkAndTriggerAlert(
    coachId: string,
    clientId: string
  ): Promise<string | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('check_no_show_threshold', {
      p_coach_id: coachId,
      p_client_id: clientId,
    })

    if (error) {
      console.error('[NoShowTrackingService] Error checking threshold:', error)
      throw new Error('Failed to check no-show threshold')
    }

    return data // Returns UUID or null
  }

  /**
   * Get all pending (unacknowledged) alerts for a coach
   * Uses the database function get_pending_no_show_alerts
   */
  static async getPendingAlerts(coachId: string): Promise<PendingNoShowAlert[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.rpc('get_pending_no_show_alerts', {
      p_coach_id: coachId,
    })

    if (error) {
      console.error('[NoShowTrackingService] Error fetching pending alerts:', error)
      throw new Error('Failed to fetch pending alerts')
    }

    return (data || []).map((row: any) => ({
      alert_id: row.alert_id,
      client_id: row.client_id,
      client_name: row.client_name,
      no_show_count: row.no_show_count,
      session_count: row.session_count,
      no_show_rate: parseFloat(row.no_show_rate),
      alert_created_at: row.alert_created_at,
    }))
  }

  /**
   * Get a single alert by ID
   */
  static async getAlert(alertId: string): Promise<ClientNoShowAlert | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('client_no_show_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[NoShowTrackingService] Error fetching alert:', error)
      throw new Error('Failed to fetch alert')
    }

    return data as unknown as ClientNoShowAlert
  }

  /**
   * Get alert for a specific client (if exists)
   */
  static async getAlertForClient(
    coachId: string,
    clientId: string
  ): Promise<ClientNoShowAlert | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('client_no_show_alerts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('[NoShowTrackingService] Error fetching client alert:', error)
      throw new Error('Failed to fetch client alert')
    }

    return data as unknown as ClientNoShowAlert
  }

  /**
   * Acknowledge an alert (coach has reviewed it)
   */
  static async acknowledgeAlert(
    alertId: string,
    notes?: string
  ): Promise<ClientNoShowAlert> {
    const supabase = getSupabaseBrowserClient()

    const updates: UpdateClientNoShowAlert = {
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
      console.error('[NoShowTrackingService] Error acknowledging alert:', error)
      throw new Error('Failed to acknowledge alert')
    }

    return data as unknown as ClientNoShowAlert
  }

  /**
   * Get the count of pending alerts for a coach (for badge display)
   */
  static async getPendingAlertCount(coachId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count, error } = await supabase
      .from('client_no_show_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .is('acknowledged_at', null)

    if (error) {
      console.error('[NoShowTrackingService] Error counting alerts:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Format the alert message for display
   */
  static formatAlertMessage(
    clientName: string,
    noShowCount: number,
    sessionCount: number,
    language: 'en' | 'it' = 'it'
  ): string {
    if (language === 'it') {
      return `${clientName} ha saltato ${noShowCount}/${sessionCount} ultime sessioni`
    }
    return `${clientName} missed ${noShowCount}/${sessionCount} recent sessions`
  }

  /**
   * Get severity level based on no-show rate
   */
  static getSeverityLevel(noShowRate: number): 'warning' | 'high' | 'critical' {
    if (noShowRate >= 60) {
      return 'critical'
    }
    if (noShowRate >= 50) {
      return 'high'
    }
    return 'warning'
  }

  /**
   * Get severity color for UI
   */
  static getSeverityColor(noShowRate: number): string {
    const severity = this.getSeverityLevel(noShowRate)
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'warning'
      default:
        return 'secondary'
    }
  }
}
