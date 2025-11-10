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
  pull: number // Pull-ups, lat pulldowns, rows
  legPress: number // Leg press machine
}

/**
 * Male strength standards (multipliers of bodyweight)
 * Source: Adapted from Strength Level standards and Starting Strength progressions
 * Updated: Less conservative thresholds based on real-world training data
 */
export const MALE_STANDARDS: StrengthStandard[] = [
  {
    level: 'beginner',
    years: 0.25, // 0-6 months
    benchPress: 0.5,
    squat: 0.75,
    deadlift: 1.0,
    overheadPress: 0.35,
    pull: 0.3, // Assisted pull-ups or light lat pulldown
    legPress: 1.5, // Leg press is easier than squat
  },
  {
    level: 'novice',
    years: 0.75, // 6-12 months
    benchPress: 0.75,
    squat: 1.0,
    deadlift: 1.25,
    overheadPress: 0.5,
    pull: 0.6, // Partial bodyweight pull-ups
    legPress: 2.0,
  },
  {
    level: 'intermediate',
    years: 1.5, // 1-2 years
    benchPress: 1.25, // Raised from 1.0
    squat: 1.75, // Raised from 1.5
    deadlift: 2.0, // Raised from 1.75
    overheadPress: 0.75, // Raised from 0.65
    pull: 1.0, // Bodyweight pull-ups or 1x BW lat pulldown
    legPress: 2.5, // 2.5x bodyweight leg press
  },
  {
    level: 'advanced',
    years: 3.5, // 2-5 years
    benchPress: 1.75, // Raised from 1.5
    squat: 2.25, // Raised from 2.0
    deadlift: 2.5, // Raised from 2.25
    overheadPress: 1.0, // Raised from 0.9
    pull: 1.3, // Weighted pull-ups or heavy lat pulldown
    legPress: 3.5,
  },
  {
    level: 'elite',
    years: 5.0, // 5+ years
    benchPress: 2.0,
    squat: 2.5,
    deadlift: 3.0,
    overheadPress: 1.2,
    pull: 1.6, // Heavy weighted pull-ups
    legPress: 4.5,
  },
]

/**
 * Female strength standards (multipliers of bodyweight)
 * Approximately 60-70% of male standards, adjusted for natural strength differences
 * Updated: Less conservative thresholds based on real-world training data
 */
export const FEMALE_STANDARDS: StrengthStandard[] = [
  {
    level: 'beginner',
    years: 0.25, // 0-6 months
    benchPress: 0.3,
    squat: 0.5,
    deadlift: 0.65,
    overheadPress: 0.2,
    pull: 0.2, // Assisted pull-ups
    legPress: 1.0,
  },
  {
    level: 'novice',
    years: 0.75, // 6-12 months
    benchPress: 0.45,
    squat: 0.75,
    deadlift: 0.95,
    overheadPress: 0.3,
    pull: 0.4,
    legPress: 1.5,
  },
  {
    level: 'intermediate',
    years: 1.5, // 1-2 years
    benchPress: 0.75, // Raised from 0.65
    squat: 1.25, // Raised from 1.0
    deadlift: 1.5, // Raised from 1.25
    overheadPress: 0.55, // Raised from 0.45
    pull: 0.7, // Partial bodyweight
    legPress: 2.0,
  },
  {
    level: 'advanced',
    years: 3.5, // 2-5 years
    benchPress: 1.15, // Raised from 1.0
    squat: 1.75, // Raised from 1.5
    deadlift: 2.0, // Raised from 1.75
    overheadPress: 0.75, // Raised from 0.65
    pull: 1.0, // Bodyweight pull-ups
    legPress: 2.75,
  },
  {
    level: 'elite',
    years: 5.0, // 5+ years
    benchPress: 1.5, // Raised from 1.35
    squat: 2.25, // Raised from 2.0
    deadlift: 2.5, // Raised from 2.25
    overheadPress: 1.0, // Raised from 0.85
    pull: 1.3,
    legPress: 3.5,
  },
]

/**
 * Absolute weight thresholds when bodyweight is not available
 * These are rough estimates for an average adult (75kg male, 60kg female)
 */
export const ABSOLUTE_MALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number; pull: number; legPress: number }
> = {
  beginner: { benchPress: 40, squat: 60, deadlift: 80, overheadPress: 25, pull: 25, legPress: 110 },
  novice: { benchPress: 60, squat: 80, deadlift: 100, overheadPress: 40, pull: 45, legPress: 150 },
  intermediate: { benchPress: 95, squat: 130, deadlift: 150, overheadPress: 55, pull: 75, legPress: 190 },
  advanced: { benchPress: 130, squat: 170, deadlift: 190, overheadPress: 75, pull: 100, legPress: 260 },
  elite: { benchPress: 155, squat: 195, deadlift: 235, overheadPress: 95, pull: 120, legPress: 340 },
}

export const ABSOLUTE_FEMALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number; pull: number; legPress: number }
> = {
  beginner: { benchPress: 20, squat: 35, deadlift: 45, overheadPress: 15, pull: 12, legPress: 60 },
  novice: { benchPress: 30, squat: 50, deadlift: 65, overheadPress: 20, pull: 24, legPress: 90 },
  intermediate: { benchPress: 45, squat: 75, deadlift: 90, overheadPress: 33, pull: 42, legPress: 120 },
  advanced: { benchPress: 70, squat: 105, deadlift: 120, overheadPress: 45, pull: 60, legPress: 165 },
  elite: { benchPress: 90, squat: 135, deadlift: 150, overheadPress: 60, pull: 78, legPress: 210 },
}

/**
 * Exercise name mappings to standard lift types
 * Case-insensitive partial matching
 * Includes Italian and common variations
 */
export const LIFT_NAME_MAPPINGS = {
  bench: [
    // English
    'bench', 'bench press', 'chest press', 'pec',
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
  pull: [
    // English - Pull-ups and vertical pulling
    'pull up', 'pullup', 'pull-up', 'chin up', 'chinup', 'chin-up',
    'lat pulldown', 'lat pull down', 'lat machine', 'pulldown', 'lat pull',
    // English - Horizontal pulling (rows)
    'barbell row', 'dumbbell row', 'cable row', 'bent over row', 'pendlay row',
    'seated row', 'chest supported row', 't-bar row',
    // Italian
    'trazioni', 'trazioni alla sbarra', 'lat machine', 'pulley', 'dorso',
    'rematore', 'rematore bilanciere', 'rematore manubri',
    // Variations
    'wide grip pulldown', 'close grip pulldown', 'neutral grip pulldown',
    'assisted pullup', 'weighted pullup', 'lat', 'vertical pull'
  ],
  legPress: [
    // English
    'leg press', 'leg press machine', 'seated leg press', 'leg-press',
    '45 degree leg press', '45 degree press', 'angled leg press',
    // Italian
    'pressa', 'pressa gambe', 'leg press', 'press gambe', 'pressa 45',
    // Variations
    'horizontal leg press', 'vertical leg press', 'hack squat press',
    'plate loaded leg press', 'machine leg press'
  ],
} as const

export type LiftType = keyof typeof LIFT_NAME_MAPPINGS
