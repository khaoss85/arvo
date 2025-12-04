import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";
import { isCoach } from "@/lib/utils/auth.server";
import type { SessionDefinition, SplitType } from "@/lib/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/coach/split-plan-templates
 * List all split plan templates for the current coach
 */
export async function GET(request: NextRequest) {
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

    const templates = await CoachService.getSplitPlanTemplatesServer(user.id);

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("[GetSplitPlanTemplates] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get templates",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coach/split-plan-templates
 * Create a new split plan template
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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!split_type) {
      return NextResponse.json(
        { error: "Split type is required" },
        { status: 400 }
      );
    }

    if (!cycle_days || cycle_days < 1 || cycle_days > 14) {
      return NextResponse.json(
        { error: "Cycle days must be between 1 and 14" },
        { status: 400 }
      );
    }

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: "At least one session is required" },
        { status: 400 }
      );
    }

    // Create template
    const template = await CoachService.createSplitPlanTemplateServer({
      coach_id: user.id,
      name: name.trim(),
      description: description || null,
      split_type: split_type as SplitType,
      cycle_days,
      sessions: sessions as SessionDefinition[],
      frequency_map: frequency_map || null,
      volume_distribution: volume_distribution || null,
      tags: tags || null,
      is_public: is_public || false,
      is_system: false, // User-created templates are never system templates
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("[CreateSplitPlanTemplate] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create template",
      },
      { status: 500 }
    );
  }
}
