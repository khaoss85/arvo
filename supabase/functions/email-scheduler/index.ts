// Supabase Edge Function: Email Scheduler
// Scheduled to run hourly to send automated emails
// Handles: first workout reminders, weekly progress, re-engagement,
//          PR digest, milestones, plateau detection

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
      prDigest: 0,
      milestones: 0,
      plateau: 0,
      errors: [] as string[],
    }

    const currentHour = new Date().getUTCHours()
    const currentDay = new Date().getUTCDay() // 0 = Sunday, 1 = Monday

    // 1. Send first workout reminders (every hour)
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

    // 3. Send re-engagement emails (every hour)
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

    // 4. Send PR digest emails (daily at 20:00 UTC)
    if (currentHour === 20) {
      try {
        console.log('[EmailScheduler] Sending PR digest emails (20:00 UTC)...')
        const response = await fetch(`${appUrl}/api/email/pr-digest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          results.prDigest = data.emailsSent || 0
          console.log(`[EmailScheduler] PR digest complete: ${results.prDigest} emails sent`)
        } else {
          const error = await response.text()
          console.error('[EmailScheduler] Failed to send PR digest:', error)
          results.errors.push(`PR digest: ${error}`)
        }
      } catch (error) {
        console.error('[EmailScheduler] Error in PR digest section:', error)
        results.errors.push(`PR digest section: ${error}`)
      }
    } else {
      console.log(`[EmailScheduler] Skipping PR digest (current hour: ${currentHour}, runs at 20:00 UTC)`)
    }

    // 5. Send milestone emails (daily at 10:00 UTC)
    if (currentHour === 10) {
      try {
        console.log('[EmailScheduler] Checking milestone emails (10:00 UTC)...')
        const response = await fetch(`${appUrl}/api/email/milestone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          results.milestones = data.emailsSent || 0
          console.log(`[EmailScheduler] Milestone check complete: ${results.milestones} emails sent`)
        } else {
          const error = await response.text()
          console.error('[EmailScheduler] Failed to check milestones:', error)
          results.errors.push(`Milestone check: ${error}`)
        }
      } catch (error) {
        console.error('[EmailScheduler] Error in milestone section:', error)
        results.errors.push(`Milestone section: ${error}`)
      }
    } else {
      console.log(`[EmailScheduler] Skipping milestone check (current hour: ${currentHour}, runs at 10:00 UTC)`)
    }

    // 6. Send plateau detection emails (weekly on Mondays at 10:00 UTC)
    if (currentDay === 1 && currentHour === 10) {
      try {
        console.log('[EmailScheduler] Checking plateau detection (Monday 10:00 UTC)...')
        const response = await fetch(`${appUrl}/api/email/plateau`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          results.plateau = data.emailsSent || 0
          console.log(`[EmailScheduler] Plateau check complete: ${results.plateau} emails sent`)
        } else {
          const error = await response.text()
          console.error('[EmailScheduler] Failed to check plateaus:', error)
          results.errors.push(`Plateau check: ${error}`)
        }
      } catch (error) {
        console.error('[EmailScheduler] Error in plateau section:', error)
        results.errors.push(`Plateau section: ${error}`)
      }
    } else {
      console.log(`[EmailScheduler] Skipping plateau check (day: ${currentDay}, hour: ${currentHour}, runs Monday 10:00 UTC)`)
    }

    console.log('[EmailScheduler] Scheduling process complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email scheduling complete',
        timestamp: new Date().toISOString(),
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
