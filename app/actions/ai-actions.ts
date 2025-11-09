'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { ProgressionCalculator } from '@/lib/agents/progression-calculator.agent'
import { ReorderValidator } from '@/lib/agents/reorder-validator.agent'
import { WorkoutSummaryAgent } from '@/lib/agents/workout-summary.agent'
import { ExplanationService } from '@/lib/services/explanation.service'
import {
  getNextWorkoutType,
  getTargetMuscleGroups,
  generateWorkoutName,
  inferWorkoutType,
  type WorkoutType,
  type SplitType
} from '@/lib/services/muscle-groups.service'
import type { ProgressionInput } from '@/lib/types/progression'
import type { OnboardingData } from '@/lib/types/onboarding'
import type { Workout, InsertWorkout } from '@/lib/types/schemas'
import type { ExplanationType, ExplanationContext } from '@/lib/services/explanation.service'
import type { ReorderValidationInput } from '@/lib/agents/reorder-validator.agent'
import type { WorkoutSummaryInput } from '@/lib/agents/workout-summary.agent'

/**
 * Server action to complete onboarding
 * Creates user profile and generates first AI workout
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function completeOnboardingAction(
  userId: string,
  data: OnboardingData
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Determine split plan ID if split selection was made
    let splitPlanId: string | null = null

    // Generate split plan if user selected a split type
    if (data.splitType && data.weeklyFrequency) {
      const { generateSplitPlanAction } = await import('./split-actions')

      const splitResult = await generateSplitPlanAction({
        userId,
        approachId: data.approachId,
        splitType: data.splitType,
        weeklyFrequency: data.weeklyFrequency,
        weakPoints: data.weakPoints || [],
        equipmentAvailable: data.equipmentPreferences ? Object.values(data.equipmentPreferences) : [],
        experienceYears: data.confirmedExperience || null,
        userAge: data.age || null,
        userGender: data.gender || null
      })

      if (splitResult.success && splitResult.data) {
        splitPlanId = splitResult.data.splitPlan.id
      }
    }

    // Upsert user profile using server client (bypasses RLS with server role)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        approach_id: data.approachId,
        weak_points: data.weakPoints,
        equipment_preferences: data.equipmentPreferences,
        strength_baseline: data.strengthBaseline,
        gender: data.gender || null,
        age: data.age || null,
        weight: data.weight || null,
        height: data.height || null,
        experience_years: data.confirmedExperience || 0,
        preferred_split: data.splitType || null,
        active_split_plan_id: splitPlanId,
        current_cycle_day: splitPlanId ? 1 : null
      })

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    // Generate first AI-powered workout using server client
    const workout = await generateWorkoutWithServerClient(userId, supabase, data.approachId!)

    return { success: true, workoutId: workout.id }
  } catch (error) {
    console.error('Server action - Onboarding completion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding'
    }
  }
}

/**
 * Generate AI-powered workout using server client
 * Bypasses RLS and browser client issues
 */
