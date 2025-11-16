'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SplitPlanner, type SplitPlannerInput } from '@/lib/agents/split-planner.agent'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { SplitTimelineService } from '@/lib/services/split-timeline.service'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'

/**
 * Generate a new split plan using AI
 * Server action to access OpenAI API key
 */
export async function generateSplitPlanAction(
  input: SplitPlannerInput,
  generationRequestId?: string
) {
  try {
    const supabase = await getSupabaseServerClient()
    const targetLanguage = await getUserLanguage(input.userId)

    // Check if this generation already completed (resume check)
    if (generationRequestId) {
      const queueEntry = await GenerationQueueService.getByRequestIdServer(generationRequestId)

      if (queueEntry?.status === 'completed' && queueEntry.split_plan_id) {
        console.log(`[GenerateSplit] Returning completed split: ${generationRequestId}`)

        // Fetch the completed split plan
        const { data: splitPlan } = await supabase
          .from('split_plans')
          .select('*')
          .eq('id', queueEntry.split_plan_id)
          .single()

        if (splitPlan) {
          return {
            success: true,
            data: {
              splitPlan,
              rationale: null, // Not stored in queue entry
              weeklyScheduleExample: null, // Not stored in queue entry
            }
          }
        }
      }

      // Create queue entry (marks intent to generate)
      if (!queueEntry) {
        await GenerationQueueService.createServer({
          userId: input.userId,
          requestId: generationRequestId,
          context: { type: 'split', splitType: input.splitType }
        })
        console.log(`[GenerateSplit] Created queue entry: ${generationRequestId}`)
      }
    }

    // Use SplitPlanner agent with server client
    const splitPlanner = new SplitPlanner(supabase)

    // Generate split plan using AI
    const splitPlanData = await splitPlanner.planSplit(input, targetLanguage)

    // Create split plan in database
    const splitPlanBase = {
      user_id: input.userId,
      approach_id: input.approachId,
      split_type: input.splitType,
      cycle_days: splitPlanData.cycleDays,
      sessions: splitPlanData.sessions as any,
      frequency_map: splitPlanData.frequencyMap as any,
      volume_distribution: splitPlanData.volumeDistribution as any,
      active: true,
    }

    // Add specialization fields for weak_point_focus splits
    const splitPlanData_final = input.splitType === 'weak_point_focus' && input.specializationMuscle
      ? {
          ...splitPlanBase,
          specialization_muscle: input.specializationMuscle,
          specialization_frequency: splitPlanData.frequencyMap?.[input.specializationMuscle] || 3,
          specialization_volume_multiplier: 1.5,
        }
      : splitPlanBase

    const splitPlan = await SplitPlanService.createServer(splitPlanData_final)

    // Mark as completed in queue
    if (generationRequestId && splitPlan?.id) {
      try {
        await GenerationQueueService.markSplitAsCompleted({
          requestId: generationRequestId,
          splitPlanId: splitPlan.id
        })
        console.log(`[GenerateSplit] Marked as completed: ${generationRequestId}`)
      } catch (error) {
        console.error('[GenerateSplit] Failed to mark as completed:', error)
        // Don't throw - split was generated successfully
      }
    }

    return {
      success: true,
      data: {
        splitPlan,
        rationale: splitPlanData.rationale,
        weeklyScheduleExample: splitPlanData.weeklyScheduleExample,
      }
    }
  } catch (error: any) {
    console.error('Error generating split plan:', error)

    // Mark as failed in queue
    if (generationRequestId) {
      try {
        await GenerationQueueService.markAsFailed({
          requestId: generationRequestId,
          errorMessage: error?.message || 'Split generation failed'
        })
        console.log(`[GenerateSplit] Marked as failed: ${generationRequestId}`)
      } catch (dbError) {
        console.error('[GenerateSplit] Failed to mark as failed:', dbError)
      }
    }

    return {
      success: false,
      error: error?.message || 'Failed to generate split plan'
    }
  }
}

/**
 * Get active split plan for user
 */
export async function getActiveSplitPlanAction(userId: string) {
  try {
    const splitPlan = await SplitPlanService.getActiveServer(userId)

    return {
      success: true,
      data: splitPlan
    }
  } catch (error: any) {
    console.error('Error getting active split plan:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get active split plan'
    }
  }
}

/**
 * Get preview of next workout based on current cycle
 */
export async function getNextWorkoutPreviewAction(userId: string) {
  try {
    const nextWorkoutData = await SplitPlanService.getNextWorkout(userId)

    if (!nextWorkoutData) {
      return {
        success: false,
        error: 'No active split plan found'
      }
    }

    const { session, splitPlan, cycleDay } = nextWorkoutData

    return {
      success: true,
      data: {
        sessionName: session.name,
        workoutType: session.workoutType,
        variation: session.variation,
        focus: session.focus,
        targetVolume: session.targetVolume,
        principles: session.principles,
        cycleDay,
        totalCycleDays: splitPlan.cycle_days,
        splitType: splitPlan.split_type,
        sessions: splitPlan.sessions as any[], // Include all sessions for customization dialog
      }
    }
  } catch (error: any) {
    console.error('Error getting next workout preview:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get next workout preview'
    }
  }
}

/**
 * Manually advance split cycle (for rest days or missed workouts)
 */
