import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
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

    const supabase = getSupabaseAdmin()

    // Get entry before deleting (for logging and to check if converted)
    const { data: entry } = await supabase
      .from('waitlist_entries')
      .select('email, status, converted_user_id')
      .eq('id', entryId)
      .single()

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    // If user has converted (has an auth account), delete the full account first
    // This will CASCADE delete all user data (profiles, workouts, etc.)
    if (entry.status === 'converted' && entry.converted_user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        entry.converted_user_id
      )

      if (authDeleteError) {
        console.error('Error deleting user account:', authDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete user account' },
          { status: 500 }
        )
      }

      console.log('Deleted user account:', entry.email, entry.converted_user_id)
    }

    // Delete waitlist entry
    const { error: deleteError } = await supabase
      .from('waitlist_entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      console.error('Error deleting waitlist entry:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove waitlist entry' },
        { status: 500 }
      )
    }

    console.log('Removed waitlist entry:', entry.email)

    return NextResponse.json({
      success: true,
      message: entry.status === 'converted'
        ? 'User account and waitlist entry removed'
        : 'Entry removed from waitlist',
    })
  } catch (error) {
    console.error('Unexpected error in admin remove:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
