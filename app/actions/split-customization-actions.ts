'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SplitPlanService, type SessionDefinition } from '@/lib/services/split-plan.service'
import {
  WorkoutModificationValidator,
  type SplitChangeValidationInput,
  type SplitChangeValidationOutput,
} from '@/lib/agents/workout-modification-validator.agent'

/**
 * Validate a split modification using AI
 */
export async function validateSplitChangeAction(input: SplitChangeValidationInput) {
  try {
    const supabase = await getSupabaseServerClient()
    const validator = new WorkoutModificationValidator(supabase)

    // Fetch complete user context for AI validation using public method
    const userContext = await validator.buildCompleteUserContext(input.userContext.userId)

    // Populate input with real user context data
    const enrichedInput: SplitChangeValidationInput = {
      ...input,
      userContext: {
        userId: input.userContext.userId,
        approachId: userContext.approachId || '',
        experienceYears: userContext.experienceYears,
        userAge: userContext.userAge,
        weakPoints: userContext.weakPoints,
        mesocycleWeek: userContext.mesocycleWeek,
        mesocyclePhase: userContext.mesocyclePhase,
      }
    }

    const validation = await validator.validateSplitChange(enrichedInput)

    return {
      success: true,
      data: validation,
    }
  } catch (error: any) {
    console.error('Error validating split change:', error)
    return {
      success: false,
      error: error?.message || 'Failed to validate split change',
    }
  }
}

/**
 * Swap two days in the active split
 */
export async function swapCycleDaysAction(
  userId: string,
  day1: number,
  day2: number,
  aiValidation: SplitChangeValidationOutput,
  userOverride?: boolean,
  userReason?: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId)
    if (!splitPlan) {
      return {
        success: false,
        error: 'No active split plan found',
      }
    }

    // Query affected workouts BEFORE modification for undo
    const { data: affectedWorkouts } = await supabase
      .from('workouts')
      .select('id, cycle_day, status')
      .eq('split_plan_id', splitPlan.id)
      .in('cycle_day', [day1, day2])

    // Store previous state for undo
    const previousState = {
      sessions: splitPlan.sessions,
      frequency_map: splitPlan.frequency_map,
      volume_distribution: splitPlan.volume_distribution,
      affected_workouts: affectedWorkouts?.map(w => ({
        id: w.id,
        cycle_day: w.cycle_day,
        status: w.status,
      })) || [],
    }

    // Swap sessions
    const updatedSessions = SplitPlanService.swapSessions(splitPlan, day1, day2)

    // Update split plan
    const { data: updated, error: updateError } = await supabase
      .from('split_plans')
      .update({ sessions: updatedSessions as any })
      .eq('id', splitPlan.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update split plan: ${updateError.message}`)
    }

    // Sync workouts (swap cycle_day for existing workouts)
    await SplitPlanService.syncWorkoutsAfterModificationServer(splitPlan.id, {
      type: 'swap_days',
      details: { day1, day2 },
    })

    // Log modification
    const fromSession = (splitPlan.sessions as unknown as SessionDefinition[]).find(s => s.day === day1)
    const toSession = (splitPlan.sessions as unknown as SessionDefinition[]).find(s => s.day === day2)

    await supabase.from('split_modifications').insert({
      user_id: userId,
      split_plan_id: splitPlan.id,
      modification_type: 'swap_days',
      details: {
        fromDay: day1,
        toDay: day2,
        fromSession: fromSession,
        toSession: toSession,
      } as any,
      previous_state: previousState as any,
      ai_validation: aiValidation as any,
      user_override: userOverride || false,
      user_reason: userReason,
    })

    return {
      success: true,
      data: {
        splitPlan: updated,
        message: `Giorni ${day1} e ${day2} scambiati con successo`,
      },
    }
  } catch (error: any) {
    console.error('Error swapping cycle days:', error)
    return {
      success: false,
      error: error?.message || 'Failed to swap cycle days',
    }
  }
}

/**
 * Toggle muscle group in/out of a session
 */
export async function toggleMuscleInSessionAction(
  userId: string,
  cycleDay: number,
  muscleGroup: string,
  add: boolean,
  aiValidation: SplitChangeValidationOutput,
  userOverride?: boolean,
  userReason?: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId)
    if (!splitPlan) {
      return {
        success: false,
        error: 'No active split plan found',
      }
    }

    // Query affected workouts BEFORE modification for undo
    const { data: affectedWorkouts } = await supabase
      .from('workouts')
      .select('id, cycle_day, status')
      .eq('split_plan_id', splitPlan.id)
      .eq('cycle_day', cycleDay)

    // Store previous state for undo
    const previousState = {
      sessions: splitPlan.sessions,
      frequency_map: splitPlan.frequency_map,
      volume_distribution: splitPlan.volume_distribution,
      affected_workouts: affectedWorkouts?.map(w => ({
        id: w.id,
        cycle_day: w.cycle_day,
        status: w.status,
      })) || [],
    }

    const session = SplitPlanService.getSessionForDay(splitPlan, cycleDay)
    if (!session) {
      return {
        success: false,
        error: `Session for day ${cycleDay} not found`,
      }
    }

    // Toggle muscle focus
    const { sessions: updatedSessions, frequencyMap, volumeDistribution } =
      SplitPlanService.toggleMuscleFocus(
        splitPlan,
        cycleDay,
        muscleGroup,
        add
      )

    // Update split plan with sessions, frequency_map, and volume_distribution
    const { data: updated, error: updateError } = await supabase
      .from('split_plans')
      .update({
        sessions: updatedSessions as any,
        frequency_map: frequencyMap as any,
        volume_distribution: volumeDistribution as any,
      })
      .eq('id', splitPlan.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update split plan: ${updateError.message}`)
    }

    // Sync workouts (invalidate affected day)
    const syncResult = await SplitPlanService.syncWorkoutsAfterModificationServer(splitPlan.id, {
      type: 'toggle_muscle',
      details: { cycleDay },
    })

    // Log modification
    await supabase.from('split_modifications').insert({
      user_id: userId,
      split_plan_id: splitPlan.id,
      modification_type: 'toggle_muscle',
      details: {
        cycleDay,
        sessionName: session.name,
        workoutType: session.workoutType,
        muscleGroup,
        action: add ? 'add' : 'remove',
        currentFocus: session.focus,
        newFocus: updatedSessions.find(s => s.day === cycleDay)?.focus || [],
      } as any,
      previous_state: previousState as any,
      ai_validation: aiValidation as any,
      user_override: userOverride || false,
      user_reason: userReason,
    })

    return {
      success: true,
      data: {
        splitPlan: updated,
        syncResult,
        message: add
          ? `${muscleGroup} aggiunto al giorno ${cycleDay}`
          : `${muscleGroup} rimosso dal giorno ${cycleDay}`,
      },
    }
  } catch (error: any) {
    console.error('Error toggling muscle in session:', error)
    return {
      success: false,
      error: error?.message || 'Failed to toggle muscle in session',
    }
  }
}

