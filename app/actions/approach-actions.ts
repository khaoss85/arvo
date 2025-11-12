'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { WorkoutService } from '@/lib/services/workout.service'
import { SplitPlanner, type SplitPlannerInput } from '@/lib/agents/split-planner.agent'
import type { TrainingApproach } from '@/lib/types/schemas'
import type { Tables } from '@/lib/types/database.types'

type UserApproachHistory = Tables<'user_approach_history'>

export type ApproachHistoryWithDetails = UserApproachHistory & {
  approach: TrainingApproach | null
}

/**
 * Get all available training approaches
 */
export async function getAllApproachesAction() {
  try {
    const approaches = await TrainingApproachService.getAllServer()
    return {
      success: true,
      data: approaches
    }
  } catch (error: any) {
    console.error('Error fetching approaches:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch training approaches'
    }
  }
}

/**
 * Get approach history for a user with approach details
 */
export async function getApproachHistoryAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_approach_history')
      .select(`
        *,
        approach:training_approaches(*)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch approach history: ${error.message}`)
    }

    // Calculate additional stats for each history entry
    const historyWithStats = await Promise.all(
      (data || []).map(async (entry: any) => {
        // Calculate duration in weeks
        const startDate = new Date(entry.started_at)
        const endDate = entry.ended_at ? new Date(entry.ended_at) : new Date()
        const durationWeeks = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

        // Get workout count for this approach
        const { count: workoutCount } = await supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('approach_id', entry.approach_id)
          .eq('completed', true)

        return {
          ...entry,
          calculated_duration_weeks: durationWeeks,
          calculated_workouts_completed: workoutCount || 0
        }
      })
    )

    return {
      success: true,
      data: historyWithStats
    }
  } catch (error: any) {
    console.error('Error fetching approach history:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch approach history'
    }
  }
}

/**
 * Switch to a new training approach
 */
export async function switchTrainingApproachAction(
  userId: string,
  newApproachId: string,
  options?: {
    switchReason?: string
    notes?: string
    generateNewSplit?: boolean
    splitType?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom'
  }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Validate that the new approach exists
    const newApproach = await TrainingApproachService.getAllServer()
      .then(approaches => approaches.find(a => a.id === newApproachId))

    if (!newApproach) {
      return {
        success: false,
        error: 'Invalid approach selected'
      }
    }

    // Get user profile to check current approach
    const profile = await UserProfileService.getByUserIdServer(userId)

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found'
      }
    }

    // Check if user is already using this approach
    if (profile.approach_id === newApproachId) {
      return {
        success: false,
        error: 'You are already using this training approach'
      }
    }

    // Get current active split plan ID
    const currentSplitPlanId = profile.active_split_plan_id

    // Calculate stats for current approach
    const currentApproachId = profile.approach_id
    let totalWorkouts = 0
    let totalWeeks = 0

    if (currentApproachId) {
      // Get workout count
      const { count } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('approach_id', currentApproachId)
        .eq('completed', true)

      totalWorkouts = count || 0

      // Get current approach history entry to calculate weeks
      const { data: currentHistory } = await supabase
        .from('user_approach_history')
        .select('started_at')
        .eq('user_id', userId)
        .eq('approach_id', currentApproachId)
        .eq('is_active', true)
        .single()

      if (currentHistory) {
        const startDate = new Date(currentHistory.started_at)
        const now = new Date()
        totalWeeks = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      }
    }

    // Begin transaction: Archive current approach and switch to new one
    // 1. Update current approach history entry (if exists)
    if (currentApproachId) {
      const { error: updateHistoryError } = await supabase
        .from('user_approach_history')
        .update({
          ended_at: new Date().toISOString(),
          is_active: false,
          total_workouts_completed: totalWorkouts,
          total_weeks: totalWeeks,
          final_split_plan_id: currentSplitPlanId || null
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (updateHistoryError) {
        throw new Error(`Failed to archive current approach: ${updateHistoryError.message}`)
      }
    }

    // 2. Create new approach history entry
    const { error: insertHistoryError } = await supabase
      .from('user_approach_history')
      .insert({
        user_id: userId,
        approach_id: newApproachId,
        started_at: new Date().toISOString(),
        is_active: true,
        switch_reason: options?.switchReason || null,
        notes: options?.notes || null
      })

    if (insertHistoryError) {
      throw new Error(`Failed to create new approach history: ${insertHistoryError.message}`)
    }

    // 3. Deactivate current split plans
    if (currentSplitPlanId) {
      const { error: deactivateSplitError } = await supabase
        .from('split_plans')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('active', true)

      if (deactivateSplitError) {
        throw new Error(`Failed to deactivate current split: ${deactivateSplitError.message}`)
      }
    }

    // 4. Update user profile with new approach
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update({
        approach_id: newApproachId,
        active_split_plan_id: null, // Clear active split
        // Reset mesocycle tracking if new approach doesn't use periodization
        ...((!(newApproach as any).periodization) && {
          current_mesocycle_week: null,
          mesocycle_phase: null,
          mesocycle_start_date: null
        })
      })
      .eq('user_id', userId)

    if (updateProfileError) {
      throw new Error(`Failed to update user profile: ${updateProfileError.message}`)
    }

    // 5. Generate new split plan if requested
    let newSplitPlan = null
    if (options?.generateNewSplit && options?.splitType) {
      try {
        const splitPlanner = new SplitPlanner(supabase)

        const splitInput: SplitPlannerInput = {
          userId,
          approachId: newApproachId,
          splitType: options.splitType,
          weeklyFrequency: 4, // Default to 4 days per week
          weakPoints: profile.weak_points || [],
          equipmentAvailable: profile.available_equipment || [],
          experienceYears: profile.experience_years,
          userAge: profile.age,
          userGender: profile.gender as 'male' | 'female' | 'other' | null
        }

        const splitPlanData = await splitPlanner.planSplit(splitInput)

        newSplitPlan = await SplitPlanService.createServer({
          user_id: userId,
          approach_id: newApproachId,
          split_type: options.splitType,
          cycle_days: splitPlanData.cycleDays,
          sessions: splitPlanData.sessions as any,
          frequency_map: splitPlanData.frequencyMap as any,
          volume_distribution: splitPlanData.volumeDistribution as any,
          active: true
        })

        // Update profile with new split plan
        await supabase
          .from('user_profiles')
          .update({ active_split_plan_id: newSplitPlan.id })
          .eq('user_id', userId)

      } catch (splitError: any) {
        console.error('Failed to generate new split plan:', splitError)
        // Don't fail the whole operation if split generation fails
        // User can generate split manually later
      }
    }

    return {
      success: true,
      data: {
        newApproach,
        newSplitPlan,
        archivedApproach: currentApproachId,
        workoutsCompleted: totalWorkouts,
        weeksCompleted: totalWeeks
      }
    }

  } catch (error: any) {
    console.error('Error switching approach:', error)
    return {
      success: false,
      error: error?.message || 'Failed to switch training approach'
    }
  }
}
