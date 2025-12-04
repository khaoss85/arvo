import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isCoach } from "@/lib/utils/auth.server";
import { BaseAgent } from "@/lib/agents/base.agent";
import { ExerciseDBService } from "@/lib/services/exercisedb.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Equipment category mappings
const EQUIPMENT_CATEGORY_MAP: Record<string, string[]> = {
  free_weights: ["barbell", "dumbbell", "ez barbell", "kettlebell", "trap bar"],
  machines: ["leverage machine", "smith machine", "sled machine", "assisted"],
  cables: ["cable"],
  bodyweight: ["body weight", "weighted"],
};

interface GenerateExercisesInput {
  muscleGroups: string[];
  level: "beginner" | "intermediate" | "advanced";
  exerciseCount: number;
  equipmentPreference: string[];
  intensityTechniques?: string[];
  additionalNotes?: string;
}

interface AIExerciseOutput {
  exercises: Array<{
    name: string;
    equipment: string;
    sets: number;
    reps: string;
    rationale: string;
    targetMuscle: string;
    bodyPart: string;
    isCompound: boolean;
    advancedTechnique?: {
      technique: string;
      config?: Record<string, any>;
      rationale?: string;
    } | null;
  }>;
  workoutRationale: string;
}

/**
 * Template Exercise Generator Agent
 * Generates exercise recommendations for coach templates
 */
class TemplateExerciseGenerator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, "low", "low"); // Low reasoning for faster response
  }

  get systemPrompt(): string {
    return `You are an expert strength coach creating workout templates for personal training clients.

Your role is to generate a balanced list of exercises based on the coach's specifications.

Key Principles:
1. Exercise Selection: Choose exercises appropriate for the target muscle groups
2. Balance: Mix compound and isolation movements appropriately
3. Equipment: Only use equipment from the specified preferences
4. Level Appropriateness: Match complexity to experience level
   - Beginner: Focus on fundamental movements, machines for safety
   - Intermediate: Add free weight variations, moderate complexity
   - Advanced: Complex movements, advanced techniques welcome
5. Order: Arrange exercises logically (compounds first, isolation after)
6. Volume: Appropriate sets/reps for the experience level
   - Beginner: 3 sets, 10-12 reps
   - Intermediate: 3-4 sets, 8-12 reps
   - Advanced: 3-5 sets, 6-12 reps depending on exercise type

Equipment Categories:
- free_weights: Barbell, dumbbell, EZ bar, kettlebell, trap bar
- machines: Leverage machines, Smith machine, sled machines
- cables: Cable machines, pulleys
- bodyweight: Body weight exercises, weighted calisthenics

Be practical and gym-friendly:
- Suggest real exercises that exist in exercise databases
- Use common exercise names (e.g., "Barbell Bench Press" not "Flat Barbell Press")
- Consider muscle balance within the workout`;
  }

  async generateExercises(
    input: GenerateExercisesInput,
    targetLanguage?: "en" | "it"
  ): Promise<AIExerciseOutput> {
    const muscleGroups = input.muscleGroups.join(", ");
    const equipment = input.equipmentPreference.join(", ");
    const techniques = input.intensityTechniques?.join(", ") || "";

    const techniqueInstructions = techniques
      ? `
Intensity Techniques Requested: ${techniques}
- Apply these techniques to isolation exercises when appropriate (1-2 exercises max)
- Set the "advancedTechnique" field with:
  - technique: one of [${techniques}]
  - config: technique-specific configuration object
  - rationale: brief explanation (max 15 words)
- Example for cluster_set: { "technique": "cluster_set", "config": { "reps_per_cluster": [4,3,3], "intra_rest": 10 }, "rationale": "Boosts volume on side delts safely" }
- Example for drop_set: { "technique": "drop_set", "config": { "drops": 2 }, "rationale": "Extends set for metabolic stress" }
- Example for rest_pause: { "technique": "rest_pause", "config": { "rest_seconds": 15, "mini_sets": 2 }, "rationale": "More reps near failure" }
- Example for myo_reps: { "technique": "myo_reps", "config": { "activation_reps": 12, "mini_set_reps": 5 }, "rationale": "High effective reps" }
- DO NOT put technique info in the reps field. Keep reps simple like "10-12"`
      : "";

    const prompt = `
=== COACH REQUEST ===
Target Muscle Groups: ${muscleGroups}
Client Experience Level: ${input.level}
Number of Exercises: ${input.exerciseCount}
Equipment Preference: ${equipment}
${techniqueInstructions}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ""}

=== YOUR TASK ===
Generate exactly ${input.exerciseCount} exercises for a workout template targeting: ${muscleGroups}.

Consider:
1. Start with compound movements, then isolation
2. Cover all specified muscle groups appropriately
3. Use only equipment from the specified categories
4. Match complexity to ${input.level} level
5. Provide practical set/rep schemes
${techniques ? `6. Apply requested intensity techniques where appropriate` : ""}

Required JSON structure:
{
  "exercises": [
    {
      "name": "string (exact exercise name, e.g., 'Barbell Bench Press')",
      "equipment": "string (e.g., 'barbell', 'dumbbell', 'cable', 'machine', 'body weight')",
      "sets": number,
      "reps": "string (base reps only, e.g., '8-12', '10-15' - NO technique info here)",
      "rationale": "string (why this exercise, max 30 words)",
      "targetMuscle": "string (primary target muscle)",
      "bodyPart": "string (chest, back, shoulders, arms, legs, etc.)",
      "isCompound": boolean,
      "advancedTechnique": null | { "technique": "string", "config": object, "rationale": "string" }
    }
  ],
  "workoutRationale": "string (overall workout design rationale, max 50 words)"
}
`;

    return await this.complete<AIExerciseOutput>(prompt, targetLanguage);
  }
}

