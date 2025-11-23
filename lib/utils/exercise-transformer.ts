/**
 * Exercise Transformer
 *
 * Converts exercise data from various sources (DB, API, modal)
 * into ExerciseExecution format used by workout execution store
 */

import type { ExerciseExecution, WarmupSet } from '@/lib/stores/workout-execution.store'
import { AnimationService } from '@/lib/services/animation.service'

interface SimpleExercise {
  id: string
  name: string
  bodyPart?: string
  equipment?: string
  target?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  animationUrl?: string | null
  hasAnimation?: boolean
}

interface TransformOptions {
  userId?: string
  userProfile?: {
    experienceYears?: number
    strengthBaseline?: Record<string, number>
  }
  workoutType?: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body'
}

/**
 * Transform a simple exercise into ExerciseExecution format
 * with appropriate default values based on user profile and exercise type
 */
export async function transformToExerciseExecution(
  exercise: SimpleExercise,
  options: TransformOptions = {}
): Promise<ExerciseExecution> {
  // Determine exercise type (compound vs isolation)
  const isCompound = isCompoundExercise(exercise.name, exercise.bodyPart)

  // Get animation URL if not already provided
  let animationUrl = exercise.animationUrl || undefined
  let hasAnimation = exercise.hasAnimation || false

  if (!animationUrl) {
    const fetchedUrl = await AnimationService.getAnimationUrl({
      name: exercise.name,
      canonicalPattern: exercise.name,
      equipmentVariant: exercise.equipment,
    })
    if (fetchedUrl) {
      animationUrl = fetchedUrl
      hasAnimation = true
    }
  }

  // Determine default sets based on exercise type and position
  const defaultSets = isCompound ? 3 : 2

  // Determine default rep range based on exercise type
  const defaultRepRange = getDefaultRepRange(exercise.name, exercise.bodyPart, isCompound)

  // Determine default rest period based on compound vs isolation
  const defaultRest = isCompound ? 180 : 90 // 3 min for compound, 90s for isolation

  // Estimate starting weight (will be refined by AI or user input)
  const defaultWeight = estimateStartingWeight(
    exercise.name,
    options.userProfile?.strengthBaseline,
    options.userProfile?.experienceYears
  )

  // Build ExerciseExecution object
  const exerciseExecution: ExerciseExecution = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    targetSets: defaultSets,
    targetReps: defaultRepRange,
    targetWeight: defaultWeight,
    completedSets: [],
    currentAISuggestion: null,
    animationUrl,
    hasAnimation,
    restSeconds: defaultRest,

    // Technical cues placeholder (can be enhanced with AI later)
    technicalCues: getBasicTechnicalCues(exercise.name),

    // Warmup sets for compound movements
    ...(isCompound && {
      warmupSets: generateWarmupSets(defaultWeight),
    }),

    // User modification tracking - not AI recommended since user added
    aiRecommendedSets: undefined, // Undefined means not AI-generated
    userAddedSets: undefined,
    userModifications: undefined,
  }

  return exerciseExecution
}

/**
 * Determine if exercise is compound (multi-joint) vs isolation (single-joint)
 */
function isCompoundExercise(name: string, _bodyPart?: string): boolean {
  const lowerName = name.toLowerCase()

  // Compound movement patterns
  const compoundPatterns = [
    'squat',
    'deadlift',
    'press',
    'row',
    'pull-up',
    'chin-up',
    'lunge',
    'dip',
    'bench',
    'overhead',
  ]

  // Isolation movement patterns
  const isolationPatterns = [
    'fly',
    'raise',
    'curl',
    'extension',
    'pulldown',
    'pushdown',
    'leg extension',
    'leg curl',
    'calf raise',
    'lateral',
  ]

  // Check isolation first (more specific)
  if (isolationPatterns.some(pattern => lowerName.includes(pattern))) {
    return false
  }

  // Check compound
  if (compoundPatterns.some(pattern => lowerName.includes(pattern))) {
    return true
  }

  // Default: if unclear, assume isolation (safer for user-added exercises)
  return false
}

/**
 * Get default rep range based on exercise characteristics
 */
