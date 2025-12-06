'use server'

import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'
import { ExerciseSelector } from '@/lib/agents/exercise-selector.agent'
import { ProgressionCalculator } from '@/lib/agents/progression-calculator.agent'
import { ReorderValidator } from '@/lib/agents/reorder-validator.agent'
import { WorkoutSummaryAgent } from '@/lib/agents/workout-summary.agent'
import { ExerciseSubstitutionAgent } from '@/lib/agents/exercise-substitution.agent'
import { WorkoutRationaleAgent } from '@/lib/agents/workout-rationale.agent'
import { WorkoutModificationValidator } from '@/lib/agents/workout-modification-validator.agent'
import { ExerciseAdditionValidator, type ExerciseAdditionInput } from '@/lib/agents/exercise-addition-validator.agent'
import { ExerciseSuggester, type ExerciseSuggestionInput } from '@/lib/agents/exercise-suggester.agent'
import { EquipmentValidator } from '@/lib/agents/equipment-validator.agent'
import { SkipImpactAgent, type SkipImpactInput, type SkipImpactOutput } from '@/lib/agents/skip-impact.agent'
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
import { getExerciseName } from '@/lib/utils/exercise-helpers'

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

    // During onboarding, default to English (will be auto-detected on first app load via browser language)
    const workoutPromise = generateWorkoutWithServerClient(userId, supabase, data.approachId!, true, 'en')

    const [splitResult, workout] = await Promise.all([splitPlanPromise, workoutPromise])

    // Step 3: Update profile with split plan ID if available
    if (splitResult?.success && splitResult.data && 'splitPlan' in splitResult.data) {
      const splitPlanId = (splitResult.data as any).splitPlan?.id
      if (splitPlanId) {
        await supabase
          .from('user_profiles')
          .update({
            active_split_plan_id: splitPlanId,
            current_cycle_day: 1
          })
          .eq('user_id', userId)
      }
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
  skipExerciseSaving?: boolean, // Skip saving exercises to DB for onboarding performance
  targetLanguage?: 'en' | 'it' // User's preferred language for AI responses
): Promise<Workout> {
  // Get user's language if not provided
  const language = targetLanguage || await getUserLanguage(userId)

  // Pass server client to ExerciseSelector for database access (using low reasoning for faster generation)
  const exerciseSelector = new ExerciseSelector(supabase, 'low')

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
    .eq('status', 'completed')
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

  // Merge standard equipment with custom equipment
  const customEquipment = (profile.custom_equipment as Array<{ id: string; name: string; exampleExercises: string[] }>) || []
  const customEquipmentIds = customEquipment.map(eq => eq.id)
  const allAvailableEquipment = [...((profile as any).available_equipment || []), ...customEquipmentIds]

  // Fetch active insights (includes proactive physical limitations from Settings)
  const { data: activeInsights } = await supabase
    .rpc('get_active_insights', {
      p_user_id: userId,
      p_min_relevance: 0.3
    })

  // Fetch active memories (learned user preferences and patterns)
  const { data: activeMemories } = await supabase
    .rpc('get_active_memories', {
      p_user_id: userId,
      p_min_confidence: 0.6
    })

  // Transform database results to agent-expected format (snake_case → camelCase)
  const transformedInsights = (activeInsights || []).map((insight: any) => ({
    id: insight.id,
    type: insight.insight_type,
    severity: insight.severity,
    exerciseName: insight.exercise_name || undefined,
    userNote: insight.user_note,
    metadata: insight.metadata
  }))

  const transformedMemories = (activeMemories || []).map((memory: any) => ({
    id: memory.id,
    category: memory.memory_category,
    title: memory.title,
    description: memory.description || undefined,
    confidenceScore: memory.confidence_score,
    relatedExercises: memory.related_exercises || [],
    relatedMuscles: memory.related_muscles || []
  }))

  // Select exercises using AI
  const selection = await exerciseSelector.selectExercises({
    workoutType: workoutType as Exclude<WorkoutType, 'rest'>, // Safe: rest days are filtered above
    weakPoints: (profile as any).weak_points || [],
    availableEquipment: allAvailableEquipment,
    customEquipment: customEquipment, // Pass custom equipment metadata
    recentExercises: extractRecentExercises(recentWorkouts || []),
    approachId: (profile as any).approach_id,
    experienceYears: (profile as any).experience_years,
    userAge: (profile as any).age,
    userGender: (profile as any).gender,
    userId: userId,
    skipSaving: skipExerciseSaving, // Skip DB saves during onboarding for performance
    // Mesocycle context for periodization-aware exercise selection
    mesocycleWeek: (profile as any).current_mesocycle_week,
    mesocyclePhase: (profile as any).mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null,
    // Caloric phase context for approach-aware optimization
    caloricPhase: profile.caloric_phase as 'bulk' | 'cut' | 'maintenance' | null,
    caloricIntakeKcal: profile.caloric_intake_kcal,
    // Active insights and memories for AI safety and personalization
    activeInsights: transformedInsights,
    activeMemories: transformedMemories
  }, language)

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
    status: 'ready',
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

  return workout as unknown as Workout
}

