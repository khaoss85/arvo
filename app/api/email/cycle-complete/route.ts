import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cycleId } = body;

    if (!cycleId) {
      return NextResponse.json(
        { error: 'Cycle ID is required' },
        { status: 400 }
      );
    }

    // Verify cycle completion belongs to user
    const { data: cycleCompletion, error: cycleError } = await supabase
      .from('cycle_completions')
      .select('*')
      .eq('id', cycleId)
      .eq('user_id', user.id)
      .single();

    if (cycleError || !cycleCompletion) {
      console.error('Cycle completion not found:', cycleError);
      return NextResponse.json(
        { error: 'Cycle completion not found or unauthorized' },
        { status: 404 }
      );
    }

    // Send cycle complete email
    const sent = await EmailService.sendCycleCompleteEmail(
      user.id,
      user.email!,
      cycleId
    );

    return NextResponse.json({
      success: true,
      emailSent: sent,
      message: sent ? 'Cycle complete email sent' : 'Email not sent (already sent or disabled)'
    });
  } catch (error) {
    console.error('Error in cycle-complete email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