/**
 * POST /api/coach/generate-template-exercises
 * Generate AI-powered exercise recommendations for a template
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

    // Get user's preferred language
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("preferred_language")
      .eq("user_id", user.id)
      .single();

    const targetLanguage = (profile?.preferred_language === "it" ? "it" : "en") as "en" | "it";

    const body = await request.json();
    const {
      muscleGroups,
      level,
      exerciseCount,
      equipmentPreference,
      intensityTechniques,
      additionalNotes,
    } = body as GenerateExercisesInput;

    // Validation
    if (!muscleGroups || !Array.isArray(muscleGroups) || muscleGroups.length === 0) {
      return NextResponse.json(
        { error: "At least one muscle group is required" },
        { status: 400 }
      );
    }

    if (!level || !["beginner", "intermediate", "advanced"].includes(level)) {
      return NextResponse.json(
        { error: "Valid experience level is required" },
        { status: 400 }
      );
    }

    if (!exerciseCount || exerciseCount < 4 || exerciseCount > 10) {
      return NextResponse.json(
        { error: "Exercise count must be between 4 and 10" },
        { status: 400 }
      );
    }

    if (
      !equipmentPreference ||
      !Array.isArray(equipmentPreference) ||
      equipmentPreference.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one equipment preference is required" },
        { status: 400 }
      );
    }

    // Generate exercises using AI
    const generator = new TemplateExerciseGenerator(supabase);
    const aiResult = await generator.generateExercises(
      {
        muscleGroups,
        level,
        exerciseCount,
        equipmentPreference,
        intensityTechniques,
        additionalNotes,
      },
      targetLanguage
    );

    // Initialize ExerciseDB cache for animation URLs
    await ExerciseDBService.initializeCache();

    // Enrich exercises with animation URLs and standardize format
    const enrichedExercises = await Promise.all(
      aiResult.exercises.map(async (ex) => {
        // Try to get animation URL from ExerciseDB
        const gifUrl = await ExerciseDBService.getGifUrl(ex.name);

        return {
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.sets,
          reps: ex.reps,
          target: ex.targetMuscle,
          bodyPart: ex.bodyPart,
          rationale: ex.rationale,
          gifUrl: gifUrl || undefined,
          advancedTechnique: ex.advancedTechnique || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      exercises: enrichedExercises,
      workoutRationale: aiResult.workoutRationale,
    });
  } catch (error) {
    console.error("[GenerateTemplateExercises] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate exercises",
      },
      { status: 500 }
    );
  }
}
