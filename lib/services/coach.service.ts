import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import {
  insertCoachProfileSchema,
  updateCoachProfileSchema,
  insertCoachClientRelationshipSchema,
  updateCoachClientRelationshipSchema,
  insertWorkoutTemplateSchema,
  updateWorkoutTemplateSchema,
  insertCoachWorkoutAssignmentSchema,
  insertSplitPlanTemplateSchema,
  updateSplitPlanTemplateSchema,
  insertCoachSplitPlanAssignmentSchema,
  type CoachProfile,
  type InsertCoachProfile,
  type UpdateCoachProfile,
  type CoachClientRelationship,
  type InsertCoachClientRelationship,
  type UpdateCoachClientRelationship,
  type WorkoutTemplate,
  type InsertWorkoutTemplate,
  type UpdateWorkoutTemplate,
  type CoachWorkoutAssignment,
  type InsertCoachWorkoutAssignment,
  type RelationshipStatus,
  type UserProfile,
  type SplitPlanTemplate,
  type InsertSplitPlanTemplate,
  type UpdateSplitPlanTemplate,
  type CoachSplitPlanAssignment,
  type InsertCoachSplitPlanAssignment,
} from "@/lib/types/schemas";

// =====================================================
// Helper Functions
// =====================================================

/**
 * Generate a unique invite code locally
 * Format: COACH_XXXXX where X is alphanumeric
 */
function generateInviteCodeLocal(displayName?: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // If display name provided, use first 4 chars as prefix
  if (displayName) {
    const prefix = displayName
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4);
    if (prefix.length >= 2) {
      return `${prefix}_${code}`;
    }
  }
  return `COACH_${code}`;
}

// =====================================================
// Coach Profile Types
// =====================================================

export interface ClientWithProfile {
  relationship: CoachClientRelationship;
  profile: UserProfile | null;
  lastWorkout: {
    id: string;
    completed_at: string | null;
    workout_name: string | null;
  } | null;
  workoutsThisWeek: number;
  totalWorkouts: number;
}

export interface CoachDashboardStats {
  totalClients: number;
  activeClients: number;
  pendingInvites: number;
  workoutsThisWeek: number;
  avgCompletionRate: number;
}

// =====================================================
// Coach Service
// =====================================================

export class CoachService {
  // =====================================================
  // Coach Profile Methods
  // =====================================================

