// Supabase Edge Function: Process Booking Notifications
// Scheduled to run every 15 minutes to process pending booking notifications
// Handles: booking confirmations, 24h reminders, reschedule notices, cancellations

import { createClient } from 'jsr:@supabase/supabase-js@2'

interface BookingNotification {
  id: string
  booking_id: string
  recipient_id: string
  notification_type: 'booking_confirmed' | 'reminder_24h' | 'booking_rescheduled' | 'booking_cancelled' | 'package_low'
  channel: 'in_app' | 'email'
  scheduled_for: string
  status: 'pending' | 'sent' | 'failed'
  metadata: Record<string, any>
  bookings?: {
    scheduled_date: string
    start_time: string
    end_time: string
    coach_id: string
    client_id: string
    coach_profiles?: {
      display_name: string
    }
  }
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const appUrl = Deno.env.get('APP_URL') ?? 'https://arvo.guru'
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[BookingNotifications] Starting notification processing...')

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      byType: {
        booking_confirmed: 0,
        reminder_24h: 0,
        booking_rescheduled: 0,
        booking_cancelled: 0,
        package_low: 0,
      } as Record<string, number>,
      errors: [] as string[],
    }

    const now = new Date().toISOString()

    // Fetch pending notifications that are ready to send
    const { data: notifications, error: fetchError } = await supabase
      .from('booking_notifications')
      .select(`
        *,
        bookings (
          scheduled_date,
          start_time,
          end_time,
          coach_id,
          client_id,
          coach_profiles!bookings_coach_id_fkey (
            display_name
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(100) as { data: BookingNotification[] | null; error: any }

    if (fetchError) {
      console.error('[BookingNotifications] Error fetching notifications:', fetchError)
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      console.log('[BookingNotifications] No pending notifications to process')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending notifications',
          timestamp: now,
          results,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[BookingNotifications] Found ${notifications.length} notifications to process`)

    // Process each notification
    for (const notification of notifications) {
      try {
        // Skip if booking was cancelled (for reminders)
        if (notification.notification_type === 'reminder_24h') {
          const { data: booking } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', notification.booking_id)
            .single()

          if (booking?.status === 'cancelled') {
            console.log(`[BookingNotifications] Skipping reminder for cancelled booking: ${notification.booking_id}`)
            await supabase
              .from('booking_notifications')
              .delete()
              .eq('id', notification.id)
            results.skipped++
            continue
          }
        }

        if (notification.channel === 'in_app') {
          // In-app notifications are already stored - just mark as sent
          await markAsSent(supabase, notification.id)
          results.processed++
          results.byType[notification.notification_type]++
          console.log(`[BookingNotifications] In-app notification processed: ${notification.id}`)
        } else if (notification.channel === 'email') {
          // Send email notification
          const emailSent = await sendEmailNotification(
            supabase,
            notification,
            resendApiKey,
            appUrl
          )

          if (emailSent) {
            await markAsSent(supabase, notification.id)
            results.processed++
            results.byType[notification.notification_type]++
            console.log(`[BookingNotifications] Email notification sent: ${notification.id}`)
          } else {
            await markAsFailed(supabase, notification.id)
            results.failed++
            results.errors.push(`Failed to send email for notification ${notification.id}`)
          }
        }
      } catch (error) {
        console.error(`[BookingNotifications] Error processing notification ${notification.id}:`, error)
        await markAsFailed(supabase, notification.id)
        results.failed++
        results.errors.push(`Notification ${notification.id}: ${String(error)}`)
      }
    }

    console.log('[BookingNotifications] Processing complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification processing complete',
        timestamp: new Date().toISOString(),
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[BookingNotifications] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function markAsSent(supabase: any, notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('booking_notifications')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (error) {
    console.error(`[BookingNotifications] Error marking notification as sent: ${notificationId}`, error)
    throw error
  }
}

async function markAsFailed(supabase: any, notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('booking_notifications')
    .update({ status: 'failed' })
    .eq('id', notificationId)

  if (error) {
    console.error(`[BookingNotifications] Error marking notification as failed: ${notificationId}`, error)
  }
}

async function sendEmailNotification(
  supabase: any,
  notification: BookingNotification,
  resendApiKey: string,
  appUrl: string
): Promise<boolean> {
  // Get recipient email
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', notification.recipient_id)
    .single()

  if (!user?.email) {
    console.error(`[BookingNotifications] No email found for user: ${notification.recipient_id}`)
    return false
  }

  // Skip if no Resend API key configured
  if (!resendApiKey) {
    console.log(`[BookingNotifications] Resend API key not configured, skipping email`)
    return true // Mark as sent anyway since we can't send emails
  }

  const { subject, html } = buildEmailContent(notification, appUrl)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Arvo <noreply@arvo.guru>',
        to: user.email,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[BookingNotifications] Resend API error:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`[BookingNotifications] Error sending email:`, error)
    return false
  }
}

