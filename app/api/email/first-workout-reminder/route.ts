import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, workoutId } = body;

    if (!userId || !email || !workoutId) {
      return NextResponse.json(
        { error: 'userId, email, and workoutId are required' },
        { status: 400 }
      );
    }

    // Send first workout reminder email
    const sent = await EmailService.sendFirstWorkoutReminderEmail(
      userId,
      email,
      workoutId
    );

    return NextResponse.json({
      success: true,
      emailSent: sent,
      message: sent ? 'First workout reminder email sent' : 'Email not sent (already sent or disabled)'
    });
  } catch (error) {
    console.error('Error in first-workout-reminder email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
