import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertSplitPlanSchema,
  updateSplitPlanSchema,
  type SplitPlan,
  type InsertSplitPlan,
  type UpdateSplitPlan,
} from "@/lib/types/schemas";
import { CycleStatsService } from "@/lib/services/cycle-stats.service";

export interface SessionDefinition {
  day: number; // Position in cycle (1 to cycle_days)
  name: string; // e.g., "Push A", "Pull B", "Legs A"
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body';
  variation: 'A' | 'B';
  focus: string[]; // Muscle groups emphasized
  targetVolume: Record<string, number>; // Sets per muscle group in this session
  principles: string[]; // Key principles for this session
  exampleExercises?: string[]; // Optional example exercises
}

export class SplitPlanService {
  /**
   * Create a new split plan and set it as active
   */
  static async create(plan: InsertSplitPlan): Promise<SplitPlan> {
    const validated = insertSplitPlanSchema.parse(plan);
    const supabase = getSupabaseBrowserClient();

    // Deactivate all other plans for this user first
    await this.deactivateAll(plan.user_id);

    // Create new active plan
    const { data, error } = await supabase
      .from("split_plans")
      .insert({ ...validated, active: true } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan: ${error.message}`);
    }

    // Update user profile with active split plan
    await supabase
      .from("user_profiles")
      .update({
        active_split_plan_id: data.id,
        current_cycle_day: 1, // Start at day 1
      })
      .eq("user_id", plan.user_id);

    return data as SplitPlan;
  }

  /**
   * Get active split plan for a user
   */
  static async getActive(userId: string): Promise<SplitPlan | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No active plan found
      }
      throw new Error(`Failed to fetch active split plan: ${error.message}`);
    }

    return data as SplitPlan;
  }

  /**
   * Get session definition for a specific cycle day
   */
  static getSessionForDay(
    splitPlan: SplitPlan,
    cycleDay: number
  ): SessionDefinition | null {
    const sessions = splitPlan.sessions as unknown as SessionDefinition[];

    // cycleDay is 1-indexed (1 to cycle_days)
    const session = sessions.find(s => s.day === cycleDay);

    if (!session) {
      console.error(`No session found for cycle day ${cycleDay}`);
      return null;
    }

    return session;
  }

  /**
   * Get next workout for user based on current cycle day (server-safe version)
   */
  static async getNextWorkoutServer(userId: string): Promise<{
    session: SessionDefinition;
    splitPlan: SplitPlan;
    cycleDay: number;
  } | null> {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Get user profile with current cycle day
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("current_cycle_day, active_split_plan_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.active_split_plan_id) {
      return null;
    }

    // Get active split plan
    const { data: splitPlan, error: planError } = await supabase
      .from("split_plans")
      .select("*")
      .eq("id", profile.active_split_plan_id)
      .single();

    if (planError || !splitPlan) {
      return null;
    }

    const cycleDay = profile.current_cycle_day || 1;
    const session = this.getSessionForDay(splitPlan as SplitPlan, cycleDay);

    if (!session) {
      return null;
    }

    return {
      session,
      splitPlan: splitPlan as SplitPlan,
      cycleDay,
    };
  }

  /**
   * Get next workout for user based on current cycle day
   */
  static async getNextWorkout(userId: string): Promise<{
    session: SessionDefinition;
    splitPlan: SplitPlan;
    cycleDay: number;
  } | null> {
    const supabase = getSupabaseBrowserClient();

    // Get user profile with current cycle day
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("current_cycle_day, active_split_plan_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.active_split_plan_id) {
      return null;
    }

    // Get active split plan
    const { data: splitPlan, error: planError } = await supabase
      .from("split_plans")
      .select("*")
      .eq("id", profile.active_split_plan_id)
      .single();

    if (planError || !splitPlan) {
      return null;
    }

    const cycleDay = profile.current_cycle_day || 1;
    const session = this.getSessionForDay(splitPlan as SplitPlan, cycleDay);

    if (!session) {
      return null;
    }

    return {
      session,
      splitPlan: splitPlan as SplitPlan,
      cycleDay,
    };
  }

  /**
   * Advance user to next cycle day
   */
  static async advanceCycle(userId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient();

    console.log('[SplitPlanService] advanceCycle - Starting for userId:', userId);

    // Get current state
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("current_cycle_day, active_split_plan_id, current_cycle_start_date, cycles_completed")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error('[SplitPlanService] advanceCycle - Failed to fetch profile:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    if (!profile?.active_split_plan_id) {
      console.error('[SplitPlanService] advanceCycle - No active split plan found');
      throw new Error("No active split plan found");
    }

    console.log('[SplitPlanService] advanceCycle - Current state:', {
      currentDay: profile.current_cycle_day,
      activeSplitPlanId: profile.active_split_plan_id
    });

    const { data: splitPlan, error: planError } = await supabase
      .from("split_plans")
      .select("cycle_days")
      .eq("id", profile.active_split_plan_id)
      .single();

    if (planError) {
      console.error('[SplitPlanService] advanceCycle - Failed to fetch split plan:', planError);
      throw new Error(`Failed to fetch split plan: ${planError.message}`);
    }

    if (!splitPlan) {
      console.error('[SplitPlanService] advanceCycle - Split plan not found');
      throw new Error("Split plan not found");
    }

    // Calculate next cycle day (wraps around)
    const currentDay = profile.current_cycle_day || 1;
    const nextDay = currentDay >= splitPlan.cycle_days ? 1 : currentDay + 1;
    const wrappedAround = nextDay === 1 && currentDay >= splitPlan.cycle_days;

    console.log('[SplitPlanService] advanceCycle - Advancing:', {
      from: currentDay,
      to: nextDay,
      totalCycleDays: splitPlan.cycle_days,
      wrappedAround
    });

    // Handle cycle advancement
    if (wrappedAround) {
      console.log('[SplitPlanService] advanceCycle - Cycle completing, using atomic transaction...');

      try {
        // Calculate cycle statistics using CycleStatsService
        const stats = await CycleStatsService.calculateCycleStats(
          userId,
          profile.active_split_plan_id!
        );

        const cycleNumber = (profile.cycles_completed || 0) + 1;

        // Use atomic RPC function to complete cycle (inserts completion + updates profile)
        const { data: result, error: rpcError } = await supabase.rpc('complete_cycle', {
          p_user_id: userId,
          p_split_plan_id: profile.active_split_plan_id!,
          p_cycle_number: cycleNumber,
          p_next_cycle_day: nextDay,
          p_total_volume: stats.totalVolume,
          p_total_workouts_completed: stats.totalWorkoutsCompleted,
          p_avg_mental_readiness: stats.avgMentalReadiness ?? 0,
          p_total_sets: stats.totalSets,
          p_total_duration_seconds: stats.totalDurationSeconds,
          p_volume_by_muscle_group: stats.volumeByMuscleGroup,
          p_workouts_by_type: stats.workoutsByType,
        });

        const typedResult = result as { success: boolean; error?: string } | null;

        if (rpcError || !typedResult?.success) {
          const errorMsg = typedResult?.error || rpcError?.message || 'Unknown error';
          console.error('[SplitPlanService] advanceCycle - Atomic completion failed:', errorMsg);
          throw new Error(`Failed to complete cycle atomically: ${errorMsg}`);
        }

        console.log('[SplitPlanService] advanceCycle - Cycle completion saved atomically:', result);
      } catch (error) {
        console.error('[SplitPlanService] advanceCycle - Error in atomic cycle completion:', error);
        throw error; // Throw to prevent inconsistent state
      }
    } else {
      // Normal cycle advancement (not wrapping around)
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ current_cycle_day: nextDay })
        .eq("user_id", userId);

      if (updateError) {
        console.error('[SplitPlanService] advanceCycle - Failed to update profile:', updateError);
        throw new Error(`Failed to advance cycle: ${updateError.message}`);
      }
    }

    console.log('[SplitPlanService] advanceCycle - Successfully advanced to day:', nextDay);
    return nextDay;
  }

  /**
   * Deactivate all split plans for a user
   */
  static async deactivateAll(userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("split_plans")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("active", true);

    if (error) {
      console.error("Failed to deactivate split plans:", error);
    }
  }

  /**
   * Update split plan
   */
  static async update(
    id: string,
    updates: UpdateSplitPlan
  ): Promise<SplitPlan> {
    const validated = updateSplitPlanSchema.parse(updates);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plans")
      .update(validated as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update split plan: ${error.message}`);
    }

