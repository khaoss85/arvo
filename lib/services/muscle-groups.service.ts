/**
 * Muscle Groups Service
 *
 * Maps exercises to their primary muscle groups and provides utilities
 * for workout categorization and muscle group identification.
 */

import type { Database } from '@/lib/types/database.types'
import { getExerciseName } from '@/lib/utils/exercise-helpers'

export type WorkoutType = Database['public']['Enums']['workout_type']
export type SplitType = Database['public']['Enums']['split_type']

// Muscle group categories
export const MUSCLE_GROUPS = {
  // Upper body - Push
  chest: 'Petto',
  chest_upper: 'Petto Alto',
  chest_lower: 'Petto Basso',
  chest_total_assist: 'Petto (Assist)',
  shoulders: 'Spalle',
  front_delts: 'Deltoidi Anteriori',
  side_delts: 'Deltoidi Laterali',
  rear_delts: 'Deltoidi Posteriori',
  triceps: 'Tricipiti',

  // Upper body - Pull
  back: 'Schiena',
  upper_back: 'Schiena Alta',
  back_width: 'Schiena Larghezza',
  back_thickness: 'Schiena Spessore',
  lats: 'Dorsali',
  traps: 'Trapezi',
  biceps: 'Bicipiti',
  forearms: 'Avambracci',

  // Lower body
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  glutes: 'Glutei',
  calves: 'Polpacci',

  // Core
  abs: 'Addominali',
  obliques: 'Obliqui',
  lowerBack: 'Lombare',
} as const

// Exercise keyword patterns mapped to muscle groups
const EXERCISE_PATTERNS: Record<string, keyof typeof MUSCLE_GROUPS> = {
  // Chest
  'bench': 'chest',
  'press': 'chest',
  'fly': 'chest',
  'pec': 'chest',
  'chest': 'chest',
  'petto': 'chest',

  // Shoulders
  'shoulder': 'shoulders',
  'overhead': 'shoulders',
  'military': 'shoulders',
  'lateral': 'shoulders',
  'rear delt': 'shoulders',
  'spalle': 'shoulders',

  // Triceps
  'tricep': 'triceps',
  'pushdown': 'triceps',
  'dip': 'triceps',
  'skull crusher': 'triceps',

  // Back
  'row': 'back',
  'pull': 'back',
  'lat': 'lats',
  'pulldown': 'lats',
  'deadlift': 'back',
  'trap': 'traps',
  'shrug': 'traps',
  'schiena': 'back',
  'dorsali': 'lats',

  // Biceps
  'curl': 'biceps',
  'bicep': 'biceps',

  // Legs
  'squat': 'quads',
  'leg press': 'quads',
  'lunge': 'quads',
  'quad': 'quads',
  'leg extension': 'quads',
  'leg curl': 'hamstrings',
  'hamstring': 'hamstrings',
  'romanian': 'hamstrings',
  'glute': 'glutes',
  'hip thrust': 'glutes',
  'calf': 'calves',

  // Core
  'crunch': 'abs',
  'plank': 'abs',
  'ab': 'abs',
  'sit': 'abs',
}

/**
 * Get user-friendly Italian label for a muscle group key
 *
 * @param key - Technical muscle group identifier (e.g., 'chest_upper', 'back_thickness')
 * @returns Italian label (e.g., 'Petto Alto', 'Schiena Spessore')
 *
 * @example
 * getMuscleGroupLabel('chest_upper') // → 'Petto Alto'
 * getMuscleGroupLabel('triceps') // → 'Tricipiti'
 * getMuscleGroupLabel('unknown_key') // → 'Unknown Key' (fallback)
 */