/**
 * Extract exercise names from recent workouts
 */
function extractRecentExercises(workouts: Workout[]): string[] {
  return workouts.flatMap(w => {
    const exercises = w.exercises as any[]
    return exercises?.map((e: any) => getExerciseName(e)) || []
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
  if (name.includes('leg') && name.includes('press')) return 70 // Leg press is a heavy compound movement
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

    if (!(profile as any).approach_id) {
      throw new Error('No training approach selected. Please select a training approach in your profile.')
    }

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    // Generate workout using server client
    const workout = await generateWorkoutWithServerClient(userId, supabase, (profile as any).approach_id, false, targetLanguage)

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
      userAge: input.userAge,
      workoutId: input.workoutId
    },
    timestamp: new Date().toISOString()
  })

  try {
    const supabase = await getSupabaseServerClient()

    // Check if AI suggestions are disabled for this workout
    if (input.workoutId) {
      const { data: workout } = await supabase
        .from('workouts')
        .select('ai_suggestions_enabled')
        .eq('id', input.workoutId)
        .single()

      if (workout?.ai_suggestions_enabled === false) {
        console.log('[calculateProgressionAction] AI suggestions disabled for workout', input.workoutId)
        return {
          success: true,
          suggestion: null
        }
      }
    }

    // Fetch user profile for mesocycle context and language preference
    console.log('[calculateProgressionAction] Fetching user profile for mesocycle context')
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_mesocycle_week, mesocycle_phase, preferred_language')
      .eq('user_id', userId)
      .single()

    console.log('[calculateProgressionAction] User profile fetched', {
      hasProfile: !!profile,
      mesocycleWeek: profile?.current_mesocycle_week,
      mesocyclePhase: profile?.mesocycle_phase,
      preferredLanguage: profile?.preferred_language
    })

    // Fetch active insights (includes proactive physical limitations from Settings)
    const { data: activeInsights } = await supabase
      .rpc('get_active_insights', {
        p_user_id: userId,
        p_min_relevance: 0.3
      })

    // Transform database results to agent-expected format (snake_case → camelCase)
    const transformedInsights = (activeInsights || []).map((insight: any) => ({
      id: insight.id,
      type: insight.insight_type,
      severity: insight.severity,
      exerciseName: insight.exercise_name || undefined,
      userNote: insight.user_note
    }))

    console.log('[calculateProgressionAction] Active insights fetched', {
      insightCount: transformedInsights.length,
      hasExerciseSpecific: transformedInsights.some((i: any) => i.exerciseName)
    })

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    const calculator = new ProgressionCalculator(supabase)

    const enrichedInput = {
      ...input,
      mesocycleWeek: profile?.current_mesocycle_week ?? undefined,
      mesocyclePhase: (profile?.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined,
      activeInsights: transformedInsights
    }

    console.log('[calculateProgressionAction] Calling ProgressionCalculator.suggestNextSet with enriched input')
    const result = await calculator.suggestNextSet(enrichedInput, targetLanguage)

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
  userId: string,
  type: ExplanationType,
  context: ExplanationContext,
  approachId: string
) {
  try {
    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    const explanation = await ExplanationService.explainDecision(type, context, approachId, targetLanguage)

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
  userId: string,
  exerciseName: string,
  weakPoints: string[],
  rationale: string,
  approachId: string
) {
  try {
    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    const explanation = await ExplanationService.explainExerciseSelection(
      exerciseName,
      weakPoints,
      rationale,
      approachId,
      targetLanguage
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
  userId: string,
  currentSet: { weight: number; reps: number; rir: number },
  suggestionRationale: string,
  approachId: string
) {
  try {
    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    const explanation = await ExplanationService.explainProgression(
      currentSet,
      suggestionRationale,
      approachId,
      targetLanguage
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

    // Fetch user profile for mesocycle context and language preference
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_mesocycle_week, mesocycle_phase, preferred_language')
      .eq('user_id', userId)
      .single()

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    const summaryAgent = new WorkoutSummaryAgent(supabase)
    summaryAgent.setUserId(userId)

    const result = await summaryAgent.summarizeWorkout({
      ...input,
      mesocycleWeek: profile?.current_mesocycle_week || null,
      mesocyclePhase: profile?.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null
    }, targetLanguage)

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
 * Server action to get user's weak points
 * Returns the weak points array from user_profiles table
 */
export async function getUserWeakPointsAction(
  userId: string
): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('weak_points')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to get weak points: ${error.message}`)
    }

    return { success: true, data: data?.weak_points || [] }
  } catch (error) {
    console.error('Server action - Get weak points error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get weak points'
    }
  }
}

/**
 * Server action to update user's caloric phase
 * Updates the user_profiles table with the selected caloric phase (bulk/cut/maintenance)
 * and optionally the caloric intake (surplus/deficit in kcal)
 */
export async function updateCaloricPhaseAction(
  userId: string,
  phase: 'bulk' | 'cut' | 'maintenance',
  caloricIntakeKcal?: number | null
) {
  try {
    // Validate caloric intake range if provided
    if (caloricIntakeKcal !== undefined && caloricIntakeKcal !== null) {
      if (caloricIntakeKcal < -1500 || caloricIntakeKcal > 1500) {
        throw new Error('Caloric intake must be between -1500 and +1500 kcal')
      }
      // For maintenance phase, caloric intake should not be set
      if (phase === 'maintenance' && caloricIntakeKcal !== 0) {
        throw new Error('Maintenance phase should have neutral caloric intake')
      }
    }

    const supabase = await getSupabaseServerClient()
    const startDate = new Date().toISOString()

    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        caloric_phase: phase,
        caloric_phase_start_date: startDate,
        ...(caloricIntakeKcal !== undefined && { caloric_intake_kcal: caloricIntakeKcal })
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update caloric phase: ${error.message}`)
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Server action - Update caloric phase error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update caloric phase'
    }
  }
}

/**
 * Server action to update user's available equipment (primary system)
 * Updates the user_profiles table with the complete equipment inventory
 */
export async function updateAvailableEquipmentAction(
  userId: string,
  availableEquipment: string[]
) {
  try {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ available_equipment: availableEquipment })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update available equipment: ${error.message}`)
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Server action - Update available equipment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update available equipment'
    }
  }
}

/**
 * Server action to validate custom equipment name using AI
 * Supports both text input and photo recognition
 * Returns validation result without saving to database
 */
export async function validateCustomEquipmentAction(
  userId: string,
  equipmentName?: string,
  imageBase64?: string
) {
  try {
    // Validate inputs
    if (!equipmentName && !imageBase64) {
      throw new Error('Either equipment name or image must be provided')
    }

    const supabase = await getSupabaseServerClient()

    // Get user's current equipment
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('available_equipment, custom_equipment')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw new Error('User profile not found')
      }
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    if (!profile) {
      throw new Error('User profile not found')
    }

    // Initialize validator
    const validator = new EquipmentValidator(supabase)

    let finalEquipmentName = equipmentName

    // If image is provided, extract equipment name using Vision API
    if (imageBase64) {
      console.log('[validateCustomEquipmentAction] Extracting equipment name from image')

      try {
        finalEquipmentName = await validator.extractNameFromImage(imageBase64)
        console.log('[validateCustomEquipmentAction] Detected equipment:', finalEquipmentName)
      } catch (error) {
        // API error (timeout, rate limit, etc.) - return specific error message
        const errorMessage = error instanceof Error ? error.message : 'Failed to process image'
        console.error('[validateCustomEquipmentAction] Vision API error:', errorMessage)
        return {
          success: false,
          error: errorMessage
        }
      }

      // Check if extraction returned Unknown Equipment (legitimate recognition failure)
      if (!finalEquipmentName || finalEquipmentName === 'Unknown Equipment') {
        return {
          success: false,
          error: 'Could not identify gym equipment in the image. Please try again with a clearer photo or enter the equipment name manually.'
        }
      }
    }

    // Validate equipment (same flow for both text and photo input)
    const result = await validator.validateEquipment({
      equipmentName: finalEquipmentName!,
      existingEquipment: (profile as any).available_equipment || [],
      customEquipment: (profile.custom_equipment as Array<{ id: string; name: string }>) || [],
      userId
    })

    return { success: true, result, detectedName: imageBase64 ? finalEquipmentName : undefined }
  } catch (error) {
    console.error('Server action - Validate custom equipment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate equipment'
    }
  }
}

/**
 * Server action to add validated custom equipment to user's profile
 * Should only be called after validateCustomEquipmentAction returns approved/unclear
 */
export async function addCustomEquipmentAction(
  userId: string,
  equipment: {
    name: string
    category: string
    exampleExercises: string[]
    validated: boolean
  }
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current custom equipment
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('custom_equipment')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw new Error('User profile not found')
      }
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    if (!profile) {
      throw new Error('User profile not found')
    }

    const customEquipment = (profile.custom_equipment as Array<any>) || []

    // Generate unique ID
    const equipmentId = `custom_${equipment.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

    // Add new equipment
    const newEquipment = {
      id: equipmentId,
      name: equipment.name,
      category: equipment.category,
      exampleExercises: equipment.exampleExercises,
      validated: equipment.validated,
      addedAt: new Date().toISOString()
    }

    customEquipment.push(newEquipment)

    // Update database
    const { error } = await supabase
      .from('user_profiles')
      .update({ custom_equipment: customEquipment })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to add custom equipment: ${error.message}`)
    }

    revalidatePath('/settings')
    return { success: true, equipment: newEquipment }
  } catch (error) {
    console.error('Server action - Add custom equipment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add custom equipment'
    }
  }
}

/**
 * Server action to remove custom equipment from user's profile
 */
export async function removeCustomEquipmentAction(
  userId: string,
  equipmentId: string
) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current custom equipment
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('custom_equipment')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        throw new Error('User profile not found')
      }
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    if (!profile) {
      throw new Error('User profile not found')
    }

    const customEquipment = (profile.custom_equipment as Array<any>) || []

    // Remove equipment by ID
    const updatedEquipment = customEquipment.filter((eq: any) => eq.id !== equipmentId)

    // Update database
    const { error } = await supabase
      .from('user_profiles')
      .update({ custom_equipment: updatedEquipment })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to remove custom equipment: ${error.message}`)
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Server action - Remove custom equipment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove custom equipment'
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

    // Load user profile, insights, and memories in parallel for faster response
    const [
      { data: profile, error: profileError },
      { data: insights },
      { data: memories }
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      (supabase as any).rpc('get_active_insights', {
        p_user_id: userId,
        p_min_relevance: 0.3
      }),
      (supabase as any).rpc('get_active_memories', {
        p_user_id: userId,
        p_min_confidence: 0.5
      })
    ])

    if (profileError || !profile) {
      throw new Error('Failed to load user profile')
    }

    // Enrich input with user profile data + insights + memories
    const enrichedInput: SubstitutionInput = {
      ...input,
      approachId: (profile as any).approach_id || '',
      weakPoints: (profile as any).weak_points || [],
      availableEquipment: (profile as any).available_equipment || [],
      experienceYears: (profile as any).experience_years ?? undefined,
      mesocycleWeek: (profile as any).current_mesocycle_week ?? undefined,
      mesocyclePhase: ((profile as any).mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined,
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

    // Get user's preferred language from already-fetched profile
    const language = (profile as any).preferred_language
    const targetLanguage = (language === 'en' || language === 'it') ? language : 'en'

    // Create agent instance with server Supabase client
    // Using 'none' reasoning for ultra-fast responses (~1s vs ~5s)
    const agent = new ExerciseSubstitutionAgent(supabase, 'none')
    agent.setUserId(userId)

    // Generate substitution suggestions
    const result = await agent.suggestSubstitutions(enrichedInput, targetLanguage)

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
      approachId: (profile as any).approach_id || '',
      weakPoints: (profile as any).weak_points || [],
      experienceYears: (profile as any).experience_years ?? undefined,
      mesocycleWeek: (profile as any).current_mesocycle_week ?? undefined,
      mesocyclePhase: ((profile as any).mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined
    }

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    // Create agent instance with server Supabase client
    const agent = new WorkoutRationaleAgent(supabase)
    agent.setUserId(userId)

    // Generate rationale
    const result = await agent.generateRationale(enrichedInput, targetLanguage)

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
      approachId: (profile as any).approach_id || '',
      weakPoints: (profile as any).weak_points || [],
      availableEquipment: (profile as any).available_equipment || [],
      experienceYears: (profile as any).experience_years ?? undefined,
      mesocycleWeek: (profile as any).current_mesocycle_week ?? undefined,
      mesocyclePhase: ((profile as any).mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | null) ?? undefined,
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

    // Get user's preferred language
    const targetLanguage = await getUserLanguage(userId)

    // Create agent instance with server Supabase client
    // Using 'none' reasoning for fast validation (~1s vs ~5s)
    const agent = new ExerciseSubstitutionAgent(supabase, 'none')
    agent.setUserId(userId)

    // Validate user's custom exercise
    const result = await agent.validateCustomSubstitution(enrichedInput, targetLanguage)

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
        approachId: (profile as any).approach_id || input.userContext.approachId,
        experienceYears: (profile as any).experience_years ?? undefined,
        userAge: (profile as any).age ?? undefined,
        weakPoints: (profile as any).weak_points || []
      },
      workoutContext: {
        ...input.workoutContext,
        mesocycleWeek: (profile as any).current_mesocycle_week ?? input.workoutContext.mesocycleWeek,
        mesocyclePhase: ((profile as any).mesocycle_phase as any) ?? input.workoutContext.mesocyclePhase
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

/**
 * Validate adding a new exercise to workout
 * Server action for Exercise Addition Validator agent
 * Analyzes muscle overlap, fatigue, and workout balance
 */
export async function validateExerciseAdditionAction(
  userId: string,
  input: ExerciseAdditionInput
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
    const enrichedInput: ExerciseAdditionInput = {
      ...input,
      userContext: {
        ...input.userContext,
        approachId: (profile as any).approach_id || input.userContext.approachId,
        experienceYears: (profile as any).experience_years ?? undefined,
        userAge: (profile as any).age ?? undefined,
        weakPoints: (profile as any).weak_points || []
      },
      currentWorkout: {
        ...input.currentWorkout,
        mesocycleWeek: (profile as any).current_mesocycle_week ?? input.currentWorkout.mesocycleWeek,
        mesocyclePhase: ((profile as any).mesocycle_phase as any) ?? input.currentWorkout.mesocyclePhase
      }
    }

    // Create validator agent and validate exercise addition
    const validator = new ExerciseAdditionValidator(supabase)
    const result = await validator.validateExerciseAddition(enrichedInput)

    console.log('[validateExerciseAdditionAction] Validation result:', {
      validation: result.validation,
      exerciseName: input.exerciseToAdd.name,
      currentExercises: input.currentWorkout.totalExercises,
      warningsCount: result.warnings.length
    })

    return { success: true, validation: result }
  } catch (error) {
    console.error('Server action - Exercise addition validation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate exercise addition'
    }
  }
}

/**
 * Suggest exercises to add to current workout
 * Server action for Exercise Suggester agent
 * Returns 3-5 suggested exercises ranked by appropriateness
 */
export async function suggestExerciseAdditionAction(
  userId: string,
  input: ExerciseSuggestionInput
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
    const enrichedInput: ExerciseSuggestionInput = {
      ...input,
      userContext: {
        ...input.userContext,
        approachId: (profile as any).approach_id || input.userContext.approachId,
        experienceYears: (profile as any).experience_years ?? undefined,
        userAge: (profile as any).age ?? undefined,
        weakPoints: (profile as any).weak_points || [],
        availableEquipment: (profile as any).available_equipment || []
      },
      mesocycleWeek: (profile as any).current_mesocycle_week ?? input.mesocycleWeek,
      mesocyclePhase: ((profile as any).mesocycle_phase as any) ?? input.mesocyclePhase
    }

    // Create suggester agent and get suggestions
    const suggester = new ExerciseSuggester(supabase)
    const result = await suggester.suggestExercises(enrichedInput)

    console.log('[suggestExerciseAdditionAction] Suggestions generated:', {
      suggestionsCount: result.suggestions.length,
      workoutType: input.currentWorkout.workoutType,
      currentExercises: input.currentWorkout.totalExercises,
      bestChoice: result.recommendations.bestChoice
    })

    return { success: true, suggestions: result }
  } catch (error) {
    console.error('Server action - Exercise suggestion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to suggest exercises'
    }
  }
}

/**
 * Server action to extract equipment name and muscle groups from photo
 * Uses Vision API to identify gym equipment in uploaded image
 * Used for photo-based exercise substitution
 */
export async function extractEquipmentNameFromImageAction(
  imageBase64: string
): Promise<
  | { success: true; detectedName: string; primaryMuscles: string[]; secondaryMuscles?: string[] }
  | { success: false; error: string }
> {
  try {
    const supabase = await getSupabaseServerClient()
    const validator = new EquipmentValidator(supabase)

    const details = await validator.extractEquipmentDetailsFromImage(imageBase64)

    if (!details.name || details.name === 'Unknown Equipment') {
      return {
        success: false,
        error: 'Could not identify gym equipment. Try a clearer photo or enter the name manually.',
      }
    }

    return {
      success: true,
      detectedName: details.name,
      primaryMuscles: details.primaryMuscles,
      secondaryMuscles: details.secondaryMuscles,
    }
  } catch (error) {
    console.error('Server action - Extract equipment name from image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    }
  }
}

/**
 * Server action to evaluate the impact of skipping an exercise
 * Uses ultra-fast AI (gpt-5-nano) for instant feedback
 */
export async function evaluateSkipImpactAction(
  input: SkipImpactInput
): Promise<{ success: boolean; result?: SkipImpactOutput; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const locale = await getLocale() as 'en' | 'it'

    console.log('[evaluateSkipImpactAction] Locale detected:', locale)

    const agent = new SkipImpactAgent(supabase)
    const result = await agent.evaluate(input, locale)

    return { success: true, result }
  } catch (error) {
    console.error('[evaluateSkipImpactAction] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate skip impact'
    }
  }
}

/**
 * Server action to extract branding from a website URL
 * Fetches HTML and parses meta tags, colors, fonts
 */
export async function extractBrandingFromUrlAction(
  url: string
): Promise<{
  success: boolean
  data?: import('@/lib/types/branding-extraction.types').ExtractedBranding
  error?: string
}> {
  try {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'URL is required' }
    }

    // Basic URL validation
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    try {
      new URL(normalizedUrl)
    } catch {
      return { success: false, error: 'Invalid URL format' }
    }

    // Import service dynamically to avoid circular dependencies
    const { BrandingExtractorService } = await import('@/lib/services/branding-extractor.service')

    // Extract branding
    const branding = await BrandingExtractorService.extractBranding(normalizedUrl)

    return { success: true, data: branding }
  } catch (error) {
    console.error('[extractBrandingFromUrlAction] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract branding from URL'
    }
  }
}
