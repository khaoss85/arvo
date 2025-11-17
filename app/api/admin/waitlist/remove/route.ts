import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/auth.server'

export async function DELETE(request: NextRequest) {
  try {
    // Check admin permission
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entryId } = body

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get entry before deleting (for logging)
    const { data: entry } = await supabase
      .from('waitlist_entries')
      .select('email')
      .eq('id', entryId)
      .single()

    // Delete entry
    const { error: deleteError } = await supabase
      .from('waitlist_entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      console.error('Error deleting waitlist entry:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove entry' },
        { status: 500 }
      )
    }

    console.log('Removed waitlist entry:', entry?.email)

    return NextResponse.json({
      success: true,
      message: 'Entry removed from waitlist',
    })
  } catch (error) {
    console.error('Unexpected error in admin remove:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
