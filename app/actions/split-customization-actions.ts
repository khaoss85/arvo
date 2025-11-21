'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SplitPlanService, type SessionDefinition } from '@/lib/services/split-plan.service'
import {
  WorkoutModificationValidator,
  type SplitChangeValidationInput,
  type SplitChangeValidationOutput,
} from '@/lib/agents/workout-modification-validator.agent'
import {
  SplitTypeChangeValidator,
  type SplitTypeChangeInput,
  type SplitTypeChangeOutput,
} from '@/lib/agents/split-type-change-validator.agent'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { WorkoutService } from '@/lib/services/workout.service'
import type { SplitType } from '@/lib/types/split.types'
import { generateSplitPlanAction } from './split-actions'
import type { SplitPlannerInput } from '@/lib/agents/split-planner.agent'

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
    const { data: modifications, error: fetchError } = (await supabase
      .from('split_modifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)) as any

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

/**
 * Generate new split plan with different split type
 *
 * Fetches user profile and generates a new split plan with the target split type.
 * This deactivates the current split and activates the new one.
 * Logs the modification to split_modifications table for tracking and undo.
 */
export async function generateNewSplitTypeAction(
  userId: string,
  targetSplitType: SplitType,
  weakPointMuscle?: string,
  aiValidation?: SplitTypeChangeOutput,
  userOverride?: boolean,
  userReason?: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current active split plan BEFORE generating new one (for tracking)
    const currentSplitPlan = await SplitPlanService.getActiveServer(userId)
    const previousSplitType = currentSplitPlan?.split_type || null

    // Get user profile
    const profile = await UserProfileService.getByUserIdServer(userId)
    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      }
    }

    // Build input for split planner
    const plannerInput: SplitPlannerInput = {
      userId,
      approachId: profile.approach_id || '',
      splitType: targetSplitType,
      weeklyFrequency: 4, // Default, will be adjusted by planner
      weakPoints: profile.weak_points || [],
      equipmentAvailable: profile.available_equipment || [],
      specializationMuscle: weakPointMuscle || null,
      experienceYears: profile.experience_years,
      userAge: profile.age,
      userGender: profile.gender,
      userHeight: profile.height,
      userWeight: profile.weight,
      mesocycleWeek: profile.current_mesocycle_week,
      mesocyclePhase: profile.mesocycle_phase,
      caloricPhase: profile.caloric_phase,
      caloricIntakeKcal: profile.caloric_intake_kcal,
    }

    // Generate new split plan
    const result = await generateSplitPlanAction(plannerInput)

    if (!result.success || !result.data?.splitPlan) {
      return {
        success: false,
        error: result.error || 'Failed to generate new split plan',
      }
    }

    // Log modification if AI validation was provided and we have previous split
    if (aiValidation && currentSplitPlan) {
      const previousState = {
        split_plan_id: currentSplitPlan.id,
        split_type: currentSplitPlan.split_type,
        sessions: currentSplitPlan.sessions,
        cycle_days: currentSplitPlan.cycle_days,
        frequency_map: currentSplitPlan.frequency_map,
        volume_distribution: currentSplitPlan.volume_distribution,
      }

      await supabase.from('split_modifications').insert({
        user_id: userId,
        split_plan_id: (result.data as any).splitPlan.id, // New split plan ID
        modification_type: 'change_split_type',
        details: {
          previousSplitType,
          newSplitType: targetSplitType,
          weakPointMuscle,
          previousSplitPlanId: currentSplitPlan.id,
        } as any,
        previous_state: previousState as any,
        ai_validation: aiValidation as any,
        user_override: userOverride || false,
        user_reason: userReason,
      })
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error: any) {
    console.error('Error generating new split type:', error)
    return {
      success: false,
      error: error?.message || 'Failed to generate new split type',
    }
  }
}

/**
 * Analyze split type change using AI
 *
 * This validates whether changing from current split type to target split type
 * is advisable based on cycle progress, fatigue, volume distribution, and user context.
 */
