import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CycleCompletion, InsertCycleCompletion } from "@/lib/types/schemas";
import { calculateMuscleGroupVolumes } from "@/lib/utils/workout-helpers";
import type { Database } from "@/lib/types/database.types";

export interface CycleStats {
  totalVolume: number;
  totalWorkoutsCompleted: number;
  avgMentalReadiness: number | null;
  totalSets: number;
  totalDurationSeconds: number;
  volumeByMuscleGroup: Record<string, number>; // Despite name, this contains SETS count (legacy naming issue)
  setsByMuscleGroup: Record<string, number>; // Same data as volumeByMuscleGroup, semantically correct name
  workoutsByType: Record<string, number>;
}

export interface CycleComparison {
  volumeDelta: number; // Percentage change
  workoutsDelta: number; // Absolute change
  mentalReadinessDelta: number | null; // Absolute change
  setsDelta: number; // Absolute change
}

export class CycleStatsService {
  /**
   * Calculate statistics for the current cycle
   */
  static async calculateCycleStats(
    userId: string,
    splitPlanId: string
  ): Promise<CycleStats> {
    const supabase = await getSupabaseServerClient();

    // Get user profile to find when current cycle started
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("current_cycle_start_date")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to fetch user profile");
    }

    // If no start date, assume cycle just started (no workouts yet)
    const cycleStartDate = profile.current_cycle_start_date || new Date().toISOString();

    // Fetch all completed workouts for this cycle
    const { data: workouts, error: workoutsError } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .eq("split_plan_id", splitPlanId)
      .eq("status", "completed")
      .gte("completed_at", cycleStartDate)
      .order("completed_at", { ascending: true });

    if (workoutsError) {
      throw new Error(`Failed to fetch workouts: ${workoutsError.message}`);
    }

    type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
    const typedWorkouts = (workouts || []) as WorkoutRow[];

    if (typedWorkouts.length === 0) {
      // No workouts completed in this cycle yet
      return {
        totalVolume: 0,
        totalWorkoutsCompleted: 0,
        avgMentalReadiness: null,
        totalSets: 0,
        totalDurationSeconds: 0,
        volumeByMuscleGroup: {},
        setsByMuscleGroup: {},
        workoutsByType: {},
      };
    }

    // Calculate aggregated statistics
    const totalVolume = typedWorkouts.reduce(
      (sum: number, w: any) => sum + (w.total_volume || 0),
      0
    );
    const totalSets = typedWorkouts.reduce((sum: number, w: any) => sum + (w.total_sets || 0), 0);
    const totalDurationSeconds = typedWorkouts.reduce(
      (sum: number, w: any) => sum + (w.duration_seconds || 0),
      0
    );

    // Calculate average mental readiness
    const mentalReadinessValues = typedWorkouts
      .map((w: any) => w.mental_readiness_overall)
      .filter((mr: any): mr is number => mr !== null && mr !== undefined);
    const avgMentalReadiness =
      mentalReadinessValues.length > 0
        ? mentalReadinessValues.reduce((sum: number, mr: number) => sum + mr, 0) /
          mentalReadinessValues.length
        : null;

    // Calculate volume by muscle group
    // NOTE: Despite the name "volumeByMuscleGroup", calculateMuscleGroupVolumes() actually returns SETS count, not volume!
    // This is a known naming issue throughout the codebase.
    const volumeByMuscleGroup: Record<string, number> = {};
    for (const workout of typedWorkouts) {
      if (!workout.exercises || !Array.isArray(workout.exercises)) continue;

      const muscleVolumes = calculateMuscleGroupVolumes(workout.exercises as any);
      for (const [muscle, breakdown] of Object.entries(muscleVolumes)) {
        const totalSets = (breakdown.direct || 0) + (breakdown.indirect || 0);
        volumeByMuscleGroup[muscle] =
          (volumeByMuscleGroup[muscle] || 0) + totalSets;
      }
    }

