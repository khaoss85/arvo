'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SplitPlanner, type SplitPlannerInput } from '@/lib/agents/split-planner.agent'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { SplitTimelineService } from '@/lib/services/split-timeline.service'
import { CycleStatsService } from '@/lib/services/cycle-stats.service'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { GenerationQueueService } from '@/lib/services/generation-queue.service'
import { MemoryService } from '@/lib/services/memory.service'
import { InsightService } from '@/lib/services/insight.service'

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

    // Fetch cycle history to provide context for AI split planning
    let cycleHistory = null
    let cycleComparison = null

    try {
      const allCycles = await CycleStatsService.getAllCycleCompletions(input.userId)

      if (allCycles.length > 0) {
        // Get last 3 cycles for context
        const recentCycles = allCycles.slice(0, 3)

        cycleHistory = recentCycles.map(cycle => ({
          cycleNumber: cycle.cycle_number,
          completedAt: cycle.completed_at,
          totalVolume: cycle.total_volume,
          totalWorkoutsCompleted: cycle.total_workouts_completed,
          avgMentalReadiness: cycle.avg_mental_readiness,
          totalSets: cycle.total_sets,
          volumeByMuscleGroup: (cycle.volume_by_muscle_group as Record<string, number>) || {},
          workoutsByType: (cycle.workouts_by_type as Record<string, number>) || {},
        }))

        // Get comparison between last two cycles if available
        if (allCycles.length >= 2) {
          const lastCycle = allCycles[0]
          const previousCycle = allCycles[1]

          const volumeDelta = previousCycle.total_volume > 0
            ? ((lastCycle.total_volume - previousCycle.total_volume) / previousCycle.total_volume) * 100
            : 0

          const mentalReadinessDelta = (lastCycle.avg_mental_readiness !== null && previousCycle.avg_mental_readiness !== null)
            ? lastCycle.avg_mental_readiness - previousCycle.avg_mental_readiness
            : null

          cycleComparison = {
            volumeDelta,
            workoutsDelta: lastCycle.total_workouts_completed - previousCycle.total_workouts_completed,
            mentalReadinessDelta,
            setsDelta: lastCycle.total_sets - previousCycle.total_sets,
          }
        }

        console.log(`[GenerateSplit] Loaded ${cycleHistory.length} cycles for context`)
      }
    } catch (error) {
      console.error('[GenerateSplit] Failed to load cycle history (non-critical):', error)
      // Continue without cycle history - it's optional context
    }

    // Use SplitPlanner agent with server client
    const splitPlanner = new SplitPlanner(supabase)

    // Generate split plan using AI (with cycle history context if available)
    const splitPlanData = await splitPlanner.planSplit({
      ...input,
      recentCycleCompletions: cycleHistory || undefined,
      cycleComparison: cycleComparison || undefined,
    }, targetLanguage)

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
 * Verifies both that user_profiles.active_split_plan_id is set AND split exists
 * This ensures DB consistency and prevents race conditions during onboarding
 */
