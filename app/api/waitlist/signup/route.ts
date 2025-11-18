import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/services/email.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { email, firstName, trainingGoal, referrerCode } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingEntry } = await supabase
      .from('waitlist_entries')
      .select('id, email, referral_code, queue_position, invited_count, status')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEntry) {
      // Return existing entry instead of error (idempotent)
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        entry: {
          email: existingEntry.email,
          referralCode: existingEntry.referral_code,
          queuePosition: existingEntry.queue_position,
          invitedCount: existingEntry.invited_count,
          status: existingEntry.status,
        },
      })
    }

    // Find referrer if code provided
    let referrerId = null
    if (referrerCode) {
      const { data: referrer } = await supabase
        .from('waitlist_entries')
        .select('id')
        .eq('referral_code', referrerCode.toUpperCase())
        .single()

      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Generate referral code
    const { data: referralCode, error: refCodeError } = await supabase
      .rpc('generate_referral_code')

    if (refCodeError || !referralCode) {
      console.error('Error generating referral code:', refCodeError)
      return NextResponse.json(
        { error: 'Failed to generate referral code. Please try again.' },
        { status: 500 }
      )
    }

    // Insert new waitlist entry
    const { data: newEntry, error } = await supabase
      .from('waitlist_entries')
      .insert({
        email: email.toLowerCase(),
        first_name: firstName || null,
        training_goal: trainingGoal || null,
        referrer_id: referrerId,
        referral_code: referralCode,
      })
      .select('id, email, referral_code, queue_position, invited_count, status')
      .single()

    if (error) {
      console.error('Error creating waitlist entry:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    // Send emails (await to ensure they complete before function terminates)
    try {
      await Promise.all([
        // Get referrer email if exists
        referrerId
          ? supabase
              .from('waitlist_entries')
              .select('email')
              .eq('id', referrerId)
              .single()
              .then(({ data }) =>
                EmailService.sendAdminNotification(
                  {
                    ...newEntry,
                    first_name: firstName,
                    training_goal: trainingGoal,
                  },
                  data?.email
                )
              )
          : EmailService.sendAdminNotification({
              ...newEntry,
              first_name: firstName,
              training_goal: trainingGoal,
            }),
        // Send welcome email to user
        EmailService.sendWaitlistWelcome({
          ...newEntry,
          first_name: firstName,
          training_goal: trainingGoal,
        }),
      ])
      console.log('✅ Waitlist emails sent successfully')
    } catch (emailError) {
      console.error('❌ Error sending waitlist emails:', emailError)
      // Don't fail the request if emails fail - user is already in waitlist
    }

    return NextResponse.json({
      success: true,
      entry: {
        email: newEntry.email,
        referralCode: newEntry.referral_code,
        queuePosition: newEntry.queue_position,
        invitedCount: newEntry.invited_count,
        status: newEntry.status,
      },
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${newEntry.referral_code}`,
    })
  } catch (error) {
    console.error('Unexpected error in waitlist signup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
