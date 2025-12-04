import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/client/join-coach
 * Client joins a coach using their invite code
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

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = inviteCode.trim().toUpperCase();

    // Find coach by invite code
    const { data: coachProfile, error: coachError } = await supabase
      .from("coach_profiles")
      .select("user_id, display_name")
      .eq("invite_code", normalizedCode)
      .single();

    if (coachError || !coachProfile) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // Check if user is trying to join themselves
    if (coachProfile.user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot be your own coach" },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from("coach_client_relationships")
      .select("id, status")
      .eq("coach_id", coachProfile.user_id)
      .eq("client_id", user.id)
      .single();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { error: "You are already linked to this coach" },
          { status: 400 }
        );
      }

      // Reactivate terminated or paused relationship
      if (existing.status === "terminated" || existing.status === "paused") {
        const { error: updateError } = await supabase
          .from("coach_client_relationships")
          .update({
            status: "active",
            accepted_at: new Date().toISOString(),
            terminated_at: null,
            termination_reason: null,
          })
          .eq("id", existing.id);

        if (updateError) {
          throw new Error(`Failed to reactivate relationship: ${updateError.message}`);
        }

        // Update user profile
        await supabase
          .from("user_profiles")
          .update({ coach_id: coachProfile.user_id })
          .eq("user_id", user.id);

        return NextResponse.json({
          success: true,
          coachName: coachProfile.display_name || "Coach",
          message: "Successfully reconnected with coach",
        });
      }

      // Accept pending invitation
      if (existing.status === "pending") {
        const { error: acceptError } = await supabase
          .from("coach_client_relationships")
          .update({
            status: "active",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (acceptError) {
          throw new Error(`Failed to accept invitation: ${acceptError.message}`);
        }

        await supabase
          .from("user_profiles")
          .update({ coach_id: coachProfile.user_id })
          .eq("user_id", user.id);

        return NextResponse.json({
          success: true,
          coachName: coachProfile.display_name || "Coach",
          message: "Successfully connected with coach",
        });
      }
    }

    // Create new relationship
    const { error: insertError } = await supabase
      .from("coach_client_relationships")
      .insert({
        coach_id: coachProfile.user_id,
        client_id: user.id,
        status: "active",
        client_autonomy: "standard",
        notes: null,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to join coach: ${insertError.message}`);
    }

    // Update user profile with coach_id
    await supabase
      .from("user_profiles")
      .update({ coach_id: coachProfile.user_id })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      coachName: coachProfile.display_name || "Coach",
      message: "Successfully connected with coach",
    });
  } catch (error) {
    console.error("[JoinCoach] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to join coach",
      },
      { status: 500 }
    );
  }
}
