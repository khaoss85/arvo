import { NextRequest, NextResponse } from "next/server";
import { getUser, requireCoach } from "@/lib/utils/auth.server";
import { CoachService } from "@/lib/services/coach.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// UPDATE template
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get the template to verify ownership
    const existingTemplate = await CoachService.getTemplate(id);

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own templates" },
        { status: 403 }
      );
    }

    // Update the template (including exercises if provided)
    const updatedTemplate = await CoachService.updateTemplate(id, {
      name: body.name,
      description: body.description,
      workout_type: body.workout_type,
      tags: body.tags,
      target_muscle_groups: body.target_muscle_groups,
      exercises: body.exercises,
      ai_suggestions_enabled: body.ai_suggestions_enabled,
    });

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("[API] Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE template
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireCoach();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the template to verify ownership
    const existingTemplate = await CoachService.getTemplate(id);

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own templates" },
        { status: 403 }
      );
    }

    // Delete the template
    await CoachService.deleteTemplate(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
