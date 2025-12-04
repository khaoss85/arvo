import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/utils/auth.server'

export async function GET(request: NextRequest) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const adminSupabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)

  // Parse params
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  const search = searchParams.get('search')
  const approachId = searchParams.get('approach')
  const dateRange = searchParams.get('dateRange') // '7d' | '30d' | '90d'

  try {
    // Build base query for users (use admin client to bypass RLS)
    let query = adminSupabase
      .from('users')
      .select(`
        id,
        email,
        role,
        created_at,
        user_profiles (
          first_name,
          approach_id
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    if (dateRange) {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      query = query.gte('created_at', fromDate.toISOString())
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('[Admin Users] Users query error:', usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const userIds = users.map(u => u.id)

    // Batch enrichment queries (parallel) - use admin client to bypass RLS
    const [approaches, workoutCounts, creditUsage, milestones, authData] = await Promise.all([
      // Get all approaches
      adminSupabase.from('training_approaches').select('id, name'),

      // Get workout counts per user
      adminSupabase.from('workouts')
        .select('user_id, status')
        .in('user_id', userIds),

      // Get credit usage per user
      adminSupabase.from('credit_usage')
        .select('user_id, credits_used')
        .in('user_id', userIds),

      // Get milestones per user
      adminSupabase.from('user_milestones')
        .select('user_id, milestone_type')
        .in('user_id', userIds),

      // Get auth data (last_sign_in_at) via RPC
      adminSupabase.rpc('get_users_auth_data', { user_ids: userIds }),
    ])

    // Build lookup maps
    const approachMap = new Map(approaches.data?.map(a => [a.id, a.name]) || [])

    // Filter by approach if specified (post-query filter since we need to check user_profiles)
    let filteredUsers = users
    if (approachId) {
      filteredUsers = users.filter(u => {
        const profile = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles
        return profile?.approach_id === approachId
      })
    }

    // Build enriched response
    const enrichedUsers = filteredUsers.map(user => {
      const profile = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles
      const userWorkouts = workoutCounts.data?.filter(w => w.user_id === user.id) || []
      const userCredits = creditUsage.data?.filter(c => c.user_id === user.id) || []
      const userMilestones = milestones.data?.filter(m => m.user_id === user.id) || []
      const authInfo = authData.data?.find((a: any) => a.user_id === user.id)

      const creditsConsumed = userCredits.reduce((sum, c) => sum + Number(c.credits_used), 0)

      return {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        firstName: profile?.first_name || null,
        createdAt: user.created_at,
        lastSignInAt: authInfo?.last_sign_in_at || null,
        approachId: profile?.approach_id || null,
        approachName: profile?.approach_id ? approachMap.get(profile.approach_id) || null : null,
        workoutsGenerated: userWorkouts.length,
        workoutsCompleted: userWorkouts.filter(w => w.status === 'completed').length,
        creditsConsumed: Math.round(creditsConsumed),
        milestonesCount: userMilestones.length,
        milestones: userMilestones.map(m => m.milestone_type),
      }
    })

    // Get unique approaches for filter dropdown
    const uniqueApproaches = Array.from(
      new Set(
        users
          .map(u => {
            const profile = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles
            return profile?.approach_id
          })
          .filter(Boolean)
      )
    ).map(id => ({
      id,
      name: approachMap.get(id as string) || 'Unknown',
    }))

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      approaches: uniqueApproaches,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[Admin Users] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
