import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isCoach } from "@/lib/utils/auth.server";
import { BaseAgent } from "@/lib/agents/base.agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface NotesInput {
  exercise_name: string;
  target_muscle: string;
  equipment: string;
}

interface NotesOutput {
  notes: string;
}

/**
 * Simple agent for generating technical cues
 */
class ExerciseNotesGenerator extends BaseAgent {
  constructor(supabaseClient?: any) {
    super(supabaseClient, "low", "low"); // Fast, simple generation
  }

  get systemPrompt(): string {
    return `You are a concise fitness coach. Generate 2-3 brief technical cues for exercises.
Each cue should be:
- Maximum 8 words
- Actionable and specific
- Focus on form, muscle connection, or common mistakes to avoid

Output format: bullet points separated by " • " on a single line.
Example: "Keep chest high • Squeeze at top • Control the negative"`;
  }

  async generateNotes(input: NotesInput, language: "en" | "it"): Promise<NotesOutput> {
    const prompt = `
Exercise: ${input.exercise_name}
Equipment: ${input.equipment}
Target Muscle: ${input.target_muscle}
Language: ${language === "it" ? "Italian" : "English"}

Generate 2-3 brief technical cues for this exercise.

Required JSON format:
{
  "cues": ["cue 1", "cue 2", "cue 3"]
}`;

    try {
      const result = await this.complete<{ cues: string[] }>(prompt, language);

      // Join cues with bullet separator
      const notes = Array.isArray(result?.cues)
        ? result.cues.join(" • ")
        : typeof result === "string"
        ? result
        : "Technical focus required";

      return { notes };
    } catch (error) {
      console.error("[ExerciseNotesGenerator] AI error:", error);
      throw error;
    }
  }
}

/**
 * POST /api/coach/generate-exercise-notes
 * Generate AI-powered technical cues for an exercise
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
    const { exercise_name, target_muscle, equipment } = body as NotesInput;

    if (!exercise_name) {
      return NextResponse.json(
        { error: "Exercise name is required" },
        { status: 400 }
      );
    }

    // Get user language preference
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("preferred_language")
      .eq("user_id", user.id)
      .single();

    const language = (profile?.preferred_language === "it" ? "it" : "en") as "en" | "it";

    // Generate notes
    const generator = new ExerciseNotesGenerator(supabase);
    const result = await generator.generateNotes(
      { exercise_name, target_muscle: target_muscle || "", equipment: equipment || "" },
      language
    );

    return NextResponse.json({
      success: true,
      notes: result.notes,
    });
  } catch (error) {
    console.error("[GenerateExerciseNotes] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate notes",
      },
      { status: 500 }
    );
  }
}
