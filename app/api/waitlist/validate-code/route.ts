import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    // Check if code exists
    const { data: entry, error } = await supabase
      .from('waitlist_entries')
      .select('id, first_name, invited_count, created_at')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (error || !entry) {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      code: code.toUpperCase(),
      referrer: {
        firstName: entry.first_name,
        invitedCount: entry.invited_count,
      },
    })
  } catch (error) {
    console.error('Unexpected error validating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
