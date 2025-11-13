/**
 * Warmup Skip Intelligence
 *
 * Conservative logic to determine when to suggest skipping warmup sets.
 * Prioritizes safety while optimizing workout efficiency.
 */

import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'
import type { Workout } from '@/lib/types/schemas'

export interface WarmupSkipSuggestion {
  shouldSuggest: boolean
  reason: string
  confidence: 'low' | 'medium' | 'high'
}

export interface WorkoutContext {
  workout: Workout
  exerciseIndex: number
  totalExercises: number
  completedSetsCount: number // Total sets completed in workout so far
  mentalReadiness?: number | null // Overall mental readiness (1-5)
}

/**
 * Determines if warmup skip should be suggested for the current exercise
 * Uses conservative logic - only suggests in obvious safe scenarios
 */
export function shouldSuggestWarmupSkip(
  exercise: ExerciseExecution,
  allExercises: ExerciseExecution[],
  context: WorkoutContext
): WarmupSkipSuggestion {
  // Check if exercise has warmup sets
  const warmupCount = exercise.warmupSets?.length || 0
  if (warmupCount === 0) {
    return {
      shouldSuggest: false,
      reason: 'No warmup sets for this exercise',
      confidence: 'high'
    }
  }

  // Never suggest skip for first exercise (muscles not activated)
  if (context.exerciseIndex === 0) {
    return {
      shouldSuggest: false,
      reason: 'First exercise of workout - warmup recommended',
      confidence: 'high'
    }
  }

  // Check for deload phase (conservative - obvious case)
  // Use optional chaining since mesocycle_phase might not be in all workout types
  const mesocyclePhase = (context.workout as any).mesocycle_phase
  if (mesocyclePhase === 'deload') {
    return {
      shouldSuggest: true,
      reason: 'Deload week - muscles already activated, reduced volume recommended',
      confidence: 'high'
    }
  }

  // Check for second similar compound exercise (conservative - obvious case)
  const similarCompoundBefore = hasSimilarCompoundBefore(
    exercise,
    allExercises,
    context.exerciseIndex
  )

  if (similarCompoundBefore) {
    return {
      shouldSuggest: true,
      reason: `Similar compound exercise already performed - muscles activated`,
      confidence: 'high'
    }
  }

  // For 3rd exercise onwards with low mental readiness (moderately conservative)
  if (
    context.exerciseIndex >= 2 &&
    context.mentalReadiness &&
    context.mentalReadiness <= 2
  ) {
    return {
      shouldSuggest: true,
      reason: 'Muscles already activated from previous exercises',
      confidence: 'medium'
    }
  }

  // Default: do not suggest skip (conservative approach)
  return {
    shouldSuggest: false,
    reason: 'Warmup recommended for optimal performance and safety',
    confidence: 'high'
  }
}

/**
 * Checks if a similar compound exercise targeting the same muscle group
 * has been performed before this exercise in the workout
 */
function hasSimilarCompoundBefore(
  currentExercise: ExerciseExecution,
  allExercises: ExerciseExecution[],
  currentIndex: number
): boolean {
  // Only check if current exercise is compound (has warmup)
  if (!currentExercise.warmupSets || currentExercise.warmupSets.length === 0) {
    return false
  }

  // Get primary muscle group from exercise name
  const currentMuscleGroup = getPrimaryMuscleGroup(currentExercise.exerciseName)
  if (!currentMuscleGroup) {
    return false
  }

  // Check previous exercises for similar compound movements
  for (let i = 0; i < currentIndex; i++) {
    const prevExercise = allExercises[i]

    // Check if previous exercise is compound (has warmup)
    if (prevExercise.warmupSets && prevExercise.warmupSets.length > 0) {
      const prevMuscleGroup = getPrimaryMuscleGroup(prevExercise.exerciseName)

      // If same primary muscle group, suggest skip
      if (prevMuscleGroup === currentMuscleGroup) {
        return true
      }
    }
  }

  return false
}

/**
 * Extracts primary muscle group from exercise name
 * Uses simple keyword matching for common patterns
 */
function getPrimaryMuscleGroup(exerciseName: string): string | null {
  const nameLower = exerciseName.toLowerCase()

  // Chest patterns
  if (nameLower.includes('bench') ||
      nameLower.includes('press') && (nameLower.includes('chest') || nameLower.includes('pec'))) {
    return 'chest'
  }

  // Back patterns
  if (nameLower.includes('row') ||
      nameLower.includes('pull') && !nameLower.includes('pulldown') ||
      nameLower.includes('deadlift')) {
    return 'back'
  }

  // Leg patterns
  if (nameLower.includes('squat') ||
      nameLower.includes('leg press') ||
      nameLower.includes('lunge')) {
    return 'legs'
  }

  // Shoulder patterns
  if ((nameLower.includes('shoulder') || nameLower.includes('overhead')) &&
      nameLower.includes('press')) {
    return 'shoulders'
  }

  return null
}

/**
 * Formats the skip suggestion reason for display in the UI
 * Returns user-friendly, concise message
 */
export function formatSkipReason(suggestion: WarmupSkipSuggestion): string {
  return suggestion.reason
}

/**
 * Generates analytics-friendly skip reason code
 * Used when logging skipped sets to database
 */
export function getSkipReasonCode(suggestion: WarmupSkipSuggestion): string {
  if (suggestion.reason.includes('Deload')) {
    return 'ai_suggested_deload'
  }

  if (suggestion.reason.includes('Similar compound')) {
    return 'ai_suggested_second_compound'
  }

  if (suggestion.reason.includes('already activated')) {
    return 'ai_suggested_late_exercise'
  }

  return 'ai_suggested_general'
}
