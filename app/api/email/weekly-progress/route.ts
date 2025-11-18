import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, weekNumber } = body;

    if (!userId || !email || typeof weekNumber !== 'number') {
      return NextResponse.json(
        { error: 'userId, email, and weekNumber are required' },
        { status: 400 }
      );
    }

    // Send weekly progress email
    const sent = await EmailService.sendWeeklyProgressEmail(
      userId,
      email,
      weekNumber
    );

    return NextResponse.json({
      success: true,
      emailSent: sent,
      message: sent ? 'Weekly progress email sent' : 'Email not sent (already sent or disabled)'
    });
  } catch (error) {
    console.error('Error in weekly-progress email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
