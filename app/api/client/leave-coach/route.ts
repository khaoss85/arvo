import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/client/leave-coach
 * Check if user has an archived split plan that can be restored
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for archived split plans
    const { data: archivedSplit } = await supabase
      .from("split_plans")
      .select("id, split_type, archived_at")
      .eq("user_id", user.id)
      .eq("archived_reason", "coach_replaced")
      .order("archived_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      hasArchivedSplit: !!archivedSplit,
      archivedSplit: archivedSplit
        ? {
            id: archivedSplit.id,
            splitType: archivedSplit.split_type,
            archivedAt: archivedSplit.archived_at,
          }
        : null,
    });
  } catch (error) {
    console.error("[LeaveCoach GET] Error:", error);
    return NextResponse.json({ hasArchivedSplit: false, archivedSplit: null });
  }
}

/**
 * POST /api/client/leave-coach
 * Client disconnects from their current coach
 *
 * Body: { restorePreviousSplit?: boolean }
 * - If true, restores the client's previous split plan (archived by coach)
 * - If false/undefined, keeps current split plan (becomes client-owned)
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

    // Parse request body for options
    let restorePreviousSplit = false;
    try {
      const body = await request.json();
      restorePreviousSplit = body.restorePreviousSplit === true;
    } catch {
      // No body or invalid JSON - use default (keep current)
    }

    // Get current user profile to find coach_id
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("coach_id, active_split_plan_id")
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

    // Handle split plan based on user choice
    let restoredSplitId: string | null = null;

    if (restorePreviousSplit) {
      // Find the most recent archived split that was replaced by coach
      const { data: archivedSplit } = await supabase
        .from("split_plans")
        .select("id, split_type")
        .eq("user_id", user.id)
        .eq("archived_reason", "coach_replaced")
        .order("archived_at", { ascending: false })
        .limit(1)
        .single();

      if (archivedSplit) {
        // Deactivate current split (coach's split)
        if (profile.active_split_plan_id) {
          await supabase
            .from("split_plans")
            .update({ active: false })
            .eq("id", profile.active_split_plan_id);
        }

        // Restore the archived split
        await supabase
          .from("split_plans")
          .update({
            active: true,
            archived_at: null,
            archived_reason: null,
          })
          .eq("id", archivedSplit.id);

        restoredSplitId = archivedSplit.id;

        // Update profile with restored split
        await supabase
          .from("user_profiles")
          .update({
            coach_id: null,
            active_split_plan_id: archivedSplit.id,
            current_cycle_day: 1,
            current_cycle_start_date: new Date().toISOString(),
            preferred_split: archivedSplit.split_type,
          })
          .eq("user_id", user.id);
      } else {
        // No archived split to restore, just clear coach_id
        await supabase
          .from("user_profiles")
          .update({ coach_id: null })
          .eq("user_id", user.id);
      }
    } else {
      // Keep current split (it becomes client-owned), just clear coach_id
      await supabase
        .from("user_profiles")
        .update({ coach_id: null })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: restorePreviousSplit && restoredSplitId
        ? "Disconnected and restored previous plan"
        : "Successfully disconnected from coach",
      restoredSplitId,
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
