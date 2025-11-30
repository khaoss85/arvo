import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { EmailService } from '@/lib/services/email.service';
import type { SupportedLanguage } from '@/lib/services/email-templates';

interface PRData {
  exerciseName: string;
  weight: number;
  reps: number;
  e1rm: number;
  previousE1rm: number;
  improvementPercent: number;
}

interface UserWithPRs {
  user_id: string;
  email: string;
  first_name: string;
  preferred_language: string;
  prs: PRData[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get all users who achieved PRs today
    const { data: usersWithPRs, error } = await supabase.rpc('get_users_with_prs_today');

    if (error) {
      console.error('Error fetching users with PRs:', error);
      return NextResponse.json({ error: 'Failed to fetch PR data' }, { status: 500 });
    }

    if (!usersWithPRs || usersWithPRs.length === 0) {
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'No users with PRs today',
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of usersWithPRs as unknown as UserWithPRs[]) {
      try {
        const sent = await EmailService.sendPRDigestEmail(
          user.user_id,
          user.email,
          user.first_name || 'there',
          user.prs,
          (user.preferred_language || 'en') as SupportedLanguage
        );

        if (sent) {
          emailsSent++;
        }
      } catch (err) {
        console.error(`Error sending PR digest to ${user.email}:`, err);
        errors.push(user.email);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: usersWithPRs.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${emailsSent} PR digest emails`,
    });
  } catch (error) {
    console.error('Error in PR digest endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
