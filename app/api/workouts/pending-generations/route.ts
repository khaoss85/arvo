import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/workouts/pending-generations
 *
 * Returns all pending/in_progress workout generations for the current user
 *
 * Used by dashboard to:
 * - Check if there are ongoing generations when user returns
 * - Show progress indicators
 * - Resume progress tracking after page reload
 *
 * Returns: Array of generation queue entries with status pending or in_progress
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query workout_generation_queue for pending/in_progress entries
    const { data: pendingGenerations, error } = await supabase
      .from('workout_generation_queue')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[PendingGenerations] Error:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch pending generations',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(pendingGenerations || [])
  } catch (error: any) {
    console.error('[PendingGenerations] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch pending generations',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
