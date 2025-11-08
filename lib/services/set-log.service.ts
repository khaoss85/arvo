import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertSetLogSchema,
  updateSetLogSchema,
  type SetLog,
  type InsertSetLog,
  type UpdateSetLog,
} from "@/lib/types/schemas";

export class SetLogService {
  /**
   * Get sets by workout ID (client-side)
   */
  static async getByWorkoutId(workoutId: string): Promise<SetLog[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      .select("*")
      .eq("workout_id", workoutId)
      .order("set_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sets: ${error.message}`);
    }

    return data as SetLog[];
  }

  /**
   * Get sets by exercise ID (client-side)
   */
  static async getByExerciseId(exerciseId: string): Promise<SetLog[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      .select("*")
      .eq("exercise_id", exerciseId)
      .order("set_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sets: ${error.message}`);
    }

    return data as SetLog[];
  }

  /**
   * Get set by ID (client-side)
   */
  static async getById(id: string): Promise<SetLog | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch set: ${error.message}`);
    }

    return data as SetLog;
  }

  /**
   * Create set log (client-side)
   */
  static async create(setLog: InsertSetLog): Promise<SetLog> {
    const validated = insertSetLogSchema.parse(setLog);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create set log: ${error.message}`);
    }

    return data as SetLog;
  }

  /**
   * Create multiple set logs (client-side)
   */
  static async createMany(setLogs: InsertSetLog[]): Promise<SetLog[]> {
    const validated = setLogs.map((log) => insertSetLogSchema.parse(log));
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      // @ts-ignore
      .insert(validated)
      .select();

    if (error) {
      throw new Error(`Failed to create set logs: ${error.message}`);
    }

    return data as SetLog[];
  }

  /**
   * Update set log (client-side)
   */
  static async update(id: string, setLog: UpdateSetLog): Promise<SetLog> {
    const validated = updateSetLogSchema.parse(setLog);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      // @ts-ignore
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update set log: ${error.message}`);
    }

    return data as SetLog;
  }

  /**
   * Delete set log (client-side)
   */
  static async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("sets_log").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete set log: ${error.message}`);
    }
  }

  /**
   * Delete all sets for a workout (client-side)
   */
  static async deleteByWorkoutId(workoutId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("sets_log")
      .delete()
      .eq("workout_id", workoutId);

    if (error) {
      throw new Error(`Failed to delete workout sets: ${error.message}`);
    }
  }

  /**
   * Get sets by workout ID (server-side)
   */
  static async getByWorkoutIdServer(workoutId: string): Promise<SetLog[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("sets_log")
      .select("*")
      .eq("workout_id", workoutId)
      .order("set_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch sets: ${error.message}`);
    }

    return data as SetLog[];
  }

  /**
   * Get last performance for a specific exercise (by name)
   * Used to show progression and calculate AI suggestions
   */
  static async getLastPerformance(
    userId: string,
    exerciseName: string
  ): Promise<SetLog | null> {
    const supabase = getSupabaseBrowserClient();

    // First, get the exercise ID by name
    const { data: exercise } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", exerciseName)
      .single();

    if (!exercise) {
      return null;
    }

    // Get the most recent set for this exercise by this user
    const { data, error } = await supabase
      .from("sets_log")
      .select("*, workouts!inner(user_id)")
      .eq("exercise_id", exercise.id)
      .eq("workouts.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch last performance: ${error.message}`);
    }

    return data as SetLog | null;
  }

  /**
   * Calculate total volume (weight × reps) for a workout
   */
  static async calculateWorkoutVolume(workoutId: string): Promise<number> {
    const sets = await this.getByWorkoutId(workoutId);

    return sets.reduce((total, set) => {
      const weight = set.weight_actual || 0;
      const reps = set.reps_actual || 0;
      return total + weight * reps;
    }, 0);
  }

  /**
   * Get personal records for an exercise
   * Returns the best set by volume (weight × reps)
   */
  static async getPersonalRecords(
    userId: string,
    exerciseId: string
  ): Promise<SetLog | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("sets_log")
      .select("*, workouts!inner(user_id)")
      .eq("exercise_id", exerciseId)
      .eq("workouts.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch personal records: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find the set with the highest volume (weight × reps)
    return data.reduce((best, current) => {
      const currentVolume =
        (current.weight_actual || 0) * (current.reps_actual || 0);
      const bestVolume = (best.weight_actual || 0) * (best.reps_actual || 0);

      return currentVolume > bestVolume ? current : best;
    }) as SetLog;
  }
}
