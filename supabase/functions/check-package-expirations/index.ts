// Supabase Edge Function: Check Package Expirations
// Scheduled to run daily to check for expiring packages and trigger notifications
// Also checks for packages that were completed quickly and creates upgrade suggestions

import { createClient } from 'jsr:@supabase/supabase-js@2'

interface ExpiringPackage {
  id: string
  coach_id: string
  client_id: string
  name: string
  end_date: string
  total_sessions: number
  sessions_used: number
}

interface CompletedPackage {
  id: string
  coach_id: string
  client_id: string
  total_sessions: number
  start_date: string
  updated_at: string
}

const EXPIRY_WARNING_DAYS = [7, 3, 1]
const FAST_USAGE_THRESHOLD_DAYS = 14

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[PackageExpirations] Starting package expiration check...')

    const results = {
      checked: 0,
      expirationAlerts: 0,
      upgradeSuggestions: 0,
      errors: [] as string[],
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // ============================================
    // PART 1: Check for expiring packages
    // ============================================

    // Get all active packages with end_date within 7 days
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: expiringPackages, error: expiringError } = await supabase
      .from('booking_packages')
      .select('id, coach_id, client_id, name, end_date, total_sessions, sessions_used')
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', sevenDaysFromNow.toISOString().split('T')[0])
      .gte('end_date', today.toISOString().split('T')[0])

    if (expiringError) {
      console.error('[PackageExpirations] Error fetching expiring packages:', expiringError)
      results.errors.push(`Fetch error: ${expiringError.message}`)
    } else {
      console.log(`[PackageExpirations] Found ${expiringPackages?.length || 0} potentially expiring packages`)

      for (const pkg of (expiringPackages || []) as ExpiringPackage[]) {
        results.checked++

        const sessionsRemaining = pkg.total_sessions - (pkg.sessions_used || 0)

        // Skip if no sessions remaining
        if (sessionsRemaining <= 0) continue

        const endDate = new Date(pkg.end_date)
        endDate.setHours(0, 0, 0, 0)
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Check if this matches one of our warning thresholds
        if (!EXPIRY_WARNING_DAYS.includes(daysRemaining)) continue

        // Check if we already sent a notification for this package today
        const dayStart = new Date(today)
        const { data: existingNotif } = await supabase
          .from('booking_notifications')
          .select('id')
          .eq('recipient_id', pkg.client_id)
          .eq('notification_type', 'package_expiring_soon')
          .gte('created_at', dayStart.toISOString())
          .limit(1)

        if (existingNotif && existingNotif.length > 0) {
          console.log(`[PackageExpirations] Already notified client ${pkg.client_id} today, skipping`)
          continue
        }

        // Queue expiration notification
        const { error: notifError } = await supabase
          .from('booking_notifications')
          .insert({
            booking_id: null,
            recipient_id: pkg.client_id,
            notification_type: 'package_expiring_soon',
            channel: 'in_app',
            scheduled_for: new Date().toISOString(),
            status: 'pending',
            metadata: {
              coach_id: pkg.coach_id,
              package_id: pkg.id,
              package_name: pkg.name,
              sessions_remaining: sessionsRemaining,
              days_until_expiry: daysRemaining,
            },
          })

        if (notifError) {
          console.error(`[PackageExpirations] Error creating notification for package ${pkg.id}:`, notifError)
          results.errors.push(`Notification error for ${pkg.id}: ${notifError.message}`)
        } else {
          results.expirationAlerts++
          console.log(`[PackageExpirations] Created expiration alert for package ${pkg.id} (${daysRemaining} days remaining)`)
        }
      }
    }

    // ============================================
    // PART 2: Check for completed packages that qualify for upgrade suggestion
    // ============================================

    // Get packages that were completed recently (sessions_used = total_sessions)
    // and don't already have an upgrade suggestion
    const { data: completedPackages, error: completedError } = await supabase
      .from('booking_packages')
      .select('id, coach_id, client_id, total_sessions, start_date, updated_at')
      .eq('status', 'active')
      .gte('total_sessions', 5) // Only for meaningful packages
      .filter('sessions_used', 'eq', supabase.rpc('total_sessions')) // sessions_used = total_sessions

    // Since the above filter won't work, let's do it differently
    const { data: allActivePackages, error: activeError } = await supabase
      .from('booking_packages')
      .select('id, coach_id, client_id, total_sessions, sessions_used, start_date, updated_at')
      .eq('status', 'active')
      .gte('total_sessions', 5)

    if (activeError) {
      console.error('[PackageExpirations] Error fetching active packages:', activeError)
      results.errors.push(`Active packages fetch error: ${activeError.message}`)
    } else {
      // Filter to only fully used packages
      const completedPkgs = (allActivePackages || []).filter(
        (p: any) => p.sessions_used >= p.total_sessions
      )

      console.log(`[PackageExpirations] Found ${completedPkgs.length} completed packages to check for upgrades`)

      for (const pkg of completedPkgs) {
        // Check if already has suggestion
        const { data: existingSuggestion } = await supabase
          .from('package_upgrade_suggestions')
          .select('id')
          .eq('package_id', pkg.id)
          .limit(1)

        if (existingSuggestion && existingSuggestion.length > 0) {
          continue // Already has a suggestion
        }

        // Calculate days to complete
        const startDate = new Date(pkg.start_date)
        const completedAt = new Date(pkg.updated_at)
        const daysToComplete = Math.ceil(
          (completedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Only suggest if completed fast
        if (daysToComplete >= FAST_USAGE_THRESHOLD_DAYS) {
          continue
        }

        // Calculate suggested package size
        const suggestedSessions = calculateSuggestedSize(pkg.total_sessions, daysToComplete)

        // Create upgrade suggestion
        const { error: suggestionError } = await supabase
          .from('package_upgrade_suggestions')
          .insert({
            coach_id: pkg.coach_id,
            client_id: pkg.client_id,
            package_id: pkg.id,
            reason: 'fast_usage',
            suggested_sessions: suggestedSessions,
            current_sessions: pkg.total_sessions,
            days_to_complete: daysToComplete,
            status: 'pending',
          })

        if (suggestionError) {
          // Could be duplicate, which is fine
          if (suggestionError.code !== '23505') {
            console.error(`[PackageExpirations] Error creating upgrade suggestion for package ${pkg.id}:`, suggestionError)
            results.errors.push(`Suggestion error for ${pkg.id}: ${suggestionError.message}`)
          }
        } else {
          results.upgradeSuggestions++
          console.log(`[PackageExpirations] Created upgrade suggestion for package ${pkg.id} (completed in ${daysToComplete} days)`)
        }
      }
    }

    console.log('[PackageExpirations] Processing complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Package expiration check complete',
        timestamp: new Date().toISOString(),
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[PackageExpirations] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function calculateSuggestedSize(currentSessions: number, daysToComplete: number): number {
  // Very fast usage (< 7 days): suggest 2x
  // Fast usage (< 14 days): suggest 1.5x
  const commonSizes = [5, 10, 15, 20, 30]
  const multiplier = daysToComplete < 7 ? 2 : 1.5
  const targetSize = Math.ceil(currentSessions * multiplier)

  // Find next common size that's >= target
  return commonSizes.find((size) => size >= targetSize) || targetSize
}
