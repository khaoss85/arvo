'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { ProgressionCalculator } from '@/lib/agents/progression-calculator.agent'
import { ReorderValidator } from '@/lib/agents/reorder-validator.agent'
import { WorkoutSummaryAgent } from '@/lib/agents/workout-summary.agent'
import { ExerciseSubstitutionAgent } from '@/lib/agents/exercise-substitution.agent'
import { WorkoutRationaleAgent } from '@/lib/agents/workout-rationale.agent'
import { WorkoutModificationValidator } from '@/lib/agents/workout-modification-validator.agent'
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
import type { SubstitutionInput, SubstitutionOutput, CustomSubstitutionInput, SubstitutionSuggestion } from '@/lib/agents/exercise-substitution.agent'
import type { WorkoutRationaleInput, WorkoutRationaleOutput } from '@/lib/agents/workout-rationale.agent'
import type { ModificationValidationInput, ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'

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

    // Step 1: Create user profile first (workout generation needs it)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        approach_id: data.approachId,
        weak_points: data.weakPoints,
        available_equipment: data.availableEquipment || [],
        equipment_preferences: data.equipmentPreferences, // Keep for backward compatibility
        strength_baseline: data.strengthBaseline,
        first_name: data.firstName || null,
        gender: data.gender || null,
        age: data.age || null,
        weight: data.weight || null,
        height: data.height || null,
        experience_years: data.confirmedExperience || 0,
        preferred_split: data.splitType || null,
        active_split_plan_id: null, // Will be updated after split plan generation
        current_cycle_day: null
      })

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    // Step 2: Parallelize split plan generation and workout generation
    const splitPlanPromise = (data.splitType && data.weeklyFrequency)
      ? (async () => {
          const { generateSplitPlanAction } = await import('./split-actions')
          return generateSplitPlanAction({
            userId,
            approachId: data.approachId,
            splitType: data.splitType!,
            weeklyFrequency: data.weeklyFrequency!,
            weakPoints: data.weakPoints || [],
            equipmentAvailable: data.availableEquipment || [],
            experienceYears: data.confirmedExperience || null,
            userAge: data.age || null,
            userGender: data.gender || null
          })
        })()
      : Promise.resolve(null)

    const workoutPromise = generateWorkoutWithServerClient(userId, supabase, data.approachId!, true)

    const [splitResult, workout] = await Promise.all([splitPlanPromise, workoutPromise])

    // Step 3: Update profile with split plan ID if available
    if (splitResult?.success && splitResult.data) {
      await supabase
        .from('user_profiles')
        .update({
          active_split_plan_id: splitResult.data.splitPlan.id,
          current_cycle_day: 1
        })
        .eq('user_id', userId)
    }

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
  approachId: string,
  skipExerciseSaving?: boolean // Skip saving exercises to DB for onboarding performance
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
    availableEquipment: profile.available_equipment || [],
    equipmentPreferences: (profile.equipment_preferences as Record<string, string>) || {}, // Fallback for old data
    recentExercises: extractRecentExercises(recentWorkouts || []),
    approachId: profile.approach_id,
    experienceYears: profile.experience_years,
    userAge: profile.age,
    userGender: profile.gender,
    userId: userId,
    skipSaving: skipExerciseSaving, // Skip DB saves during onboarding for performance
    // Mesocycle context for periodization-aware exercise selection
    mesocycleWeek: profile.current_mesocycle_week,
    mesocyclePhase: profile.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null
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
    mental_readiness_overall: null,
    status: 'ready'
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert(workoutData)
    .select()
    .single()

  if (workoutError) {
    throw new Error(`Failed to create workout: ${workoutError.message}`)
  }

  return workout as unknown as Workout
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
  // Get recent sets for this exercise by name
  // Note: exercise_id is nullable, so we query by exercise_name instead
  const { data: sets } = await supabase
    .from('sets_log')
    .select('*')
    .ilike('exercise_name', exerciseName)
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
export async function calculateProgressionAction(userId: string, input: ProgressionInput) {
  console.log('[calculateProgressionAction] Received request', {
    userId,
    input: {
      lastSet: input.lastSet,
      setNumber: input.setNumber,
      exerciseType: input.exerciseType,
      approachId: input.approachId,
      experienceYears: input.experienceYears,
      userAge: input.userAge
    },
    timestamp: new Date().toISOString()
  })

  try {
    const supabase = await getSupabaseServerClient()

    // Fetch user profile for mesocycle context
    console.log('[calculateProgressionAction] Fetching user profile for mesocycle context')
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_mesocycle_week, mesocycle_phase')
      .eq('user_id', userId)
      .single()

    console.log('[calculateProgressionAction] User profile fetched', {
      hasProfile: !!profile,
      mesocycleWeek: profile?.current_mesocycle_week,
      mesocyclePhase: profile?.mesocycle_phase
    })

    const calculator = new ProgressionCalculator(supabase)

    const enrichedInput = {
      ...input,
      mesocycleWeek: profile?.current_mesocycle_week ?? undefined,
      mesocyclePhase: (profile?.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined
    }

    console.log('[calculateProgressionAction] Calling ProgressionCalculator.suggestNextSet with enriched input')
    const result = await calculator.suggestNextSet(enrichedInput)

    console.log('[calculateProgressionAction] Suggestion generated successfully', {
      suggestion: result.suggestion,
      hasRationale: !!result.rationale,
      hasAlternatives: !!result.alternatives
    })

    return { success: true, suggestion: result }
  } catch (error) {
    console.error('[calculateProgressionAction] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      inputLastSet: input.lastSet
    })
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
export async function generateWorkoutSummaryAction(userId: string, input: WorkoutSummaryInput) {
  try {
    const supabase = await getSupabaseServerClient()

    // Fetch user profile for mesocycle context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_mesocycle_week, mesocycle_phase')
      .eq('user_id', userId)
      .single()

    const summaryAgent = new WorkoutSummaryAgent(supabase)

    const result = await summaryAgent.summarizeWorkout({
      ...input,
      mesocycleWeek: profile?.current_mesocycle_week || null,
      mesocyclePhase: profile?.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null
    })

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

/**
 * Server action to suggest exercise substitutions
 * Uses AI to generate 3-5 intelligent alternatives with validation
 * Optimized for gym use: concise rationales, quick decisions
 */
export async function suggestExerciseSubstitutionAction(
  userId: string,
  input: SubstitutionInput
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Load user profile for context (approach, weak points, equipment, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Failed to load user profile')
    }

    // Load active insights and memories
    const { data: insights } = await (supabase as any).rpc('get_active_insights', {
      p_user_id: userId,
      p_min_relevance: 0.3
    })

    const { data: memories } = await (supabase as any).rpc('get_active_memories', {
      p_user_id: userId,
      p_min_confidence: 0.5
    })

    // Enrich input with user profile data + insights + memories
    const enrichedInput: SubstitutionInput = {
      ...input,
      approachId: profile.approach_id || '',
      weakPoints: profile.weak_points || [],
      availableEquipment: (profile as any).available_equipment || [],
      experienceYears: profile.experience_years ?? undefined,
      mesocycleWeek: profile.current_mesocycle_week ?? undefined,
      mesocyclePhase: (profile.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined,
      activeInsights: (insights || []).map((i: any) => ({
        id: i.id,
        exerciseName: i.exercise_name,
        type: i.insight_type,
        severity: i.severity,
        userNote: i.user_note
      })),
      activeMemories: (memories || []).map((m: any) => ({
        id: m.id,
        category: m.memory_category,
        title: m.title,
        confidenceScore: m.confidence_score,
        relatedExercises: m.related_exercises || []
      }))
    }

    // Create agent instance with server Supabase client
    const agent = new ExerciseSubstitutionAgent(supabase)

    // Generate substitution suggestions
    const result = await agent.suggestSubstitutions(enrichedInput)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Server action - Exercise substitution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest substitutions'
    }
  }
}

/**
 * Server action to generate workout rationale
 * Uses AI to explain why exercises were chosen based on user context
 * Optimized for gym use: concise explanations, 2-3 sentences overall + 1 per exercise
 */
export async function generateWorkoutRationaleAction(
  userId: string,
  input: WorkoutRationaleInput
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Load user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Failed to load user profile')
    }

    // Enrich input with user profile data
    const enrichedInput: WorkoutRationaleInput = {
      ...input,
      approachId: profile.approach_id || '',
      weakPoints: profile.weak_points || [],
      experienceYears: profile.experience_years ?? undefined,
      mesocycleWeek: profile.current_mesocycle_week ?? undefined,
      mesocyclePhase: (profile.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined
    }

    // Create agent instance with server Supabase client
    const agent = new WorkoutRationaleAgent(supabase)

    // Generate rationale
    const result = await agent.generateRationale(enrichedInput)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Server action - Workout rationale error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workout rationale'
    }
  }
}

/**
 * Server action to validate user's custom exercise substitution
 * Allows users to propose their own exercise and get AI validation
 * Returns same format as AI suggestions for consistent UX
 */
export async function validateCustomSubstitutionAction(
  userId: string,
  input: CustomSubstitutionInput
): Promise<{ success: true; data: SubstitutionSuggestion } | { success: false; error: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    // Load user profile for context (approach, weak points, equipment, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Failed to load user profile')
    }

    // Load active insights and memories
    const { data: insights } = await (supabase as any).rpc('get_active_insights', {
      p_user_id: userId,
      p_min_relevance: 0.3
    })

    const { data: memories } = await (supabase as any).rpc('get_active_memories', {
      p_user_id: userId,
      p_min_confidence: 0.5
    })

    // Enrich input with user profile data + insights + memories
    const enrichedInput: CustomSubstitutionInput = {
      ...input,
      approachId: profile.approach_id || '',
      weakPoints: profile.weak_points || [],
      availableEquipment: (profile as any).available_equipment || [],
      experienceYears: profile.experience_years ?? undefined,
      mesocycleWeek: profile.current_mesocycle_week ?? undefined,
      mesocyclePhase: (profile.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined,
      activeInsights: (insights || []).map((i: any) => ({
        id: i.id,
        exerciseName: i.exercise_name,
        type: i.insight_type,
        severity: i.severity,
        userNote: i.user_note
      })),
      activeMemories: (memories || []).map((m: any) => ({
        id: m.id,
        category: m.memory_category,
        title: m.title,
        confidenceScore: m.confidence_score,
        relatedExercises: m.related_exercises || []
      }))
    }

    // Create agent instance with server Supabase client
    const agent = new ExerciseSubstitutionAgent(supabase)

    // Validate user's custom exercise
    const result = await agent.validateCustomSubstitution(enrichedInput)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Server action - Custom substitution validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate custom substitution'
    }
  }
}