export async function advanceSplitCycleAction(userId: string) {
  try {
    console.log('[advanceSplitCycleAction] Starting for userId:', userId)
    const supabase = await getSupabaseServerClient()

    // Get current state
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("current_cycle_day, active_split_plan_id")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error('[advanceSplitCycleAction] Failed to fetch profile:', profileError)
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    if (!profile?.active_split_plan_id) {
      console.error('[advanceSplitCycleAction] No active split plan found')
      throw new Error("No active split plan found")
    }

    console.log('[advanceSplitCycleAction] Current state:', {
      currentDay: profile.current_cycle_day,
      activeSplitPlanId: profile.active_split_plan_id
    })

    // Get split plan cycle_days
    const { data: splitPlan, error: planError } = await supabase
      .from("split_plans")
      .select("cycle_days")
      .eq("id", profile.active_split_plan_id)
      .single()

    if (planError) {
      console.error('[advanceSplitCycleAction] Failed to fetch split plan:', planError)
      throw new Error(`Failed to fetch split plan: ${planError.message}`)
    }

    if (!splitPlan) {
      console.error('[advanceSplitCycleAction] Split plan not found')
      throw new Error("Split plan not found")
    }

    // Calculate next cycle day (wraps around)
    const currentDay = profile.current_cycle_day || 1
    const nextDay = currentDay >= splitPlan.cycle_days ? 1 : currentDay + 1

    console.log('[advanceSplitCycleAction] Advancing:', {
      from: currentDay,
      to: nextDay,
      totalCycleDays: splitPlan.cycle_days,
      wrappedAround: nextDay === 1
    })

    // Update user profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ current_cycle_day: nextDay })
      .eq("user_id", userId)

    if (updateError) {
      console.error('[advanceSplitCycleAction] Failed to update profile:', updateError)
      throw new Error(`Failed to advance cycle: ${updateError.message}`)
    }

    console.log('[advanceSplitCycleAction] Successfully advanced to day:', nextDay)

    return {
      success: true,
      data: { nextDay }
    }
  } catch (error: any) {
    console.error('Error advancing split cycle:', error)
    return {
      success: false,
      error: error?.message || 'Failed to advance split cycle'
    }
  }
}

/**
 * Deactivate current split plan
 */
export async function deactivateSplitPlanAction(userId: string) {
  try {
    await SplitPlanService.deactivateAll(userId)

    return {
      success: true,
      data: null
    }
  } catch (error: any) {
    console.error('Error deactivating split plan:', error)
    return {
      success: false,
      error: error?.message || 'Failed to deactivate split plan'
    }
  }
}

/**
 * Get all split plans for user (including inactive)
 */
export async function getAllSplitPlansAction(userId: string) {
  try {
    const splitPlans = await SplitPlanService.getAll(userId)

    return {
      success: true,
      data: splitPlans
    }
  } catch (error: any) {
    console.error('Error getting split plans:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get split plans'
    }
  }
}

/**
 * Activate an existing split plan
 */
export async function activateSplitPlanAction(
  splitPlanId: string,
  userId: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Deactivate all other plans
    await SplitPlanService.deactivateAll(userId)

    // Activate this plan
    await supabase
      .from('split_plans')
      .update({ active: true })
      .eq('id', splitPlanId)
      .eq('user_id', userId)

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        active_split_plan_id: splitPlanId,
        current_cycle_day: 1,
        current_cycle_start_date: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return {
      success: true,
      data: null
    }
  } catch (error: any) {
    console.error('Error activating split plan:', error)
    return {
      success: false,
      error: error?.message || 'Failed to activate split plan'
    }
  }
}

/**
 * Get complete timeline data for split cycle
 */
export async function getSplitTimelineDataAction(userId: string) {
  try {
    const timelineData = await SplitTimelineService.getTimelineDataServer(userId)

    return {
      success: true,
      data: timelineData
    }
  } catch (error: any) {
    console.error('Error getting split timeline data:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get split timeline data'
    }
  }
}

/**
 * Get the last completed cycle for a user
 */
export async function getLastCycleCompletionAction(userId: string) {
  try {
    const lastCycle = await CycleStatsService.getLastCycleCompletion(userId)

    return {
      success: true,
      data: lastCycle
    }
  } catch (error: any) {
    console.error('Error getting last cycle completion:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get last cycle completion'
    }
  }
}

/**
 * Get current cycle stats with comparison to previous cycle
 */
export async function getCycleComparisonAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("active_split_plan_id, cycles_completed")
      .eq("user_id", userId)
      .single()

    if (!profile?.active_split_plan_id) {
      return {
        success: false,
        error: 'No active split plan found'
      }
    }

    // Calculate current cycle stats
    const currentStats = await CycleStatsService.calculateCycleStats(
      userId,
      profile.active_split_plan_id
    )

    // Get comparison with previous cycle
    const comparison = await CycleStatsService.getComparisonWithPreviousCycle(
      currentStats,
      userId
    )

    return {
      success: true,
      data: {
        currentStats,
        comparison,
        cycleNumber: (profile.cycles_completed || 0) + 1
      }
    }
  } catch (error: any) {
    console.error('Error getting cycle comparison:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get cycle comparison'
    }
  }
}

/**
 * Change the active split plan and reset cycle tracking
 */
export async function changeSplitPlanAction(
  userId: string,
  newSplitPlanId: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Deactivate all other plans
    await SplitPlanService.deactivateAll(userId)

    // Activate the new plan
    await supabase
      .from('split_plans')
      .update({ active: true })
      .eq('id', newSplitPlanId)
      .eq('user_id', userId)

    // Update user profile with new split and reset cycle tracking
    await supabase
      .from('user_profiles')
      .update({
        active_split_plan_id: newSplitPlanId,
        current_cycle_day: 1,
        current_cycle_start_date: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return {
      success: true,
      data: null
    }
  } catch (error: any) {
    console.error('Error changing split plan:', error)
    return {
      success: false,
      error: error?.message || 'Failed to change split plan'
    }
  }
}
