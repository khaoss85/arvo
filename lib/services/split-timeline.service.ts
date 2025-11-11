import { SplitPlanService, type SessionDefinition } from "@/lib/services/split-plan.service";
import type { Workout } from "@/lib/types/schemas";
import type {
  DayStatus,
  VolumeComparison,
  CompletedWorkoutData,
  PreGeneratedWorkoutData,
  TimelineDayData,
  SplitTimelineData,
} from "@/lib/services/split-timeline.types";

// Re-export types for convenience
export type {
  DayStatus,
  VolumeComparison,
  CompletedWorkoutData,
  PreGeneratedWorkoutData,
  TimelineDayData,
  SplitTimelineData,
};

/**
 * Exercise pattern matching for muscle groups
 * Based on muscle-groups.service.ts patterns
 */
const EXERCISE_MUSCLE_PATTERNS: Record<string, string[]> = {
  // Chest
  chest: ['bench', 'press', 'fly', 'pec', 'chest', 'petto'],
  // Shoulders
  shoulders: ['shoulder', 'overhead', 'military', 'lateral', 'rear delt', 'spalle', 'delt'],
  // Triceps
  triceps: ['tricep', 'pushdown', 'dip', 'skull crusher', 'extension'],
  // Back
  back: ['row', 'deadlift', 'schiena', 'back'],
  lats: ['lat', 'pulldown', 'pull-up', 'pullup', 'chin', 'dorsali'],
  traps: ['trap', 'shrug'],
  // Biceps
  biceps: ['curl', 'bicep'],
  // Legs
  quads: ['squat', 'leg press', 'lunge', 'quad', 'leg extension'],
  hamstrings: ['leg curl', 'hamstring', 'romanian', 'rdl', 'stiff'],
  glutes: ['glute', 'hip thrust', 'bridge'],
  calves: ['calf', 'raise'],
  // Core
  abs: ['crunch', 'plank', 'ab', 'sit-up', 'sit up'],
};

/**
 * Service for managing split cycle timeline data
 */
export class SplitTimelineService {
  /**
   * Get muscle groups from exercise name
   */
  private static getMuscleGroupsFromExercise(exerciseName: string): string[] {
    const nameLower = exerciseName.toLowerCase();
    const muscleGroups: Set<string> = new Set();

    // Check each muscle group pattern
    for (const [muscle, patterns] of Object.entries(EXERCISE_MUSCLE_PATTERNS)) {
      for (const pattern of patterns) {
        if (nameLower.includes(pattern)) {
          muscleGroups.add(muscle);
        }
      }
    }

    // Fallback to generic categories if no specific match
    if (muscleGroups.size === 0) {
      if (nameLower.includes('push') || nameLower.includes('press')) {
        muscleGroups.add('chest');
      } else if (nameLower.includes('pull')) {
        muscleGroups.add('back');
      } else if (nameLower.includes('leg') || nameLower.includes('squat')) {
        muscleGroups.add('quads');
      }
    }

    return Array.from(muscleGroups);
  }

  /**
   * Calculate actual volume per muscle group from completed workout
   */
  static calculateActualVolume(workout: Workout): Record<string, number> {
    const volumeByMuscle: Record<string, number> = {};

    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      return volumeByMuscle;
    }

    const exercises = workout.exercises as any[];

    for (const exercise of exercises) {
      if (!exercise.name) continue;

      // Get muscle groups for this exercise
      const muscleGroups = this.getMuscleGroupsFromExercise(exercise.name);

      // Count completed sets
      const completedSets = exercise.completedSets || exercise.sets || [];
      const actualSets = Array.isArray(completedSets) ? completedSets.length : 0;

      // Add to each muscle group
      for (const muscle of muscleGroups) {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + actualSets;
      }
    }

