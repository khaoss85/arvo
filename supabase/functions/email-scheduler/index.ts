// Supabase Edge Function: Email Scheduler
// Scheduled to run hourly to send automated emails
// Handles: first workout reminders, weekly progress, re-engagement emails

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const appUrl = Deno.env.get('APP_URL') ?? 'https://arvo.guru'

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[EmailScheduler] Starting email scheduling process...')

    const results = {
      firstWorkoutReminders: 0,
      weeklyProgress: 0,
      reengagement: 0,
      errors: [] as string[],
    }

    // 1. Send first workout reminders
    try {
      console.log('[EmailScheduler] Checking for first workout reminders...')
      const { data: users, error } = await supabase.rpc('get_users_needing_first_workout_reminder')

      if (error) {
        console.error('[EmailScheduler] Error fetching users for first workout reminder:', error)
        results.errors.push(`First workout reminder query: ${error.message}`)
      } else if (users && users.length > 0) {
        console.log(`[EmailScheduler] Found ${users.length} users needing first workout reminder`)

        for (const user of users) {
          try {
            const response = await fetch(`${appUrl}/api/email/first-workout-reminder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                userId: user.user_id,
                email: user.email,
                workoutId: user.workout_id,
              }),
            })

            if (response.ok) {
              results.firstWorkoutReminders++
              console.log(`[EmailScheduler] First workout reminder sent to ${user.email}`)
            } else {
              const error = await response.text()
              console.error(`[EmailScheduler] Failed to send first workout reminder to ${user.email}:`, error)
              results.errors.push(`First workout reminder to ${user.email}: ${error}`)
            }
          } catch (error) {
            console.error(`[EmailScheduler] Error sending first workout reminder to ${user.email}:`, error)
            results.errors.push(`First workout reminder to ${user.email}: ${error}`)
          }
        }
      } else {
        console.log('[EmailScheduler] No users need first workout reminder')
      }
    } catch (error) {
      console.error('[EmailScheduler] Unexpected error in first workout reminder section:', error)
      results.errors.push(`First workout reminder section: ${error}`)
    }

    // 2. Send weekly progress emails (only on Mondays)
    try {
      console.log('[EmailScheduler] Checking for weekly progress emails...')
      const { data: users, error } = await supabase.rpc('get_users_needing_weekly_progress')

      if (error) {
        console.error('[EmailScheduler] Error fetching users for weekly progress:', error)
        results.errors.push(`Weekly progress query: ${error.message}`)
      } else if (users && users.length > 0) {
        console.log(`[EmailScheduler] Found ${users.length} users needing weekly progress`)

        for (const user of users) {
          try {
            const response = await fetch(`${appUrl}/api/email/weekly-progress`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                userId: user.user_id,
                email: user.email,
                weekNumber: user.week_number,
              }),
            })

            if (response.ok) {
              results.weeklyProgress++
              console.log(`[EmailScheduler] Weekly progress sent to ${user.email}`)
            } else {
              const error = await response.text()
              console.error(`[EmailScheduler] Failed to send weekly progress to ${user.email}:`, error)
              results.errors.push(`Weekly progress to ${user.email}: ${error}`)
            }
          } catch (error) {
            console.error(`[EmailScheduler] Error sending weekly progress to ${user.email}:`, error)
            results.errors.push(`Weekly progress to ${user.email}: ${error}`)
          }
        }
      } else {
        console.log('[EmailScheduler] No users need weekly progress (not Monday or no eligible users)')
      }
    } catch (error) {
      console.error('[EmailScheduler] Unexpected error in weekly progress section:', error)
      results.errors.push(`Weekly progress section: ${error}`)
    }

    // 3. Send re-engagement emails
    try {
      console.log('[EmailScheduler] Checking for re-engagement emails...')
      const { data: users, error } = await supabase.rpc('get_users_needing_reengagement')

      if (error) {
        console.error('[EmailScheduler] Error fetching users for re-engagement:', error)
        results.errors.push(`Re-engagement query: ${error.message}`)
      } else if (users && users.length > 0) {
        console.log(`[EmailScheduler] Found ${users.length} users needing re-engagement`)

        for (const user of users) {
          try {
            const response = await fetch(`${appUrl}/api/email/reengagement`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                userId: user.user_id,
                email: user.email,
              }),
            })

            if (response.ok) {
              results.reengagement++
              console.log(`[EmailScheduler] Re-engagement sent to ${user.email}`)
            } else {
              const error = await response.text()
              console.error(`[EmailScheduler] Failed to send re-engagement to ${user.email}:`, error)
              results.errors.push(`Re-engagement to ${user.email}: ${error}`)
            }
          } catch (error) {
            console.error(`[EmailScheduler] Error sending re-engagement to ${user.email}:`, error)
            results.errors.push(`Re-engagement to ${user.email}: ${error}`)
          }
        }
      } else {
        console.log('[EmailScheduler] No users need re-engagement')
      }
    } catch (error) {
      console.error('[EmailScheduler] Unexpected error in re-engagement section:', error)
      results.errors.push(`Re-engagement section: ${error}`)
    }

    console.log('[EmailScheduler] Scheduling process complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email scheduling complete',
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[EmailScheduler] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
