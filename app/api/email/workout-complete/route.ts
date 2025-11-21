import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email.service';
import { ActivityService } from '@/lib/services/activity.service';

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
    const { workoutId } = body;

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    // Check if this is the user's first completed workout
    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (workoutsError) {
      console.error('Error fetching completed workouts:', workoutsError);
      return NextResponse.json(
        { error: 'Failed to check workout history' },
        { status: 500 }
      );
    }

    // Only send email if this is the first completed workout
    if (completedWorkouts && completedWorkouts.length === 1 && completedWorkouts[0].id === workoutId) {
      // Create first workout completion milestone
      await ActivityService.createMilestone(user.id, 'first_workout_complete', {
        workoutId: workoutId,
      });

      // Send first workout complete email
      const sent = await EmailService.sendFirstWorkoutCompleteEmail(
        user.id,
        user.email!,
        workoutId
      );

      return NextResponse.json({
        success: true,
        emailSent: sent,
        message: sent ? 'First workout complete email sent' : 'Email not sent (already sent or disabled)'
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: false,
      message: 'Not first workout - email not sent'
    });
  } catch (error) {
    console.error('Error in workout-complete email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
