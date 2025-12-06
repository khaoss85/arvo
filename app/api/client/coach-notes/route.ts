import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/client/coach-notes
 * Returns shared notes from the client's coach
 * Uses RLS policy that filters for is_shared=true
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's coach relationship with autonomy level
    const { data: relationship, error: relError } = await supabase
      .from("coach_client_relationships")
      .select("id, coach_id, client_autonomy")
      .eq("client_id", user.id)
      .eq("status", "active")
      .single();

    if (relError || !relationship) {
      return NextResponse.json({
        notes: [],
        coachName: null,
        coachBio: null,
        autonomyLevel: null
      });
    }

    // Get coach profile with bio
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("display_name, bio")
      .eq("user_id", relationship.coach_id)
      .single();

    // Get shared notes (RLS ensures only is_shared=true)
    const { data: notes, error: notesError } = await supabase
      .from("coach_client_notes")
      .select("id, content, created_at, updated_at")
      .eq("relationship_id", relationship.id)
      .eq("is_shared", true)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("[CoachNotes] Error fetching notes:", notesError);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notes: notes || [],
      coachName: coachProfile?.display_name || "Coach",
      coachBio: coachProfile?.bio || null,
      autonomyLevel: relationship.client_autonomy || "standard",
    });
  } catch (error) {
    console.error("[CoachNotes] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
