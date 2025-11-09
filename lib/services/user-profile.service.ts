import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  insertUserProfileSchema,
  updateUserProfileSchema,
  type UserProfile,
  type InsertUserProfile,
  type UpdateUserProfile,
} from "@/lib/types/schemas";

export class UserProfileService {
  /**
   * Get user profile by user ID (client-side)
   */
  static async getByUserId(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data as any as UserProfile;
  }

  /**
   * Create user profile (client-side)
   */
  static async create(profile: InsertUserProfile): Promise<UserProfile> {
    const validated = insertUserProfileSchema.parse(profile);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_profiles")
      // @ts-ignore
      .insert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data as any as UserProfile;
  }

  /**
   * Update user profile (client-side)
   */
  static async update(
    userId: string,
    profile: UpdateUserProfile
  ): Promise<UserProfile> {
    const validated = updateUserProfileSchema.parse({ ...profile, user_id: userId });
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_profiles")
      // @ts-ignore
      .update(validated)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data as any as UserProfile;
  }

  /**
   * Upsert user profile (create or update) (client-side)
   */
  static async upsert(profile: InsertUserProfile): Promise<UserProfile> {
    const validated = insertUserProfileSchema.parse(profile);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("user_profiles")
      // @ts-ignore
      .upsert(validated)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert user profile: ${error.message}`);
    }

    return data as any as UserProfile;
  }

  /**
   * Get user profile by user ID (server-side)
   */
  static async getByUserIdServer(userId: string): Promise<UserProfile | null> {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data as any as UserProfile;
  }
}
