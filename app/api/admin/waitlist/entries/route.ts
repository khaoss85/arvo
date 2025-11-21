import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/auth.server'
import type { Database } from '@/lib/types/database.types'

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') // pending | approved | converted
    const search = searchParams.get('search') // email search

    // Build query
    let query = supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: entries, error, count } = await query

    if (error) {
      console.error('Error fetching waitlist entries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    type WaitlistEntry = Database['public']['Tables']['waitlist_entries']['Row']
    const typedEntries = (entries || []) as WaitlistEntry[]

    // For each entry, get referrals count
    const entriesWithStats = await Promise.all(
      typedEntries.map(async (entry) => {
        const { count: referralsCount } = await supabase
          .from('waitlist_entries')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', entry.id)

        return {
          ...entry,
          referralsCount: referralsCount || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      entries: entriesWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Unexpected error in admin waitlist entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
