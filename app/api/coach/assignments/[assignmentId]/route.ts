import { NextRequest, NextResponse } from "next/server";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId } = params;
    const body = await request.json();
    const { coach_notes, client_notes } = body;

    const supabase = await getSupabaseServerClient();

    // First verify the coach owns this assignment
    const { data: assignment, error: fetchError } = await supabase
      .from("coach_workout_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own assignments" },
        { status: 403 }
      );
    }

    // Update the assignment
    const updates: Record<string, string | null> = {};
    if (coach_notes !== undefined) updates.coach_notes = coach_notes;
    if (client_notes !== undefined) updates.client_notes = client_notes;

    const { data: updatedAssignment, error: updateError } = await supabase
      .from("coach_workout_assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error("[API] Error updating assignment:", updateError);
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error("[API] Error in PATCH /api/coach/assignments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
