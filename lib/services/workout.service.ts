import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
}
