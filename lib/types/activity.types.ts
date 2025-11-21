import type { Workout } from './schemas'
import type { Database } from './database.types'

// Milestone types (stored in user_milestones table)
export type MilestoneType =
  | 'onboarding_complete'
  | 'first_workout_generated'
  | 'first_workout_complete'
  | 'first_cycle_complete'

// Activity Types
export type ActivityType =
  | 'workout_completed'
  | 'cycle_completed'
  | 'split_modified'
  | 'onboarding_completed'
  | 'first_workout_completed'
  | 'progress_check_milestone'

// Activity Categories for filtering
export type ActivityCategory = 'all' | 'workouts' | 'milestones'

// Base Activity interface
export interface BaseActivity {
  id: string
  userId: string
  type: ActivityType
  timestamp: string
  category: ActivityCategory
}

// Workout Completed Activity
export interface WorkoutCompletedActivity extends BaseActivity {
  type: 'workout_completed'
  category: 'workouts'
  data: {
    workoutId: string
    workoutName: string
    workoutType: Workout['workout_type']
    totalVolume: number | null
    durationSeconds: number | null
    totalSets: number | null
    mentalReadiness: number | null
  }
}

// Cycle Completed Activity (Milestone)
export interface CycleCompletedActivity extends BaseActivity {
  type: 'cycle_completed'
  category: 'milestones'
  data: {
    cycleNumber: number
    totalVolume: number
    totalWorkouts: number
    avgMentalReadiness: number | null
    totalSets: number
    totalDurationSeconds: number | null
    volumeByMuscleGroup: Record<string, number> | null
  }
}

// Split Modified Activity (Milestone)
export interface SplitModifiedActivity extends BaseActivity {
  type: 'split_modified'
  category: 'milestones'
  data: {
    modificationType: 'swap_days' | 'toggle_muscle' | 'change_variation' | 'change_split_type'
    details: Record<string, unknown>
    previousState: Record<string, unknown>
    aiValidation: {
      validation: 'approved' | 'caution' | 'not_recommended'
      rationale: string
      warnings?: string[]
    }
    userOverride: boolean
    userReason: string | null
  }
}

// Onboarding Completed Activity (Milestone)
export interface OnboardingCompletedActivity extends BaseActivity {
  type: 'onboarding_completed'
  category: 'milestones'
  data: {
    metadata: Record<string, unknown> | null
  }
}

// First Workout Completed Activity (Milestone)
export interface FirstWorkoutCompletedActivity extends BaseActivity {
  type: 'first_workout_completed'
  category: 'milestones'
  data: {
    workoutName: string | null
    metadata: Record<string, unknown> | null
  }
}

// Progress Check Milestone Activity (Milestone)
export interface ProgressCheckMilestoneActivity extends BaseActivity {
  type: 'progress_check_milestone'
  category: 'milestones'
  data: {
    checkId: string
    cycleNumber: number | null
    cycleDay: number | null
    weight: number | null
    photoCount: number
    hasMeasurements: boolean
  }
}

// Union type of all activities
export type Activity =
  | WorkoutCompletedActivity
  | CycleCompletedActivity
  | SplitModifiedActivity
  | OnboardingCompletedActivity
  | FirstWorkoutCompletedActivity
  | ProgressCheckMilestoneActivity

// Type guards
export function isWorkoutCompletedActivity(activity: Activity): activity is WorkoutCompletedActivity {
  return activity.type === 'workout_completed'
}

export function isCycleCompletedActivity(activity: Activity): activity is CycleCompletedActivity {
  return activity.type === 'cycle_completed'
}

export function isSplitModifiedActivity(activity: Activity): activity is SplitModifiedActivity {
  return activity.type === 'split_modified'
}

export function isOnboardingCompletedActivity(activity: Activity): activity is OnboardingCompletedActivity {
  return activity.type === 'onboarding_completed'
}

export function isFirstWorkoutCompletedActivity(activity: Activity): activity is FirstWorkoutCompletedActivity {
  return activity.type === 'first_workout_completed'
}

export function isProgressCheckMilestoneActivity(activity: Activity): activity is ProgressCheckMilestoneActivity {
  return activity.type === 'progress_check_milestone'
}

// Database types for tables
export type EmailEvent = Database['public']['Tables']['email_events']['Row']
export type SplitModification = Database['public']['Tables']['split_modifications']['Row']

// User Milestone interface (for user_milestones table)
export interface UserMilestone {
  id: string
  user_id: string
  milestone_type: MilestoneType
  created_at: string
  metadata: Record<string, unknown>
}
