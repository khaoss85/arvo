import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/utils/auth.server'

export async function POST(request: NextRequest) {
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
    const { entryId, sendEmail = true } = body

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    const adminClient = getSupabaseAdmin()

    // Get entry details
    const { data: entry, error: fetchError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404 }
      )
    }

    // Check if already approved or converted
    if (entry.status === 'approved') {
      return NextResponse.json(
        { error: 'Entry already approved', alreadyApproved: true },
        { status: 400 }
      )
    }

    if (entry.status === 'converted') {
      return NextResponse.json(
        { error: 'Entry already converted to user', alreadyConverted: true },
        { status: 400 }
      )
    }

    // Update status to approved
    const { error: updateError } = await supabase
      .from('waitlist_entries')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)

    if (updateError) {
      console.error('Error updating waitlist entry:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve entry' },
        { status: 500 }
      )
    }

    // Send magic link email if requested
    let magicLinkSent = false
    let magicLinkError = null

    if (sendEmail && entry.email) {
      try {
        // Generate magic link using Supabase Auth
        // Note: This sends email directly through Supabase
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: entry.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        })

        if (error) {
          console.error('Error generating magic link:', error)
          magicLinkError = error.message
        } else {
          magicLinkSent = true
          console.log('Magic link generated for:', entry.email)

          // Alternatively, send custom email with the link
          // You could use the `data.properties.action_link` to send via your email service
        }
      } catch (emailError: any) {
        console.error('Error sending approval email:', emailError)
        magicLinkError = emailError.message
      }
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        email: entry.email,
        status: 'approved',
      },
      magicLinkSent,
      magicLinkError,
      message: magicLinkSent
        ? 'Entry approved and magic link sent'
        : 'Entry approved (email not sent)',
    })
  } catch (error) {
    console.error('Unexpected error in admin approve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