function getDefaultRepRange(
  name: string,
  bodyPart?: string,
  isCompound: boolean = false
): [number, number] {
  const lowerName = name.toLowerCase()

  // Heavy compounds: lower reps
  if (isCompound && (lowerName.includes('squat') || lowerName.includes('deadlift'))) {
    return [5, 8]
  }

  // Upper body compound: moderate reps
  if (isCompound) {
    return [6, 10]
  }

  // Isolation movements: higher reps
  if (lowerName.includes('fly') || lowerName.includes('raise') || lowerName.includes('curl')) {
    return [10, 15]
  }

  // Calves and abs: very high reps
  if (bodyPart?.includes('calves') || bodyPart?.includes('abs')) {
    return [12, 20]
  }

  // Default: moderate rep range
  return [8, 12]
}

/**
 * Estimate starting weight based on exercise and user strength baseline
 */
function estimateStartingWeight(
  exerciseName: string,
  strengthBaseline?: Record<string, number>,
  experienceYears?: number
): number {
  const lowerName = exerciseName.toLowerCase()

  // If we have strength baseline data, use it
  if (strengthBaseline) {
    // Try to match exercise name to baseline data
    for (const [exercise, weight] of Object.entries(strengthBaseline)) {
      if (lowerName.includes(exercise.toLowerCase())) {
        return weight
      }
    }
  }

  // Fallback: Rough estimates for common exercises based on experience
  const experienceMultiplier = experienceYears ? 1 + experienceYears * 0.1 : 1

  const baseWeights: Record<string, number> = {
    'barbell bench press': 60,
    'barbell squat': 80,
    'deadlift': 100,
    'overhead press': 40,
    'barbell row': 60,
    'dumbbell': 12, // per dumbbell
    'cable': 20,
  }

  for (const [pattern, baseWeight] of Object.entries(baseWeights)) {
    if (lowerName.includes(pattern)) {
      return Math.round(baseWeight * experienceMultiplier)
    }
  }

  // Ultimate fallback: moderate weight
  return 20
}

/**
 * Generate warmup sets for compound exercises
 */
function generateWarmupSets(workingWeight: number): WarmupSet[] {
  // Standard warmup protocol:
  // - 50% x 8 reps
  // - 75% x 5 reps
  return [
    {
      setNumber: 1,
      weightPercentage: 50,
      weight: Math.round(workingWeight * 0.5),
      reps: 8,
      rir: 5, // Warmups should be easy (high RIR)
      restSeconds: 90, // Shorter rest for warmups
      technicalFocus: 'Movement pattern and form',
    },
    {
      setNumber: 2,
      weightPercentage: 75,
      weight: Math.round(workingWeight * 0.75),
      reps: 5,
      rir: 4, // Still submaximal
      restSeconds: 120, // Slightly longer before working sets
      technicalFocus: 'Build to working weight',
    },
  ]
}

/**
 * Get basic technical cues for common exercises
 */
function getBasicTechnicalCues(exerciseName: string): string[] {
  const lowerName = exerciseName.toLowerCase()

  if (lowerName.includes('squat')) {
    return ['Chest up', 'Knees out', 'Full depth']
  }

  if (lowerName.includes('bench press')) {
    return ['Retract scapula', 'Leg drive', 'Touch chest']
  }

  if (lowerName.includes('deadlift')) {
    return ['Brace core', 'Hinge at hips', 'Neutral spine']
  }

  if (lowerName.includes('row')) {
    return ['Retract scapula', 'Control descent', 'Pull to sternum']
  }

  if (lowerName.includes('overhead press')) {
    return ['Brace core', 'Full lockout', 'Vertical bar path']
  }

  // Default generic cues
  return ['Control tempo', 'Full ROM', 'Mind-muscle connection']
}

/**
 * Batch transform multiple exercises
 */
export async function transformMultipleExercises(
  exercises: SimpleExercise[],
  options: TransformOptions = {}
): Promise<ExerciseExecution[]> {
  return Promise.all(
    exercises.map(exercise => transformToExerciseExecution(exercise, options))
  )
}
