import { Database } from './database.types'

// Re-export database split and workout types
export type SplitType = Database['public']['Enums']['split_type']
export type WorkoutType = Database['public']['Enums']['workout_type']
export type WorkoutVariation = Database['public']['Enums']['workout_variation']

// Specializable muscle groups for weak point focus splits
// These are canonical muscle names that can be emphasized in training
export type SpecializableMuscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'shoulders_front'
  | 'shoulders_side'
  | 'shoulders_rear'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps'
  | 'lats'
  | 'lower_back'

// Muscle group categories for UI grouping
export interface MuscleGroupCategory {
  category: string
  muscles: SpecializableMuscle[]
}

export const MUSCLE_GROUP_CATEGORIES: MuscleGroupCategory[] = [
  {
    category: 'Upper Body - Push',
    muscles: ['chest', 'shoulders', 'shoulders_front', 'shoulders_side', 'shoulders_rear', 'triceps'],
  },
  {
    category: 'Upper Body - Pull',
    muscles: ['back', 'lats', 'traps', 'biceps', 'forearms'],
  },
  {
    category: 'Lower Body',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
  },
  {
    category: 'Core',
    muscles: ['abs', 'obliques', 'lower_back'],
  },
]

// Get all unique specializable muscles
export const SPECIALIZABLE_MUSCLES: SpecializableMuscle[] = MUSCLE_GROUP_CATEGORIES.flatMap(
  (category) => category.muscles
)

// Helper to check if a muscle is specializable
export function isSpecializableMuscle(muscle: string): muscle is SpecializableMuscle {
  return SPECIALIZABLE_MUSCLES.includes(muscle as SpecializableMuscle)
}

// Configuration for weak point focus splits
export interface WeakPointFocusConfig {
  muscle: SpecializableMuscle
  targetFrequency: number // times per cycle (e.g., 3-4)
  volumeMultiplier: number // e.g., 1.5 = 50% more volume than standard
}

// Bro split workout rotation (5-day cycle with A/B variations = 10 days total)
export const BRO_SPLIT_ROTATION: WorkoutType[] = ['chest', 'back', 'shoulders', 'arms', 'legs']

// Variation patterns for bro split
export const BRO_SPLIT_VARIATION_PATTERN: Record<WorkoutType, { A: string; B: string }> = {
  chest: {
    A: 'Strength & Compound Focus',
    B: 'Hypertrophy & Isolation Focus',
  },
  back: {
    A: 'Vertical Pulling & Thickness',
    B: 'Horizontal Pulling & Width',
  },
  shoulders: {
    A: 'Overhead Press & Front Delts',
    B: 'Side & Rear Delts Focus',
  },
  arms: {
    A: 'Biceps Emphasis',
    B: 'Triceps Emphasis',
  },
  legs: {
    A: 'Quad Dominant',
    B: 'Posterior Chain Focus',
  },
  // Other workout types (not used in bro split but needed for type completeness)
  push: { A: 'Compound', B: 'Isolation' },
  pull: { A: 'Compound', B: 'Isolation' },
  upper: { A: 'Compound', B: 'Isolation' },
  lower: { A: 'Compound', B: 'Isolation' },
  full_body: { A: 'Compound', B: 'Isolation' },
}
