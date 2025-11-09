import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertSplitPlanSchema,
  updateSplitPlanSchema,
  type SplitPlan,
  type InsertSplitPlan,
  type UpdateSplitPlan,
} from "@/lib/types/schemas";

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

    // Get current state
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("current_cycle_day, active_split_plan_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.active_split_plan_id) {
      throw new Error("No active split plan found");
    }

    const { data: splitPlan } = await supabase
      .from("split_plans")
      .select("cycle_days")
      .eq("id", profile.active_split_plan_id)
      .single();

    if (!splitPlan) {
      throw new Error("Split plan not found");
    }

    // Calculate next cycle day (wraps around)
    const currentDay = profile.current_cycle_day || 1;
    const nextDay = currentDay >= splitPlan.cycle_days ? 1 : currentDay + 1;

    // Update user profile
    const { error } = await supabase
      .from("user_profiles")
      .update({ current_cycle_day: nextDay })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to advance cycle: ${error.message}`);
    }

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
}