/**
 * Server action to generate a draft workout for a future cycle day
 * This allows pre-generation of workouts that can be reviewed/refined before execution
 */
export async function generateDraftWorkoutAction(
  userId: string,
  targetCycleDay: number
) {
  try {
    const { WorkoutGeneratorService } = await import('@/lib/services/workout-generator.service')

    const workout = await WorkoutGeneratorService.generateDraftWorkout(userId, targetCycleDay)

    return {
      success: true,
      workout
    }
  } catch (error) {
    console.error('Server action - Draft workout generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate draft workout'
    }
  }
}

/**
 * Server action to update workout status
 * Used to transition workouts between draft/ready/in_progress/completed states
 */
export async function updateWorkoutStatusAction(
  workoutId: string,
  status: 'draft' | 'ready' | 'in_progress' | 'completed'
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workouts')
      .update({ status } as any)
      .eq('id', workoutId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workout status: ${error.message}`)
    }

    return {
      success: true,
      workout: data
    }
  } catch (error) {
    console.error('Server action - Update workout status error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workout status'
    }
  }
}

/**
 * Server action to update workout exercises
 * Used when refining pre-generated workouts
 */
export async function updateWorkoutExercisesAction(
  workoutId: string,
  exercises: any[]
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('workouts')
      .update({ exercises: exercises as any })
      .eq('id', workoutId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workout exercises: ${error.message}`)
    }

    return {
      success: true,
      workout: data
    }
  } catch (error) {
    console.error('Server action - Update workout exercises error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workout exercises'
    }
  }
}

