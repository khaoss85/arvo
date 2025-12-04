import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";
import { isCoach } from "@/lib/utils/auth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TemplateExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: string;
  weight_kg: number | null;
  rir: number | null;
  rest_seconds?: number;
  notes: string | null;
  equipment: string;
  target_muscle: string;
  body_part: string;
  animation_url: string | null;
  advancedTechnique?: {
    technique: string;
    config: Record<string, unknown>;
    rationale: string;
  };
}

/**
 * POST /api/coach/create-template
 * Create a standalone workout template
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
    const { name, description, workout_type, exercises, tags, ai_suggestions_enabled } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: "At least one exercise is required" },
        { status: 400 }
      );
    }

    // Parse rep ranges for each exercise (same logic as create-custom-workout)
    const parseRepRange = (reps: string): [number, number] => {
      if (reps.includes("-")) {
        const [min, max] = reps.split("-").map((r) => parseInt(r.trim(), 10));
        return [min || 8, max || 12];
      }
      const num = parseInt(reps, 10);
      return [num || 8, num || 8];
    };

    // Format exercises for template storage
    const formattedExercises = (exercises as TemplateExercise[]).map((ex, index) => {
      const [minReps, maxReps] = parseRepRange(ex.reps);
      return {
        exerciseName: ex.exercise_name,
        name: ex.exercise_name,
        equipmentVariant: ex.equipment,
        equipment: ex.equipment,
        sets: ex.sets,
        repRange: [minReps, maxReps],
        restSeconds: ex.rest_seconds ?? 120,
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
        // Include advanced technique if present
        advancedTechnique: ex.advancedTechnique || undefined,
      };
    });

    // Calculate target muscle groups
    const targetMuscleGroups = Array.from(new Set(
      (exercises as TemplateExercise[]).map((ex) => ex.body_part)
    ));

    // Create template
    const template = await CoachService.createTemplate({
      coach_id: user.id,
      name: name.trim(),
      description: description || null,
      workout_type: workout_type || null,
      exercises: formattedExercises as any,
      target_muscle_groups: targetMuscleGroups,
      tags: tags || [],
      is_public: false,
      ai_suggestions_enabled: ai_suggestions_enabled ?? true,
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("[CreateTemplate] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create template",
      },
      { status: 500 }
    );
  }
}
