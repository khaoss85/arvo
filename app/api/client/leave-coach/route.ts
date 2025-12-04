import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/client/leave-coach
 * Client disconnects from their current coach
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

    // Get current user profile to find coach_id
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("coach_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.coach_id) {
      return NextResponse.json(
        { error: "You are not connected to any coach" },
        { status: 400 }
      );
    }

    // Find the active relationship
    const { data: relationship, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("id")
      .eq("coach_id", profile.coach_id)
      .eq("client_id", user.id)
      .eq("status", "active")
      .single();

    if (relError || !relationship) {
      // Still clear coach_id even if relationship not found
      await supabase
        .from("user_profiles")
        .update({ coach_id: null })
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        message: "Disconnected from coach",
      });
    }

    // Terminate the relationship
    const { error: updateError } = await supabase
      .from("coach_client_relationships")
      .update({
        status: "terminated",
        terminated_at: new Date().toISOString(),
        termination_reason: "Client initiated disconnect",
      })
      .eq("id", relationship.id);

    if (updateError) {
      throw new Error(`Failed to terminate relationship: ${updateError.message}`);
    }

    // Clear coach_id from user profile
    await supabase
      .from("user_profiles")
      .update({ coach_id: null })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Successfully disconnected from coach",
    });
  } catch (error) {
    console.error("[LeaveCoach] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to leave coach",
      },
      { status: 500 }
    );
  }
}
