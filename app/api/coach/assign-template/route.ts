import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { isCoach } from "@/lib/utils/auth.server";
import type { InsertWorkout } from "@/lib/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/coach/assign-template
 * Assign a workout template to a client
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

    // Verify user is a coach
    const userIsCoach = await isCoach();
    if (!userIsCoach) {
      return NextResponse.json(
        { error: "Only coaches can use this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientId, templateId, coachNotes, plannedDate } = body;

    // Validate and use plannedDate, default to today
    const validPlannedDate = plannedDate || new Date().toISOString().split("T")[0];

    if (!clientId || !templateId) {
      return NextResponse.json(
        { error: "clientId and templateId are required" },
        { status: 400 }
      );
    }

    // Verify coach-client relationship
    const relationship = await CoachService.getClientRelationshipServer(
      user.id,
      clientId,
      supabase
    );

    if (!relationship || relationship.status !== "active") {
      return NextResponse.json(
        { error: "No active relationship with this client" },
        { status: 403 }
      );
    }

    // Get the template
    const template = await CoachService.getTemplate(templateId);
    if (!template || template.coach_id !== user.id) {
      return NextResponse.json(
        { error: "Template not found or not owned by you" },
        { status: 404 }
      );
    }

    // Create workout from template
    const workoutData: InsertWorkout & {
      assigned_by_coach_id?: string;
      coach_locked?: boolean;
      ai_suggestions_enabled?: boolean;
    } = {
      user_id: clientId,
      approach_id: null, // Template-based workout doesn't need approach
      planned_at: validPlannedDate,
      exercises: template.exercises as any,
      started_at: null,
      completed_at: null,
      duration_seconds: null,
      total_volume: null,
      total_sets: null,
      notes: null,
      workout_type: template.workout_type?.[0] || null,
      workout_name: template.name,
      target_muscle_groups: template.target_muscle_groups || null,
      split_type: null,
      split_plan_id: null,
      cycle_day: null,
      variation: null,
      mental_readiness_overall: null,
      status: "ready",
      ai_response_id: null,
      assigned_by_coach_id: user.id,
      coach_locked: false,
      // Propagate AI suggestions setting from template
      ai_suggestions_enabled: template.ai_suggestions_enabled ?? true,
    };

    const workout = await WorkoutService.createServer(
      workoutData as InsertWorkout,
      supabase
    );

    // Create assignment record
    await CoachService.createAssignment({
      workout_id: workout.id,
      coach_id: user.id,
      client_id: clientId,
      assignment_type: "template",
      template_id: templateId,
      coach_notes: coachNotes || null,
      client_notes: null,
      assigned_at: new Date().toISOString(),
      approved_at: null,
    });

    return NextResponse.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error("[CoachAssignTemplate] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign template",
      },
      { status: 500 }
    );
  }
}
