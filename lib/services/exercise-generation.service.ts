import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertExerciseGenerationSchema,
  updateExerciseGenerationSchema,
  type ExerciseGeneration,
  type InsertExerciseGeneration,
  type UpdateExerciseGeneration,
} from "@/lib/types/schemas";

export interface ExerciseMetadata {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  movementPattern?: string;
  romEmphasis?: 'lengthened' | 'shortened' | 'full_range';
  unilateral?: boolean;
  equipmentUsed?: string[];
}

export class ExerciseGenerationService {
  /**
   * Find existing exercise by name (case-insensitive) or create new one
   * Ensures exercise naming consistency by reusing existing exercises
   */
  static async findOrCreate(
    name: string,
    metadata: ExerciseMetadata,
    userId?: string | null
  ): Promise<ExerciseGeneration> {
    const supabase = getSupabaseBrowserClient();

    // Try to find existing exercise by name (case-insensitive)
    const { data: existing, error: searchError } = await supabase
      .from("exercise_generations")
      .select("*")
      .ilike("name", name.trim())
      .or(`user_id.is.null${userId ? `,user_id.eq.${userId}` : ''}`)
      .order("usage_count", { ascending: false }) // Prefer most-used
      .limit(1)
      .single();

    if (existing && !searchError) {
      // Exercise exists - increment usage and return
      await this.incrementUsage(existing.id);
      return {
        ...existing,
        usage_count: (existing.usage_count || 0) + 1,
      } as ExerciseGeneration;
    }

    // Exercise doesn't exist - create new one
    const newExercise: InsertExerciseGeneration = {
      name: name.trim(),
      generated_by_ai: true,
      metadata: metadata as any,
      user_id: userId || null,
      usage_count: 1,
    };

    const validated = insertExerciseGenerationSchema.parse(newExercise);

    const { data, error } = await supabase
      .from("exercise_generations")
      .insert(validated as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exercise generation: ${error.message}`);
    }

    return data as ExerciseGeneration;
  }

  /**
   * Increment usage count and update last_used_at timestamp
   */
  static async incrementUsage(exerciseId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    // Get current usage count
    const { data: current } = await supabase
      .from("exercise_generations")
      .select("usage_count")
      .eq("id", exerciseId)
      .single();

    // Increment usage count and update timestamp
    const { error } = await supabase
      .from("exercise_generations")
      .update({
        usage_count: (current?.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", exerciseId);

    if (error) {
      console.error('Failed to increment exercise usage:', error);
    }
  }

  /**
   * Search exercises by name (fuzzy match)
   */
  static async searchByName(
    query: string,
    userId?: string | null,
    limit: number = 10
  ): Promise<ExerciseGeneration[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercise_generations")
      .select("*")
      .ilike("name", `%${query.trim()}%`)
      .or(`user_id.is.null${userId ? `,user_id.eq.${userId}` : ''}`)
      .order("usage_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search exercises: ${error.message}`);
    }

    return data as ExerciseGeneration[];
  }

  /**
   * Get recently used exercises for a user
   */
  static async getRecentlyUsed(
    userId: string | null,
    limit: number = 20
  ): Promise<ExerciseGeneration[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercise_generations")
      .select("*")
      .or(`user_id.is.null${userId ? `,user_id.eq.${userId}` : ''}`)
      .order("last_used_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recently used exercises: ${error.message}`);
    }

    return data as ExerciseGeneration[];
  }

  /**
   * Get exercise by ID
   */
  static async getById(id: string): Promise<ExerciseGeneration | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercise_generations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch exercise: ${error.message}`);
    }

    return data as ExerciseGeneration;
  }

  /**
   * Update exercise metadata
   */
  static async update(
    id: string,
    updates: UpdateExerciseGeneration
  ): Promise<ExerciseGeneration> {
    const validated = updateExerciseGenerationSchema.parse(updates);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("exercise_generations")
      .update(validated as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exercise: ${error.message}`);
    }

    return data as ExerciseGeneration;
  }

  /**
   * Delete exercise (user-created only)
   */
  static async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("exercise_generations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Can only delete own exercises

    if (error) {
      throw new Error(`Failed to delete exercise: ${error.message}`);
    }
  }

  /**
   * Server-side: find or create exercise
   */
  static async findOrCreateServer(
    name: string,
    metadata: ExerciseMetadata,
    userId?: string | null
  ): Promise<ExerciseGeneration> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Try to find existing exercise
    const { data: existing, error: searchError } = await supabase
      .from("exercise_generations")
      .select("*")
      .ilike("name", name.trim())
      .or(`user_id.is.null${userId ? `,user_id.eq.${userId}` : ''}`)
      .order("usage_count", { ascending: false })
      .limit(1)
      .single();

    if (existing && !searchError) {
      // Increment usage
      const { error: updateError } = await supabase
        .from("exercise_generations")
        .update({
          usage_count: (existing.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (!updateError) {
        return {
          ...existing,
          usage_count: (existing.usage_count || 0) + 1,
        } as ExerciseGeneration;
      }
    }

    // Create new exercise
    const newExercise: InsertExerciseGeneration = {
      name: name.trim(),
      generated_by_ai: true,
      metadata: metadata as any,
      user_id: userId || null,
      usage_count: 1,
    };

    const validated = insertExerciseGenerationSchema.parse(newExercise);

    const { data, error } = await supabase
      .from("exercise_generations")
      .insert(validated as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exercise generation: ${error.message}`);
    }

    return data as ExerciseGeneration;
  }
}