/**
 * Change session variation (A <-> B)
 */
export async function changeSessionVariationAction(
  userId: string,
  cycleDay: number,
  newVariation: 'A' | 'B',
  aiValidation: SplitChangeValidationOutput,
  userOverride?: boolean,
  userReason?: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId)
    if (!splitPlan) {
      return {
        success: false,
        error: 'No active split plan found',
      }
    }

    // Query affected workouts BEFORE modification for undo
    const { data: affectedWorkouts } = await supabase
      .from('workouts')
      .select('id, cycle_day, status')
      .eq('split_plan_id', splitPlan.id)
      .eq('cycle_day', cycleDay)

    // Store previous state for undo
    const previousState = {
      sessions: splitPlan.sessions,
      frequency_map: splitPlan.frequency_map,
      volume_distribution: splitPlan.volume_distribution,
      affected_workouts: affectedWorkouts?.map(w => ({
        id: w.id,
        cycle_day: w.cycle_day,
        status: w.status,
      })) || [],
    }

    const session = SplitPlanService.getSessionForDay(splitPlan, cycleDay)
    if (!session) {
      return {
        success: false,
        error: `Session for day ${cycleDay} not found`,
      }
    }

    // Change variation
    const updatedSessions = SplitPlanService.changeSessionVariation(
      splitPlan,
      cycleDay,
      newVariation
    )

    // Update split plan
    const { data: updated, error: updateError } = await supabase
      .from('split_plans')
      .update({ sessions: updatedSessions as any })
      .eq('id', splitPlan.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update split plan: ${updateError.message}`)
    }

    // Sync workouts (invalidate affected day)
    const syncResult = await SplitPlanService.syncWorkoutsAfterModificationServer(splitPlan.id, {
      type: 'change_variation',
      details: { cycleDay },
    })

    // Log modification
    await supabase.from('split_modifications').insert({
      user_id: userId,
      split_plan_id: splitPlan.id,
      modification_type: 'change_variation',
      details: {
        cycleDay,
        sessionName: session.name,
        workoutType: session.workoutType,
        currentVariation: session.variation,
        newVariation,
      } as any,
      previous_state: previousState as any,
      ai_validation: aiValidation as any,
      user_override: userOverride || false,
      user_reason: userReason,
    })

    return {
      success: true,
      data: {
        splitPlan: updated,
        syncResult,
        message: `Variazione cambiata in ${newVariation} per giorno ${cycleDay}`,
      },
    }
  } catch (error: any) {
    console.error('Error changing session variation:', error)
    return {
      success: false,
      error: error?.message || 'Failed to change session variation',
    }
  }
}

/**
 * Undo last split modification
 */
export async function undoLastModificationAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get last modification
    const { data: modifications, error: fetchError } = await supabase
      .from('split_modifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      throw new Error(`Failed to fetch last modification: ${fetchError.message}`)
    }

    if (!modifications || modifications.length === 0) {
      return {
        success: false,
        error: 'No modifications to undo',
      }
    }

    const lastMod = modifications[0]
    const previousState = lastMod.previous_state as any

    // Restore previous state
    const { error: updateError } = await supabase
      .from('split_plans')
      .update({
        sessions: previousState.sessions,
        frequency_map: previousState.frequency_map,
        volume_distribution: previousState.volume_distribution,
      })
      .eq('id', lastMod.split_plan_id)

    if (updateError) {
      throw new Error(`Failed to restore previous state: ${updateError.message}`)
    }

    // Restore affected workouts if present
    const affectedWorkouts = previousState.affected_workouts || []
    if (affectedWorkouts.length > 0) {
      for (const workout of affectedWorkouts) {
        await supabase
          .from('workouts')
          .update({
            cycle_day: workout.cycle_day,
            status: workout.status,
          })
          .eq('id', workout.id)
      }
    }

    // Delete the modification log
    await supabase
      .from('split_modifications')
      .delete()
      .eq('id', lastMod.id)

    return {
      success: true,
      data: {
        message: 'Ultima modifica annullata con successo',
        workoutsRestored: affectedWorkouts.length,
      },
    }
  } catch (error: any) {
    console.error('Error undoing last modification:', error)
    return {
      success: false,
      error: error?.message || 'Failed to undo last modification',
    }
  }
}

/**
 * Get recent split modifications for user (for AI context)
 */
export async function getRecentModificationsAction(userId: string, limit = 20) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('split_modifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch modifications: ${error.message}`)
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error('Error getting recent modifications:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get recent modifications',
    }
  }
}
