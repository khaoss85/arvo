import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  Activity,
  ActivityCategory,
  WorkoutCompletedActivity,
  CycleCompletedActivity,
  SplitModifiedActivity,
  OnboardingCompletedActivity,
  FirstWorkoutCompletedActivity,
  ProgressCheckMilestoneActivity,
  EmailEvent,
  SplitModification,
  MilestoneType,
  UserMilestone,
} from '@/lib/types/activity.types'
import type { Workout, CycleCompletion } from '@/lib/types/schemas'
import type { ProgressCheck } from '@/lib/types/progress-check.types'

export class ActivityService {
  /**
   * Get all activities for a user, aggregated from multiple sources
   */
  static async getActivities(
    userId: string,
    options: {
      category?: ActivityCategory
      limit?: number
    } = {}
  ): Promise<Activity[]> {
    const { category = 'all', limit = 20 } = options

    // Fetch all activity types in parallel
    const [workouts, cycles, modifications, emailEvents, progressChecks] = await Promise.all([
      category === 'all' || category === 'workouts'
        ? this.getWorkoutActivities(userId)
        : [],
      category === 'all' || category === 'milestones'
        ? this.getCycleActivities(userId)
        : [],
      category === 'all' || category === 'milestones'
        ? this.getSplitModificationActivities(userId)
        : [],
      category === 'all' || category === 'milestones'
        ? this.getMilestoneEmailActivities(userId)
        : [],
      category === 'all' || category === 'milestones'
        ? this.getProgressCheckMilestoneActivities(userId)
        : [],
    ])

    // Merge all activities
    const allActivities: Activity[] = [
      ...workouts,
      ...cycles,
      ...modifications,
      ...emailEvents,
      ...progressChecks,
    ]

    // Sort by timestamp (most recent first)
    allActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Apply limit
    return allActivities.slice(0, limit)
  }

  /**
   * Create a milestone for a user (server-side only)
   * Uses ON CONFLICT to prevent duplicate milestones
   */
  static async createMilestone(
    userId: string,
    milestoneType: MilestoneType,
    metadata: Record<string, unknown> = {}
  ): Promise<{ success: boolean; milestone?: UserMilestone; error?: string }> {
    try {
      const supabase = await getSupabaseServerClient()

      const { data, error } = (await supabase
        .from('user_milestones')
        .insert({
          user_id: userId,
          milestone_type: milestoneType,
          metadata: metadata as any,
        })
        .select()
        .single()) as any

      if (error) {
        // Check if it's a duplicate key error (milestone already exists)
        if (error.code === '23505') {
          console.log(`[ActivityService] Milestone '${milestoneType}' already exists for user ${userId}`)
          return { success: true }
        }
        console.error('[ActivityService] Failed to create milestone:', error)
        return { success: false, error: error.message }
      }

      console.log(`[ActivityService] Created milestone '${milestoneType}' for user ${userId}`)
      return { success: true, milestone: data as UserMilestone }
    } catch (err) {
      console.error('[ActivityService] Error creating milestone:', err)
      return { success: false, error: String(err) }
    }
  }

  /**
   * Backfill milestones for existing users (server-side only)
   * This function populates user_milestones from existing data
   */
  static async backfillMilestones(): Promise<{
    success: boolean
    stats: {
      onboardingMilestonesCreated: number
      firstWorkoutMilestonesCreated: number
      errors: number
    }
  }> {
    try {
      const supabase = await getSupabaseServerClient()
      const stats = {
        onboardingMilestonesCreated: 0,
        firstWorkoutMilestonesCreated: 0,
        errors: 0,
      }

      console.log('[ActivityService] Starting milestone backfill...')

      // 1. Backfill onboarding_complete milestones from user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, created_at')
        .order('created_at', { ascending: true })

      if (profilesError) {
        console.error('[ActivityService] Error fetching user profiles:', profilesError)
        return { success: false, stats }
      }

      console.log(`[ActivityService] Found ${profiles?.length || 0} user profiles`)

      for (const profile of profiles || []) {
        const result = await this.createMilestone(profile.user_id, 'onboarding_complete', {
          backfilled: true,
          originalDate: profile.created_at,
        })
        if (result.success && result.milestone) {
          stats.onboardingMilestonesCreated++
        } else if (!result.success && result.error) {
          stats.errors++
        }
      }

      // 2. Backfill first_workout_complete milestones
      // Get first completed workout for each user
      const { data: allWorkouts } = await supabase
        .from('workouts')
        .select('user_id, id, completed_at, workout_name')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true })

      // Group by user_id and get first workout for each user
      const userFirstWorkouts = new Map<string, any>()
      for (const workout of allWorkouts || []) {
        if (workout.user_id && !userFirstWorkouts.has(workout.user_id)) {
          userFirstWorkouts.set(workout.user_id, workout)
        }
      }

      for (const [userId, workout] of Array.from(userFirstWorkouts.entries())) {
        const result = await this.createMilestone(userId, 'first_workout_complete', {
          workoutId: workout.id,
          workoutName: workout.workout_name,
          backfilled: true,
          originalDate: workout.completed_at,
        })
        if (result.success && result.milestone) {
          stats.firstWorkoutMilestonesCreated++
        } else if (!result.success && result.error) {
          stats.errors++
        }
      }

