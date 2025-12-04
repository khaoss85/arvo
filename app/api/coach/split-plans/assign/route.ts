import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CoachService } from "@/lib/services/coach.service";
import { SplitPlanService } from "@/lib/services/split-plan.service";
import { isCoach } from "@/lib/utils/auth.server";
import type { SplitType } from "@/lib/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/coach/split-plans/assign
 * Assign a split plan to a client
 *
 * This creates a new split plan for the client based on a template or custom config,
 * updates the client's profile to use the new split plan, and creates an assignment record.
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
      clientId,
      templateId,
      customConfig,
      coachNotes,
      assignmentType,
    } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    if (!templateId && !customConfig) {
      return NextResponse.json(
        { error: "Either templateId or customConfig is required" },
        { status: 400 }
      );
    }

    // Verify coach-client relationship
    const relationship = await CoachService.getClientRelationshipServer(
      user.id,
      clientId
    );

    if (!relationship || relationship.status !== "active") {
      return NextResponse.json(
        { error: "No active relationship with this client" },
        { status: 403 }
      );
    }

    let splitPlanData: {
      split_type: string;
      cycle_days: number;
      sessions: unknown;
      frequency_map?: unknown;
      volume_distribution?: unknown;
    };
    let sourceTemplateId: string | null = null;

    // Get split plan data from template or custom config
    if (templateId) {
      const template = await CoachService.getSplitPlanTemplateServer(templateId);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      // Only allow coach's own templates or public templates
      if (template.coach_id !== user.id && !template.is_public) {
        return NextResponse.json(
          { error: "Template not accessible" },
          { status: 403 }
        );
      }

      splitPlanData = {
        split_type: template.split_type,
        cycle_days: template.cycle_days,
        sessions: template.sessions,
        frequency_map: template.frequency_map,
        volume_distribution: template.volume_distribution,
      };
      sourceTemplateId = templateId;

      // Increment template usage count
      await CoachService.incrementSplitPlanTemplateUsageServer(templateId);
    } else {
      // Validate custom config
      if (
        !customConfig.split_type ||
        !customConfig.cycle_days ||
        !customConfig.sessions
      ) {
        return NextResponse.json(
          { error: "customConfig must include split_type, cycle_days, and sessions" },
          { status: 400 }
        );
      }
      if (customConfig.cycle_days < 1 || customConfig.cycle_days > 14) {
        return NextResponse.json(
          { error: "cycle_days must be between 1 and 14" },
          { status: 400 }
        );
      }
      if (!Array.isArray(customConfig.sessions) || customConfig.sessions.length === 0) {
        return NextResponse.json(
          { error: "At least one session is required" },
          { status: 400 }
        );
      }

      splitPlanData = {
        split_type: customConfig.split_type,
        cycle_days: customConfig.cycle_days,
        sessions: customConfig.sessions,
        frequency_map: customConfig.frequency_map || null,
        volume_distribution: customConfig.volume_distribution || null,
      };
    }

    // 1. Deactivate any existing split plans for the client
    const { error: deactivateError } = await supabase
      .from("split_plans")
      .update({ active: false })
      .eq("user_id", clientId)
      .eq("active", true);

    if (deactivateError) {
      console.error("[AssignSplitPlan] Error deactivating old plans:", deactivateError);
    }

    // 2. Create new split plan for the client
    const splitPlan = await SplitPlanService.createServer(
      {
        user_id: clientId,
        approach_id: null,
        split_type: splitPlanData.split_type as SplitType,
        cycle_days: splitPlanData.cycle_days,
        sessions: splitPlanData.sessions as Record<string, unknown>[],
        frequency_map: (splitPlanData.frequency_map || {}) as Record<string, number>,
        volume_distribution: (splitPlanData.volume_distribution || {}) as Record<string, number>,
        active: true,
      },
      supabase
    );

    // 3. Update client's profile with the new split plan
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        active_split_plan_id: splitPlan.id,
        current_cycle_day: 1,
        current_cycle_start_date: new Date().toISOString(),
        cycles_completed: 0,
        preferred_split: splitPlanData.split_type,
      })
      .eq("user_id", clientId);

    if (profileError) {
      console.error("[AssignSplitPlan] Error updating client profile:", profileError);
      // Try to rollback the split plan creation
      await supabase.from("split_plans").delete().eq("id", splitPlan.id);
      throw new Error("Failed to update client profile");
    }

    // 4. Create assignment record for tracking
    const assignment = await CoachService.createSplitPlanAssignmentServer({
      coach_id: user.id,
      client_id: clientId,
      split_plan_id: splitPlan.id,
      template_id: sourceTemplateId,
      assignment_type: (assignmentType || (templateId ? "template" : "custom")) as "ai_generated" | "template" | "custom",
      coach_notes: coachNotes || null,
      assigned_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      splitPlan,
      assignment,
    });
  } catch (error) {
    console.error("[AssignSplitPlan] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign split plan",
      },
      { status: 500 }
    );
  }
}
