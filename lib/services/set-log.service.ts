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

    // Query directly by exercise_name (case-insensitive)
    const { data, error } = await supabase
      .from("sets_log")
      .select("*, workouts!inner(user_id)")
      .ilike("exercise_name", exerciseName)
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

    // Remove the nested 'workouts' field and cast to SetLog type
    const setsOnly = data.map(({ workouts, ...set }) => set as SetLog);

    // Find the set with the highest volume (weight × reps)
    return setsOnly.reduce((best, current) => {
      const currentVolume =
        (current.weight_actual || 0) * (current.reps_actual || 0);
      const bestVolume = (best.weight_actual || 0) * (best.reps_actual || 0);

      return currentVolume > bestVolume ? current : best;
    });
  }

  /**
   * Create a skipped set log entry
   * Used when user skips warmup or other sets
   */
  static async createSkippedSet(params: {
    workout_id: string;
    exercise_id?: string;
    exercise_name: string;
    set_number: number;
    set_type: "warmup" | "working";
    skip_reason?: string;
  }): Promise<SetLog> {
    const setLog: InsertSetLog = {
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      exercise_name: params.exercise_name,
      set_number: params.set_number,
      set_type: params.set_type,
      skipped: true,
      skip_reason: params.skip_reason || null,
      // Skipped sets have no actual values
      weight_actual: null,
      reps_actual: null,
      rir_actual: null,
      weight_target: null,
      reps_target: null,
      notes: null,
      mental_readiness: null,
    };

    return this.create(setLog);
  }

  /**
   * Create multiple skipped set log entries
   * Useful for skipping all warmup sets at once
   */
  static async createSkippedSets(
    sets: Array<{
      workout_id: string;
      exercise_id?: string;
      exercise_name: string;
      set_number: number;
      set_type: "warmup" | "working";
      skip_reason?: string;
    }>
  ): Promise<SetLog[]> {
    const setLogs: InsertSetLog[] = sets.map((params) => ({
      workout_id: params.workout_id,
      exercise_id: params.exercise_id || null,
      exercise_name: params.exercise_name,
      set_number: params.set_number,
      set_type: params.set_type,
      skipped: true,
      skip_reason: params.skip_reason || null,
      weight_actual: null,
      reps_actual: null,
      rir_actual: null,
      weight_target: null,
      reps_target: null,
      notes: null,
      mental_readiness: null,
    }));

    return this.createMany(setLogs);
  }

  /**
   * Get skip analytics for a user
   * Returns statistics about warmup skip patterns
   */
  static async getSkipAnalytics(
    userId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      approachId?: string;
    }
  ): Promise<{
    totalSkipped: number;
    totalSets: number;
    skipRate: number;
    byReason: Record<string, number>;
    bySetType: Record<string, number>;
  }> {
    const supabase = getSupabaseBrowserClient();

    // Build query with filters
    let query = supabase
      .from("sets_log")
      .select("*, workouts!inner(user_id, approach_id, created_at)")
      .eq("workouts.user_id", userId);

    if (options?.startDate) {
      query = query.gte("workouts.created_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("workouts.created_at", options.endDate);
    }

    if (options?.approachId) {
      query = query.eq("workouts.approach_id", options.approachId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch skip analytics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalSkipped: 0,
        totalSets: 0,
        skipRate: 0,
        byReason: {},
        bySetType: {},
      };
    }

    // Calculate analytics
    // Cast to any to access new fields until Supabase types are regenerated
    const dataWithNewFields = data as any[];
    const totalSets = dataWithNewFields.length;
    const skippedSets = dataWithNewFields.filter((set) => set.skipped);
    const totalSkipped = skippedSets.length;
    const skipRate = totalSets > 0 ? (totalSkipped / totalSets) * 100 : 0;

    // Group by reason
    const byReason: Record<string, number> = {};
    skippedSets.forEach((set) => {
      const reason = set.skip_reason || "unknown";
      byReason[reason] = (byReason[reason] || 0) + 1;
    });

    // Group by set type
    const bySetType: Record<string, number> = {};
    skippedSets.forEach((set) => {
      const type = set.set_type || "unknown";
      bySetType[type] = (bySetType[type] || 0) + 1;
    });

    return {
      totalSkipped,
      totalSets,
      skipRate: Math.round(skipRate * 100) / 100, // Round to 2 decimals
      byReason,
      bySetType,
    };
  }

  /**
   * Get workout modifications summary (skipped sets + exercise substitutions)
   * This provides a compact view of all modifications made during the workout
   * @client-side
   */
  static async getWorkoutModifications(workoutId: string): Promise<{
    warmupSetsSkipped: number;
    workingSetsSkipped: number;
    totalSetsSkipped: number;
    exercisesSubstituted: number;
    substitutions: Array<{
      originalExercise: string;
      newExercise: string;
      reason: string | null;
    }>;
  }> {
    try {
      const supabase = getSupabaseBrowserClient();

      // Get all sets for this workout
      const { data: sets, error } = await supabase
        .from("sets_log")
        .select("*")
        .eq("workout_id", workoutId);

      if (error) {
        console.error('[SetLogService] Failed to fetch workout modifications:', error);
        // Return default values on error
        return {
          warmupSetsSkipped: 0,
          workingSetsSkipped: 0,
          totalSetsSkipped: 0,
          exercisesSubstituted: 0,
          substitutions: [],
        };
      }

    if (!sets) {
      return {
        warmupSetsSkipped: 0,
        workingSetsSkipped: 0,
        totalSetsSkipped: 0,
        exercisesSubstituted: 0,
        substitutions: [],
      };
    }

    // Count skipped sets by type
    const skippedSets = sets.filter((set) => set.skipped);
    const warmupSetsSkipped = skippedSets.filter((set) => set.set_type === "warmup").length;
    const workingSetsSkipped = skippedSets.filter((set) => set.set_type === "working").length;

    // Find exercise substitutions
    // Group by new exercise name to avoid duplicates (multiple sets of same substituted exercise)
    const substitutionMap = new Map<string, {
      originalExercise: string;
      newExercise: string;
      reason: string | null;
    }>();

    sets.forEach((set) => {
      if (set.original_exercise_name) {
        // This exercise was substituted
        const key = set.exercise_name; // Use new exercise name as key
        if (!substitutionMap.has(key)) {
          substitutionMap.set(key, {
            originalExercise: set.original_exercise_name,
            newExercise: set.exercise_name,
            reason: set.substitution_reason,
          });
        }
      }
    });

      const substitutions = Array.from(substitutionMap.values());

      return {
        warmupSetsSkipped,
        workingSetsSkipped,
        totalSetsSkipped: skippedSets.length,
        exercisesSubstituted: substitutions.length,
        substitutions,
      };
    } catch (error) {
      console.error('[SetLogService] Error in getWorkoutModifications:', error);
      // Return default values on exception
      return {
        warmupSetsSkipped: 0,
        workingSetsSkipped: 0,
        totalSetsSkipped: 0,
        exercisesSubstituted: 0,
        substitutions: [],
      };
    }
  }

  /**
   * Get workout modifications summary (server-side version)
   * This provides a compact view of all modifications made during the workout
   * @server-side
   */
  static async getWorkoutModificationsServer(workoutId: string): Promise<{
    warmupSetsSkipped: number;
    workingSetsSkipped: number;
    totalSetsSkipped: number;
    exercisesSubstituted: number;
    substitutions: Array<{
      originalExercise: string;
      newExercise: string;
      reason: string | null;
    }>;
  }> {
    try {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = await getSupabaseServerClient();

      // Get all sets for this workout
      const { data: sets, error } = await supabase
        .from("sets_log")
        .select("*")
        .eq("workout_id", workoutId);

      if (error) {
        console.error('[SetLogService] Failed to fetch workout modifications:', error);
        // Return default values on error
        return {
          warmupSetsSkipped: 0,
          workingSetsSkipped: 0,
          totalSetsSkipped: 0,
          exercisesSubstituted: 0,
          substitutions: [],
        };
      }

      if (!sets) {
        return {
          warmupSetsSkipped: 0,
          workingSetsSkipped: 0,
          totalSetsSkipped: 0,
          exercisesSubstituted: 0,
          substitutions: [],
        };
      }

      // Count skipped sets by type
      const skippedSets = sets.filter((set) => set.skipped);
      const warmupSetsSkipped = skippedSets.filter((set) => set.set_type === "warmup").length;
      const workingSetsSkipped = skippedSets.filter((set) => set.set_type === "working").length;

      // Find exercise substitutions
      // Group by new exercise name to avoid duplicates (multiple sets of same substituted exercise)
      const substitutionMap = new Map<string, {
        originalExercise: string;
        newExercise: string;
        reason: string | null;
      }>();

      sets.forEach((set) => {
        if (set.original_exercise_name) {
          // This exercise was substituted
          const key = set.exercise_name; // Use new exercise name as key
          if (!substitutionMap.has(key)) {
            substitutionMap.set(key, {
              originalExercise: set.original_exercise_name,
              newExercise: set.exercise_name,
              reason: set.substitution_reason,
            });
          }
        }
      });

      const substitutions = Array.from(substitutionMap.values());

      return {
        warmupSetsSkipped,
        workingSetsSkipped,
        totalSetsSkipped: skippedSets.length,
        exercisesSubstituted: substitutions.length,
        substitutions,
      };
    } catch (error) {
      console.error('[SetLogService] Error in getWorkoutModificationsServer:', error);
      // Return default values on exception
      return {
        warmupSetsSkipped: 0,
        workingSetsSkipped: 0,
        totalSetsSkipped: 0,
        exercisesSubstituted: 0,
        substitutions: [],
      };
    }
  }
}
