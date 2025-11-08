import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertWorkoutSchema,
  updateWorkoutSchema,
  type Workout,
  type InsertWorkout,
  type UpdateWorkout,
} from "@/lib/types/schemas";

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

    return data as Workout[];
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

    return data as Workout;
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

    return data as Workout[];
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
      .eq("completed", true)
      .order("planned_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch completed workouts: ${error.message}`);
    }

    return data as Workout[];
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

    return data as Workout;
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

    return data as Workout;
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
   */
  static async getByUserIdServer(userId: string): Promise<Workout[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("planned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }

    return data as Workout[];
  }

  /**
   * Get workout by ID (server-side)
   */
  static async getByIdServer(id: string): Promise<Workout | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

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

    return data as Workout;
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

    return data as Workout | null;
  }

  /**
   * Get current in-progress workout for user (server-side)
   * Used to resume interrupted workouts
   */
  static async getInProgressWorkoutServer(userId: string): Promise<Workout | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

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

    return data as Workout | null;
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
  static async markAsStarted(id: string): Promise<Workout> {
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
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark workout as started: ${error.message}`);
    }

    return data as Workout;
  }

  /**
   * Mark workout as completed with stats
   */
  static async markAsCompletedWithStats(
    id: string,
    stats: {
      totalVolume?: number;
      duration?: number;
      totalSets?: number;
      completedAt?: Date;
    }
  ): Promise<Workout> {
    const supabase = getSupabaseBrowserClient();

    const updateData: any = {
      completed: true,
      completed_at: stats.completedAt ? stats.completedAt.toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    const { data, error } = await supabase
      .from("workouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark workout as completed: ${error.message}`);
    }

    return data as Workout;
  }
}
