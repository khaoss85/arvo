import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Gym,
  GymWithBranding,
  GymBranding,
  GymStaff,
  GymMember,
  GymContext,
  GymStats,
  GymStaffWithUser,
  GymMemberWithUser,
  CreateGymInput,
  UpdateGymInput,
  UpdateGymBrandingInput,
  InviteStaffInput,
  UpdateStaffInput,
  UpdateMemberInput,
} from "@/lib/types/gym.types";
import {
  createGymSchema,
  updateGymSchema,
  updateGymBrandingSchema,
  inviteStaffSchema,
  updateStaffSchema,
  updateMemberSchema,
} from "@/lib/types/gym.types";

// =====================================================
// Gym Service
// =====================================================

export class GymService {
  // =====================================================
  // Gym CRUD Methods
  // =====================================================

  /**
   * Get gym by ID
   */
  static async getGym(gymId: string): Promise<Gym | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("id", gymId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch gym: ${error.message}`);
    }

    return data as Gym;
  }

  /**
   * Get gym by slug (for public registration page)
   */
  static async getGymBySlug(slug: string): Promise<GymWithBranding | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gyms")
      .select(`
        *,
        branding:gym_branding(*)
      `)
      .eq("slug", slug.toLowerCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch gym by slug: ${error.message}`);
    }

    return {
      ...data,
      branding: Array.isArray(data.branding) ? data.branding[0] || null : data.branding || null,
    } as GymWithBranding;
  }

  /**
   * Get gym by invite code
   */
  static async getGymByInviteCode(code: string): Promise<Gym | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch gym by invite code: ${error.message}`);
    }

    return data as Gym;
  }

  /**
   * Get gym owned by user
   */
  static async getOwnedGym(userId: string): Promise<GymWithBranding | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gyms")
      .select(`
        *,
        branding:gym_branding(*)
      `)
      .eq("owner_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch owned gym: ${error.message}`);
    }

    return {
      ...data,
      branding: Array.isArray(data.branding) ? data.branding[0] || null : data.branding || null,
    } as GymWithBranding;
  }

  /**
   * Create a new gym (uses database function for transaction)
   */
  static async createGym(
    ownerId: string,
    input: CreateGymInput
  ): Promise<string> {
    const validated = createGymSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("create_gym_with_branding", {
      p_owner_id: ownerId,
      p_name: validated.name,
      p_email: validated.email || undefined,
      p_logo_url: undefined,
      p_primary_color: "221 83% 53%",
    });

    if (error) {
      throw new Error(`Failed to create gym: ${error.message}`);
    }

    return data as string;
  }

  /**
   * Update gym info
   */
  static async updateGym(gymId: string, input: UpdateGymInput): Promise<Gym> {
    const validated = updateGymSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gyms")
      .update(validated)
      .eq("id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update gym: ${error.message}`);
    }

    return data as Gym;
  }

  // =====================================================
  // Gym Context Methods
  // =====================================================

  /**
   * Get user's gym context (owner, staff, or member)
   */
  static async getUserGymContext(userId: string): Promise<GymContext | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("get_user_gym_context", {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to get gym context: ${error.message}`);
    }

    if (!data || data.length === 0) return null;

    return data[0] as GymContext;
  }

  /**
   * Get gym branding for user
   */
  static async getUserGymBranding(userId: string): Promise<GymBranding | null> {
    const context = await this.getUserGymContext(userId);
    if (!context) return null;

    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .select("*")
      .eq("gym_id", context.gym_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch gym branding: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Branding Methods
  // =====================================================

  /**
   * Get gym branding
   */
  static async getBranding(gymId: string): Promise<GymBranding | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .select("*")
      .eq("gym_id", gymId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch branding: ${error.message}`);
    }

    return data as GymBranding;
  }

  /**
   * Update gym branding
   */
  static async updateBranding(
    gymId: string,
    input: UpdateGymBrandingInput
  ): Promise<GymBranding> {
    const validated = updateGymBrandingSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_branding")
      .update(validated)
      .eq("gym_id", gymId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update branding: ${error.message}`);
    }

    return data as GymBranding;
  }

  // =====================================================
  // Staff Methods
  // =====================================================

  /**
   * Get all staff for a gym
   */
  static async getStaff(gymId: string): Promise<GymStaffWithUser[]> {
    const supabase = getSupabaseBrowserClient();

    // First get staff records
    const { data: staffData, error: staffError } = await supabase
      .from("gym_staff")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    if (staffError) {
      throw new Error(`Failed to fetch staff: ${staffError.message}`);
    }

    if (!staffData || staffData.length === 0) {
      return [];
    }

    // Get user IDs
    const userIds = staffData.map((s) => s.user_id);

    // Fetch user emails
    const { data: usersData } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);

    // Fetch user profiles
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("user_id, first_name")
      .in("user_id", userIds);

    // Map data together
    const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);
    const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

    return staffData.map((staff) => ({
      ...staff,
      user: {
        email: usersMap.get(staff.user_id)?.email || "",
        first_name: profilesMap.get(staff.user_id)?.first_name || undefined,
      },
    })) as GymStaffWithUser[];
  }

  /**
   * Add staff member to gym
   */
  static async addStaff(
    gymId: string,
    userId: string,
    input: InviteStaffInput
  ): Promise<GymStaff> {
    const validated = inviteStaffSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    // Check capacity
    const { data: canAdd } = await supabase.rpc("gym_can_add_staff", {
      p_gym_id: gymId,
    });

    if (!canAdd) {
      throw new Error("Gym has reached maximum staff capacity");
    }

    const { data, error } = await supabase
      .from("gym_staff")
      .insert({
        gym_id: gymId,
        user_id: userId,
        staff_role: validated.staff_role,
        permissions: validated.permissions || undefined,
        notes: validated.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add staff: ${error.message}`);
    }

    return data as GymStaff;
  }

  /**
   * Update staff member
   */
  static async updateStaff(
    staffId: string,
    input: UpdateStaffInput
  ): Promise<GymStaff> {
    const validated = updateStaffSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    const updateData: Record<string, unknown> = {};
    if (validated.staff_role) updateData.staff_role = validated.staff_role;
    if (validated.status) updateData.status = validated.status;
    if (validated.notes !== undefined) updateData.notes = validated.notes;

    // Handle permissions merge if provided
    if (validated.permissions) {
      const { data: current } = await supabase
        .from("gym_staff")
        .select("permissions")
        .eq("id", staffId)
        .single();

      const currentPermissions = (current?.permissions || {}) as Record<string, boolean>;
      updateData.permissions = {
        ...currentPermissions,
        ...validated.permissions,
      };
    }

    const { data, error } = await supabase
      .from("gym_staff")
      .update(updateData)
      .eq("id", staffId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update staff: ${error.message}`);
    }

    return data as GymStaff;
  }

  /**
   * Remove staff member
   */
  static async removeStaff(staffId: string, reason?: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from("gym_staff")
      .update({
        status: "terminated",
        terminated_at: new Date().toISOString(),
        termination_reason: reason || null,
      })
      .eq("id", staffId);

    if (error) {
      throw new Error(`Failed to remove staff: ${error.message}`);
    }
  }

  // =====================================================
  // Member Methods
  // =====================================================

  /**
   * Get all members for a gym
   */
  static async getMembers(
    gymId: string,
    filters?: {
      status?: string;
      assigned_coach_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ members: GymMemberWithUser[]; total: number }> {
    const supabase = getSupabaseBrowserClient();

    // Build query for members
    let query = supabase
      .from("gym_members")
      .select("*", { count: "exact" })
      .eq("gym_id", gymId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.assigned_coach_id) {
      query = query.eq("assigned_coach_id", filters.assigned_coach_id);
    }

    query = query.order("registered_at", { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    const { data: membersData, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    if (!membersData || membersData.length === 0) {
      return { members: [], total: 0 };
    }

    // Get unique user IDs and coach IDs
    const userIds = membersData.map((m) => m.user_id);
    const coachIds = membersData
      .map((m) => m.assigned_coach_id)
      .filter((id): id is string => id !== null);

    // Fetch user emails
    const { data: usersData } = await supabase
      .from("users")
      .select("id, email")
      .in("id", [...userIds, ...coachIds]);

    // Fetch user profiles
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("user_id, first_name")
      .in("user_id", userIds);

    // Create maps for quick lookup
    const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);
    const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

    const members = membersData.map((member) => ({
      ...member,
      user: {
        email: usersMap.get(member.user_id)?.email || "",
        first_name: profilesMap.get(member.user_id)?.first_name || undefined,
      },
      coach: member.assigned_coach_id
        ? {
            email: usersMap.get(member.assigned_coach_id)?.email || "",
          }
        : undefined,
    })) as GymMemberWithUser[];

    return { members, total: count || 0 };
  }

  /**
   * Update member
   */
  static async updateMember(
    memberId: string,
    input: UpdateMemberInput
  ): Promise<GymMember> {
    const validated = updateMemberSchema.parse(input);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("gym_members")
      .update(validated)
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member: ${error.message}`);
    }

    return data as GymMember;
  }

  /**
   * Register member via invite code
   */
  static async registerMemberByCode(
    userId: string,
    inviteCode: string
  ): Promise<string> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("register_gym_member_by_code", {
      p_user_id: userId,
      p_invite_code: inviteCode,
    });

    if (error) {
      throw new Error(`Failed to register: ${error.message}`);
    }

    return data as string;
  }

  /**
   * Register member via slug URL
   */
  static async registerMemberBySlug(
    userId: string,
    slug: string
  ): Promise<string> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase.rpc("register_gym_member_by_slug", {
      p_user_id: userId,
      p_slug: slug,
    });

    if (error) {
      throw new Error(`Failed to register: ${error.message}`);
    }

    return data as string;
  }

  /**
   * Leave gym - Member removes themselves from gym
   */
  static async leaveGym(userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();

    // 1. Update gym_members status to 'churned'
    const { error: memberError } = await supabase
      .from("gym_members")
      .update({
        status: "churned",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (memberError) {
      throw new Error(`Failed to leave gym: ${memberError.message}`);
    }

    // 2. Clear gym_id from user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ gym_id: null })
      .eq("user_id", userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }
  }

  // =====================================================
  // Stats Methods
  // =====================================================

  /**
   * Get gym statistics
   */
  static async getStats(gymId: string): Promise<GymStats> {
    const supabase = getSupabaseBrowserClient();

    // Get member counts
    const { data: memberData } = await supabase
      .from("gym_members")
      .select("status", { count: "exact" })
      .eq("gym_id", gymId);

    const totalMembers = memberData?.length || 0;
    const activeMembers =
      memberData?.filter((m) => m.status === "active").length || 0;

    // Get staff counts
    const { data: staffData } = await supabase
      .from("gym_staff")
      .select("status", { count: "exact" })
      .eq("gym_id", gymId);

    const totalStaff = staffData?.length || 0;
    const activeStaff =
      staffData?.filter((s) => s.status === "active").length || 0;

    // Get members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: membersThisMonth } = await supabase
      .from("gym_members")
      .select("*", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .gte("registered_at", startOfMonth.toISOString());

    // Get workouts this month (from gym members)
    const { data: memberIds } = await supabase
      .from("gym_members")
      .select("user_id")
      .eq("gym_id", gymId)
      .eq("status", "active");

    let workoutsThisMonth = 0;
    if (memberIds && memberIds.length > 0) {
      const userIds = memberIds.map((m) => m.user_id);
      const { count } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds)
        .eq("status", "completed")
        .gte("completed_at", startOfMonth.toISOString());

      workoutsThisMonth = count || 0;
    }

    return {
      total_members: totalMembers,
      active_members: activeMembers,
      total_staff: totalStaff,
      active_staff: activeStaff,
      members_this_month: membersThisMonth || 0,
      workouts_this_month: workoutsThisMonth,
    };
  }

  // =====================================================
  // Validation Methods
  // =====================================================

  /**
   * Check if invite code is valid
   */
  static async validateInviteCode(code: string): Promise<{
    valid: boolean;
    gym?: { name: string; slug: string };
  }> {
    const gym = await this.getGymByInviteCode(code);

    if (!gym) {
      return { valid: false };
    }

    if (!["trial", "active"].includes(gym.subscription_status)) {
      return { valid: false };
    }

    return {
      valid: true,
      gym: { name: gym.name, slug: gym.slug },
    };
  }

  /**
   * Check if slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    const gym = await this.getGymBySlug(slug);
    return gym === null;
  }
}
