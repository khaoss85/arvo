/**
 * Strength Standards for estimating experience level
 * Based on bodyweight ratios for compound lifts
 * Standards are conservative to avoid overestimating experience
 */

export type ExperienceLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

export interface StrengthStandard {
  level: ExperienceLevel
  years: number // Typical years of training
  // Ratios are multipliers of bodyweight for estimated 1RM
  benchPress: number
  squat: number
  deadlift: number
  overheadPress: number
}

/**
 * Male strength standards (multipliers of bodyweight)
 * Source: Adapted from Strength Level standards and Starting Strength progressions
 */
export const MALE_STANDARDS: StrengthStandard[] = [
  {
    level: 'beginner',
    years: 0.25, // 0-6 months
    benchPress: 0.5,
    squat: 0.75,
    deadlift: 1.0,
    overheadPress: 0.35,
  },
  {
    level: 'novice',
    years: 0.75, // 6-12 months
    benchPress: 0.75,
    squat: 1.0,
    deadlift: 1.25,
    overheadPress: 0.5,
  },
  {
    level: 'intermediate',
    years: 1.5, // 1-2 years
    benchPress: 1.0,
    squat: 1.5,
    deadlift: 1.75,
    overheadPress: 0.65,
  },
  {
    level: 'advanced',
    years: 3.5, // 2-5 years
    benchPress: 1.5,
    squat: 2.0,
    deadlift: 2.25,
    overheadPress: 0.9,
  },
  {
    level: 'elite',
    years: 5.0, // 5+ years
    benchPress: 2.0,
    squat: 2.5,
    deadlift: 3.0,
    overheadPress: 1.2,
  },
]

/**
 * Female strength standards (multipliers of bodyweight)
 * Approximately 60-70% of male standards, adjusted for natural strength differences
 */
export const FEMALE_STANDARDS: StrengthStandard[] = [
  {
    level: 'beginner',
    years: 0.25, // 0-6 months
    benchPress: 0.3,
    squat: 0.5,
    deadlift: 0.65,
    overheadPress: 0.2,
  },
  {
    level: 'novice',
    years: 0.75, // 6-12 months
    benchPress: 0.45,
    squat: 0.75,
    deadlift: 0.95,
    overheadPress: 0.3,
  },
  {
    level: 'intermediate',
    years: 1.5, // 1-2 years
    benchPress: 0.65,
    squat: 1.0,
    deadlift: 1.25,
    overheadPress: 0.45,
  },
  {
    level: 'advanced',
    years: 3.5, // 2-5 years
    benchPress: 1.0,
    squat: 1.5,
    deadlift: 1.75,
    overheadPress: 0.65,
  },
  {
    level: 'elite',
    years: 5.0, // 5+ years
    benchPress: 1.35,
    squat: 2.0,
    deadlift: 2.25,
    overheadPress: 0.85,
  },
]

/**
 * Absolute weight thresholds when bodyweight is not available
 * These are rough estimates for an average adult (75kg male, 60kg female)
 */
export const ABSOLUTE_MALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number }
> = {
  beginner: { benchPress: 40, squat: 60, deadlift: 80, overheadPress: 25 },
  novice: { benchPress: 60, squat: 80, deadlift: 100, overheadPress: 40 },
  intermediate: { benchPress: 80, squat: 115, deadlift: 135, overheadPress: 50 },
  advanced: { benchPress: 115, squat: 155, deadlift: 175, overheadPress: 70 },
  elite: { benchPress: 155, squat: 195, deadlift: 235, overheadPress: 95 },
}

export const ABSOLUTE_FEMALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number }
> = {
  beginner: { benchPress: 20, squat: 35, deadlift: 45, overheadPress: 15 },
  novice: { benchPress: 30, squat: 50, deadlift: 65, overheadPress: 20 },
  intermediate: { benchPress: 45, squat: 70, deadlift: 85, overheadPress: 30 },
  advanced: { benchPress: 65, squat: 100, deadlift: 115, overheadPress: 42 },
  elite: { benchPress: 85, squat: 130, deadlift: 145, overheadPress: 55 },
}

/**
 * Exercise name mappings to standard lift types
 * Case-insensitive partial matching
 * Includes Italian and common variations
 */
export const LIFT_NAME_MAPPINGS = {
  bench: [
    // English
    'bench', 'bench press', 'chest press', 'pec', 'press',
    // Italian
    'panca', 'panca piana', 'panca orizzontale', 'distensioni panca',
    // Variations
    'flat bench', 'barbell bench', 'dumbbell bench', 'db bench', 'bb bench'
  ],
  squat: [
    // English
    'squat', 'front squat', 'back squat', 'high bar', 'low bar',
    // Italian
    'squat', 'accosciata', 'squat frontale', 'squat posteriore',
    // Variations
    'barbell squat', 'bb squat', 'olympic squat', 'full squat'
  ],
  deadlift: [
    // English
    'deadlift', 'romanian deadlift', 'rdl', 'sumo', 'conventional',
    // Italian
    'stacco', 'stacco da terra', 'stacco rumeno', 'stacco sumo', 'stacco convenzionale',
    // Variations
    'barbell deadlift', 'bb deadlift', 'straight leg deadlift', 'sldl'
  ],
  overhead: [
    // English
    'overhead press', 'shoulder press', 'military press', 'ohp', 'strict press',
    // Italian
    'military press', 'lento avanti', 'distensioni sopra la testa', 'shoulder press',
    // Variations
    'seated press', 'standing press', 'barbell press', 'dumbbell press', 'db press'
  ],
} as const

export type LiftType = keyof typeof LIFT_NAME_MAPPINGS
