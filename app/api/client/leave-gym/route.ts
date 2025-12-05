import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/client/leave-gym
 * Client leaves their current gym membership
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user profile to find gym_id
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("gym_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.gym_id) {
      return NextResponse.json(
        { error: "You are not a member of any gym" },
        { status: 400 }
      );
    }

    // Update gym_members status to 'churned'
    const { error: memberError } = await supabase
      .from("gym_members")
      .update({
        status: "churned",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("gym_id", profile.gym_id)
      .eq("status", "active");

    if (memberError) {
      console.error("[LeaveGym] Failed to update gym_members:", memberError);
      // Continue even if this fails - still clear gym_id
    }

    // Clear gym_id from user profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ gym_id: null })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left gym",
    });
  } catch (error) {
    console.error("[LeaveGym] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to leave gym",
      },
      { status: 500 }
    );
  }
}
