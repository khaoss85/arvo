/**
 * Exercise Muscle Mapper
 *
 * Advanced muscle group extraction for AI validation.
 * Distinguishes between primary (target) and secondary (synergist) muscles.
 *
 * IMPORTANT: Returns muscle group KEYS (e.g., 'chest_upper', 'shoulders_front')
 * that match the keys used in split plan targetVolume, NOT translated labels.
 */

import { MUSCLE_GROUPS } from '@/lib/services/muscle-groups.service'

type MuscleGroupKey = keyof typeof MUSCLE_GROUPS

/**
 * Exercise patterns with primary and secondary muscle mappings
 * Structure: exercise keyword → { primary: [muscle keys], secondary: [muscle keys] }
 *
 * Uses specific muscle keys that match split plan targetVolume:
 * - chest_upper, chest_lower (instead of generic 'chest')
 * - shoulders_front, shoulders_side, shoulders_rear (instead of generic 'shoulders')
 */
const EXERCISE_MUSCLE_MAPPING: Record<
  string,
  { primary: MuscleGroupKey[]; secondary: MuscleGroupKey[] }
> = {
  // Chest exercises - distinguish upper vs lower
  'incline': {
    primary: ['chest_upper'],
    secondary: ['shoulders_front', 'triceps'],
  },
  'decline': {
    primary: ['chest_lower'],
    secondary: ['triceps', 'shoulders_front'],
  },
  'bench press': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front', 'triceps'],
  },
  'flat press': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front', 'triceps'],
  },
  'chest press': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front', 'triceps'],
  },
  'chest fly': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front'],
  },
  'pec deck': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front'],
  },
  'cable fly': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front'],
  },
  'high-to-low': {
    primary: ['chest_lower'],
    secondary: ['shoulders_front'],
  },
  'low-to-high': {
    primary: ['chest_upper'],
    secondary: ['shoulders_front'],
  },
  'dip': {
    primary: ['chest_lower', 'triceps'],
    secondary: ['shoulders_front'],
  },

  // Shoulder exercises - distinguish front/side/rear
  'overhead press': {
    primary: ['shoulders_front'],
    secondary: ['triceps', 'shoulders_side'],
  },
  'military press': {
    primary: ['shoulders_front'],
    secondary: ['triceps'],
  },
  'shoulder press': {
    primary: ['shoulders_front'],
    secondary: ['triceps', 'shoulders_side'],
  },
  'lateral raise': {
    primary: ['shoulders_side'],
    secondary: [],
  },
  'side raise': {
    primary: ['shoulders_side'],
    secondary: [],
  },
  'front raise': {
    primary: ['shoulders_front'],
    secondary: [],
  },
  'rear delt': {
    primary: ['shoulders_rear'],
    secondary: ['upper_back'],
  },
  'face pull': {
    primary: ['shoulders_rear'],
    secondary: ['upper_back'],
  },
  'reverse fly': {
    primary: ['shoulders_rear'],
    secondary: ['upper_back'],
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
  'triceps pushdown': {
    primary: ['triceps'],
    secondary: [],
  },
  'triceps extension': {
    primary: ['triceps'],
    secondary: [],
  },
  'skull crusher': {
    primary: ['triceps'],
    secondary: [],
  },
  'close grip': {
    primary: ['triceps'],
    secondary: ['chest_lower'],
  },

  // Biceps exercises
  'bicep curl': {
    primary: ['biceps'],
    secondary: ['forearms'],
  },
  'biceps curl': {
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
  'concentration curl': {
    primary: ['biceps'],
    secondary: [],
  },

  // Back exercises
  'barbell row': {
    primary: ['upper_back'],
    secondary: ['biceps', 'lats'],
  },
  'dumbbell row': {
    primary: ['upper_back'],
    secondary: ['biceps', 'lats'],
  },
  't-bar row': {
    primary: ['upper_back'],
    secondary: ['biceps', 'lats'],
  },
  'cable row': {
    primary: ['upper_back'],
    secondary: ['biceps'],
  },
  'seated row': {
    primary: ['upper_back'],
    secondary: ['biceps', 'lats'],
  },
  'lat pulldown': {
    primary: ['lats'],
    secondary: ['biceps', 'upper_back'],
  },
  'pull-up': {
    primary: ['lats', 'upper_back'],
    secondary: ['biceps'],
  },
  'chin-up': {
    primary: ['lats', 'biceps'],
    secondary: ['upper_back'],
  },
  'deadlift': {
    primary: ['lower_back', 'hamstrings'],
    secondary: ['glutes', 'traps'],
  },
  'romanian deadlift': {
    primary: ['hamstrings'],
    secondary: ['glutes', 'lower_back'],
  },
  'shrug': {
    primary: ['traps'],
    secondary: [],
  },

  // Leg exercises
  'squat': {
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings'],
  },
  'front squat': {
    primary: ['quads'],
    secondary: ['glutes'],
  },
  'hack squat': {
    primary: ['quads'],
    secondary: ['glutes'],
  },
  'leg press': {
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings'],
  },
  'lunge': {
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
  'crunch': {
    primary: ['abs'],
    secondary: [],
  },
  'plank': {
    primary: ['abs'],
    secondary: ['lower_back'],
  },
  'leg raise': {
    primary: ['abs'],
    secondary: [],
  },
  'russian twist': {
    primary: ['obliques'],
    secondary: ['abs'],
  },
  'ab wheel': {
    primary: ['abs'],
    secondary: ['lower_back'],
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
  // Generic patterns - use specific keys
  'press': { primary: ['chest_lower'], secondary: ['shoulders_front', 'triceps'] },
  'fly': { primary: ['chest_lower'], secondary: ['shoulders_front'] },
  'row': { primary: ['upper_back'], secondary: ['biceps'] },
  'pull': { primary: ['lats', 'upper_back'], secondary: ['biceps'] },
  'curl': { primary: ['biceps'], secondary: ['forearms'] },
  'extension': { primary: ['triceps'], secondary: [] },
  'pushdown': { primary: ['triceps'], secondary: [] },
  'raise': { primary: ['shoulders_side'], secondary: [] },
  'squat': { primary: ['quads'], secondary: ['glutes'] },
  'lunge': { primary: ['quads'], secondary: ['glutes'] },
}

/**
 * Extracts primary and secondary muscle groups from an exercise name
 *
 * IMPORTANT: Returns muscle group KEYS (e.g., 'chest_upper', 'triceps'),
 * NOT translated labels (e.g., 'Petto Alto', 'Tricipiti').
 * This allows direct matching with split plan targetVolume keys.
 *
 * @param exerciseName - The name of the exercise (e.g., "Incline Dumbbell Bench Press")
 * @param _equipmentVariant - Optional equipment variant (currently unused)
 * @returns Object with primary and secondary muscle group key arrays
 *
 * @example
 * extractMuscleGroupsFromExercise("Incline Dumbbell Bench Press")
 * // Returns: { primary: ["chest_upper"], secondary: ["shoulders_front", "triceps"] }
 *
 * extractMuscleGroupsFromExercise("Cable Lateral Raise")
 * // Returns: { primary: ["shoulders_side"], secondary: [] }
 */
export function extractMuscleGroupsFromExercise(
  exerciseName: string,
  _equipmentVariant?: string
): { primary: string[]; secondary: string[] } {
  const lowerName = exerciseName.toLowerCase()

  // Try exact match first (most accurate)
  for (const [pattern, muscles] of Object.entries(EXERCISE_MUSCLE_MAPPING)) {
    if (lowerName.includes(pattern)) {
      return {
        primary: [...muscles.primary],    // Return KEYS, not translated values
        secondary: [...muscles.secondary],
      }
    }
  }

  // Try fallback patterns (less precise, but covers more exercises)
  for (const [pattern, muscles] of Object.entries(FALLBACK_PATTERNS)) {
    if (lowerName.includes(pattern)) {
      return {
        primary: [...muscles.primary],
        secondary: [...muscles.secondary],
      }
    }
  }

  // Ultimate fallback: try to infer from general patterns
  if (lowerName.includes('chest') || lowerName.includes('petto')) {
    return {
      primary: ['chest_lower'],
      secondary: ['shoulders_front', 'triceps'],
    }
  }

  if (lowerName.includes('back') || lowerName.includes('schiena')) {
    return {
      primary: ['upper_back'],
      secondary: ['biceps'],
    }
  }

  if (lowerName.includes('shoulder') || lowerName.includes('spalle')) {
    return {
      primary: ['shoulders_front'],
      secondary: ['triceps'],
    }
  }

  if (lowerName.includes('leg') || lowerName.includes('quad')) {
    return {
      primary: ['quads'],
      secondary: ['glutes'],
    }
  }

  if (lowerName.includes('lat') || lowerName.includes('dorsal')) {
    return {
      primary: ['lats'],
      secondary: ['biceps'],
    }
  }

  if (lowerName.includes('tricep')) {
    return {
      primary: ['triceps'],
      secondary: [],
    }
  }

  if (lowerName.includes('bicep')) {
    return {
      primary: ['biceps'],
      secondary: ['forearms'],
    }
  }

  // Last resort: return empty arrays
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
 * Returns KEYS, not translated labels
 */
export function getAllMuscleGroups(exerciseName: string): string[] {
  const { primary, secondary } = extractMuscleGroupsFromExercise(exerciseName)
  return [...primary, ...secondary]
}

/**
 * Helper to check if an exercise targets a specific muscle group
 * Accepts either a key (e.g., 'chest_upper') or a label (e.g., 'Petto Alto')
 */
export function exerciseTargetsMuscle(
  exerciseName: string,
  targetMuscle: string
): boolean {
  const allMuscles = getAllMuscleGroups(exerciseName)
  const targetLower = targetMuscle.toLowerCase()

  // Check if target matches any key directly
  if (allMuscles.some(muscle => muscle.toLowerCase() === targetLower)) {
    return true
  }

  // Also check if target is a translated label
  const targetLabel = MUSCLE_GROUPS[targetMuscle as MuscleGroupKey]
  if (targetLabel) {
    return allMuscles.includes(targetMuscle)
  }

  return false
}