async function generateWorkoutWithServerClient(
  userId: string,
  supabase: any,
  approachId: string
): Promise<Workout> {
  // Pass server client to ExerciseSelector for database access
  const exerciseSelector = new ExerciseSelector(supabase)

  // Get user profile (already created above, but we need to fetch it for weak points and equipment)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('User profile not found')
  }

  // Get recent completed workouts to determine rotation
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('planned_at', { ascending: false })
    .limit(3)

  // Get user's preferred split type (defaults to push_pull_legs)
  const preferredSplit = (profile.preferred_split as SplitType) || 'push_pull_legs'

  // Determine next workout type based on preferred split and last workout
  let lastWorkoutType: WorkoutType | null = null
  if (recentWorkouts && recentWorkouts.length > 0) {
    const lastWorkout = recentWorkouts[0]
    // Try to get workout_type from database, fallback to inference
    lastWorkoutType = lastWorkout.workout_type as WorkoutType ||
                     inferWorkoutType(lastWorkout.exercises as any[] || [])
  }

  const workoutType = getNextWorkoutType(lastWorkoutType, preferredSplit)

  // Select exercises using AI
  const selection = await exerciseSelector.selectExercises({
    workoutType,
    weakPoints: profile.weak_points || [],
    equipmentPreferences: (profile.equipment_preferences as Record<string, string>) || {},
    recentExercises: extractRecentExercises(recentWorkouts || []),
    approachId: profile.approach_id,
    experienceYears: profile.experience_years,
    userAge: profile.age,
    userGender: profile.gender
  })

  // Get exercise history and calculate initial targets
  const exercisesWithTargets = await Promise.all(
    selection.exercises.map(async (exercise) => {
      const history = await getExerciseHistoryServer(supabase, exercise.name)

      let targetWeight = 0
      let targetReps = exercise.repRange[0]

      if (history.length > 0) {
        // Use last performance
        const last = history[0]
        targetWeight = last.weight_actual || last.weight_target || 0
        targetReps = last.reps_actual || last.reps_target || exercise.repRange[0]
      } else {
        // Initial conservative estimate based on exercise type
        targetWeight = estimateInitialWeight(exercise.name)
      }

      // Calculate warmup set weights if warmupSets are provided
      const warmupSetsWithWeights = exercise.warmupSets?.map(warmup => ({
        ...warmup,
        weight: Math.round((warmup.weightPercentage / 100) * targetWeight * 4) / 4 // Round to nearest 0.25kg
      }))

      return {
        name: exercise.name,
        equipmentVariant: exercise.equipmentVariant,
        sets: exercise.sets,
        repRange: exercise.repRange,
        restSeconds: exercise.restSeconds,
        targetWeight,
        targetReps,
        rationale: exercise.rationaleForSelection,
        alternatives: exercise.alternatives,
        technicalCues: exercise.technicalCues,
        warmupSets: warmupSetsWithWeights,
        setGuidance: exercise.setGuidance
      }
    })
  )

  // Calculate target muscle groups from exercises
  const targetMuscleGroups = getTargetMuscleGroups(exercisesWithTargets)

  // Generate descriptive workout name
  const workoutName = generateWorkoutName(workoutType, targetMuscleGroups)

  // Create workout using server client
  const workoutData: InsertWorkout = {
    user_id: userId,
    approach_id: approachId,
    planned_at: new Date().toISOString().split('T')[0],
    exercises: exercisesWithTargets as any,
    completed: false,
    started_at: null,
    completed_at: null,
    duration_seconds: null,
    total_volume: null,
    total_sets: null,
    notes: null,
    workout_type: workoutType,
    workout_name: workoutName,
    target_muscle_groups: targetMuscleGroups,
    split_type: preferredSplit,
    // Split plan fields (null for non-split workouts)
    split_plan_id: null,
    cycle_day: null,
    variation: null,
    mental_readiness_overall: null
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert(workoutData)
    .select()
    .single()

  if (workoutError) {
    throw new Error(`Failed to create workout: ${workoutError.message}`)
  }

  return workout as Workout
}

/**
 * Extract exercise names from recent workouts
 */
function extractRecentExercises(workouts: Workout[]): string[] {
  return workouts.flatMap(w => {
    const exercises = w.exercises as any[]
    return exercises?.map((e: any) => e.name) || []
  })
}

/**
 * Get exercise history for a specific exercise using server client
 */
