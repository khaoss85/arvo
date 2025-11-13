/**
 * Exercise utility functions
 *
 * IMPORTANT: Exercise data in the database has inconsistent field naming.
 * Exercises may have:
 * - `exerciseName` (canonical, used by ExerciseExecution type)
 * - `name` (used by workout generator and some legacy code)
 * - `exercise_name` (snake_case from database in some contexts)
 *
 * These utilities provide a consistent interface for accessing exercise data
 * regardless of which field name is used.
 */

/**
 * Canonical interface for workout exercises.
 * Use this type when working with exercises in workout context.
 *
 * @property exerciseName - The canonical name field for exercises
 * @property name - Legacy field, kept for backwards compatibility
 * @property sets - Number of sets to perform
 * @property repRange - Target repetition range (e.g., "8-12")
 * @property restSeconds - Rest period between sets in seconds
 */
export interface WorkoutExercise {
  exerciseName: string
  name?: string // Backwards compatibility
  exercise_name?: string // Database compatibility
  sets?: number
  completedSets?: any[]
  repRange?: string
  restSeconds?: number
  targetWeight?: number
  targetReps?: number
  equipmentVariant?: string
  equipment?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  animationUrl?: string | null
  hasAnimation?: boolean
  [key: string]: any // Allow additional properties
}

/**
 * Safely extracts the exercise name from an exercise object,
 * handling multiple possible field name variations.
 *
 * @param exercise - Exercise object that may have name in different fields
 * @returns The exercise name, or 'Unknown Exercise' if no name found
 *
 * @example
 * const name = getExerciseName(exercise);
 * console.log(name); // "Barbell Bench Press"
 */
export function getExerciseName(exercise: any): string {
  if (!exercise) {
    return 'Unknown Exercise';
  }

  // Try all known field name variations
  return (
    exercise.exerciseName ||
    exercise.name ||
    exercise.exercise_name ||
    'Unknown Exercise'
  );
}

/**
 * Normalizes an exercise object to use the canonical `exerciseName` field.
 * This should be used when creating or transforming exercise data.
 *
 * @param exercise - Exercise object to normalize
 * @returns Normalized exercise with `exerciseName` field
 *
 * @example
 * const normalized = normalizeExercise({ name: "Squat", sets: [] });
 * console.log(normalized.exerciseName); // "Squat"
 */
export function normalizeExercise<T extends Record<string, any>>(exercise: T): T & { exerciseName: string } {
  const name = getExerciseName(exercise);

  return {
    ...exercise,
    exerciseName: name,
    // Keep original fields for backwards compatibility
    // but exerciseName is now the canonical field
  };
}

/**
 * Type guard to check if an object has a valid exercise name
 *
 * @param exercise - Object to check
 * @returns True if exercise has a valid name
 */
export function hasExerciseName(exercise: any): exercise is { exerciseName: string } {
  return !!exercise && typeof getExerciseName(exercise) === 'string' && getExerciseName(exercise) !== 'Unknown Exercise';
}