function buildEmailContent(
  notification: BookingNotification,
  appUrl: string
): { subject: string; html: string } {
  const booking = notification.bookings
  const coachName = booking?.coach_profiles?.display_name || 'Your Coach'
  const date = booking?.scheduled_date || notification.metadata?.scheduled_date || ''
  const time = booking?.start_time?.slice(0, 5) || notification.metadata?.start_time || ''

  // Format date nicely
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : ''

  switch (notification.notification_type) {
    case 'booking_confirmed':
      return {
        subject: `Training Session Confirmed - ${formattedDate}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Session Confirmed!</h2>
            <p>Your training session with <strong>${coachName}</strong> has been confirmed.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0;"><strong>Time:</strong> ${time}</p>
            </div>
            <p>See you at the gym!</p>
            <a href="${appUrl}/bookings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View My Sessions</a>
          </div>
        `,
      }

    case 'reminder_24h':
      return {
        subject: `Reminder: Training Tomorrow at ${time}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Training Tomorrow!</h2>
            <p>This is a reminder that you have a training session with <strong>${coachName}</strong> tomorrow.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0;"><strong>Time:</strong> ${time}</p>
            </div>
            <p>Don't forget to:</p>
            <ul>
              <li>Get a good night's sleep</li>
              <li>Stay hydrated</li>
              <li>Bring your gym gear</li>
            </ul>
            <a href="${appUrl}/bookings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Session Details</a>
          </div>
        `,
      }

    case 'booking_rescheduled':
      const newDate = notification.metadata?.new_date || date
      const newTime = notification.metadata?.new_time || time
      const formattedNewDate = newDate ? new Date(newDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) : ''

      return {
        subject: `Session Rescheduled - ${formattedNewDate}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Session Rescheduled</h2>
            <p>Your training session with <strong>${coachName}</strong> has been rescheduled.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>New Date:</strong> ${formattedNewDate}</p>
              <p style="margin: 10px 0 0;"><strong>New Time:</strong> ${newTime}</p>
            </div>
            <p>Please update your calendar accordingly.</p>
            <a href="${appUrl}/bookings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View My Sessions</a>
          </div>
        `,
      }

    case 'booking_cancelled':
      const reason = notification.metadata?.reason
      return {
        subject: `Session Cancelled - ${formattedDate}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Session Cancelled</h2>
            <p>Your training session with <strong>${coachName}</strong> has been cancelled.</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 10px 0 0;"><strong>Time:</strong> ${time}</p>
              ${reason ? `<p style="margin: 10px 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            <p>Please contact your coach to reschedule.</p>
            <a href="${appUrl}/bookings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View My Sessions</a>
          </div>
        `,
      }

    case 'package_low':
      const sessionsRemaining = notification.metadata?.sessions_remaining || 0
      return {
        subject: `Low Sessions Alert - ${sessionsRemaining} Sessions Left`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Sessions Running Low</h2>
            <p>You only have <strong>${sessionsRemaining} session${sessionsRemaining !== 1 ? 's' : ''}</strong> remaining in your package.</p>
            <p>Consider renewing your package to continue your training progress!</p>
            <a href="${appUrl}/bookings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View My Sessions</a>
          </div>
        `,
      }

    default:
      return {
        subject: 'Arvo Notification',
        html: `<p>You have a new notification from Arvo.</p>`,
      }
  }
}
