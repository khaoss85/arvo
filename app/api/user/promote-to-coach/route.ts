import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/user/promote-to-coach
 * Promotes the current user to coach role and creates coach profile if needed
 */
export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check current role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("[PromoteToCoach] Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // If already coach or higher role, just ensure profile exists
    const isAlreadyCoach = ["coach", "gym_owner", "admin"].includes(userData?.role || "");

    // Update role to coach if not already a coach/admin/gym_owner
    if (!isAlreadyCoach) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ role: "coach" })
        .eq("id", user.id);

      if (updateError) {
        console.error("[PromoteToCoach] Error updating role:", updateError);
        return NextResponse.json(
          { error: "Failed to update user role" },
          { status: 500 }
        );
      }
    }

    // Check if coach profile exists
    const { data: existingProfile } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    // Create coach profile if it doesn't exist
    if (!existingProfile) {
      // Get display name from user profile
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("first_name")
        .eq("user_id", user.id)
        .single();

      const displayName = userProfile?.first_name || user.email?.split("@")[0] || "Coach";

      await CoachService.createProfileServer(user.id, { displayName }, supabase);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully promoted to coach",
    });
  } catch (error) {
    console.error("[PromoteToCoach] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to promote to coach",
      },
      { status: 500 }
    );
  }
}