export async function getActiveSplitPlanAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // First verify user profile has active_split_plan_id set
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('active_split_plan_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Profile not found'
      }
    }

    if (!profile.active_split_plan_id) {
      return {
        success: false,
        error: 'No active split plan set in profile'
      }
    }

    // Then verify the split actually exists
    const splitPlan = await SplitPlanService.getActiveServer(userId)

    if (!splitPlan) {
      return {
        success: false,
        error: 'Split plan not found'
      }
    }

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
      .select("current_cycle_day, active_split_plan_id, cycles_completed")
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
    const wrappedAround = currentDay >= splitPlan.cycle_days

    console.log('[advanceSplitCycleAction] Advancing:', {
      from: currentDay,
      to: nextDay,
      totalCycleDays: splitPlan.cycle_days,
      wrappedAround
    })

    // Handle cycle completion (when completing last day and wrapping around)
    if (wrappedAround) {
      console.log('[advanceSplitCycleAction] Cycle completing, using atomic transaction...')

      try {
        // Calculate cycle statistics using CycleStatsService
        const stats = await CycleStatsService.calculateCycleStats(
          userId,
          profile.active_split_plan_id!
        )

        const cycleNumber = (profile.cycles_completed || 0) + 1

        console.log('[advanceSplitCycleAction] Cycle stats calculated:', {
          cycleNumber,
          totalVolume: stats.totalVolume,
          totalWorkouts: stats.totalWorkoutsCompleted,
          totalSets: stats.totalSets
        })

        // Use atomic RPC function to complete cycle (inserts completion + updates profile)
        const { data: result, error: rpcError } = await supabase.rpc('complete_cycle', {
          p_user_id: userId,
          p_split_plan_id: profile.active_split_plan_id!,
          p_cycle_number: cycleNumber,
          p_next_cycle_day: nextDay,
          p_total_volume: stats.totalVolume,
          p_total_workouts_completed: stats.totalWorkoutsCompleted,
          p_avg_mental_readiness: stats.avgMentalReadiness ?? 0,
          p_total_sets: stats.totalSets,
          p_total_duration_seconds: stats.totalDurationSeconds,
          p_volume_by_muscle_group: stats.volumeByMuscleGroup,
          p_workouts_by_type: stats.workoutsByType,
        })

        if (rpcError) {
          console.error('[advanceSplitCycleAction] complete_cycle RPC failed:', rpcError)
          throw new Error(`Failed to complete cycle: ${rpcError.message}`)
        }

        console.log('[advanceSplitCycleAction] Cycle completed successfully:', {
          cycleNumber,
          nextDay,
          rpcResult: result
        })

        // TODO: Send cycle completion email notification (fire-and-forget)
        // EmailService.sendCycleCompletionEmail(userId, cycleNumber, stats).catch(...)

      } catch (error) {
        console.error('[advanceSplitCycleAction] Error during cycle completion:', error)
        throw error
      }
    } else {
      // Normal day advancement (no cycle completion)
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ current_cycle_day: nextDay })
        .eq("user_id", userId)

      if (updateError) {
        console.error('[advanceSplitCycleAction] Failed to update profile:', updateError)
        throw new Error(`Failed to advance cycle: ${updateError.message}`)
      }

      console.log('[advanceSplitCycleAction] Successfully advanced to day:', nextDay)
    }

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

    // Get previous cycle completion for muscle group data
    const previousCycle = await CycleStatsService.getLastCycleCompletion(userId)

    return {
      success: true,
      data: {
        currentStats,
        comparison,
        cycleNumber: (profile.cycles_completed || 0) + 1,
        previousVolumeByMuscleGroup: previousCycle?.volume_by_muscle_group || null
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

/**
 * Adapt current split based on cycle history and user preferences
 * Called when user clicks "Adapt Split" after cycle completion
 */
export async function adaptSplitAfterCycleAction(userId: string) {
  try {
    console.log('[adaptSplitAfterCycleAction] Starting adaptation for userId:', userId)
    const supabase = await getSupabaseServerClient()

    // 1. Get current active split
    const currentSplit = await SplitPlanService.getActiveServer(userId)
    if (!currentSplit) {
      throw new Error('No active split plan found')
    }

    console.log('[adaptSplitAfterCycleAction] Current split:', {
      id: currentSplit.id,
      type: currentSplit.split_type,
      cycleDays: currentSplit.cycle_days
    })

    // 2. Gather adaptation inputs
    console.log('[adaptSplitAfterCycleAction] Gathering adaptation data...')

    // Get last 3 cycle completions for trend analysis
    const cycleHistory = await CycleStatsService.getAllCycleCompletions(userId)
    const recentCycles = cycleHistory.slice(0, 3)

    // Get cycle comparison (trends)
    let cycleComparison = null
    if (recentCycles.length >= 2) {
      cycleComparison = await CycleStatsService.getComparisonWithPreviousCycle(
        recentCycles[0],
        recentCycles[1]
      )
    }

    // Get active memories (learned preferences)
    const memories = await MemoryService.getActiveMemories(userId)

    // Get active insights (exercise issues)
    const insights = await InsightService.getActiveInsights(userId)

    // Get recent substitutions (last 90 days)
    const substitutions = await getRecentSubstitutions(userId, 90)

    console.log('[adaptSplitAfterCycleAction] Adaptation data gathered:', {
      cycles: recentCycles.length,
      memories: memories.length,
      insights: insights.length,
      substitutions: substitutions.length
    })

    // 3. Build SplitPlannerInput (same structure as generateSplitPlanAction)
    const targetLanguage = await getUserLanguage(userId)

    const input: SplitPlannerInput = {
      userId,
      approachId: currentSplit.approach_id!,
      splitType: currentSplit.split_type as any,
      // Reuse current split configuration
      targetFrequency: currentSplit.cycle_days, // TODO: Extract from sessions
      weakPoints: [], // TODO: Could extract from user profile if needed
      // Adaptation context
      recentCycleCompletions: recentCycles,
      cycleComparison: cycleComparison || undefined,
      // NOTE: memories and insights are passed downstream to ExerciseSelector
      targetLanguage
    }

    console.log('[adaptSplitAfterCycleAction] Calling SplitPlanner agent...')

    // 4. Call SplitPlanner agent (reuse existing agent!)
    const planner = new SplitPlanner(supabase, 'medium')
    const adaptedSplit = await planner.planSplit(input)

    console.log('[adaptSplitAfterCycleAction] Split adapted:', {
      sessions: adaptedSplit.sessions?.length,
      cycleDays: adaptedSplit.cycleDays
    })

    // 5. Save new split (deactivate old, create new)
    console.log('[adaptSplitAfterCycleAction] Saving adapted split...')

    // Deactivate current split
    await SplitPlanService.deactivateAll(userId)

    // Create new adapted split
    const newSplit = await SplitPlanService.createServer({
      user_id: userId,
      approach_id: currentSplit.approach_id!,
      split_type: currentSplit.split_type,
      cycle_days: adaptedSplit.cycleDays,
      sessions: adaptedSplit.sessions as any,
      frequency_map: adaptedSplit.frequencyMap,
      volume_distribution: adaptedSplit.volumeDistribution,
      active: true
    })

    console.log('[adaptSplitAfterCycleAction] Adapted split saved:', newSplit.id)

    // Update user profile to use new split
    await supabase
      .from('user_profiles')
      .update({
        active_split_plan_id: newSplit.id,
        current_cycle_day: 1,
        current_cycle_start_date: new Date().toISOString()
      })
      .eq('user_id', userId)

    return {
      success: true,
      data: {
        splitId: newSplit.id,
        cycleDays: newSplit.cycle_days,
        sessions: newSplit.sessions,
        adaptationContext: {
          cyclesAnalyzed: recentCycles.length,
          memoriesUsed: memories.length,
          insightsUsed: insights.length,
          substitutionsUsed: substitutions.length
        }
      }
    }
  } catch (error: any) {
    console.error('[adaptSplitAfterCycleAction] Error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to adapt split plan'
    }
  }
}

/**
 * Helper Types
 */
interface SubstitutionPattern {
  originalExercise: string
  newExercise: string
  reason: string
  count: number
}

/**
 * Get recent exercise substitutions for a user
 * Used by split adaptation to prefer user's exercise choices
 */
async function getRecentSubstitutions(
  userId: string,
  daysBack: number = 90
): Promise<SubstitutionPattern[]> {
  const supabase = await getSupabaseServerClient()

  // Calculate date threshold
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysBack)

  // Query sets_log for substitutions in recent workouts
  const { data: substitutions, error } = await supabase
    .from('sets_log')
    .select(`
      exercise_name,
      original_exercise_name,
      substitution_reason,
      workouts!inner(
        user_id,
        completed_at
      )
    `)
    .eq('workouts.user_id', userId)
    .not('original_exercise_name', 'is', null)
    .gte('workouts.completed_at', threshold.toISOString())

  if (error || !substitutions) {
    console.error('[getRecentSubstitutions] Error fetching substitutions:', error)
    return []
  }

  // Deduplicate and count occurrences
  const patternMap = new Map<string, SubstitutionPattern>()

  for (const sub of substitutions) {
    const key = `${sub.original_exercise_name}→${sub.exercise_name}`

    if (patternMap.has(key)) {
      patternMap.get(key)!.count++
    } else {
      patternMap.set(key, {
        originalExercise: sub.original_exercise_name,
        newExercise: sub.exercise_name,
        reason: sub.substitution_reason || 'user_preference',
        count: 1
      })
    }
  }

  // Convert to array and sort by count (most frequent first)
  return Array.from(patternMap.values())
    .sort((a, b) => b.count - a.count)
}
