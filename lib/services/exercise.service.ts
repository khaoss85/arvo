import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  insertExerciseSchema,
  updateExerciseSchema,
  type Exercise,
  type InsertExercise,
  type UpdateExercise,
} from "@/lib/types/schemas";

export class ExerciseService {
  /**
   * Get all exercises (client-side)
   */
  static async getAll(): Promise<Exercise[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    return data as Exercise[];
  }

  /**
   * Get exercise by ID (client-side)
   */
  static async getById(id: string): Promise<Exercise | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch exercise: ${error.message}`);
    }

    return data as Exercise;
  }

  /**
   * Get exercises by pattern (client-side)
   */
  static async getByPattern(pattern: string): Promise<Exercise[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("pattern", pattern)
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch exercises by pattern: ${error.message}`);
    }

    return data as Exercise[];
  }

  /**
   * Create exercise (client-side)
   */
  static async create(exercise: InsertExercise): Promise<Exercise> {
    const validated = insertExerciseSchema.parse(exercise);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercises")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exercise: ${error.message}`);
    }

    return data as Exercise;
  }

  /**
   * Update exercise (client-side)
   */
  static async update(id: string, exercise: UpdateExercise): Promise<Exercise> {
    const validated = updateExerciseSchema.parse(exercise);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercises")
      // @ts-ignore - Database types need to be regenerated after migration
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exercise: ${error.message}`);
    }

    return data as Exercise;
  }

  /**
   * Delete exercise (client-side)
   */
  static async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("exercises").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete exercise: ${error.message}`);
    }
  }

  /**
   * Get all exercises (server-side)
   */
  static async getAllServer(): Promise<Exercise[]> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    return data as Exercise[];
  }
}
