import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/auth.server'

export async function GET() {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const supabase = await getSupabaseServerClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    const [totalUsers, newUsersWeek, totalWorkouts, activeUsersData, totalCredits] = await Promise.all([
      // Total users count
      supabase.from('users').select('*', { count: 'exact', head: true }),

      // New users this week
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),

      // Total workouts generated
      supabase.from('workouts').select('*', { count: 'exact', head: true }),

      // Active users (with workout in last 30 days)
      supabase.from('workouts').select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Total credits consumed
      supabase.from('credit_usage').select('credits_used'),
    ])

    // Calculate unique active users
    const uniqueActiveUsers = new Set(activeUsersData.data?.map(w => w.user_id)).size

    // Calculate total credits
    const totalCreditsUsed = totalCredits.data?.reduce(
      (sum, row) => sum + Number(row.credits_used),
      0
    ) || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers.count || 0,
        activeUsers: uniqueActiveUsers,
        newUsersThisWeek: newUsersWeek.count || 0,
        totalWorkoutsGenerated: totalWorkouts.count || 0,
        totalCreditsUsed: Math.round(totalCreditsUsed),
      },
    })
  } catch (error) {
    console.error('[Admin Users Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