  /**
   * Get coach profile by user ID
   */
  static async getProfile(userId: string): Promise<CoachProfile | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch coach profile: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Get coach profile by invite code
   */
  static async getProfileByInviteCode(inviteCode: string): Promise<CoachProfile | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch coach by invite code: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Create coach profile
   */
  static async createProfile(profile: InsertCoachProfile): Promise<CoachProfile> {
    const validated = insertCoachProfileSchema.parse(profile);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_profiles")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create coach profile: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Update coach profile
   */
  static async updateProfile(userId: string, profile: UpdateCoachProfile): Promise<CoachProfile> {
    const validated = updateCoachProfileSchema.parse({ ...profile, user_id: userId });
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_profiles")
      // @ts-ignore - Supabase types mismatch
      .update(validated)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coach profile: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Generate unique invite code for coach
   */
  static async generateInviteCode(displayName?: string): Promise<string> {
    // Generate a unique code locally
    return generateInviteCodeLocal(displayName);
  }

  // =====================================================
  // Client Relationship Methods
  // =====================================================

  /**
   * Get all clients for a coach
   */
  static async getClients(
    coachId: string,
    status?: RelationshipStatus
  ): Promise<CoachClientRelationship[]> {
    const supabase = getSupabaseBrowserClient();

    let query = supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship[];
  }

  /**
   * Get clients with full profile data for dashboard
   */
  static async getClientsWithProfiles(coachId: string): Promise<ClientWithProfile[]> {
    const supabase = getSupabaseBrowserClient();

    // Get all active relationships
    const relationships = await this.getClients(coachId, "active");

    if (relationships.length === 0) {
      return [];
    }

    const clientIds = relationships.map((r) => r.client_id);

    // Fetch profiles for all clients
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .in("user_id", clientIds);

    if (profilesError) {
      throw new Error(`Failed to fetch client profiles: ${profilesError.message}`);
    }

    // Fetch last workout for each client
    const { data: lastWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .select("id, user_id, completed_at, workout_name")
      .in("user_id", clientIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (workoutsError) {
      throw new Error(`Failed to fetch client workouts: ${workoutsError.message}`);
    }

    // Get workout counts (this week and total)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: workoutCounts, error: countsError } = await supabase
      .from("workouts")
      .select("user_id, completed_at")
      .in("user_id", clientIds)
      .eq("status", "completed");

    if (countsError) {
      throw new Error(`Failed to fetch workout counts: ${countsError.message}`);
    }

    // Build result
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const lastWorkoutMap = new Map<string, typeof lastWorkouts[0]>();
    lastWorkouts?.forEach((w) => {
      if (!lastWorkoutMap.has(w.user_id!)) {
        lastWorkoutMap.set(w.user_id!, w);
      }
    });

    // Count workouts per user
    const weeklyCountMap = new Map<string, number>();
    const totalCountMap = new Map<string, number>();
    workoutCounts?.forEach((w) => {
      const userId = w.user_id!;
      totalCountMap.set(userId, (totalCountMap.get(userId) || 0) + 1);
      if (w.completed_at && new Date(w.completed_at) >= oneWeekAgo) {
        weeklyCountMap.set(userId, (weeklyCountMap.get(userId) || 0) + 1);
      }
    });

    return relationships.map((relationship) => ({
      relationship,
      profile: (profileMap.get(relationship.client_id) as unknown as UserProfile) || null,
      lastWorkout: lastWorkoutMap.get(relationship.client_id) || null,
      workoutsThisWeek: weeklyCountMap.get(relationship.client_id) || 0,
      totalWorkouts: totalCountMap.get(relationship.client_id) || 0,
    }));
  }

  /**
   * Get coach dashboard stats
   */
  static async getDashboardStats(coachId: string): Promise<CoachDashboardStats> {
    const supabase = getSupabaseBrowserClient();

    // Get relationship counts
    const { data: relationships, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("status")
      .eq("coach_id", coachId);

    if (relError) {
      throw new Error(`Failed to fetch relationships: ${relError.message}`);
    }

    const activeClients = relationships?.filter((r) => r.status === "active").length || 0;
    const pendingInvites = relationships?.filter((r) => r.status === "pending").length || 0;
    const totalClients = activeClients + pendingInvites;

    // Get active client IDs
    const activeClientIds = relationships
      ?.filter((r) => r.status === "active")
      .map((r) => (r as any).client_id as string) || [];

    let workoutsThisWeek = 0;
    let avgCompletionRate = 0;

    if (activeClientIds.length > 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get workouts this week
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .in("user_id", activeClientIds)
        .eq("status", "completed")
        .gte("completed_at", oneWeekAgo.toISOString());

      if (!weeklyError) {
        workoutsThisWeek = weeklyCount || 0;
      }

      // Calculate completion rate (completed / total ready workouts in last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: recentWorkouts, error: recentError } = await supabase
        .from("workouts")
        .select("status")
        .in("user_id", activeClientIds)
        .gte("created_at", fourWeeksAgo.toISOString())
        .in("status", ["completed", "ready"]);

      if (!recentError && recentWorkouts && recentWorkouts.length > 0) {
        const completed = recentWorkouts.filter((w) => w.status === "completed").length;
        avgCompletionRate = Math.round((completed / recentWorkouts.length) * 100);
      }
    }

    return {
      totalClients,
      activeClients,
      pendingInvites,
      workoutsThisWeek,
      avgCompletionRate,
    };
  }

  /**
   * Get relationship for a specific client
   */
  static async getClientRelationship(
    coachId: string,
    clientId: string
  ): Promise<CoachClientRelationship | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("coach_id", coachId)
      .eq("client_id", clientId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch relationship: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Get coach for a client (if they have one)
   */
  static async getCoachForClient(clientId: string): Promise<{
    coach: CoachProfile;
    relationship: CoachClientRelationship;
  } | null> {
    const supabase = getSupabaseBrowserClient();

    const { data: relationship, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active")
      .single();

    if (relError) {
      if (relError.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch coach relationship: ${relError.message}`);
    }

    const coachProfile = await this.getProfile(relationship.coach_id);
    if (!coachProfile) {
      return null;
    }

    return {
      coach: coachProfile,
      relationship: relationship as unknown as CoachClientRelationship,
    };
  }

  /**
   * Invite a client by creating a pending relationship
   */
  static async inviteClient(
    coachId: string,
    clientId: string,
    options?: { autonomy?: "minimal" | "standard" | "full"; notes?: string }
  ): Promise<CoachClientRelationship> {
    const supabase = getSupabaseBrowserClient();

    const insert: InsertCoachClientRelationship = {
      coach_id: coachId,
      client_id: clientId,
      status: "pending",
      client_autonomy: options?.autonomy || "standard",
      notes: options?.notes || null,
      invited_at: new Date().toISOString(),
      accepted_at: null,
      terminated_at: null,
      termination_reason: null,
    };

    const validated = insertCoachClientRelationshipSchema.parse(insert);

    const { data, error } = await supabase
      .from("coach_client_relationships")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to invite client: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Client accepts coach invitation
   */
  static async acceptInvitation(
    clientId: string,
    coachId: string
  ): Promise<CoachClientRelationship> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_client_relationships")
      .update({
        status: "active",
        accepted_at: new Date().toISOString(),
      })
      .eq("client_id", clientId)
      .eq("coach_id", coachId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to accept invitation: ${error.message}`);
    }

    // Also update user_profiles.coach_id
    await supabase
      .from("user_profiles")
      .update({ coach_id: coachId })
      .eq("user_id", clientId);

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Client joins coach via invite code
   */
  static async joinCoachByCode(
    clientId: string,
    inviteCode: string
  ): Promise<CoachClientRelationship> {
    // Find coach by invite code
    const coachProfile = await this.getProfileByInviteCode(inviteCode);
    if (!coachProfile) {
      throw new Error("Invalid invite code");
    }

    // Check if relationship already exists
    const existing = await this.getClientRelationship(coachProfile.user_id, clientId);
    if (existing) {
      if (existing.status === "active") {
        throw new Error("You are already linked to this coach");
      }
      if (existing.status === "pending") {
        // Auto-accept the pending invitation
        return this.acceptInvitation(clientId, coachProfile.user_id);
      }
    }

    // Create new relationship (auto-activated since client initiated)
    const supabase = getSupabaseBrowserClient();

    const insert: InsertCoachClientRelationship = {
      coach_id: coachProfile.user_id,
      client_id: clientId,
      status: "active",
      client_autonomy: "standard",
      notes: null,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
      terminated_at: null,
      termination_reason: null,
    };

    const { data, error } = await supabase
      .from("coach_client_relationships")
      // @ts-ignore - Supabase types mismatch
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to join coach: ${error.message}`);
    }

    // Also update user_profiles.coach_id
    await supabase
      .from("user_profiles")
      .update({ coach_id: coachProfile.user_id })
      .eq("user_id", clientId);

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Update client relationship (autonomy, notes, etc.)
   */
  static async updateRelationship(
    relationshipId: string,
    updates: UpdateCoachClientRelationship
  ): Promise<CoachClientRelationship> {
    const validated = updateCoachClientRelationshipSchema.parse(updates);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_client_relationships")
      // @ts-ignore - Supabase types mismatch
      .update(validated)
      .eq("id", relationshipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update relationship: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Terminate coach-client relationship
   */
  static async terminateRelationship(
    relationshipId: string,
    reason?: string
  ): Promise<CoachClientRelationship> {
    const supabase = getSupabaseBrowserClient();

    // Get relationship to find client_id
    const { data: rel, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("client_id")
      .eq("id", relationshipId)
      .single();

    if (relError) {
      throw new Error(`Failed to find relationship: ${relError.message}`);
    }

    const { data, error } = await supabase
      .from("coach_client_relationships")
      .update({
        status: "terminated",
        terminated_at: new Date().toISOString(),
        termination_reason: reason || null,
      })
      .eq("id", relationshipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to terminate relationship: ${error.message}`);
    }

    // Clear coach_id from user_profiles
    await supabase
      .from("user_profiles")
      .update({ coach_id: null })
      .eq("user_id", rel.client_id);

    return data as unknown as CoachClientRelationship;
  }

  // =====================================================
  // Workout Template Methods
  // =====================================================

  /**
   * Get all templates for a coach
   */
  static async getTemplates(coachId: string): Promise<WorkoutTemplate[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("coach_id", coachId)
      .order("usage_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data as unknown as WorkoutTemplate[];
  }

  /**
   * Get template by ID
   */
  static async getTemplate(templateId: string): Promise<WorkoutTemplate | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    return data as unknown as WorkoutTemplate;
  }

  /**
   * Create workout template
   */
  static async createTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const validated = insertWorkoutTemplateSchema.parse(template);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workout_templates")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data as unknown as WorkoutTemplate;
  }

  /**
   * Create template from existing workout
   */
  static async createTemplateFromWorkout(
    coachId: string,
    workoutId: string,
    name: string,
    options?: { description?: string; tags?: string[] }
  ): Promise<WorkoutTemplate> {
    const supabase = getSupabaseBrowserClient();

    // Fetch the workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("exercises, workout_type, target_muscle_groups")
      .eq("id", workoutId)
      .single();

    if (workoutError) {
      throw new Error(`Failed to fetch workout: ${workoutError.message}`);
    }

    // Create template
    return this.createTemplate({
      coach_id: coachId,
      name,
      description: options?.description || null,
      workout_type: workout.workout_type as any,
      exercises: (workout.exercises as any[]) || [],
      target_muscle_groups: workout.target_muscle_groups || null,
      tags: options?.tags || null,
      is_public: false,
      ai_suggestions_enabled: true, // Default to enabled when creating template from workout
    });
  }

  /**
   * Update workout template
   */
  static async updateTemplate(
    templateId: string,
    updates: UpdateWorkoutTemplate
  ): Promise<WorkoutTemplate> {
    const validated = updateWorkoutTemplateSchema.parse(updates);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("workout_templates")
      // @ts-ignore - Supabase types mismatch
      .update(validated)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data as unknown as WorkoutTemplate;
  }

  /**
   * Delete workout template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Increment template usage count
   */
  static async incrementTemplateUsage(templateId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.rpc("increment_template_usage", {
      template_id: templateId,
    });

    if (error) {
      // Non-critical, log but don't throw
      console.warn(`Failed to increment template usage: ${error.message}`);
    }
  }

  // =====================================================
  // Workout Assignment Methods
  // =====================================================

  /**
   * Create workout assignment record
   */
  static async createAssignment(
    assignment: InsertCoachWorkoutAssignment
  ): Promise<CoachWorkoutAssignment> {
    const validated = insertCoachWorkoutAssignmentSchema.parse(assignment);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      // @ts-ignore - Supabase types mismatch
      .insert({
        ...validated,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }

    // If using a template, increment usage
    if (validated.template_id) {
      await this.incrementTemplateUsage(validated.template_id);
    }

    return data as unknown as CoachWorkoutAssignment;
  }

  /**
   * Get assignments for a client
   */
  static async getAssignmentsForClient(clientId: string): Promise<CoachWorkoutAssignment[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return data as unknown as CoachWorkoutAssignment[];
  }

  /**
   * Get assignment for a specific workout
   */
  static async getAssignmentForWorkout(
    workoutId: string
  ): Promise<CoachWorkoutAssignment | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      .select("*")
      .eq("workout_id", workoutId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch assignment: ${error.message}`);
    }

    return data as unknown as CoachWorkoutAssignment;
  }

  /**
   * Update assignment notes
   */
  static async updateAssignmentNotes(
    assignmentId: string,
    options: { coachNotes?: string; clientNotes?: string }
  ): Promise<CoachWorkoutAssignment> {
    const supabase = getSupabaseBrowserClient();

    const updates: Record<string, string | null> = {};
    if (options.coachNotes !== undefined) updates.coach_notes = options.coachNotes;
    if (options.clientNotes !== undefined) updates.client_notes = options.clientNotes;

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update assignment: ${error.message}`);
    }

    return data as unknown as CoachWorkoutAssignment;
  }

  // =====================================================
  // Server-side Methods (for background workers/API routes)
  // =====================================================

  /**
   * Get coach profile (server-side)
   */
  static async getProfileServer(
    userId: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<CoachProfile | null> {
    let supabase: SupabaseClient<Database>;
    if (supabaseClient) {
      supabase = supabaseClient;
    } else {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      supabase = await getSupabaseServerClient();
    }

    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch coach profile: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Create coach profile (server-side)
   * Auto-generates invite code if not provided
   */
  static async createProfileServer(
    userId: string,
    options?: { displayName?: string; inviteCode?: string },
    supabaseClient?: SupabaseClient<Database>
  ): Promise<CoachProfile> {
    let supabase: SupabaseClient<Database>;
    if (supabaseClient) {
      supabase = supabaseClient;
    } else {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      supabase = await getSupabaseServerClient();
    }

    const displayName = options?.displayName || "Coach";
    const inviteCode = options?.inviteCode || generateInviteCodeLocal(displayName);

    const profile: InsertCoachProfile = {
      user_id: userId,
      display_name: displayName,
      invite_code: inviteCode,
      max_clients: 30,
      bio: null,
      subscription_status: "trial",
    };

    const validated = insertCoachProfileSchema.parse(profile);

    const { data, error } = await supabase
      .from("coach_profiles")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create coach profile: ${error.message}`);
    }

    return data as unknown as CoachProfile;
  }

  /**
   * Check if user is a coach (server-side)
   */
  static async isCoachServer(
    userId: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<boolean> {
    const profile = await this.getProfileServer(userId, supabaseClient);
    return profile !== null;
  }

  /**
   * Get relationship (server-side)
   */
  static async getClientRelationshipServer(
    coachId: string,
    clientId: string,
    supabaseClient?: SupabaseClient<Database>
  ): Promise<CoachClientRelationship | null> {
    let supabase: SupabaseClient<Database>;
    if (supabaseClient) {
      supabase = supabaseClient;
    } else {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      supabase = await getSupabaseServerClient();
    }

    const { data, error } = await supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("coach_id", coachId)
      .eq("client_id", clientId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch relationship: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship;
  }

  /**
   * Server-side: Get clients with full profile data for dashboard
   */
  static async getClientsWithProfilesServer(coachId: string): Promise<ClientWithProfile[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Get all active relationships
    const { data: relationships, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("coach_id", coachId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (relError || !relationships?.length) {
      return [];
    }

    const clientIds = relationships.map((r) => r.client_id);

    // Fetch profiles for all clients
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .in("user_id", clientIds);

    if (profilesError) {
      throw new Error(`Failed to fetch client profiles: ${profilesError.message}`);
    }

    // Fetch last workout for each client
    const { data: lastWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .select("id, user_id, completed_at, workout_name")
      .in("user_id", clientIds)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (workoutsError) {
      throw new Error(`Failed to fetch client workouts: ${workoutsError.message}`);
    }

    // Get workout counts (this week and total)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: workoutCounts, error: countsError } = await supabase
      .from("workouts")
      .select("user_id, completed_at")
      .in("user_id", clientIds)
      .eq("status", "completed");

    if (countsError) {
      throw new Error(`Failed to fetch workout counts: ${countsError.message}`);
    }

    // Build result
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const lastWorkoutMap = new Map<string, typeof lastWorkouts[0]>();
    lastWorkouts?.forEach((w) => {
      if (w.user_id && !lastWorkoutMap.has(w.user_id)) {
        lastWorkoutMap.set(w.user_id, w);
      }
    });

    // Count workouts per user (weekly and total)
    const weeklyCountMap = new Map<string, number>();
    const totalCountMap = new Map<string, number>();
    workoutCounts?.forEach((w) => {
      if (w.user_id) {
        totalCountMap.set(w.user_id, (totalCountMap.get(w.user_id) || 0) + 1);
        if (w.completed_at && new Date(w.completed_at) >= oneWeekAgo) {
          weeklyCountMap.set(w.user_id, (weeklyCountMap.get(w.user_id) || 0) + 1);
        }
      }
    });

    return relationships.map((rel) => ({
      relationship: rel as unknown as CoachClientRelationship,
      profile: (profileMap.get(rel.client_id) as unknown as UserProfile) || null,
      lastWorkout: lastWorkoutMap.get(rel.client_id) || null,
      workoutsThisWeek: weeklyCountMap.get(rel.client_id) || 0,
      totalWorkouts: totalCountMap.get(rel.client_id) || 0,
    }));
  }

  /**
   * Server-side: Get coach dashboard stats
   */
  static async getDashboardStatsServer(coachId: string): Promise<CoachDashboardStats> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Get relationship counts
    const { data: relationships, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("status, client_id")
      .eq("coach_id", coachId);

    if (relError) {
      throw new Error(`Failed to fetch relationships: ${relError.message}`);
    }

    const activeClients = relationships?.filter((r) => r.status === "active").length || 0;
    const pendingInvites = relationships?.filter((r) => r.status === "pending").length || 0;
    const totalClients = activeClients + pendingInvites;

    // Get active client IDs
    const activeClientIds = relationships
      ?.filter((r) => r.status === "active")
      .map((r) => r.client_id as string) || [];

    let workoutsThisWeek = 0;
    let avgCompletionRate = 0;

    if (activeClientIds.length > 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get workouts this week
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .in("user_id", activeClientIds)
        .eq("status", "completed")
        .gte("completed_at", oneWeekAgo.toISOString());

      if (!weeklyError) {
        workoutsThisWeek = weeklyCount || 0;
      }

      // Calculate completion rate (completed / total ready workouts in last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: recentWorkouts, error: recentError } = await supabase
        .from("workouts")
        .select("status")
        .in("user_id", activeClientIds)
        .gte("created_at", fourWeeksAgo.toISOString())
        .in("status", ["completed", "ready"]);

      if (!recentError && recentWorkouts && recentWorkouts.length > 0) {
        const completed = recentWorkouts.filter((w) => w.status === "completed").length;
        avgCompletionRate = Math.round((completed / recentWorkouts.length) * 100);
      }
    }

    return {
      totalClients,
      activeClients,
      pendingInvites,
      workoutsThisWeek,
      avgCompletionRate,
    };
  }

  /**
   * Server-side: Get clients by status
   */
  static async getClientsServer(
    coachId: string,
    status?: RelationshipStatus
  ): Promise<CoachClientRelationship[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from("coach_client_relationships")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data as unknown as CoachClientRelationship[];
  }

  /**
   * Server-side: Get templates for a coach
   */
  static async getTemplatesServer(coachId: string): Promise<WorkoutTemplate[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("coach_id", coachId)
      .order("usage_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data as unknown as WorkoutTemplate[];
  }

  /**
   * Server-side: Get assignments for a client
   */
  static async getAssignmentsForClientServer(clientId: string): Promise<CoachWorkoutAssignment[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return data as unknown as CoachWorkoutAssignment[];
  }

  /**
   * Server-side: Get assignment for a specific workout
   */
  static async getAssignmentForWorkoutServer(
    workoutId: string
  ): Promise<CoachWorkoutAssignment | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("coach_workout_assignments")
      .select("*")
      .eq("workout_id", workoutId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch assignment: ${error.message}`);
    }

    return data as unknown as CoachWorkoutAssignment;
  }

  // =====================================================
  // Split Plan Template Methods
  // =====================================================

  /**
   * Get all split plan templates for a coach
   */
  static async getSplitPlanTemplates(coachId: string): Promise<SplitPlanTemplate[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plan_templates")
      .select("*")
      .eq("coach_id", coachId)
      .order("usage_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch split plan templates: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate[];
  }

  /**
   * Get split plan template by ID
   */
  static async getSplitPlanTemplate(templateId: string): Promise<SplitPlanTemplate | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plan_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Create split plan template
   */
  static async createSplitPlanTemplate(template: InsertSplitPlanTemplate): Promise<SplitPlanTemplate> {
    const validated = insertSplitPlanTemplateSchema.parse(template);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plan_templates")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Update split plan template
   */
  static async updateSplitPlanTemplate(
    templateId: string,
    updates: UpdateSplitPlanTemplate
  ): Promise<SplitPlanTemplate> {
    const validated = updateSplitPlanTemplateSchema.parse(updates);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("split_plan_templates")
      // @ts-ignore - Supabase types mismatch
      .update(validated)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Delete split plan template
   */
  static async deleteSplitPlanTemplate(templateId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("split_plan_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      throw new Error(`Failed to delete split plan template: ${error.message}`);
    }
  }

  /**
   * Increment split plan template usage count
   */
  static async incrementSplitPlanTemplateUsage(templateId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.rpc("increment_split_plan_template_usage", {
      template_uuid: templateId,
    });

    if (error) {
      // Non-critical, log but don't throw
      console.warn(`Failed to increment split plan template usage: ${error.message}`);
    }
  }

  // =====================================================
  // Split Plan Assignment Methods
  // =====================================================

  /**
   * Create split plan assignment record
   */
  static async createSplitPlanAssignment(
    assignment: InsertCoachSplitPlanAssignment
  ): Promise<CoachSplitPlanAssignment> {
    const validated = insertCoachSplitPlanAssignmentSchema.parse(assignment);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_split_plan_assignments")
      // @ts-ignore - Supabase types mismatch
      .insert({
        ...validated,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan assignment: ${error.message}`);
    }

    // If using a template, increment usage
    if (validated.template_id) {
      await this.incrementSplitPlanTemplateUsage(validated.template_id);
    }

    return data as unknown as CoachSplitPlanAssignment;
  }

  /**
   * Get split plan assignments for a client
   */
  static async getSplitPlanAssignmentsForClient(clientId: string): Promise<CoachSplitPlanAssignment[]> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_split_plan_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch split plan assignments: ${error.message}`);
    }

    return data as unknown as CoachSplitPlanAssignment[];
  }

  /**
   * Get latest split plan assignment for a client
   */
  static async getLatestSplitPlanAssignment(clientId: string): Promise<CoachSplitPlanAssignment | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("coach_split_plan_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch split plan assignment: ${error.message}`);
    }

    return data as unknown as CoachSplitPlanAssignment;
  }

  // =====================================================
  // Server-side Split Plan Methods
  // =====================================================

  /**
   * Server-side: Get split plan templates for a coach
   */
  static async getSplitPlanTemplatesServer(coachId: string): Promise<SplitPlanTemplate[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Fetch both coach's templates AND system (base) templates
    const { data, error } = await supabase
      .from("split_plan_templates")
      .select("*")
      .or(`coach_id.eq.${coachId},is_system.eq.true`)
      .order("is_system", { ascending: false }) // System templates first
      .order("usage_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch split plan templates: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate[];
  }

  /**
   * Server-side: Get split plan template by ID
   */
  static async getSplitPlanTemplateServer(templateId: string): Promise<SplitPlanTemplate | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("split_plan_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Server-side: Create split plan template
   */
  static async createSplitPlanTemplateServer(
    template: InsertSplitPlanTemplate
  ): Promise<SplitPlanTemplate> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();
    const validated = insertSplitPlanTemplateSchema.parse(template);

    const { data, error } = await supabase
      .from("split_plan_templates")
      // @ts-ignore - Supabase types mismatch
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Server-side: Update split plan template
   */
  static async updateSplitPlanTemplateServer(
    templateId: string,
    updates: Partial<InsertSplitPlanTemplate>
  ): Promise<SplitPlanTemplate> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Remove coach_id from updates if present (it's immutable for non-system templates)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { coach_id: _coachId, is_system: _isSystem, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from("split_plan_templates")
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update split plan template: ${error.message}`);
    }

    return data as unknown as SplitPlanTemplate;
  }

  /**
   * Server-side: Delete split plan template
   */
  static async deleteSplitPlanTemplateServer(templateId: string): Promise<void> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from("split_plan_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      throw new Error(`Failed to delete split plan template: ${error.message}`);
    }
  }

  /**
   * Server-side: Increment split plan template usage count
   */
  static async incrementSplitPlanTemplateUsageServer(templateId: string): Promise<void> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.rpc("increment_split_plan_template_usage", {
      template_uuid: templateId,
    });

    if (error) {
      console.error("Failed to increment template usage:", error);
      // Non-critical, don't throw
    }
  }

  /**
   * Server-side: Create split plan assignment
   */
  static async createSplitPlanAssignmentServer(
    assignment: InsertCoachSplitPlanAssignment
  ): Promise<CoachSplitPlanAssignment> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();
    const validated = insertCoachSplitPlanAssignmentSchema.parse(assignment);

    const { data, error } = await supabase
      .from("coach_split_plan_assignments")
      // @ts-ignore - Supabase types mismatch
      .insert({
        ...validated,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split plan assignment: ${error.message}`);
    }

    // If using a template, increment usage
    if (validated.template_id) {
      await supabase.rpc("increment_split_plan_template_usage", {
        template_uuid: validated.template_id,
      });
    }

    return data as unknown as CoachSplitPlanAssignment;
  }

  /**
   * Server-side: Get split plan assignments for a client
   */
  static async getSplitPlanAssignmentsForClientServer(
    clientId: string
  ): Promise<CoachSplitPlanAssignment[]> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("coach_split_plan_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch split plan assignments: ${error.message}`);
    }

    return data as unknown as CoachSplitPlanAssignment[];
  }

  /**
   * Server-side: Get coach feedback for a specific workout
   * Returns the client_notes from coach_workout_assignments if the workout was assigned by a coach
   */
  static async getWorkoutCoachFeedbackServer(
    workoutId: string
  ): Promise<{ coachNotes: string | null; coachName: string | null } | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    // Get the workout assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("coach_workout_assignments")
      .select("client_notes, coach_id")
      .eq("workout_id", workoutId)
      .maybeSingle();

    if (assignmentError) {
      console.error("[CoachService] Failed to fetch workout assignment:", assignmentError);
      return null;
    }

    if (!assignment) {
      return null;
    }

    // Get coach profile separately
    let coachName: string | null = null;
    if (assignment.coach_id) {
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("display_name")
        .eq("user_id", assignment.coach_id)
        .single();

      coachName = coachProfile?.display_name || null;
    }

    return {
      coachNotes: assignment.client_notes,
      coachName,
    };
  }
}
