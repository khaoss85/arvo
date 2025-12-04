import { NextRequest, NextResponse } from "next/server";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";

export async function POST(request: NextRequest) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, newName } = body;

    if (!templateId || !newName) {
      return NextResponse.json(
        { error: "templateId and newName are required" },
        { status: 400 }
      );
    }

    // Get the original template
    const originalTemplate = await CoachService.getTemplate(templateId);

    if (!originalTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (originalTemplate.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only duplicate your own templates" },
        { status: 403 }
      );
    }

    // Create the duplicate
    const newTemplate = await CoachService.createTemplate({
      coach_id: user.id,
      name: newName,
      description: originalTemplate.description,
      workout_type: originalTemplate.workout_type,
      exercises: originalTemplate.exercises,
      target_muscle_groups: originalTemplate.target_muscle_groups,
      tags: originalTemplate.tags,
      is_public: false, // Duplicates are always private
      ai_suggestions_enabled: originalTemplate.ai_suggestions_enabled ?? true,
    });

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("[API] Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
