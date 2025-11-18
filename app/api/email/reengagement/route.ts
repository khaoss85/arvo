import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Send re-engagement email
    const sent = await EmailService.sendReengagementEmail(
      userId,
      email
    );

    return NextResponse.json({
      success: true,
      emailSent: sent,
      message: sent ? 'Re-engagement email sent' : 'Email not sent (already sent or disabled)'
    });
  } catch (error) {
    console.error('Error in reengagement email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
