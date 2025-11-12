/**
 * Exercise Muscle Mapper
 *
 * Advanced muscle group extraction for AI validation.
 * Distinguishes between primary (target) and secondary (synergist) muscles.
 */

import { MUSCLE_GROUPS } from '@/lib/services/muscle-groups.service'

type MuscleGroupKey = keyof typeof MUSCLE_GROUPS

/**
 * Exercise patterns with primary and secondary muscle mappings
 * Structure: exercise keyword → { primary: [muscles], secondary: [muscles] }
 */
const EXERCISE_MUSCLE_MAPPING: Record<
  string,
  { primary: MuscleGroupKey[]; secondary: MuscleGroupKey[] }
> = {
  // Chest exercises
  'bench press': {
    primary: ['chest'],
    secondary: ['shoulders', 'triceps'],
  },
  'incline press': {
    primary: ['chest'],
    secondary: ['shoulders', 'triceps'],
  },
  'decline press': {
    primary: ['chest'],
    secondary: ['triceps', 'shoulders'],
  },
  'chest fly': {
    primary: ['chest'],
    secondary: ['shoulders'],
  },
  'pec deck': {
    primary: ['chest'],
    secondary: ['shoulders'],
  },
  'cable fly': {
    primary: ['chest'],
    secondary: ['shoulders'],
  },
  dip: {
    primary: ['chest', 'triceps'],
    secondary: ['shoulders'],
  },

  // Shoulder exercises
  'overhead press': {
    primary: ['shoulders'],
    secondary: ['triceps'],
  },
  'military press': {
    primary: ['shoulders'],
    secondary: ['triceps'],
  },
  'shoulder press': {
    primary: ['shoulders'],
    secondary: ['triceps'],
  },
  'lateral raise': {
    primary: ['shoulders'],
    secondary: [],
  },
  'front raise': {
    primary: ['shoulders'],
    secondary: [],
  },
  'rear delt': {
    primary: ['shoulders'],
    secondary: ['back'],
  },

  // Triceps exercises
  'tricep extension': {
    primary: ['triceps'],
    secondary: [],
  },
  'tricep pushdown': {
    primary: ['triceps'],
    secondary: [],
  },
  'skull crusher': {
    primary: ['triceps'],
    secondary: [],
  },
  'close grip': {
    primary: ['triceps'],
    secondary: ['chest'],
  },

  // Back exercises
  'barbell row': {
    primary: ['back'],
    secondary: ['biceps', 'lats'],
  },
  'dumbbell row': {
    primary: ['back'],
    secondary: ['biceps', 'lats'],
  },
  't-bar row': {
    primary: ['back'],
    secondary: ['biceps', 'lats'],
  },
  'cable row': {
    primary: ['back'],
    secondary: ['biceps'],
  },
  'lat pulldown': {
    primary: ['lats'],
    secondary: ['biceps', 'back'],
  },
  'pull-up': {
    primary: ['lats', 'back'],
    secondary: ['biceps'],
  },
  'chin-up': {
    primary: ['lats', 'biceps'],
    secondary: ['back'],
  },
  deadlift: {
    primary: ['back', 'hamstrings'],
    secondary: ['glutes', 'traps', 'forearms'],
  },
  'romanian deadlift': {
    primary: ['hamstrings'],
    secondary: ['glutes', 'back'],
  },
  shrug: {
    primary: ['traps'],
    secondary: [],
  },

  // Biceps exercises
  'bicep curl': {
    primary: ['biceps'],
    secondary: ['forearms'],
  },
  'hammer curl': {
    primary: ['biceps'],
    secondary: ['forearms'],
  },
  'preacher curl': {
    primary: ['biceps'],
    secondary: [],
  },

  // Leg exercises
  squat: {
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings'],
  },
  'front squat': {
    primary: ['quads'],
    secondary: ['glutes'],
  },
  'leg press': {
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings'],
  },
  lunge: {
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings'],
  },
  'leg extension': {
    primary: ['quads'],
    secondary: [],
  },
  'leg curl': {
    primary: ['hamstrings'],
    secondary: [],
  },
  'hip thrust': {
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  'glute bridge': {
    primary: ['glutes'],
    secondary: ['hamstrings'],
  },
  'calf raise': {
    primary: ['calves'],
    secondary: [],
  },

  // Core exercises
  crunch: {
    primary: ['abs'],
    secondary: [],
  },
  plank: {
    primary: ['abs'],
    secondary: ['lowerBack'],
  },
  'leg raise': {
    primary: ['abs'],
    secondary: [],
  },
  'russian twist': {
    primary: ['obliques'],
    secondary: ['abs'],
  },
}

/**
 * Fallback patterns for exercises not in the explicit mapping
 * Uses simple keyword matching with reasonable defaults
 */
const FALLBACK_PATTERNS: Record<
  string,
  { primary: MuscleGroupKey[]; secondary: MuscleGroupKey[] }
> = {
  // Generic patterns
  press: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  fly: { primary: ['chest'], secondary: ['shoulders'] },
  row: { primary: ['back'], secondary: ['biceps'] },
  pull: { primary: ['lats', 'back'], secondary: ['biceps'] },
  curl: { primary: ['biceps'], secondary: ['forearms'] },
  extension: { primary: ['triceps'], secondary: [] },
  raise: { primary: ['shoulders'], secondary: [] },
  squat: { primary: ['quads'], secondary: ['glutes'] },
  lunge: { primary: ['quads'], secondary: ['glutes'] },
}

/**
 * Extracts primary and secondary muscle groups from an exercise name
 *
 * @param exerciseName - The name of the exercise (e.g., "Barbell Bench Press")
 * @param equipmentVariant - Optional equipment variant (e.g., "barbell", "dumbbell")
 * @returns Object with primary and secondary muscle group arrays
 *
 * @example
 * extractMuscleGroupsFromExercise("Barbell Bench Press")
 * // Returns: { primary: ["chest"], secondary: ["shoulders", "triceps"] }
 */
export function extractMuscleGroupsFromExercise(
  exerciseName: string,
  equipmentVariant?: string
): { primary: string[]; secondary: string[] } {
  const lowerName = exerciseName.toLowerCase()

  // Try exact match first (most accurate)
  for (const [pattern, muscles] of Object.entries(EXERCISE_MUSCLE_MAPPING)) {
    if (lowerName.includes(pattern)) {
      return {
        primary: muscles.primary.map(key => MUSCLE_GROUPS[key]),
        secondary: muscles.secondary.map(key => MUSCLE_GROUPS[key]),
      }
    }
  }

  // Try fallback patterns (less precise, but covers more exercises)
  for (const [pattern, muscles] of Object.entries(FALLBACK_PATTERNS)) {
    if (lowerName.includes(pattern)) {
      return {
        primary: muscles.primary.map(key => MUSCLE_GROUPS[key]),
        secondary: muscles.secondary.map(key => MUSCLE_GROUPS[key]),
      }
    }
  }

  // Ultimate fallback: try to infer from general patterns
  // This ensures we always return something useful
  if (lowerName.includes('chest') || lowerName.includes('petto')) {
    return {
      primary: [MUSCLE_GROUPS.chest],
      secondary: [MUSCLE_GROUPS.shoulders, MUSCLE_GROUPS.triceps],
    }
  }

  if (lowerName.includes('back') || lowerName.includes('schiena')) {
    return {
      primary: [MUSCLE_GROUPS.back],
      secondary: [MUSCLE_GROUPS.biceps],
    }
  }

  if (lowerName.includes('shoulder') || lowerName.includes('spalle')) {
    return {
      primary: [MUSCLE_GROUPS.shoulders],
      secondary: [MUSCLE_GROUPS.triceps],
    }
  }

  if (lowerName.includes('leg') || lowerName.includes('quad')) {
    return {
      primary: [MUSCLE_GROUPS.quads],
      secondary: [MUSCLE_GROUPS.glutes],
    }
  }

  if (lowerName.includes('lat') || lowerName.includes('dorsal')) {
    return {
      primary: [MUSCLE_GROUPS.lats],
      secondary: [MUSCLE_GROUPS.biceps],
    }
  }

  // Last resort: return empty arrays (AI will note "muscle groups not specified")
  console.warn(
    `[extractMuscleGroupsFromExercise] Could not determine muscle groups for: "${exerciseName}"`
  )
  return {
    primary: [],
    secondary: [],
  }
}

/**
 * Helper to get all involved muscle groups (primary + secondary)
 */
export function getAllMuscleGroups(exerciseName: string): string[] {
  const { primary, secondary } = extractMuscleGroupsFromExercise(exerciseName)
  return [...primary, ...secondary]
}

/**
 * Helper to check if an exercise targets a specific muscle group
 */
export function exerciseTargetsMuscle(
  exerciseName: string,
  targetMuscle: string
): boolean {
  const allMuscles = getAllMuscleGroups(exerciseName)
  return allMuscles.some(
    muscle => muscle.toLowerCase() === targetMuscle.toLowerCase()
  )
}
