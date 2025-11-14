import {
  SpecializableMuscle,
  SPECIALIZABLE_MUSCLES,
  WeakPointFocusConfig,
  WorkoutType,
} from '@/lib/types/split.types'

/**
 * Specialization Service
 * Handles logic for weak point focus splits including schedule generation
 * and volume calculations for target muscles
 */

/**
 * Get list of all specializable muscles
 */
export function getSpecializableMuscles(): SpecializableMuscle[] {
  return SPECIALIZABLE_MUSCLES
}

/**
 * Validate if a muscle name is specializable
 */
export function validateSpecializationMuscle(muscle: string): muscle is SpecializableMuscle {
  return SPECIALIZABLE_MUSCLES.includes(muscle as SpecializableMuscle)
}

/**
 * Generate a weak point focus split schedule
 * Distributes the specialization muscle across the cycle with increased frequency
 *
 * @param muscle - Target muscle to specialize
 * @param weeklyFrequency - Total training days per week (e.g., 4, 5, 6)
 * @param config - Optional configuration for frequency and volume
 * @returns Array of workout types representing the cycle
 */
export function generateWeakPointSchedule(
  muscle: SpecializableMuscle,
  weeklyFrequency: number,
  config?: Partial<WeakPointFocusConfig>
): {
  workoutTypes: WorkoutType[]
  cycleDays: number
  specializationFrequency: number
} {
  const targetFrequency = config?.targetFrequency || Math.min(weeklyFrequency - 1, 4)
  const cycleDays = weeklyFrequency + 1 // e.g., 6 training days + 1 rest = 7-day cycle

  const schedule: WorkoutType[] = []

  // Determine workout types based on muscle group
  const workoutTypesForMuscle = getWorkoutTypesForMuscle(muscle)

  // Distribute specialization workouts across the cycle
  const specializationInterval = Math.floor(cycleDays / targetFrequency)

  for (let day = 0; day < cycleDays; day++) {
    const isSpecializationDay = day % specializationInterval === 0 && schedule.filter(
      (type) => workoutTypesForMuscle.includes(type)
    ).length < targetFrequency

    if (isSpecializationDay) {
      // Add primary workout for specialization muscle
      const primaryType = workoutTypesForMuscle[0]
      schedule.push(primaryType)
    } else {
      // Add complementary workout types
      const complementaryType = getComplementaryWorkoutType(muscle, schedule.length)
      schedule.push(complementaryType)
    }
  }

  return {
    workoutTypes: schedule,
    cycleDays,
    specializationFrequency: targetFrequency,
  }
}

/**
 * Get appropriate workout types for a given muscle
 */
function getWorkoutTypesForMuscle(muscle: SpecializableMuscle): WorkoutType[] {
  // Map muscles to their primary workout types
  const muscleToWorkoutType: Record<string, WorkoutType[]> = {
    chest: ['chest', 'push'],
    shoulders: ['shoulders', 'push'],
    shoulders_front: ['shoulders', 'push'],
    shoulders_side: ['shoulders'],
    shoulders_rear: ['shoulders', 'pull'],
    triceps: ['arms', 'push'],
    back: ['back', 'pull'],
    lats: ['back', 'pull'],
    traps: ['back', 'pull'],
    biceps: ['arms', 'pull'],
    forearms: ['arms', 'pull'],
    quads: ['legs', 'lower'],
    hamstrings: ['legs', 'lower'],
    glutes: ['legs', 'lower'],
    calves: ['legs', 'lower'],
    abs: ['full_body'],
    obliques: ['full_body'],
    lower_back: ['back', 'lower'],
  }

  return muscleToWorkoutType[muscle] || ['full_body']
}

/**
 * Get complementary workout type based on what's already scheduled
 */
function getComplementaryWorkoutType(
  specializationMuscle: SpecializableMuscle,
  currentDayIndex: number
): WorkoutType {
  const isUpperFocus = [
    'chest',
    'back',
    'shoulders',
    'shoulders_front',
    'shoulders_side',
    'shoulders_rear',
    'biceps',
    'triceps',
    'traps',
    'lats',
  ].includes(specializationMuscle)

  const isLowerFocus = ['quads', 'hamstrings', 'glutes', 'calves'].includes(specializationMuscle)

  // Alternate between push/pull/legs to ensure balanced training
  if (isUpperFocus) {
    // If specializing upper body, include legs more frequently
    const rotation: WorkoutType[] = ['push', 'pull', 'legs']
    return rotation[currentDayIndex % rotation.length]
  } else if (isLowerFocus) {
    // If specializing lower body, include upper body work
    const rotation: WorkoutType[] = ['upper', 'legs']
    return rotation[currentDayIndex % rotation.length]
  } else {
    // For core/arms, use full body or upper/lower split
    const rotation: WorkoutType[] = ['upper', 'lower']
    return rotation[currentDayIndex % rotation.length]
  }
}

/**
 * Calculate volume multiplier for specialization muscle
 * Returns increased volume based on how aggressive the specialization should be
 *
 * @param baseVolume - Base volume (sets) for the muscle group
 * @param frequency - How many times per cycle the muscle is trained
 * @param aggressiveness - 'moderate' (1.3x), 'high' (1.5x), or 'very_high' (1.8x)
 */
export function calculateSpecializationVolume(
  baseVolume: number,
  frequency: number,
  aggressiveness: 'moderate' | 'high' | 'very_high' = 'high'
): {
  totalVolume: number
  volumeMultiplier: number
  volumePerSession: number
} {
  const multipliers = {
    moderate: 1.3,
    high: 1.5,
    very_high: 1.8,
  }

  const volumeMultiplier = multipliers[aggressiveness]
  const totalVolume = Math.round(baseVolume * volumeMultiplier)
  const volumePerSession = Math.round(totalVolume / frequency)

  return {
    totalVolume,
    volumeMultiplier,
    volumePerSession,
  }
}

/**
 * Get recommended frequency for a muscle group based on recovery capacity
 */
export function getRecommendedFrequency(muscle: SpecializableMuscle): {
  min: number
  max: number
  optimal: number
} {
  // Smaller muscle groups can typically handle higher frequency
  const smallMuscles: SpecializableMuscle[] = [
    'biceps',
    'triceps',
    'forearms',
    'calves',
    'abs',
    'obliques',
    'shoulders_front',
    'shoulders_side',
    'shoulders_rear',
  ]

  // Large compound muscle groups need more recovery
  const largeMuscles: SpecializableMuscle[] = [
    'back',
    'lats',
    'chest',
    'quads',
    'hamstrings',
    'glutes',
  ]

  if (smallMuscles.includes(muscle)) {
    return { min: 3, max: 6, optimal: 4 }
  } else if (largeMuscles.includes(muscle)) {
    return { min: 2, max: 4, optimal: 3 }
  } else {
    // Medium muscle groups (shoulders, traps, etc.)
    return { min: 2, max: 5, optimal: 3 }
  }
}
