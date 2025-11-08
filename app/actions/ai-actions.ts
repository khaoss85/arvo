'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { ProgressionCalculator } from '@/lib/agents/progression-calculator.agent'
import type { ProgressionInput } from '@/lib/types/progression'
import type { OnboardingData } from '@/lib/types/onboarding'
import type { Workout, InsertWorkout } from '@/lib/types/schemas'

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

    // Upsert user profile using server client (bypasses RLS with server role)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        approach_id: data.approachId,
        weak_points: data.weakPoints,
        equipment_preferences: data.equipmentPreferences,
        strength_baseline: data.strengthBaseline,
        experience_years: 0
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

  const workoutType = determineNextWorkoutType(recentWorkouts || [])

  // Select exercises using AI
  const selection = await exerciseSelector.selectExercises({
    workoutType,
    weakPoints: profile.weak_points || [],
    equipmentPreferences: (profile.equipment_preferences as Record<string, string>) || {},
    recentExercises: extractRecentExercises(recentWorkouts || []),
    approachId: profile.approach_id
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

      return {
        name: exercise.name,
        equipmentVariant: exercise.equipmentVariant,
        sets: exercise.sets,
        repRange: exercise.repRange,
        restSeconds: exercise.restSeconds,
        targetWeight,
        targetReps,
        rationale: exercise.rationaleForSelection,
        alternatives: exercise.alternatives
      }
    })
  )

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
    notes: null
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
 * Determine next workout type based on recent workouts
 */
function determineNextWorkoutType(
  recentWorkouts: Workout[]
): 'push' | 'pull' | 'legs' | 'upper' | 'lower' {
  // Default sequence: push -> pull -> legs
  const sequence: ('push' | 'pull' | 'legs')[] = ['push', 'pull', 'legs']

  if (recentWorkouts.length === 0) {
    return 'push'
  }

  // Try to extract workout type from last workout's exercises
  const lastWorkout = recentWorkouts[0]
  const exercises = lastWorkout.exercises as any[]

  if (!exercises || exercises.length === 0) {
    return 'push'
  }

  // Simple heuristic: check first exercise name for workout type indicators
  const firstExerciseName = exercises[0]?.name?.toLowerCase() || ''

  let lastType: 'push' | 'pull' | 'legs' = 'legs'

  if (firstExerciseName.includes('bench') || firstExerciseName.includes('press') || firstExerciseName.includes('dip')) {
    lastType = 'push'
  } else if (firstExerciseName.includes('row') || firstExerciseName.includes('pull') || firstExerciseName.includes('lat')) {
    lastType = 'pull'
  } else if (firstExerciseName.includes('squat') || firstExerciseName.includes('leg') || firstExerciseName.includes('lunge')) {
    lastType = 'legs'
  }

  // Rotate to next in sequence
  const lastIndex = sequence.indexOf(lastType)
  return sequence[(lastIndex + 1) % sequence.length]
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