async function getExerciseHistoryServer(
  supabase: any,
  exerciseName: string
): Promise<any[]> {
  // Get exercise ID by name
  const { data: exercise } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', exerciseName)
    .single()

  if (!exercise) {
    return []
  }

  // Get recent sets for this exercise
  const { data: sets } = await supabase
    .from('sets_log')
    .select('*')
    .eq('exercise_id', exercise.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return sets || []
}

/**
 * Estimate initial weight for an exercise
 */
function estimateInitialWeight(exerciseName: string): number {
  const name = exerciseName.toLowerCase()

  // Very conservative starting weights
  if (name.includes('bench')) return 40
  if (name.includes('squat')) return 50
  if (name.includes('deadlift')) return 60
  if (name.includes('row')) return 30
  if (name.includes('press') && name.includes('shoulder')) return 20
  if (name.includes('curl')) return 15
  if (name.includes('extension')) return 15
  if (name.includes('raise')) return 10
  if (name.includes('fly')) return 15

  // Default conservative weight
  return 20
}

/**
 * Server action to generate a new workout
 * Uses AI to create personalized workout based on user profile
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function generateWorkoutAction(userId: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get user profile using server client
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found. Please create a profile first.')
    }

    if (!profile.approach_id) {
      throw new Error('No training approach selected. Please select a training approach in your profile.')
    }

    // Generate workout using server client
    const workout = await generateWorkoutWithServerClient(userId, supabase, profile.approach_id)

    return { success: true, workout }
  } catch (error) {
    console.error('Server action - Workout generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workout'
    }
  }
}

/**
 * Server action to calculate progression for next set
 * Uses AI to suggest optimal weight, reps, and RIR based on previous set
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function calculateProgressionAction(input: ProgressionInput) {
  try {
    const supabase = await getSupabaseServerClient()
    const calculator = new ProgressionCalculator(supabase)

    const result = await calculator.suggestNextSet(input)

    return { success: true, suggestion: result }
  } catch (error) {
    console.error('Server action - Progression calculation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate progression'
    }
  }
}

/**
 * Server action to explain a training decision
 * Uses GPT-5-mini to generate user-friendly explanations
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function explainDecisionAction(
  type: ExplanationType,
  context: ExplanationContext,
  approachId: string
) {
  try {
    const explanation = await ExplanationService.explainDecision(type, context, approachId)

    return { success: true, explanation }
  } catch (error) {
    console.error('Server action - Explanation generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate explanation'
    }
  }
}

/**
 * Server action to explain exercise selection
 * Convenience wrapper for exercise selection explanations
 */
export async function explainExerciseSelectionAction(
  exerciseName: string,
  weakPoints: string[],
  rationale: string,
  approachId: string
) {
  try {
    const explanation = await ExplanationService.explainExerciseSelection(
      exerciseName,
      weakPoints,
      rationale,
      approachId
    )

    return { success: true, explanation }
  } catch (error) {
    console.error('Server action - Exercise selection explanation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to explain exercise selection'
    }
  }
}

/**
 * Server action to explain set progression
 * Convenience wrapper for progression explanations
 */
export async function explainProgressionAction(
  currentSet: { weight: number; reps: number; rir: number },
  suggestionRationale: string,
  approachId: string
) {
  try {
    const explanation = await ExplanationService.explainProgression(
      currentSet,
      suggestionRationale,
      approachId
    )

    return { success: true, explanation }
  } catch (error) {
    console.error('Server action - Progression explanation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to explain progression'
    }
  }
}

/**
 * Server action to validate exercise reordering
 * Uses ReorderValidator agent with GPT-5-mini
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function validateReorderAction(input: ReorderValidationInput) {
  try {
    const supabase = await getSupabaseServerClient()
    const validator = new ReorderValidator(supabase)

    const result = await validator.validateReorder(input)

    return { success: true, validation: result }
  } catch (error) {
    console.error('Server action - Reorder validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate reorder'
    }
  }
}

/**
 * Server action to generate workout summary
 * Uses WorkoutSummaryAgent with GPT-5-mini for immediate post-workout feedback
 * This runs on the server and has access to OPENAI_API_KEY
 */
export async function generateWorkoutSummaryAction(input: WorkoutSummaryInput) {
  try {
    const supabase = await getSupabaseServerClient()
    const summaryAgent = new WorkoutSummaryAgent(supabase)

    const result = await summaryAgent.summarizeWorkout(input)

    return { success: true, summary: result }
  } catch (error) {
    console.error('Server action - Workout summary generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workout summary'
    }
  }
}

/**
 * Server action to update user's preferred split type
 * Updates the user_profiles table with the selected split preference
 */
export async function updatePreferredSplitAction(
  userId: string,
  splitType: SplitType
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ preferred_split: splitType })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update preferred split: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Server action - Update preferred split error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferred split'
    }
  }
}

/**
 * Server action to update user's weak points
 * Updates the user_profiles table with the selected weak points (max 5)
 */
export async function updateWeakPointsAction(
  userId: string,
  weakPoints: string[]
) {
  try {
    // Validate max 5 weak points
    if (weakPoints.length > 5) {
      throw new Error('Maximum 5 weak points allowed')
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ weak_points: weakPoints })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update weak points: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Server action - Update weak points error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update weak points'
    }
  }
}

/**
 * Server action to update user's equipment preferences
 * Updates the user_profiles table with equipment preferences for each category
 */
export async function updateEquipmentPreferencesAction(
  userId: string,
  equipmentPreferences: Record<string, string>
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ equipment_preferences: equipmentPreferences })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update equipment preferences: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Server action - Update equipment preferences error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update equipment preferences'
    }
  }
}
