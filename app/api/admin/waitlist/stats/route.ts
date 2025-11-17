import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/auth.server'

export async function GET() {
  try {
    // Check admin permission
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get counts by status
    const [
      { count: totalPending },
      { count: totalApproved },
      { count: totalConverted },
      { count: totalEntries },
    ] = await Promise.all([
      supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted'),
      supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true }),
    ])

    // Get top referrers
    const { data: topReferrers } = await supabase
      .from('waitlist_entries')
      .select('email, first_name, invited_count, created_at')
      .order('invited_count', { ascending: false })
      .limit(10)

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentSignups } = await supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Calculate conversion rate
    const conversionRate =
      totalApproved && totalApproved > 0
        ? ((totalConverted || 0) / totalApproved) * 100
        : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalEntries: totalEntries || 0,
        totalPending: totalPending || 0,
        totalApproved: totalApproved || 0,
        totalConverted: totalConverted || 0,
        conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
        recentSignups: recentSignups || 0,
      },
      topReferrers: topReferrers || [],
    })
  } catch (error) {
    console.error('Unexpected error in admin waitlist stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