export function getMuscleGroupLabel(key: string): string {
  // Check if key exists in MUSCLE_GROUPS mapping
  if (key in MUSCLE_GROUPS) {
    return MUSCLE_GROUPS[key as keyof typeof MUSCLE_GROUPS]
  }

  // Fallback: capitalize and format the technical name
  // Convert snake_case to Title Case (e.g., 'chest_upper' → 'Chest Upper')
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Extracts muscle groups from an exercise name
 */
export function getMuscleGroupsFromExercise(exerciseName: string): string[] {
  const lowerName = exerciseName.toLowerCase()
  const muscleGroups = new Set<string>()

  // Check each pattern
  for (const [pattern, muscleGroup] of Object.entries(EXERCISE_PATTERNS)) {
    if (lowerName.includes(pattern)) {
      muscleGroups.add(MUSCLE_GROUPS[muscleGroup])
    }
  }

  // If no match found, try to infer from general patterns
  if (muscleGroups.size === 0) {
    // Default to a generic muscle group based on common patterns
    if (lowerName.includes('push') || lowerName.includes('press')) {
      muscleGroups.add(MUSCLE_GROUPS.chest)
    } else if (lowerName.includes('pull')) {
      muscleGroups.add(MUSCLE_GROUPS.back)
    } else if (lowerName.includes('leg')) {
      muscleGroups.add(MUSCLE_GROUPS.quads)
    }
  }

  return Array.from(muscleGroups)
}

/**
 * Extracts all target muscle groups from a list of exercises
 */
export function getTargetMuscleGroups(exercises: any[]): string[] {
  const allMuscleGroups = new Set<string>()

  for (const exercise of exercises) {
    const name = getExerciseName(exercise)
    if (name === 'Unknown Exercise') continue

    const groups = getMuscleGroupsFromExercise(name)
    groups.forEach(group => allMuscleGroups.add(group))
  }

  return Array.from(allMuscleGroups)
}

/**
 * Infers workout type from exercise list
 */
export function inferWorkoutType(exercises: any[]): WorkoutType {
  if (!exercises || exercises.length === 0) {
    return 'push' // default
  }

  const firstExerciseName = getExerciseName(exercises[0]).toLowerCase()

  // Push patterns
  if (
    firstExerciseName.includes('bench') ||
    firstExerciseName.includes('press') ||
    firstExerciseName.includes('dip') ||
    firstExerciseName.includes('chest') ||
    firstExerciseName.includes('shoulder') ||
    firstExerciseName.includes('tricep')
  ) {
    return 'push'
  }

  // Pull patterns
  if (
    firstExerciseName.includes('row') ||
    firstExerciseName.includes('pull') ||
    firstExerciseName.includes('lat') ||
    firstExerciseName.includes('back') ||
    firstExerciseName.includes('bicep') ||
    firstExerciseName.includes('curl')
  ) {
    return 'pull'
  }

  // Legs patterns
  if (
    firstExerciseName.includes('squat') ||
    firstExerciseName.includes('leg') ||
    firstExerciseName.includes('lunge') ||
    firstExerciseName.includes('deadlift') ||
    firstExerciseName.includes('glute') ||
    firstExerciseName.includes('calf')
  ) {
    return 'legs'
  }

  // Upper body
  if (firstExerciseName.includes('upper')) {
    return 'upper'
  }

  // Lower body
  if (firstExerciseName.includes('lower')) {
    return 'lower'
  }

  // Default to push
  return 'push'
}

/**
 * Generates a descriptive workout name based on exercises and muscle groups
 */
export function generateWorkoutName(
  workoutType: WorkoutType,
  muscleGroups: string[]
): string {
  const typeNames: Record<WorkoutType, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Gambe',
    upper: 'Upper Body',
    lower: 'Lower Body',
    full_body: 'Full Body',
    chest: 'Petto',
    back: 'Schiena',
    shoulders: 'Spalle',
    arms: 'Braccia',
  }

  const baseName = typeNames[workoutType] || 'Allenamento'

  if (muscleGroups.length === 0) {
    return baseName
  }

  // Get primary muscle groups (max 3)
  const primaryGroups = muscleGroups.slice(0, 3).join(', ')

  return `${baseName}: ${primaryGroups}`
}

/**
 * Get the next workout type in a split rotation
 */
export function getNextWorkoutType(
  lastWorkoutType: WorkoutType | null,
  splitType: SplitType
): WorkoutType {
  switch (splitType) {
    case 'push_pull_legs': {
      const sequence: WorkoutType[] = ['push', 'pull', 'legs']
      if (!lastWorkoutType) return 'push'
      const currentIndex = sequence.indexOf(lastWorkoutType)
      if (currentIndex === -1) return 'push'
      return sequence[(currentIndex + 1) % sequence.length]
    }

    case 'upper_lower': {
      const sequence: WorkoutType[] = ['upper', 'lower']
      if (!lastWorkoutType) return 'upper'
      const currentIndex = sequence.indexOf(lastWorkoutType)
      if (currentIndex === -1) return 'upper'
      return sequence[(currentIndex + 1) % sequence.length]
    }

    case 'full_body': {
      return 'full_body'
    }

    case 'bro_split': {
      const sequence: WorkoutType[] = ['chest', 'back', 'shoulders', 'arms', 'legs']
      if (!lastWorkoutType) return 'chest'
      const currentIndex = sequence.indexOf(lastWorkoutType)
      if (currentIndex === -1) return 'chest'
      return sequence[(currentIndex + 1) % sequence.length]
    }

    case 'weak_point_focus': {
      // Weak point focus uses custom session ordering defined in split plan
      // Fallback to full_body if called without split plan context
      return 'full_body'
    }

    case 'custom':
    default: {
      // For custom splits, default to push_pull_legs rotation
      const sequence: WorkoutType[] = ['push', 'pull', 'legs']
      if (!lastWorkoutType) return 'push'
      const currentIndex = sequence.indexOf(lastWorkoutType)
      if (currentIndex === -1) return 'push'
      return sequence[(currentIndex + 1) % sequence.length]
    }
  }
}

/**
 * Get workout type color for UI
 */
export function getWorkoutTypeColor(workoutType: WorkoutType): string {
  const colors: Record<WorkoutType, string> = {
    push: 'red',
    pull: 'blue',
    legs: 'green',
    upper: 'orange',
    lower: 'purple',
    full_body: 'yellow',
    chest: 'red',
    back: 'blue',
    shoulders: 'orange',
    arms: 'purple',
  }

  return colors[workoutType] || 'gray'
}

/**
 * Get workout type emoji icon
 */
export function getWorkoutTypeIcon(workoutType: WorkoutType): string {
  const icons: Record<WorkoutType, string> = {
    push: '💪',
    pull: '🏋️',
    legs: '🦵',
    upper: '⬆️',
    lower: '⬇️',
    full_body: '🔥',
    chest: '🦾',
    back: '🔙',
    shoulders: '💥',
    arms: '💪',
  }

  return icons[workoutType] || '💪'
}
