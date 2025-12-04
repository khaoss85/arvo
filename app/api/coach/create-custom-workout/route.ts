import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WorkoutService } from "@/lib/services/workout.service";
import { CoachService } from "@/lib/services/coach.service";
import { isCoach } from "@/lib/utils/auth.server";
import type { InsertWorkout } from "@/lib/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CustomExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: string; // "8-12" or "10"
  weight_kg: number | null;
  rir: number | null;
  notes: string | null;
  equipment: string;
  target_muscle: string;
  body_part: string;
  animation_url: string | null;
}

/**
 * POST /api/coach/create-custom-workout
 * Create a fully custom workout for a client
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
    const { clientId, workoutName, workoutType, exercises, coachNotes, saveAsTemplate, plannedDate } = body;

    // Validate and use plannedDate, default to today
    const validPlannedDate = plannedDate || new Date().toISOString().split("T")[0];

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: "At least one exercise is required" },
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

    // Get client profile to get approach_id
    const { data: clientProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("approach_id, preferred_split")
      .eq("user_id", clientId)
      .single();

    if (profileError || !clientProfile) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Parse rep ranges for each exercise
    const parseRepRange = (reps: string): [number, number] => {
      if (reps.includes("-")) {
        const [min, max] = reps.split("-").map((r) => parseInt(r.trim(), 10));
        return [min || 8, max || 12];
      }
      const num = parseInt(reps, 10);
      return [num || 8, num || 8];
    };

    // Format exercises for workout
    const formattedExercises = (exercises as CustomExercise[]).map((ex, index) => {
      const [minReps, maxReps] = parseRepRange(ex.reps);
      return {
        exerciseName: ex.exercise_name,
        name: ex.exercise_name, // backwards compat
        equipmentVariant: ex.equipment,
        equipment: ex.equipment,
        sets: ex.sets,
        repRange: [minReps, maxReps],
        restSeconds: 120, // default
        tempo: null,
        targetWeight: ex.weight_kg || 0,
        targetReps: minReps,
        rationale: ex.notes || "Coach selected",
        alternatives: [],
        primaryMuscles: [ex.target_muscle],
        secondaryMuscles: [],
        canonicalPattern: undefined,
        movementPattern: undefined,
        romEmphasis: undefined,
        unilateral: false,
        technicalCues: [],
        warmupSets: [],
        setGuidance: [],
        animationUrl: ex.animation_url || undefined,
        hasAnimation: !!ex.animation_url,
        rir: ex.rir ?? 2,
        orderIndex: index,
      };
    });

    // Calculate target muscle groups
    const targetMuscleGroups = Array.from(new Set(
      (exercises as CustomExercise[]).map((ex) => ex.body_part)
    ));

    // Create workout
    const workoutData: InsertWorkout & { assigned_by_coach_id?: string | null } = {
      user_id: clientId,
      approach_id: clientProfile.approach_id,
      planned_at: validPlannedDate,
      exercises: formattedExercises as any,
      started_at: null,
      completed_at: null,
      duration_seconds: null,
      total_volume: null,
      total_sets: null,
      notes: coachNotes || null,
      workout_type: workoutType || "custom",
      workout_name: workoutName || "Custom Workout",
      target_muscle_groups: targetMuscleGroups,
      split_type: clientProfile.preferred_split || "push_pull_legs",
      split_plan_id: null,
      cycle_day: null,
      variation: null,
      mental_readiness_overall: null,
      status: "ready",
      ai_response_id: null,
      assigned_by_coach_id: user.id,
    };

    const workout = await WorkoutService.createServer(workoutData as InsertWorkout, supabase);

    // Create assignment record
    await CoachService.createAssignment({
      workout_id: workout.id,
      coach_id: user.id,
      client_id: clientId,
      assignment_type: "custom",
      template_id: null,
      coach_notes: coachNotes || null,
      client_notes: null,
      assigned_at: new Date().toISOString(),
      approved_at: null,
    });

    // Optionally save as template
    if (saveAsTemplate) {
      try {
        await CoachService.createTemplate({
          coach_id: user.id,
          name: workoutName || "Custom Workout Template",
          description: coachNotes || null,
          workout_type: workoutType || "custom",
          exercises: formattedExercises as any,
          target_muscle_groups: targetMuscleGroups,
          tags: [],
          is_public: false,
          ai_suggestions_enabled: true, // Default to enabled for templates saved from custom workouts
        });
      } catch (templateError) {
        // Log but don't fail - workout was already created
        console.error("[CreateCustomWorkout] Failed to save template:", templateError);
      }
    }

    return NextResponse.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error("[CreateCustomWorkout] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create workout",
      },
      { status: 500 }
    );
  }
}
