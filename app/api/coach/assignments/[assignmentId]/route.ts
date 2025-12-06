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

    // Create in-app notification when client_notes is added/changed
    if (client_notes && client_notes !== assignment.client_notes) {
      try {
        // Fetch workout name
        const { data: workout } = await supabase
          .from("workouts")
          .select("workout_name")
          .eq("id", assignment.workout_id)
          .single();

        // Fetch coach display name
        const { data: coachProfile } = await supabase
          .from("coach_profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();

        // Create notification for client (booking_id and scheduled_for are nullable for non-booking notifications)
        await supabase.from("booking_notifications").insert({
          booking_id: null,
          scheduled_for: null,
          recipient_id: assignment.client_id,
          notification_type: "coach_feedback",
          channel: "in_app",
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            workoutId: assignment.workout_id,
            workoutName: workout?.workout_name || "Workout",
            coachName: coachProfile?.display_name || "Coach",
          },
        });
      } catch (notifError) {
        // Log but don't fail the main operation
        console.error("[API] Error creating feedback notification:", notifError);
      }
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
