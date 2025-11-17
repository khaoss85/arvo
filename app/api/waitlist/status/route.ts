import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const code = searchParams.get('code')

    if (!email && !code) {
      return NextResponse.json(
        { error: 'Email or referral code is required' },
        { status: 400 }
      )
    }

    // Fetch waitlist entry by email or code
    let query = supabase
      .from('waitlist_entries')
      .select(`
        id,
        email,
        referral_code,
        queue_position,
        invited_count,
        status,
        created_at,
        first_name,
        training_goal
      `)

    if (email) {
      query = query.eq('email', email.toLowerCase())
    } else if (code) {
      query = query.eq('referral_code', code.toUpperCase())
    }

    const { data: entry, error } = await query.single()

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404 }
      )
    }

    // Get total pending count for context
    const { count: totalPending } = await supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get referrals (people who joined via this person's code)
    const { data: referrals, count: referralsCount } = await supabase
      .from('waitlist_entries')
      .select('email, first_name, created_at, status', { count: 'exact' })
      .eq('referrer_id', entry.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      entry: {
        email: entry.email,
        firstName: entry.first_name,
        trainingGoal: entry.training_goal,
        referralCode: entry.referral_code,
        queuePosition: entry.queue_position,
        invitedCount: entry.invited_count,
        status: entry.status,
        createdAt: entry.created_at,
      },
      stats: {
        totalPending: totalPending || 0,
        referralsCount: referralsCount || 0,
        instantAccessAt: 5, // 5 invites = instant access
        topBoostAt: 3, // 3 invites = top 50
      },
      referrals: referrals?.map((r) => ({
        email: r.email,
        firstName: r.first_name,
        joinedAt: r.created_at,
        status: r.status,
      })) || [],
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${entry.referral_code}`,
    })
  } catch (error) {
    console.error('Unexpected error fetching waitlist status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
