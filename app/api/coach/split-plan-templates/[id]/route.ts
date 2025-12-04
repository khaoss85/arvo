import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";
import { isCoach } from "@/lib/utils/auth.server";
import type { SessionDefinition, SplitType } from "@/lib/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/coach/split-plan-templates/[id]
 * Update a split plan template
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Verify template ownership
    const existingTemplate = await CoachService.getSplitPlanTemplateServer(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    if (existingTemplate.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      split_type,
      cycle_days,
      sessions,
      frequency_map,
      volume_distribution,
      tags,
      is_public,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description || null;
    if (split_type !== undefined) updates.split_type = split_type as SplitType;
    if (cycle_days !== undefined) {
      if (cycle_days < 1 || cycle_days > 14) {
        return NextResponse.json(
          { error: "Cycle days must be between 1 and 14" },
          { status: 400 }
        );
      }
      updates.cycle_days = cycle_days;
    }
    if (sessions !== undefined) {
      if (!Array.isArray(sessions) || sessions.length === 0) {
        return NextResponse.json(
          { error: "At least one session is required" },
          { status: 400 }
        );
      }
      updates.sessions = sessions as SessionDefinition[];
    }
    if (frequency_map !== undefined) updates.frequency_map = frequency_map;
    if (volume_distribution !== undefined)
      updates.volume_distribution = volume_distribution;
    if (tags !== undefined) updates.tags = tags;
    if (is_public !== undefined) updates.is_public = is_public;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    const template = await CoachService.updateSplitPlanTemplateServer(
      id,
      updates
    );

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("[UpdateSplitPlanTemplate] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update template",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coach/split-plan-templates/[id]
 * Delete a split plan template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Verify template ownership
    const existingTemplate = await CoachService.getSplitPlanTemplateServer(id);
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

    await CoachService.deleteSplitPlanTemplateServer(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[DeleteSplitPlanTemplate] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete template",
      },
      { status: 500 }
    );
  }
}