    // Create setsByMuscleGroup with the same data (for clarity and to fix radar chart bug)
    // This is the correct semantic name for what the data actually represents
    const setsByMuscleGroup = { ...volumeByMuscleGroup };

    // Count workouts by type
    const workoutsByType: Record<string, number> = {};
    for (const workout of typedWorkouts) {
      if (workout.workout_type) {
        workoutsByType[workout.workout_type] =
          (workoutsByType[workout.workout_type] || 0) + 1;
      }
    }

    return {
      totalVolume,
      totalWorkoutsCompleted: typedWorkouts.length,
      avgMentalReadiness,
      totalSets,
      totalDurationSeconds,
      volumeByMuscleGroup,
      setsByMuscleGroup, // Same data as volumeByMuscleGroup, but with semantically correct name
      workoutsByType,
    };
  }

  /**
   * Get the last completed cycle for a user
   */
  static async getLastCycleCompletion(
    userId: string
  ): Promise<CycleCompletion | null> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("cycle_completions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No previous cycle completion found
      return null;
    }

    return data as CycleCompletion;
  }

  /**
   * Compare current cycle stats with the previous cycle
   */
  static async getComparisonWithPreviousCycle(
    currentStats: CycleStats,
    userId: string
  ): Promise<CycleComparison | null> {
    const lastCycle = await this.getLastCycleCompletion(userId);

    if (!lastCycle) {
      return null; // No previous cycle to compare with
    }

    // Calculate percentage change in volume
    const volumeDelta =
      lastCycle.total_volume > 0
        ? ((currentStats.totalVolume - lastCycle.total_volume) /
            lastCycle.total_volume) *
          100
        : 0;

    // Calculate absolute changes
    const workoutsDelta =
      currentStats.totalWorkoutsCompleted - lastCycle.total_workouts_completed;
    const setsDelta = currentStats.totalSets - lastCycle.total_sets;

    // Calculate mental readiness delta
    let mentalReadinessDelta: number | null = null;
    if (
      currentStats.avgMentalReadiness !== null &&
      lastCycle.avg_mental_readiness !== null
    ) {
      mentalReadinessDelta =
        currentStats.avgMentalReadiness - lastCycle.avg_mental_readiness;
    }

    return {
      volumeDelta,
      workoutsDelta,
      mentalReadinessDelta,
      setsDelta,
    };
  }

  /**
   * Save a completed cycle to the database
   */
  static async saveCycleCompletion(
    userId: string,
    splitPlanId: string,
    cycleNumber: number,
    stats: CycleStats
  ): Promise<CycleCompletion> {
    const supabase = await getSupabaseServerClient();

    const cycleCompletion: InsertCycleCompletion = {
      user_id: userId,
      split_plan_id: splitPlanId,
      cycle_number: cycleNumber,
      completed_at: new Date().toISOString(),
      total_volume: stats.totalVolume,
      total_workouts_completed: stats.totalWorkoutsCompleted,
      avg_mental_readiness: stats.avgMentalReadiness,
      total_sets: stats.totalSets,
      total_duration_seconds: stats.totalDurationSeconds,
      volume_by_muscle_group: stats.volumeByMuscleGroup,
      sets_by_muscle_group: stats.setsByMuscleGroup,
      workouts_by_type: stats.workoutsByType,
    };

    const { data, error } = await supabase
      .from("cycle_completions")
      .insert(cycleCompletion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save cycle completion: ${error.message}`);
    }

    return data as CycleCompletion;
  }

  /**
   * Get a specific cycle completion by ID
   */
  static async getCycleCompletion(
    cycleId: string
  ): Promise<CycleCompletion | null> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("cycle_completions")
      .select("*")
      .eq("id", cycleId)
      .single();

    if (error) {
      return null;
    }

    return data as CycleCompletion;
  }

  /**
   * Get all cycle completions for a user
   */
  static async getAllCycleCompletions(
    userId: string
  ): Promise<CycleCompletion[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("cycle_completions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cycle completions: ${error.message}`);
    }

    return (data || []) as CycleCompletion[];
  }
}
