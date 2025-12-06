import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Booking, InsertBookingNotification } from '@/lib/types/schemas'

// =====================================================
// Booking Notification Service
// =====================================================

/**
 * Service for managing booking notifications
 *
 * Handles:
 * - Booking confirmations
 * - Reminder notifications (24h before)
 * - Reschedule notifications
 * - Cancellation notifications
 * - Package alerts (low sessions, expired)
 */
export class BookingNotificationService {
  // =====================================================
  // Queue Notifications
  // =====================================================

  /**
   * Queue booking confirmation notifications
   */
  static async queueBookingConfirmation(booking: Booking): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const notifications: InsertBookingNotification[] = [
      // In-app notification for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_confirmed',
        channel: 'in_app',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time
        }
      },
      // Email notification for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_confirmed',
        channel: 'email',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time
        }
      }
    ]

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notifications as any[])

    if (error) {
      console.error('Error queuing confirmation notifications:', error)
    }
  }

  /**
   * Queue reminder notification (24h before)
   */
  static async queueReminder(booking: Booking): Promise<void> {
    const supabase = await getSupabaseServerClient()

    // Calculate reminder time: 9 AM the day before
    const bookingDate = new Date(booking.scheduled_date)
    const reminderDate = new Date(bookingDate)
    reminderDate.setDate(reminderDate.getDate() - 1)
    reminderDate.setHours(9, 0, 0, 0)

    // Only queue if reminder is in the future
    if (reminderDate <= new Date()) {
      return
    }

    const notifications: InsertBookingNotification[] = [
      // In-app reminder for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'reminder_24h',
        channel: 'in_app',
        scheduled_for: reminderDate.toISOString(),
        status: 'pending',
        metadata: {
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time
        }
      },
      // Email reminder for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'reminder_24h',
        channel: 'email',
        scheduled_for: reminderDate.toISOString(),
        status: 'pending',
        metadata: {
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time
        }
      },
      // In-app reminder for coach
      {
        booking_id: booking.id,
        recipient_id: booking.coach_id,
        notification_type: 'reminder_24h',
        channel: 'in_app',
        scheduled_for: reminderDate.toISOString(),
        status: 'pending',
        metadata: {
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time,
          client_id: booking.client_id
        }
      }
    ]

    // Remove old reminders for this booking first
    await supabase
      .from('booking_notifications')
      .delete()
      .eq('booking_id', booking.id)
      .eq('notification_type', 'reminder_24h')
      .eq('status', 'pending')

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notifications as any[])

    if (error) {
      console.error('Error queuing reminder notifications:', error)
    }
  }

  /**
   * Queue reschedule notification
   */
  static async queueRescheduleNotification(booking: Booking): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const notifications: InsertBookingNotification[] = [
      // In-app notification for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_rescheduled',
        channel: 'in_app',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          new_date: booking.scheduled_date,
          new_time: booking.start_time
        }
      },
      // Email notification for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_rescheduled',
        channel: 'email',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          new_date: booking.scheduled_date,
          new_time: booking.start_time
        }
      }
    ]

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notifications as any[])

    if (error) {
      console.error('Error queuing reschedule notifications:', error)
    }
  }

  /**
   * Queue cancellation notification
   */
  static async queueCancellationNotification(booking: Booking): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const notifications: InsertBookingNotification[] = [
      // In-app notification for client
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_cancelled',
        channel: 'in_app',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          cancelled_date: booking.scheduled_date,
          cancelled_time: booking.start_time,
          reason: booking.cancellation_reason
        }
      },
      // Email notification for client (if not cancelled by client)
      {
        booking_id: booking.id,
        recipient_id: booking.client_id,
        notification_type: 'booking_cancelled',
        channel: 'email',
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        metadata: {
          cancelled_date: booking.scheduled_date,
          cancelled_time: booking.start_time,
          reason: booking.cancellation_reason
        }
      }
    ]

    // Cancel pending reminders for this booking
    await supabase
      .from('booking_notifications')
      .delete()
      .eq('booking_id', booking.id)
      .in('notification_type', ['reminder_24h', 'reminder_1h'])
      .eq('status', 'pending')

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notifications as any[])

    if (error) {
      console.error('Error queuing cancellation notifications:', error)
    }
  }

  /**
   * Queue package low sessions alert
   */
  static async queuePackageLowAlert(
    packageId: string,
    clientId: string,
    sessionsRemaining: number
  ): Promise<void> {
    const supabase = await getSupabaseServerClient()

    // Get a booking for this package to link the notification
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('package_id', packageId)
      .limit(1)
      .single()

    if (!booking) return

    const notification: InsertBookingNotification = {
      booking_id: booking.id,
      recipient_id: clientId,
      notification_type: 'package_low',
      channel: 'in_app',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        package_id: packageId,
        sessions_remaining: sessionsRemaining
      }
    }

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notification as any)

    if (error) {
      console.error('Error queuing package low alert:', error)
    }
  }

  /**
   * Queue package expiration alert (with expiry date info)
   */
  static async queuePackageExpirationAlert(params: {
    coachId: string
    clientId: string
    packageName: string
    sessionsRemaining: number
    daysUntilExpiry: number
  }): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const notification: InsertBookingNotification = {
      booking_id: null,
      recipient_id: params.clientId,
      notification_type: 'package_expiring_soon',
      channel: 'in_app',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        coach_id: params.coachId,
        package_name: params.packageName,
        sessions_remaining: params.sessionsRemaining,
        days_until_expiry: params.daysUntilExpiry
      }
    }

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notification as any)

    if (error) {
      console.error('Error queuing package expiration alert:', error)
    }
  }

  /**
   * Queue upgrade suggestion notification
   */
  static async queueUpgradeSuggestionNotification(params: {
    coachId: string
    clientId: string
    packageName: string
    suggestedSessions: number
    currentSessions: number
    daysToComplete: number
  }): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const notification: InsertBookingNotification = {
      booking_id: null,
      recipient_id: params.coachId, // Notify the coach
      notification_type: 'package_upgrade_suggestion',
      channel: 'in_app',
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        client_id: params.clientId,
        package_name: params.packageName,
        suggested_sessions: params.suggestedSessions,
        current_sessions: params.currentSessions,
        days_to_complete: params.daysToComplete
      }
    }

    const { error } = await supabase
      .from('booking_notifications')
      .insert(notification as any)

    if (error) {
      console.error('Error queuing upgrade suggestion notification:', error)
    }
  }

  // =====================================================
  // Process Notifications
  // =====================================================

  /**
   * Get pending notifications ready to be sent
   */
  static async getPendingNotifications(): Promise<any[]> {
    const supabase = await getSupabaseServerClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('booking_notifications')
      .select(`
        *,
        bookings(
          scheduled_date,
          start_time,
          end_time,
          coach_id,
          client_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Error fetching pending notifications:', error)
      return []
    }

    return data || []
  }

  /**
   * Mark notification as sent
   */
  static async markAsSent(notificationId: string): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('booking_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as sent:', error)
    }
  }

  /**
   * Mark notification as failed
   */
  static async markAsFailed(notificationId: string): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('booking_notifications')
      .update({
        status: 'failed'
      })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as failed:', error)
    }
  }

  /**
   * Process all pending notifications
   * Called by cron job / edge function
   */
  static async processPendingNotifications(): Promise<{ processed: number; failed: number }> {
    const pending = await this.getPendingNotifications()
    let processed = 0
    let failed = 0

    for (const notification of pending) {
      try {
        if (notification.channel === 'in_app') {
          await this.sendInAppNotification(notification)
        } else if (notification.channel === 'email') {
          await this.sendEmailNotification(notification)
        }

        await this.markAsSent(notification.id)
        processed++
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        await this.markAsFailed(notification.id)
        failed++
      }
    }

    return { processed, failed }
  }

  // =====================================================
  // Send Notifications
  // =====================================================

  /**
   * Send in-app notification
   * For now, this is a no-op since the notification is stored in the DB
   * and can be fetched by the client
   */
  private static async sendInAppNotification(notification: any): Promise<void> {
    // In-app notifications are already stored in the DB
    // The client can fetch them via a query
    // In the future, could trigger a real-time event via Supabase Realtime
    console.log(`In-app notification ready: ${notification.notification_type} for ${notification.recipient_id}`)
  }

  /**
   * Send email notification
   * Uses Resend or similar email service
   */
  private static async sendEmailNotification(notification: any): Promise<void> {
    // TODO: Implement email sending via Resend
    // For now, just log
    console.log(`Email notification: ${notification.notification_type} for ${notification.recipient_id}`)

    // Example implementation:
    // const { data: user } = await supabase
    //   .from('users')
    //   .select('email')
    //   .eq('id', notification.recipient_id)
    //   .single()
    //
    // if (user?.email) {
    //   await resend.emails.send({
    //     from: 'Arvo <noreply@arvo.app>',
    //     to: user.email,
    //     subject: this.getEmailSubject(notification),
    //     html: this.getEmailBody(notification)
    //   })
    // }
  }

  // =====================================================
  // Client Notification Fetching
  // =====================================================

  /**
   * Get unread notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    limit = 20
  ): Promise<any[]> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_notifications')
      .select(`
        *,
        bookings(
          scheduled_date,
          start_time,
          coach_profiles!bookings_coach_id_fkey(display_name)
        )
      `)
      .eq('recipient_id', userId)
      .eq('channel', 'in_app')
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }

    return data || []
  }
}
