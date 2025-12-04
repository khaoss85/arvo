import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WorkoutGeneratorService } from "@/lib/services/workout-generator.service";
import { CoachService } from "@/lib/services/coach.service";
import { isCoach } from "@/lib/utils/auth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/coach/generate-workout
 * Generate a workout for a client as a coach
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
    const { targetUserId, coachNotes, assignmentType, plannedDate } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    // Verify coach-client relationship
    const relationship = await CoachService.getClientRelationshipServer(
      user.id,
      targetUserId,
      supabase
    );

    if (!relationship || relationship.status !== "active") {
      return NextResponse.json(
        { error: "No active relationship with this client" },
        { status: 403 }
      );
    }

    // Generate workout for client using coach context
    // Validate and use plannedDate, default to today
    const validPlannedDate = plannedDate || new Date().toISOString().split("T")[0];

    const result = await WorkoutGeneratorService.generateWorkout(user.id, {
      coachId: user.id,
      targetUserId,
      coachNotes,
      assignmentType: assignmentType || "ai_generated",
      status: "ready",
      plannedAt: validPlannedDate,
      supabaseClient: supabase,
    });

    return NextResponse.json({
      success: true,
      workout: result.workout,
      insightInfluencedChanges: result.insightInfluencedChanges,
    });
  } catch (error) {
    console.error("[CoachGenerateWorkout] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate workout",
      },
      { status: 500 }
    );
  }
}