/**
 * Server action to validate workout modifications (adding extra sets)
 * Uses WorkoutModificationValidator agent with GPT-5-mini
 * Analyzes if modification aligns with training approach and periodization phase
 */
export async function validateWorkoutModificationAction(
  userId: string,
  input: ModificationValidationInput
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Enrich with user profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    // Enrich input with profile data
    const enrichedInput: ModificationValidationInput = {
      ...input,
      userContext: {
        ...input.userContext,
        approachId: profile.approach_id || input.userContext.approachId,
        experienceYears: profile.experience_years ?? undefined,
        userAge: profile.age ?? undefined,
        weakPoints: profile.weak_points || []
      },
      workoutContext: {
        ...input.workoutContext,
        mesocycleWeek: profile.current_mesocycle_week ?? input.workoutContext.mesocycleWeek,
        mesocyclePhase: (profile.mesocycle_phase as any) ?? input.workoutContext.mesocyclePhase
      }
    }

    // Create validator agent and validate modification
    const validator = new WorkoutModificationValidator(supabase)
    const result = await validator.validateModification(enrichedInput)

    console.log('[validateWorkoutModificationAction] Validation result:', {
      validation: result.validation,
      exerciseName: input.exerciseInfo.name,
      currentSets: input.exerciseInfo.currentSets,
      proposedSets: input.exerciseInfo.proposedSets,
      warningsCount: result.warnings.length
    })

    return { success: true, validation: result }
  } catch (error) {
    console.error('Server action - Modification validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate modification'
    }
  }
}
