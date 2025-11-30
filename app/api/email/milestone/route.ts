import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { EmailService } from '@/lib/services/email.service';

interface WorkoutMilestoneUser {
  user_id: string;
  email: string;
  first_name: string;
  preferred_language: string;
  milestone_count: number;
  total_volume: number;
  favorite_exercise: string | null;
}

interface TimeMilestoneUser {
  user_id: string;
  email: string;
  first_name: string;
  preferred_language: string;
  months_active: number;
  total_workouts: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    let emailsSent = 0;
    const errors: string[] = [];

    // 1. Check workout count milestones (10, 25, 50, 100)
    const { data: workoutMilestoneUsers, error: workoutError } = await supabase.rpc(
      'get_users_reaching_workout_milestone'
    );

    if (workoutError) {
      console.error('Error fetching workout milestone users:', workoutError);
    } else if (workoutMilestoneUsers && workoutMilestoneUsers.length > 0) {
      for (const user of workoutMilestoneUsers as WorkoutMilestoneUser[]) {
        try {
          const sent = await EmailService.sendMilestoneEmail(
            user.user_id,
            user.email,
            user.first_name || 'there',
            'workout_count',
            user.milestone_count,
            {
              totalVolume: user.total_volume,
              favoriteExercise: user.favorite_exercise || undefined,
            }
          );

          if (sent) {
            emailsSent++;
          }
        } catch (err) {
          console.error(`Error sending workout milestone to ${user.email}:`, err);
          errors.push(user.email);
        }
      }
    }

    // 2. Check time-based milestones (1, 3, 6, 12 months)
    const { data: timeMilestoneUsers, error: timeError } = await supabase.rpc(
      'get_users_reaching_time_milestone'
    );

    if (timeError) {
      console.error('Error fetching time milestone users:', timeError);
    } else if (timeMilestoneUsers && timeMilestoneUsers.length > 0) {
      for (const user of timeMilestoneUsers as TimeMilestoneUser[]) {
        try {
          const sent = await EmailService.sendMilestoneEmail(
            user.user_id,
            user.email,
            user.first_name || 'there',
            'time_based',
            user.months_active,
            {
              totalWorkouts: user.total_workouts,
            }
          );

          if (sent) {
            emailsSent++;
          }
        } catch (err) {
          console.error(`Error sending time milestone to ${user.email}:`, err);
          errors.push(user.email);
        }
      }
    }

    const totalChecked =
      (workoutMilestoneUsers?.length || 0) + (timeMilestoneUsers?.length || 0);

    return NextResponse.json({
      success: true,
      emailsSent,
      workoutMilestones: workoutMilestoneUsers?.length || 0,
      timeMilestones: timeMilestoneUsers?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${emailsSent} milestone emails (checked ${totalChecked} users)`,
    });
  } catch (error) {
    console.error('Error in milestone endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
