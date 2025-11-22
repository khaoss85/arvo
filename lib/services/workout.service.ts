import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import {
  insertWorkoutSchema,
  updateWorkoutSchema,
  type Workout,
  type InsertWorkout,
  type UpdateWorkout,
} from "@/lib/types/schemas";
import { SplitPlanService } from "./split-plan.service";
import { SetLogService } from "./set-log.service";

export class WorkoutService {
  /**
   * Get workouts by user ID (client-side)
   */
  static async getByUserId(userId: string): Promise<Workout[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("planned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }

    return data as unknown as Workout[];
  }

  /**
   * Get workout by ID (client-side)
   */
  static async getById(id: string): Promise<Workout | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch workout: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Get upcoming workouts for user (client-side)
   */
  static async getUpcoming(userId: string, limit = 10): Promise<Workout[]> {
    const supabase = getSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("planned_at", today)
      .order("planned_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch upcoming workouts: ${error.message}`);
    }

    return data as unknown as Workout[];
  }

  /**
   * Get completed workouts for user (client-side)
   */
  static async getCompleted(userId: string, limit = 20): Promise<Workout[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("planned_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch completed workouts: ${error.message}`);
    }

    return data as unknown as Workout[];
  }

  /**
   * Create workout (client-side)
   */
  static async create(workout: InsertWorkout): Promise<Workout> {
    const validated = insertWorkoutSchema.parse(workout);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workout: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Create workout (server-side)
   * @param workout - Workout data to insert
   * @param supabaseClient - Optional Supabase client (defaults to server client). Use admin client for background workers.
   */
  static async createServer(
    workout: InsertWorkout,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<Workout> {
    const validated = insertWorkoutSchema.parse(workout);

    // Use provided client (admin for background workers) or fallback to server client
    const supabase = supabaseClient || await (async () => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      return await getSupabaseServerClient();
    })();

    const { data, error} = await supabase
      .from("workouts")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workout: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Update workout (client-side)
   */
  static async update(id: string, workout: UpdateWorkout): Promise<Workout> {
    const validated = updateWorkoutSchema.parse(workout);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      // @ts-ignore
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workout: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Mark workout as completed (client-side)
   */
  static async markCompleted(id: string): Promise<Workout> {
    return this.update(id, { completed: true });
  }

  /**
   * Delete workout (client-side)
   */
  static async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete workout: ${error.message}`);
    }
  }

  /**
   * Get workouts by user ID (server-side)
   * @param userId - User ID
   * @param supabaseClient - Optional Supabase client (defaults to server client)
   */
  static async getByUserIdServer(
    userId: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<Workout[]> {
    // Use provided client or fallback to server client
    const supabase = supabaseClient || await (async () => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      return await getSupabaseServerClient();
    })();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("planned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }

    return data as unknown as Workout[];
  }

  /**
   * Get workout by ID (server-side)
   * @param id - Workout ID
   * @param supabaseClient - Optional Supabase client (defaults to server client)
   */
  static async getByIdServer(
    id: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<Workout | null> {
    // Use provided client or fallback to server client
    const supabase = supabaseClient || await (async () => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      return await getSupabaseServerClient();
    })();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch workout: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Get current in-progress workout for user (client-side)
   * Used to resume interrupted workouts
   */
  static async getInProgressWorkout(userId: string): Promise<Workout | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .order("planned_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch in-progress workout: ${error.message}`);
    }

    return data as unknown as Workout | null;
  }

  /**
   * Get current in-progress workout for user (server-side)
   * Used to resume interrupted workouts
   * @param userId - User ID
   * @param supabaseClient - Optional Supabase client (defaults to server client)
   */
  static async getInProgressWorkoutServer(
    userId: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<Workout | null> {
    // Use provided client or fallback to server client
    const supabase = supabaseClient || await (async () => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      return await getSupabaseServerClient();
    })();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch in-progress workout: ${error.message}`);
    }

    return data as unknown as Workout | null;
  }

  /**
   * Save partial workout progress
   * Updates workout exercises with current state
   */
  static async savePartialProgress(
    workoutId: string,
    exercises: any[]
  ): Promise<Workout> {
    return this.update(workoutId, { exercises: exercises as any });
  }

  /**
   * Mark workout as started
   * Sets started_at timestamp if not already set
   */
  static async markAsStarted(id: string, startedAt?: string): Promise<Workout> {
    const supabase = getSupabaseBrowserClient();

    // Only update if started_at is not already set
    const { data: existing } = await supabase
      .from("workouts")
      .select("started_at")
      .eq("id", id)
      .single();

    if (existing?.started_at) {
      // Already started, return current state
      const workout = await this.getById(id);
      if (!workout) {
        throw new Error('Workout not found');
      }
      return workout;
    }

    const { data, error } = await supabase
      .from("workouts")
      .update({
        started_at: startedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'in_progress',
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark workout as started: ${error.message}`);
    }