    return volumeByMuscle;
  }

  /**
   * Compare target volume with actual volume
   */
  static calculateVariance(
    targetVolume: Record<string, number>,
    actualVolume: Record<string, number>
  ): Record<string, VolumeComparison> {
    const comparison: Record<string, VolumeComparison> = {};

    for (const [muscle, target] of Object.entries(targetVolume)) {
      const actual = actualVolume[muscle] || 0;
      const diff = actual - target;
      const percentage = target > 0 ? Math.round((diff / target) * 100) : 0;

      comparison[muscle] = { target, actual, diff, percentage };
    }

    return comparison;
  }

  /**
   * Get in-progress workout for current cycle (server-side)
   */
  static async getInProgressWorkoutForCycleServer(
    userId: string,
    splitPlanId: string
  ): Promise<Workout | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data: workout, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch in-progress workout:', error);
      return null;
    }

    return workout as unknown as Workout | null;
  }

  /**
   * Get pre-generated workouts for current cycle (server-side)
   */
  static async getPreGeneratedWorkoutsForCycleServer(
    userId: string,
    splitPlanId: string
  ): Promise<Map<number, Workout>> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .in('status', ['draft', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pre-generated workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      for (const workout of workouts) {
        const cycleDay = workout.cycle_day;
        if (cycleDay && !workoutMap.has(cycleDay)) {
          // Keep most recent workout for each cycle day
          workoutMap.set(cycleDay, workout as unknown as Workout);
        }
      }
    }

    return workoutMap;
  }

  /**
   * Get completed workouts for current cycle (server-side)
   */
  static async getCompletedWorkoutsForCycleServer(
    userId: string,
    splitPlanId: string
  ): Promise<Map<number, Workout>> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false});

    if (error) {
      console.error('Failed to fetch completed workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      for (const workout of workouts) {
        const cycleDay = workout.cycle_day;
        if (cycleDay && !workoutMap.has(cycleDay)) {
          // Keep most recent workout for each cycle day
          workoutMap.set(cycleDay, workout as unknown as Workout);
        }
      }
    }

    return workoutMap;
  }

  /**
   * Get in-progress workout for current cycle (client-side)
   */
  static async getInProgressWorkoutForCycle(
    userId: string,
    splitPlanId: string
  ): Promise<Workout | null> {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();

    const { data: workout, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch in-progress workout:', error);
      return null;
    }

    return workout as unknown as Workout | null;
  }

  /**
   * Get pre-generated workouts for current cycle (client-side)
   */
  static async getPreGeneratedWorkoutsForCycle(
    userId: string,
    splitPlanId: string
  ): Promise<Map<number, Workout>> {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .in('status', ['draft', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch pre-generated workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      for (const workout of workouts) {
        const cycleDay = workout.cycle_day;
        if (cycleDay && !workoutMap.has(cycleDay)) {
          // Keep most recent workout for each cycle day
          workoutMap.set(cycleDay, workout as unknown as Workout);
        }
      }
    }

    return workoutMap;
  }

  /**
   * Get completed workouts for current cycle (client-side)
   */
  static async getCompletedWorkoutsForCycle(
    userId: string,
    splitPlanId: string
  ): Promise<Map<number, Workout>> {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch completed workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      for (const workout of workouts) {
        const cycleDay = workout.cycle_day;
        if (cycleDay && !workoutMap.has(cycleDay)) {
          // Keep most recent workout for each cycle day
          workoutMap.set(cycleDay, workout as unknown as Workout);
        }
      }
    }

    return workoutMap;
  }

  /**
   * Determine day status based on current cycle day and session
   */
  private static getDayStatus(
    day: number,
    currentCycleDay: number,
    hasCompletedWorkout: boolean,
    hasPreGeneratedWorkout: boolean,
    hasInProgressWorkout: boolean,
    isRestDay: boolean
  ): DayStatus {
    // If this is the current day with an in-progress workout
    if (day === currentCycleDay && hasInProgressWorkout) {
      return 'in_progress';
    }

    if (day === currentCycleDay) {
      return 'current';
    }

    if (day < currentCycleDay || hasCompletedWorkout) {
      return 'completed';
    }

    if (isRestDay) {
      return 'rest';
    }

    if (hasPreGeneratedWorkout) {
      return 'pre_generated';
    }

    return 'upcoming';
  }

  /**
   * Get complete timeline data for user's active split (server-side)
   */
  static async getTimelineDataServer(userId: string): Promise<SplitTimelineData | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Get user profile with current cycle day
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_cycle_day, active_split_plan_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.active_split_plan_id) {
      return null;
    }

    // Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId);
    if (!splitPlan) {
      return null;
    }

    const currentCycleDay = profile.current_cycle_day || 1;
    const sessions = splitPlan.sessions as unknown as SessionDefinition[];

    // Get completed, pre-generated, and in-progress workouts for this cycle
    const [completedWorkoutsMap, preGeneratedWorkoutsMap, inProgressWorkout] = await Promise.all([
      this.getCompletedWorkoutsForCycleServer(userId, splitPlan.id),
      this.getPreGeneratedWorkoutsForCycleServer(userId, splitPlan.id),
      this.getInProgressWorkoutForCycleServer(userId, splitPlan.id)
    ]);

    // Build timeline data for each day in the cycle
    const days: TimelineDayData[] = [];

    for (let day = 1; day <= splitPlan.cycle_days; day++) {
      // Find session for this day
      const session = sessions.find(s => s.day === day) || null;
      const isRestDay = !session;

      // Check if this day has a completed workout
      const completedWorkout = completedWorkoutsMap.get(day);
      const hasCompletedWorkout = !!completedWorkout;

      // Check if this day has a pre-generated workout
      const preGeneratedWorkout = preGeneratedWorkoutsMap.get(day);
      const hasPreGeneratedWorkout = !!preGeneratedWorkout;

      // Check if this day has an in-progress workout
      const hasInProgressWorkout = inProgressWorkout?.cycle_day === day;

      // Determine status
      const status = this.getDayStatus(
        day,
        currentCycleDay,
        hasCompletedWorkout,
        hasPreGeneratedWorkout,
        hasInProgressWorkout,
        isRestDay
      );

      // Build day data
      const dayData: TimelineDayData = {
        day,
        status,
        session,
      };

      // Add completed workout data if exists
      if (completedWorkout && session) {
        const actualVolume = this.calculateActualVolume(completedWorkout);
        const variance = this.calculateVariance(session.targetVolume, actualVolume);

        dayData.completedWorkout = {
          id: completedWorkout.id,
          completedAt: completedWorkout.completed_at || '',
          actualVolume,
          variance,
        };
      }

      // Add pre-generated workout data if exists (includes in-progress)
      if (preGeneratedWorkout) {
        dayData.preGeneratedWorkout = {
          id: preGeneratedWorkout.id,
          status: preGeneratedWorkout.status as 'draft' | 'ready',
          exercises: preGeneratedWorkout.exercises as any[] || [],
          workoutName: preGeneratedWorkout.workout_name || 'Workout'
        };
      } else if (hasInProgressWorkout && inProgressWorkout) {
        // In-progress workout should also be accessible
        dayData.preGeneratedWorkout = {
          id: inProgressWorkout.id,
          status: 'ready', // Show as ready since it's been started
          exercises: inProgressWorkout.exercises as any[] || [],
          workoutName: inProgressWorkout.workout_name || 'Workout'
        };
      }

      days.push(dayData);
    }

    return {
      splitPlan,
      currentCycleDay,
      days,
    };
  }

  /**
   * Get complete timeline data for user's active split (client-side)
   */
  static async getTimelineData(userId: string): Promise<SplitTimelineData | null> {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();

    // Get user profile with current cycle day
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_cycle_day, active_split_plan_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.active_split_plan_id) {
      return null;
    }

    // Get active split plan
    const splitPlan = await SplitPlanService.getActive(userId);
    if (!splitPlan) {
      return null;
    }

    const currentCycleDay = profile.current_cycle_day || 1;
    const sessions = splitPlan.sessions as unknown as SessionDefinition[];

    // Get completed, pre-generated, and in-progress workouts for this cycle
    const [completedWorkoutsMap, preGeneratedWorkoutsMap, inProgressWorkout] = await Promise.all([
      this.getCompletedWorkoutsForCycle(userId, splitPlan.id),
      this.getPreGeneratedWorkoutsForCycle(userId, splitPlan.id),
      this.getInProgressWorkoutForCycle(userId, splitPlan.id)
    ]);

    // Build timeline data for each day in the cycle
    const days: TimelineDayData[] = [];

    for (let day = 1; day <= splitPlan.cycle_days; day++) {
      // Find session for this day
      const session = sessions.find(s => s.day === day) || null;
      const isRestDay = !session;

      // Check if this day has a completed workout
      const completedWorkout = completedWorkoutsMap.get(day);
      const hasCompletedWorkout = !!completedWorkout;

      // Check if this day has a pre-generated workout
      const preGeneratedWorkout = preGeneratedWorkoutsMap.get(day);
      const hasPreGeneratedWorkout = !!preGeneratedWorkout;

      // Check if this day has an in-progress workout
      const hasInProgressWorkout = inProgressWorkout?.cycle_day === day;

      // Determine status
      const status = this.getDayStatus(
        day,
        currentCycleDay,
        hasCompletedWorkout,
        hasPreGeneratedWorkout,
        hasInProgressWorkout,
        isRestDay
      );

      // Build day data
      const dayData: TimelineDayData = {
        day,
        status,
        session,
      };

      // Add completed workout data if exists
      if (completedWorkout && session) {
        const actualVolume = this.calculateActualVolume(completedWorkout);
        const variance = this.calculateVariance(session.targetVolume, actualVolume);

        dayData.completedWorkout = {
          id: completedWorkout.id,
          completedAt: completedWorkout.completed_at || '',
          actualVolume,
          variance,
        };
      }

      // Add pre-generated workout data if exists (includes in-progress)
      if (preGeneratedWorkout) {
        dayData.preGeneratedWorkout = {
          id: preGeneratedWorkout.id,
          status: preGeneratedWorkout.status as 'draft' | 'ready',
          exercises: preGeneratedWorkout.exercises as any[] || [],
          workoutName: preGeneratedWorkout.workout_name || 'Workout'
        };
      } else if (hasInProgressWorkout && inProgressWorkout) {
        // In-progress workout should also be accessible
        dayData.preGeneratedWorkout = {
          id: inProgressWorkout.id,
          status: 'ready', // Show as ready since it's been started
          exercises: inProgressWorkout.exercises as any[] || [],
          workoutName: inProgressWorkout.workout_name || 'Workout'
        };
      }

      days.push(dayData);
    }

    return {
      splitPlan,
      currentCycleDay,
      days,
    };
  }
}
