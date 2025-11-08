import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
}