    return data as unknown as Workout;
  }

  /**
   * Mark workout as completed with stats
   * Automatically advances cycle day if workout is part of a split plan
   */
  static async markAsCompletedWithStats(
    id: string,
    stats: {
      totalVolume?: number;
      duration?: number;
      totalSets?: number;
      completedAt?: Date;
      mentalReadinessOverall?: number;
      learnedTargetWeights?: Array<{
        exerciseName: string;
        targetWeight: number;
        updatedAt: string;
        confidence: 'low' | 'medium' | 'high';
      }>;
    }
  ): Promise<{ workout: Workout; warnings: string[] }> {
    console.log('[WorkoutService] Starting markAsCompletedWithStats', {
      workoutId: id,
      stats,
      timestamp: new Date().toISOString()
    });

    const supabase = getSupabaseBrowserClient();

    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid workout ID provided');
    }

    // Get workout to check if it exists and is split-based
    console.log('[WorkoutService] Fetching workout by ID:', id);
    let workout: Workout | null;
    try {
      workout = await this.getById(id);
    } catch (error) {
      console.error('[WorkoutService] Failed to fetch workout:', {
        workoutId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to fetch workout: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!workout) {
      console.error('[WorkoutService] Workout not found:', id);
      throw new Error(`Workout not found with ID: ${id}`);
    }

    console.log('[WorkoutService] Workout found:', {
      workoutId: id,
      userId: workout.user_id,
      completed: workout.completed,
      splitPlanId: workout.split_plan_id,
      approachId: workout.approach_id
    });

    // Check if already completed
    if (workout.completed) {
      console.warn('[WorkoutService] Workout already marked as completed:', id);
      return { workout, warnings: [] };
    }

    const updateData: any = {
      completed: true,
      completed_at: stats.completedAt ? stats.completedAt.toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'completed',
    };

    // Add optional stats if provided
    if (stats.totalVolume !== undefined) {
      updateData.total_volume = stats.totalVolume;
    }
    if (stats.duration !== undefined) {
      updateData.duration_seconds = stats.duration;
    }
    if (stats.totalSets !== undefined) {
      updateData.total_sets = stats.totalSets;
    }
    if (stats.mentalReadinessOverall !== undefined) {
      updateData.mental_readiness_overall = stats.mentalReadinessOverall;
    }
    if (stats.learnedTargetWeights !== undefined && stats.learnedTargetWeights.length > 0) {
      updateData.learned_target_weights = stats.learnedTargetWeights;
      console.log('[WorkoutService] Saving learned target weights:', {
        count: stats.learnedTargetWeights.length,
        exercises: stats.learnedTargetWeights.map(w => w.exerciseName)
      });
    }

    console.log('[WorkoutService] Updating workout with completion data:', {
      workoutId: id,
      updateFields: Object.keys(updateData),
      updateData
    });

    const { data, error } = await supabase
      .from("workouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('[WorkoutService] Database update failed:', {
        workoutId: id,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Provide specific error messages based on error code
      if (error.code === 'PGRST116') {
        throw new Error(`Workout not found in database: ${id}`);
      } else if (error.code === '42501' || error.message.includes('permission')) {
        throw new Error('Database permission denied. Please ensure you have access to update this workout.');
      } else {
        throw new Error(`Failed to mark workout as completed: ${error.message}`);
      }
    }

    const typedData = data as { completed_at?: string; [key: string]: any };

    console.log('[WorkoutService] Workout marked as completed successfully:', {
      workoutId: id,
      completed_at: typedData.completed_at
    });

    const warnings: string[] = [];

    // If this workout is part of a split plan, advance the cycle
    if (workout.split_plan_id && workout.user_id) {
      console.log('[WorkoutService] Workout is part of split plan, advancing cycle...', {
        splitPlanId: workout.split_plan_id,
        userId: workout.user_id,
        cycleDay: workout.cycle_day
      });

      try {
        // Pass the completed cycle_day to ensure accurate wrap-around detection
        await SplitPlanService.advanceCycle(workout.user_id, workout.cycle_day || undefined);
        console.log('[WorkoutService] Split plan cycle advanced successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[WorkoutService] Failed to advance split cycle:', {
          userId: workout.user_id,
          splitPlanId: workout.split_plan_id,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw - workout completion is more important than cycle advancement
        // The workout is already marked as completed, so we don't want to fail the entire operation
        // But we'll return a warning so the UI can inform the user
        warnings.push(`Failed to advance to next training day: ${errorMessage}`);
      }
    } else {
      console.log('[WorkoutService] Workout is not part of a split plan, skipping cycle advancement');
    }

    console.log('[WorkoutService] markAsCompletedWithStats completed successfully', {
      warnings: warnings.length > 0 ? warnings : 'none'
    });

    return {
      workout: typedData as unknown as Workout,
      warnings
    };
  }

  /**
   * Check if a workout is in "limbo" state (all sets completed but not finalized)
   * This can happen if user closed browser before completing the workout summary
   */
  static async isWorkoutInLimbo(workoutId: string): Promise<boolean> {
    try {
      const workout = await this.getById(workoutId);
      if (!workout || workout.status !== 'draft') {
        return false;
      }

      // Check if all sets are completed
      const sets = await SetLogService.getByWorkoutId(workoutId);
      if (sets.length === 0) {
        return false;
      }

      // Consider workout in limbo if it has sets logged but status is still draft
      // This indicates the user completed sets but never finalized the workout
      return sets.length > 0 && workout.status === 'draft';
    } catch (error) {
      console.error('[WorkoutService] Failed to check workout limbo state:', error);
      return false;
    }
  }

  /**
   * Update workout notes (user's free-form feedback)
   */
  static async updateWorkoutNotes(workoutId: string, notes: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from('workouts')
      .update({ user_notes: notes })
      .eq('id', workoutId);

    if (error) {
      console.error('[WorkoutService] Failed to update workout notes:', error);
      throw new Error(`Failed to update workout notes: ${error.message}`);
    }

    console.log('[WorkoutService] Workout notes updated successfully');
  }
}
