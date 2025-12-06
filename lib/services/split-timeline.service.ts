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
import { getExerciseName } from "@/lib/utils/exercise-helpers";

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
 * Order matters: more specific patterns are checked first
 */
const EXERCISE_MUSCLE_PATTERNS: Record<string, string[]> = {
  // Shoulders - specific subdivisions (must be checked before generic patterns)
  shoulders_rear: ['rear delt', 'rear-delt', 'face pull', 'reverse fly', 'reverse pec deck'],
  shoulders_side: ['lateral raise', 'side raise', 'lateral delt', 'side delt'],
  shoulders_front: ['front raise', 'front delt', 'overhead press', 'military press', 'shoulder press'],
  // Chest - specific subdivisions (must be checked before generic chest)
  chest_upper: ['incline press', 'incline bench', 'incline fly', 'incline cable', 'upper chest', 'clavicular', 'upper-chest'],
  chest_lower: ['decline press', 'decline bench', 'decline fly', 'lower chest', 'high-to-low', 'dip', 'lower-chest'],
  // Chest - generic (fallback)
  chest: ['bench press', 'chest press', 'pec deck', 'chest fly', 'petto', 'dumbbell press'],
  // Triceps
  triceps: ['tricep', 'pushdown', 'pressdown', 'dip', 'skull crusher', 'skullcrusher', 'extension', 'kickback'],
  // Back
  back: ['row', 'deadlift', 'schiena'],
  lats: ['lat', 'pulldown', 'pull-up', 'pullup', 'pull up', 'chin', 'dorsali'],
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
   * Get muscle groups from exercise using structured data (primary approach)
   * Falls back to pattern matching for legacy workouts
   */
  private static getMuscleGroupsFromExercise(exercise: any): {
    primary: string[];
    secondary: string[];
  } {
    // Use structured muscle data if available (modern workouts from AI generation)
    if (exercise.primaryMuscles && Array.isArray(exercise.primaryMuscles)) {
      return {
        primary: exercise.primaryMuscles,
        secondary: exercise.secondaryMuscles || []
      };
    }

    // Fallback to pattern matching for legacy workouts or exercises without metadata
    const exerciseName = typeof exercise === 'string'
      ? exercise
      : (exercise.exerciseName || exercise.name || 'Unknown');

    const musclesFromPattern = this.getMuscleGroupsFromExerciseLegacy(exerciseName);

    return {
      primary: musclesFromPattern,
      secondary: []
    };
  }

  /**
   * Legacy pattern matching for muscle groups (fallback only)
   * Checks specific patterns first to avoid false matches
   */
  private static getMuscleGroupsFromExerciseLegacy(exerciseName: string): string[] {
    const nameLower = exerciseName.toLowerCase();
    const muscleGroups: Set<string> = new Set();

    // Word-based matching for chest subdivisions (more flexible than exact substring)
    // Check for "incline" + any chest indicator → chest_upper
    if (nameLower.includes('incline') &&
        (nameLower.includes('bench') || nameLower.includes('press') || nameLower.includes('fly'))) {
      muscleGroups.add('chest_upper');
    }

    // Check for "decline" OR "high-to-low" + chest indicators → chest_lower
    if ((nameLower.includes('decline') || nameLower.includes('high-to-low')) &&
        (nameLower.includes('bench') || nameLower.includes('press') || nameLower.includes('fly'))) {
      muscleGroups.add('chest_lower');
    }

    // Check for "close-grip" or "close grip" (triceps focus)
    if (nameLower.includes('close-grip') || nameLower.includes('close grip')) {
      muscleGroups.add('triceps');
    }

    // Define order: check most specific patterns first
    const muscleCheckOrder = [
      // Shoulders (specific subdivisions first)
      'shoulders_rear',
      'shoulders_side',
      'shoulders_front',
      // Chest (specific subdivisions first)
      'chest_upper',
      'chest_lower',
      // Then generic categories
      'chest',
      'triceps',
      'back',
      'lats',
      'traps',
      'biceps',
      'quads',
      'hamstrings',
      'glutes',
      'calves',
      'abs'
    ];

    // Check patterns in order
    for (const muscle of muscleCheckOrder) {
      const patterns = EXERCISE_MUSCLE_PATTERNS[muscle];
      if (patterns) {
        for (const pattern of patterns) {
          if (nameLower.includes(pattern)) {
            muscleGroups.add(muscle);
            break; // Found a match for this muscle, move to next
          }
        }
      }
    }

    // Fallback to generic categories if no specific match
    if (muscleGroups.size === 0) {
      if (nameLower.includes('push')) {
        muscleGroups.add('chest');
      } else if (nameLower.includes('pull')) {
        muscleGroups.add('back');
      } else if (nameLower.includes('leg')) {
        muscleGroups.add('quads');
      }
    }

    return Array.from(muscleGroups);
  }

  /**
   * Calculate actual volume per muscle group from completed workout
   * Optimized to use a single bulk query instead of N queries per exercise
   */
  static async calculateActualVolume(workout: Workout, supabase: any): Promise<Record<string, number>> {
    const volumeByMuscle: Record<string, number> = {};

    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      return volumeByMuscle;
    }

    const exercises = workout.exercises as any[];

    // Query sets_log for accurate set counts (includes all sets: warmup + working)
    // Consistent with workout recap which counts all completedSets
    const setsByExercise = new Map<string, number>();
    try {
      const { data: loggedSets, error } = await supabase
        .from('sets_log')
        .select('exercise_name')
        .eq('workout_id', workout.id)
        .eq('skipped', false);

      if (!error && loggedSets) {
        // Group by exercise_name and count (case-insensitive matching)
        for (const set of loggedSets) {
          const exerciseName = set.exercise_name?.toLowerCase().trim() || '';
          setsByExercise.set(exerciseName, (setsByExercise.get(exerciseName) || 0) + 1);
        }
      }
    } catch (err) {
      console.error('Failed to query sets_log for workout:', workout.id, err);
      // Fallback to JSON if query fails
      for (const exercise of exercises) {
        const name = getExerciseName(exercise);
        if (name === 'Unknown Exercise') continue;

        const completedSets = exercise.completedSets || exercise.sets || [];
        // Count all sets (warmup + working) for consistency with workout recap
        const actualSets = Array.isArray(completedSets) ? completedSets.length : 0;
        const normalizedName = name.toLowerCase().trim();
        setsByExercise.set(normalizedName, actualSets);
      }
    }

    // Now calculate volumes per muscle
    for (const exercise of exercises) {
      const name = getExerciseName(exercise);
      if (name === 'Unknown Exercise') continue;

      // Get muscle groups using structured data (primary + secondary)
      const muscleData = this.getMuscleGroupsFromExercise(exercise);

      // Get working sets from database (case-insensitive)
      const normalizedName = name.toLowerCase().trim();
      const actualSets = setsByExercise.get(normalizedName) || 0;

      // Add full volume to primary muscles
      for (const muscle of muscleData.primary) {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + actualSets;
      }

      // Add partial volume to secondary muscles (0.5x weight for accuracy)
      for (const muscle of muscleData.secondary) {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (actualSets * 0.5);
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
      const typedWorkouts = workouts as any[];
      for (const workout of typedWorkouts) {
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

    // Get user profile to find when current cycle started
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_cycle_start_date')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return new Map();
    }

    // If no start date, use split plan creation date as fallback
    let cycleStartDate = profile?.current_cycle_start_date;

    if (!cycleStartDate) {
      // Fallback: fetch split plan creation date
      const { data: splitPlan } = await supabase
        .from('split_plans')
        .select('created_at')
        .eq('id', splitPlanId)
        .single();

      cycleStartDate = splitPlan?.created_at || '2000-01-01T00:00:00.000Z';
    }

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'completed')
      .gte('completed_at', cycleStartDate)
      .order('completed_at', { ascending: false});

    if (error) {
      console.error('Failed to fetch completed workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      const typedWorkouts = workouts as any[];
      for (const workout of typedWorkouts) {
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
      const typedWorkouts = workouts as any[];
      for (const workout of typedWorkouts) {
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

    // Get user profile to find when current cycle started
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_cycle_start_date')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return new Map();
    }

    // If no start date, use split plan creation date as fallback
    let cycleStartDate = profile?.current_cycle_start_date;

    if (!cycleStartDate) {
      // Fallback: fetch split plan creation date
      const { data: splitPlan } = await supabase
        .from('split_plans')
        .select('created_at')
        .eq('id', splitPlanId)
        .single();

      cycleStartDate = splitPlan?.created_at || '2000-01-01T00:00:00.000Z';
    }

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlanId)
      .eq('status', 'completed')
      .gte('completed_at', cycleStartDate)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch completed workouts:', error);
      return new Map();
    }

    // Map workouts by cycle day
    const workoutMap = new Map<number, Workout>();

    if (workouts) {
      const typedWorkouts = workouts as any[];
      for (const workout of typedWorkouts) {
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

    // Check for completed workout BEFORE returning 'current'
    // This handles the case where a workout was just completed but cycle hasn't advanced yet
    if (day === currentCycleDay && hasCompletedWorkout) {
      return 'completed';
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
        const actualVolume = await this.calculateActualVolume(completedWorkout, supabase);
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
          workoutName: preGeneratedWorkout.workout_name || 'Workout',
          assignedByCoachId: preGeneratedWorkout.assigned_by_coach_id || null
        };
      } else if (hasInProgressWorkout && inProgressWorkout) {
        // In-progress workout should also be accessible
        dayData.preGeneratedWorkout = {
          id: inProgressWorkout.id,
          status: 'ready', // Show as ready since it's been started
          exercises: inProgressWorkout.exercises as any[] || [],
          workoutName: inProgressWorkout.workout_name || 'Workout',
          assignedByCoachId: inProgressWorkout.assigned_by_coach_id || null
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
        const actualVolume = await this.calculateActualVolume(completedWorkout, supabase);
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
          workoutName: preGeneratedWorkout.workout_name || 'Workout',
          assignedByCoachId: preGeneratedWorkout.assigned_by_coach_id || null
        };
      } else if (hasInProgressWorkout && inProgressWorkout) {
        // In-progress workout should also be accessible
        dayData.preGeneratedWorkout = {
          id: inProgressWorkout.id,
          status: 'ready', // Show as ready since it's been started
          exercises: inProgressWorkout.exercises as any[] || [],
          workoutName: inProgressWorkout.workout_name || 'Workout',
          assignedByCoachId: inProgressWorkout.assigned_by_coach_id || null
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