export async function analyzeSplitTypeChangeAction(
  userId: string,
  targetSplitType: SplitType,
  weakPointMuscle?: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // 1. Get active split plan
    const splitPlan = await SplitPlanService.getActiveServer(userId)
    if (!splitPlan) {
      return {
        success: false,
        error: 'No active split plan found',
      }
    }

    // 2. Get user profile for context
    const profile = await UserProfileService.getByUserIdServer(userId)
    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      }
    }

    // 3. Get completed workouts for current cycle/split
    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, cycle_day, completed_at, mental_readiness_overall')
      .eq('user_id', userId)
      .eq('split_plan_id', splitPlan.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false })

    if (workoutsError) {
      throw new Error(`Failed to fetch completed workouts: ${workoutsError.message}`)
    }

    // 4. Calculate cycle progress
    const sessions = splitPlan.sessions as unknown as SessionDefinition[]
    const totalWorkoutsInCycle = sessions.length
    const workoutsCompleted = completedWorkouts?.length || 0

    // 5. Calculate average mental readiness
    const mentalReadinessValues = completedWorkouts
      ?.map(w => w.mental_readiness_overall)
      .filter(mr => mr !== null && mr !== undefined) as number[] || []

    const avgMentalReadiness = mentalReadinessValues.length > 0
      ? mentalReadinessValues.reduce((a, b) => a + b, 0) / mentalReadinessValues.length
      : null

    // 6. Calculate volume by muscle from current split
    const volumeByMuscle: Record<string, number> = {}
    sessions.forEach(session => {
      const focus = session.focus || []
      // Estimate sets per muscle per session (rough estimate)
      const setsPerMuscle = Math.floor(12 / Math.max(focus.length, 1)) // Assume ~12 sets per session

      focus.forEach(muscle => {
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + setsPerMuscle
      })
    })

    // 7. Get recent mental readiness trend (last 10 workouts)
    const recentMentalReadinessTrend = mentalReadinessValues.slice(0, 10).reverse()

    // 8. Calculate muscle training frequency
    const musclesTrainedFrequency: Record<string, number> = {}
    sessions.forEach(session => {
      const focus = session.focus || []
      focus.forEach(muscle => {
        musclesTrainedFrequency[muscle] = (musclesTrainedFrequency[muscle] || 0) + 1
      })
    })

    // 9. Build input for AI validator
    const validationInput: SplitTypeChangeInput = {
      currentSplit: {
        splitType: splitPlan.split_type,
        cycleDays: splitPlan.cycle_days,
        cycleProgress: {
          workoutsCompleted,
          totalWorkoutsInCycle,
          avgMentalReadiness,
        },
        volumeByMuscle,
      },
      targetSplit: {
        splitType: targetSplitType,
        weakPointMuscle,
      },
      userContext: {
        userId,
        approachId: profile.approach_id || '',
        experienceYears: profile.experience_years ?? undefined,
        userAge: profile.age ?? undefined,
        weakPoints: profile.weak_points || [],
        mesocycleWeek: profile.current_mesocycle_week ?? undefined,
        mesocyclePhase: profile.mesocycle_phase ?? undefined,
        caloricPhase: profile.caloric_phase,
      },
      completedWorkouts: {
        totalCompleted: workoutsCompleted,
        recentMentalReadinessTrend,
        musclesTrainedFrequency,
      },
    }

    // 10. Call AI validator
    const validator = new SplitTypeChangeValidator(supabase)

    console.log('🤖 [SplitTypeAnalysis] Starting analysis', {
      userId,
      targetSplitType,
      currentSplitType: splitPlan.split_type,
      model: 'gpt-5.1',
      workoutsCompleted,
      totalWorkoutsInCycle,
      timestamp: new Date().toISOString()
    })

    const startTime = Date.now()
    const analysis = await validator.validateSplitTypeChange(validationInput)
    const duration = Date.now() - startTime

    console.log('✅ [SplitTypeAnalysis] Analysis completed', {
      userId,
      targetSplitType,
      recommendation: analysis.recommendation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: analysis,
    }
  } catch (error: any) {
    console.error('🔴 [SplitTypeAnalysis] Analysis failed:', {
      error: error?.message,
      stack: error?.stack,
      userId,
      targetSplitType,
      timestamp: new Date().toISOString()
    })
    return {
      success: false,
      error: error?.message || 'Failed to analyze split type change',
    }
  }
}