      console.log('[ActivityService] Milestone backfill complete:', stats)
      return { success: true, stats }
    } catch (err) {
      console.error('[ActivityService] Error during milestone backfill:', err)
      return {
        success: false,
        stats: {
          onboardingMilestonesCreated: 0,
          firstWorkoutMilestonesCreated: 0,
          errors: 1,
        },
      }
    }
  }

  /**
   * Get workout completion activities
   */
  private static async getWorkoutActivities(
    userId: string
  ): Promise<WorkoutCompletedActivity[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch workout activities:', error)
      return []
    }

    const workouts = data as unknown as Workout[]

    return workouts.map((workout) => ({
      id: workout.id,
      userId,
      type: 'workout_completed' as const,
      category: 'workouts' as const,
      timestamp: workout.completed_at!,
      data: {
        workoutId: workout.id,
        workoutName: workout.workout_name || 'Unnamed Workout',
        workoutType: workout.workout_type,
        totalVolume: workout.total_volume,
        durationSeconds: workout.duration_seconds,
        totalSets: workout.total_sets,
        mentalReadiness: workout.mental_readiness_overall,
      },
    }))
  }

  /**
   * Get cycle completion activities
   */
  private static async getCycleActivities(
    userId: string
  ): Promise<CycleCompletedActivity[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('cycle_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch cycle activities:', error)
      return []
    }

    const cycles = data as unknown as CycleCompletion[]

    return cycles.map((cycle) => ({
      id: cycle.id,
      userId,
      type: 'cycle_completed' as const,
      category: 'milestones' as const,
      timestamp: cycle.completed_at,
      data: {
        cycleNumber: cycle.cycle_number,
        totalVolume: cycle.total_volume,
        totalWorkouts: cycle.total_workouts_completed,
        avgMentalReadiness: cycle.avg_mental_readiness,
        totalSets: cycle.total_sets,
        totalDurationSeconds: cycle.total_duration_seconds,
        volumeByMuscleGroup: cycle.volume_by_muscle_group as Record<string, number> | null,
      },
    }))
  }

  /**
   * Get split modification activities
   */
  private static async getSplitModificationActivities(
    userId: string
  ): Promise<SplitModifiedActivity[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('split_modifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch split modification activities:', error)
      return []
    }

    const modifications = data as unknown as SplitModification[]

    return modifications.map((mod) => ({
      id: mod.id,
      userId,
      type: 'split_modified' as const,
      category: 'milestones' as const,
      timestamp: mod.created_at,
      data: {
        modificationType: mod.modification_type as
          | 'swap_days'
          | 'toggle_muscle'
          | 'change_variation'
          | 'change_split_type',
        details: mod.details as Record<string, unknown>,
        previousState: mod.previous_state as Record<string, unknown>,
        aiValidation: mod.ai_validation as {
          validation: 'approved' | 'caution' | 'not_recommended'
          rationale: string
          warnings?: string[]
        },
        userOverride: mod.user_override,
        userReason: mod.user_reason,
      },
    }))
  }

  /**
   * Get milestone activities from user_milestones table
   */
  private static async getMilestoneEmailActivities(
    userId: string
  ): Promise<(OnboardingCompletedActivity | FirstWorkoutCompletedActivity)[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', userId)
      .in('milestone_type', ['onboarding_complete', 'first_workout_complete'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch milestone activities:', error)
      return []
    }

    const milestones = data as unknown as UserMilestone[]

    return milestones
      .map((milestone): OnboardingCompletedActivity | FirstWorkoutCompletedActivity | null => {
        if (milestone.milestone_type === 'onboarding_complete') {
          return {
            id: milestone.id,
            userId,
            type: 'onboarding_completed' as const,
            category: 'milestones' as const,
            timestamp: milestone.created_at,
            data: {
              metadata: milestone.metadata,
            },
          }
        }

        if (milestone.milestone_type === 'first_workout_complete') {
          return {
            id: milestone.id,
            userId,
            type: 'first_workout_completed' as const,
            category: 'milestones' as const,
            timestamp: milestone.created_at,
            data: {
              workoutName: milestone.metadata?.workoutName as string | null,
              metadata: milestone.metadata,
            },
          }
        }

        return null
      })
      .filter((activity): activity is OnboardingCompletedActivity | FirstWorkoutCompletedActivity =>
        activity !== null
      )
  }

  /**
   * Get progress check milestone activities
   */
  private static async getProgressCheckMilestoneActivities(
    userId: string
  ): Promise<ProgressCheckMilestoneActivity[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('progress_checks')
      .select('*, photos:progress_photos(id), measurements:body_measurements(id)')
      .eq('user_id', userId)
      .eq('is_milestone', true)
      .order('taken_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch progress check milestone activities:', error)
      return []
    }

    const checks = data as unknown as (ProgressCheck & {
      photos: { id: string }[]
      measurements: { id: string }[]
    })[]

    return checks.map((check) => ({
      id: check.id,
      userId,
      type: 'progress_check_milestone' as const,
      category: 'milestones' as const,
      timestamp: check.taken_at,
      data: {
        checkId: check.id,
        cycleNumber: check.cycle_number,
        cycleDay: check.cycle_day,
        weight: check.weight,
        photoCount: check.photos?.length || 0,
        hasMeasurements: (check.measurements?.length || 0) > 0,
      },
    }))
  }
}
