/**
 * Workout helper utilities
 * Pure functions for workout calculations and validations
 */

export interface SetData {
  weight: number
  reps: number
  rir: number
}

export interface WorkoutStats {
  totalVolume: number
  totalSets: number
  duration: number
  exercisesCompleted: number
}

/**
 * Calculate total volume for a set (weight × reps)
 */
export function calculateSetVolume(weight: number, reps: number): number {
  return weight * reps
}

/**
 * Calculate total volume for multiple sets
 */
export function calculateTotalVolume(sets: SetData[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set.weight, set.reps), 0)
}

/**
 * Adjust weight based on equipment change
 * Multipliers based on biomechanical difficulty and stability requirements
 */
export function adjustWeightForEquipment(
  currentWeight: number,
  fromEquipment: string,
  toEquipment: string
): number {
  const equipmentMultipliers: Record<string, number> = {
    'Barbell': 1.0,
    'Dumbbells': 0.85, // Less stability, typically use ~85% of barbell weight
    'Machine': 0.8, // Fixed path, typically use ~80% of free weight
    'Cables': 0.75, // Constant tension, typically use ~75% of free weight
    'Bodyweight': 1.0
  }

  const fromMultiplier = equipmentMultipliers[fromEquipment] || 1.0
  const toMultiplier = equipmentMultipliers[toEquipment] || 1.0

  // Calculate relative weight
  const adjustedWeight = (currentWeight / fromMultiplier) * toMultiplier

  // Round to nearest 2.5kg increment
  return Math.round(adjustedWeight / 2.5) * 2.5
}

/**
 * Recommend rest period based on exercise type and set intensity
 */
export function recommendRestPeriod(
  exerciseType: 'compound' | 'isolation',
  rir: number
): number {
  // Base rest periods in seconds
  const baseRest = {
    compound: 180, // 3 minutes
    isolation: 90   // 1.5 minutes
  }

  // Adjust based on RIR (lower RIR = harder set = more rest needed)
  const rirAdjustment = (5 - rir) * 15 // Add 15 seconds per unit of effort

  return baseRest[exerciseType] + rirAdjustment
}

/**
 * Convert RIR (Reps In Reserve) to approximate intensity percentage
 * Uses aggressive bodybuilding-style mapping
 *
 * @param rir - Reps in reserve (0-5)
 * @returns Approximate intensity percentage (0-100)
 */
export function rirToIntensityPercent(rir: number): number {
  // Aggressive bodybuilding mapping
  const rirMapping: Record<number, number> = {
    0: 100, // Failure
    1: 97,  // 1 rep left
    2: 95,  // 2 reps left
    3: 92,  // 3 reps left
    4: 88,  // 4 reps left
    5: 85   // 5 reps left
  }

  // Clamp RIR to valid range
  const clampedRir = Math.max(0, Math.min(5, rir))

  return rirMapping[clampedRir] ?? 80 // Fallback to 80% for higher RIR
}

/**
 * Validate set data
 */
export function validateSetData(setData: SetData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (setData.weight <= 0) {
    errors.push('Weight must be greater than 0')
  }

  if (setData.reps <= 0) {
    errors.push('Reps must be greater than 0')
  }

  if (setData.rir < 0 || setData.rir > 10) {
    errors.push('RIR must be between 0 and 10')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if a set is a personal record
 */
export function isPersonalRecord(
  currentSet: SetData,
  previousBest: SetData | null
): boolean {
  if (!previousBest) return true

  const currentVolume = calculateSetVolume(currentSet.weight, currentSet.reps)
  const previousVolume = calculateSetVolume(previousBest.weight, previousBest.reps)

  // PR if higher volume OR same volume with better RIR
  return (
    currentVolume > previousVolume ||
    (currentVolume === previousVolume && currentSet.rir < previousBest.rir)
  )
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Estimate workout duration based on exercises and sets
 */
export function estimateWorkoutDuration(
  exerciseCount: number,
  avgSetsPerExercise: number,
  avgRestPeriod: number
): number {
  // Average time per set execution: 30 seconds
  const setExecutionTime = 30

  const totalSets = exerciseCount * avgSetsPerExercise
  const totalSetTime = totalSets * setExecutionTime
  const totalRestTime = (totalSets - 1) * avgRestPeriod // No rest after last set

  // Add 2 minutes per exercise for transitions
  const transitionTime = exerciseCount * 120

  return totalSetTime + totalRestTime + transitionTime
}

/**
 * Parse exercise name to extract movement pattern
 */
export function extractMovementPattern(exerciseName: string): string {
  const name = exerciseName.toLowerCase()

  if (name.includes('bench') || name.includes('push') || name.includes('press') && !name.includes('leg')) {
    return name.includes('incline') || name.includes('upper') ? 'horizontal_push_upper' : 'horizontal_push'
  }
  if (name.includes('row') || name.includes('pull') && !name.includes('vertical')) {
    return 'horizontal_pull'
  }
  if (name.includes('pullup') || name.includes('pull-up') || name.includes('lat') || name.includes('pulldown')) {
    return 'vertical_pull'
  }
  if (name.includes('shoulder') || name.includes('overhead') || name.includes('military')) {
    return 'vertical_push'
  }
  if (name.includes('squat') || name.includes('quad') || name.includes('leg press')) {
    return 'quad_dominant'
  }
  if (name.includes('deadlift') || name.includes('rdl') || name.includes('hamstring') || name.includes('glute')) {
    return 'hip_dominant'
  }

  return 'unknown'
}
