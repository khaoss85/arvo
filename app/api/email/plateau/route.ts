import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { EmailService } from '@/lib/services/email.service';

interface PlateauUser {
  user_id: string;
  email: string;
  first_name: string;
  preferred_language: string;
  exercise_name: string;
  current_e1rm: number;
  weeks_stuck: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get users with plateau on main lifts
    const { data: plateauUsers, error } = await supabase.rpc('get_users_with_plateau');

    if (error) {
      console.error('Error fetching plateau users:', error);
      return NextResponse.json({ error: 'Failed to fetch plateau data' }, { status: 500 });
    }

    if (!plateauUsers || plateauUsers.length === 0) {
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'No users with plateaus detected',
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of plateauUsers as PlateauUser[]) {
      try {
        const sent = await EmailService.sendPlateauDetectionEmail(
          user.user_id,
          user.email,
          user.first_name || 'there',
          user.exercise_name,
          user.current_e1rm,
          user.weeks_stuck
        );

        if (sent) {
          emailsSent++;
        }
      } catch (err) {
        console.error(`Error sending plateau email to ${user.email}:`, err);
        errors.push(user.email);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: plateauUsers.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${emailsSent} plateau detection emails`,
    });
  } catch (error) {
    console.error('Error in plateau endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