    return data as SplitPlan;
  }

  /**
   * Delete split plan
   */
  static async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("split_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Security: only delete own plans

    if (error) {
      throw new Error(`Failed to delete split plan: ${error.message}`);
    }
  }

  /**
   * Get all split plans for a user (including inactive)
   */
  static async getAll(userId: string): Promise<SplitPlan[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch split plans: ${error.message}`);
    }

    return data as SplitPlan[];
  }

  /**
   * Server-side: Create split plan
   */
  static async createServer(plan: InsertSplitPlan): Promise<SplitPlan> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const validated = insertSplitPlanSchema.parse(plan);

    // Deactivate other plans
    await supabase
      .from("split_plans")
      .update({ active: false })
      .eq("user_id", plan.user_id)
      .eq("active", true);

    // Create new active plan
    const { data, error } = await supabase
      .from("split_plans")
      .insert({ ...validated, active: true } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan: ${error.message}`);
    }

    // Update user profile
    await supabase
      .from("user_profiles")
      .update({
        active_split_plan_id: data.id,
        current_cycle_day: 1,
      })
      .eq("user_id", plan.user_id);

    return data as SplitPlan;
  }

  /**
   * Server-side: Get active split plan
   */
  static async getActiveServer(userId: string): Promise<SplitPlan | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("split_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch active split plan: ${error.message}`);
    }

    return data as SplitPlan;
  }

  /**
   * Swap two sessions in a split plan cycle
   * Returns updated sessions array (does NOT save to DB - caller must update)
   */
  static swapSessions(
    splitPlan: SplitPlan,
    day1: number,
    day2: number
  ): SessionDefinition[] {
    const sessions = (splitPlan.sessions as unknown as SessionDefinition[]).slice();

    // Find session indices
    const index1 = sessions.findIndex((s) => s.day === day1);
    const index2 = sessions.findIndex((s) => s.day === day2);

    if (index1 === -1 || index2 === -1) {
      throw new Error(`Invalid cycle days: ${day1} or ${day2} not found`);
    }

    // Swap the day numbers (keep sessions in same array position)
    const temp = sessions[index1].day;
    sessions[index1] = { ...sessions[index1], day: day2 };
    sessions[index2] = { ...sessions[index2], day: temp };

    return sessions;
  }

  /**
   * Toggle muscle group in/out of a session's focus
   * Returns updated sessions, frequency_map, and volume_distribution
   */
  static toggleMuscleFocus(
    splitPlan: SplitPlan,
    cycleDay: number,
    muscleGroup: string,
    add: boolean
  ): {
    sessions: SessionDefinition[];
    frequencyMap: Record<string, number>;
    volumeDistribution: Record<string, number>;
  } {
    const sessions = (splitPlan.sessions as unknown as SessionDefinition[]).slice();

    const sessionIndex = sessions.findIndex((s) => s.day === cycleDay);
    if (sessionIndex === -1) {
      throw new Error(`Session for cycle day ${cycleDay} not found`);
    }

    const session = { ...sessions[sessionIndex] };
    const currentFocus = session.focus || [];

    if (add) {
      // Add muscle if not already present
      if (!currentFocus.includes(muscleGroup)) {
        session.focus = [...currentFocus, muscleGroup];
      }
    } else {
      // Remove muscle
      session.focus = currentFocus.filter((m) => m !== muscleGroup);

      // Also remove from targetVolume if present
      if (session.targetVolume && session.targetVolume[muscleGroup]) {
        const newTargetVolume = { ...session.targetVolume };
        delete newTargetVolume[muscleGroup];
        session.targetVolume = newTargetVolume;
      }
    }

    sessions[sessionIndex] = session;

    // Recalculate frequency and volume distribution
    const { frequencyMap, volumeDistribution } = this.recalculateFrequencyAndVolume(
      sessions,
      splitPlan.cycle_days
    );

    return { sessions, frequencyMap, volumeDistribution };
  }

  /**
   * Change session variation (A <-> B)
   * Returns updated sessions array (does NOT save to DB - caller must update)
   */
  static changeSessionVariation(
    splitPlan: SplitPlan,
    cycleDay: number,
    newVariation: 'A' | 'B'
  ): SessionDefinition[] {
    const sessions = (splitPlan.sessions as unknown as SessionDefinition[]).slice();

    const sessionIndex = sessions.findIndex((s) => s.day === cycleDay);
    if (sessionIndex === -1) {
      throw new Error(`Session for cycle day ${cycleDay} not found`);
    }

    const session = { ...sessions[sessionIndex] };
    session.variation = newVariation;

    // Update session name to reflect new variation
    session.name = session.name.replace(/[AB]$/, newVariation);

    sessions[sessionIndex] = session;
    return sessions;
  }

  /**
   * Recalculate frequency_map and volume_distribution from sessions
   * Used after modifying sessions to keep summary fields in sync
   */
  static recalculateFrequencyAndVolume(
    sessions: SessionDefinition[],
    cycleDays: number
  ): {
    frequencyMap: Record<string, number>;
    volumeDistribution: Record<string, number>;
  } {
    const frequencyMap: Record<string, number> = {};
    const volumeDistribution: Record<string, number> = {};

    // Count occurrences and sum volumes for each muscle
    for (const session of sessions) {
      for (const muscle of session.focus || []) {
        // Count frequency (how many times this muscle appears in cycle)
        frequencyMap[muscle] = (frequencyMap[muscle] || 0) + 1;

        // Sum volume (total sets for this muscle in cycle)
        const sets = session.targetVolume?.[muscle] || 0;
        volumeDistribution[muscle] = (volumeDistribution[muscle] || 0) + sets;
      }
    }

    // Convert frequency count to weekly frequency
    // Formula: (occurrences_in_cycle * 7) / cycle_days
    for (const muscle in frequencyMap) {
      const occurrences = frequencyMap[muscle];
      frequencyMap[muscle] = Math.round((occurrences * 7) / cycleDays * 10) / 10; // Round to 1 decimal
    }

    return { frequencyMap, volumeDistribution };
  }

  /**
   * Sync workouts after split modification
   * Invalidates or swaps existing workouts based on modification type
   */
  static async syncWorkoutsAfterModification(
    splitPlanId: string,
    modification: {
      type: 'swap_days' | 'toggle_muscle' | 'change_variation';
      details: Record<string, any>;
    }
  ): Promise<{ invalidated: number; swapped: number }> {
    const supabase = getSupabaseBrowserClient();

    let invalidatedCount = 0;
    let swappedCount = 0;

    if (modification.type === 'swap_days') {
      const { day1, day2 } = modification.details;

      // Get workouts for both days
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, cycle_day')
        .eq('split_plan_id', splitPlanId)
        .in('cycle_day', [day1, day2]);

      if (workouts && workouts.length > 0) {
        // Swap cycle_day for existing workouts
        for (const workout of workouts) {
          const newCycleDay = workout.cycle_day === day1 ? day2 : day1;
          await supabase
            .from('workouts')
            .update({ cycle_day: newCycleDay })
            .eq('id', workout.id);
          swappedCount++;
        }
      }
    } else if (modification.type === 'toggle_muscle' || modification.type === 'change_variation') {
      const { cycleDay } = modification.details;

      // Invalidate workouts for affected day (set to 'draft' status)
      const { data: affectedWorkouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('split_plan_id', splitPlanId)
        .eq('cycle_day', cycleDay)
        .in('status', ['ready', 'in_progress']);

      if (affectedWorkouts && affectedWorkouts.length > 0) {
        for (const workout of affectedWorkouts) {
          await supabase
            .from('workouts')
            .update({ status: 'draft' })
            .eq('id', workout.id);
          invalidatedCount++;
        }
      }
    }

    return { invalidated: invalidatedCount, swapped: swappedCount };
  }

  /**
   * Server-side: Sync workouts after split modification
   */
  static async syncWorkoutsAfterModificationServer(
    splitPlanId: string,
    modification: {
      type: 'swap_days' | 'toggle_muscle' | 'change_variation';
      details: Record<string, any>;
    }
  ): Promise<{ invalidated: number; swapped: number }> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    let invalidatedCount = 0;
    let swappedCount = 0;

    if (modification.type === 'swap_days') {
      const { day1, day2 } = modification.details;

      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, cycle_day')
        .eq('split_plan_id', splitPlanId)
        .in('cycle_day', [day1, day2]);

      if (workouts && workouts.length > 0) {
        for (const workout of workouts) {
          const newCycleDay = workout.cycle_day === day1 ? day2 : day1;
          await supabase
            .from('workouts')
            .update({ cycle_day: newCycleDay })
            .eq('id', workout.id);
          swappedCount++;
        }
      }
    } else if (modification.type === 'toggle_muscle' || modification.type === 'change_variation') {
      const { cycleDay } = modification.details;

      const { data: affectedWorkouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('split_plan_id', splitPlanId)
        .eq('cycle_day', cycleDay)
        .in('status', ['ready', 'in_progress']);

      if (affectedWorkouts && affectedWorkouts.length > 0) {
        for (const workout of affectedWorkouts) {
          await supabase
            .from('workouts')
            .update({ status: 'draft' })
            .eq('id', workout.id);
          invalidatedCount++;
        }
      }
    }

    return { invalidated: invalidatedCount, swapped: swappedCount };
  }
}
