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
  hipThrust: number // Hip thrust - glute-dominant hinge
  row: number // Barbell row - horizontal pull
  pullUps: number // Pull-ups/chin-ups - vertical pull bodyweight
  frontSquat: number // Front squat - quad-dominant squat
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
    hipThrust: 0.75, // Can move more weight than deadlift
    row: 0.5, // Similar to bench press
    pullUps: 0.1, // Heavily assisted pull-ups
    frontSquat: 0.6, // ~80% of back squat
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
    hipThrust: 1.25, // Progressing quickly
    row: 0.75, // Following bench press progression
    pullUps: 0.5, // Partial bodyweight pull-ups
    frontSquat: 0.85, // ~85% of back squat
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
    hipThrust: 1.75, // Strong hip extension
    row: 1.0, // Bodyweight barbell row
    pullUps: 1.0, // Clean bodyweight pull-ups (10+ reps)
    frontSquat: 1.25, // ~70% of back squat at this level
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
    hipThrust: 2.25, // Excellent hip drive
    row: 1.4, // Heavy barbell rows
    pullUps: 1.25, // Weighted pull-ups (BW + 0.25x for reps)
    frontSquat: 1.75, // ~75% of back squat
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
    hipThrust: 2.75, // Elite hip power
    row: 1.75, // Very heavy barbell rows
    pullUps: 1.5, // Heavy weighted pull-ups (BW + 0.5x)
    frontSquat: 2.0, // ~80% of back squat
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
    hipThrust: 0.5, // Women often excel at hip thrust
    row: 0.3, // ~60% of male standard
    pullUps: 0.05, // Heavily assisted
    frontSquat: 0.4, // ~67% of male standard
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
    hipThrust: 0.85, // Women progress quickly on hip thrust
    row: 0.5, // ~67% of male standard
    pullUps: 0.3, // Very assisted or band-assisted
    frontSquat: 0.55, // ~65% of male standard
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
    hipThrust: 1.25, // Strong glute development
    row: 0.7, // 70% of male standard
    pullUps: 0.7, // Near bodyweight or band-assisted
    frontSquat: 0.85, // ~68% of male standard
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
    hipThrust: 1.75, // Excellent hip power
    row: 1.0, // Bodyweight rows
    pullUps: 1.0, // Clean bodyweight pull-ups
    frontSquat: 1.25, // ~71% of male standard
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
    hipThrust: 2.25, // Elite hip strength
    row: 1.3, // Heavy rows
    pullUps: 1.3, // Weighted pull-ups
    frontSquat: 1.5, // ~75% of male standard
  },
]

/**
 * Absolute weight thresholds when bodyweight is not available
 * These are rough estimates for an average adult (75kg male, 60kg female)
 */
export const ABSOLUTE_MALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number; pull: number; legPress: number; hipThrust: number; row: number; pullUps: number; frontSquat: number }
> = {
  beginner: { benchPress: 40, squat: 60, deadlift: 80, overheadPress: 25, pull: 25, legPress: 110, hipThrust: 56, row: 38, pullUps: 8, frontSquat: 45 },
  novice: { benchPress: 60, squat: 80, deadlift: 100, overheadPress: 40, pull: 45, legPress: 150, hipThrust: 94, row: 56, pullUps: 38, frontSquat: 64 },
  intermediate: { benchPress: 95, squat: 130, deadlift: 150, overheadPress: 55, pull: 75, legPress: 190, hipThrust: 131, row: 75, pullUps: 75, frontSquat: 94 },
  advanced: { benchPress: 130, squat: 170, deadlift: 190, overheadPress: 75, pull: 100, legPress: 260, hipThrust: 169, row: 105, pullUps: 94, frontSquat: 131 },
  elite: { benchPress: 155, squat: 195, deadlift: 235, overheadPress: 95, pull: 120, legPress: 340, hipThrust: 206, row: 131, pullUps: 113, frontSquat: 150 },
}

export const ABSOLUTE_FEMALE_STANDARDS: Record<
  ExperienceLevel,
  { benchPress: number; squat: number; deadlift: number; overheadPress: number; pull: number; legPress: number; hipThrust: number; row: number; pullUps: number; frontSquat: number }
> = {
  beginner: { benchPress: 20, squat: 35, deadlift: 45, overheadPress: 15, pull: 12, legPress: 60, hipThrust: 30, row: 18, pullUps: 3, frontSquat: 24 },
  novice: { benchPress: 30, squat: 50, deadlift: 65, overheadPress: 20, pull: 24, legPress: 90, hipThrust: 51, row: 30, pullUps: 18, frontSquat: 33 },
  intermediate: { benchPress: 45, squat: 75, deadlift: 90, overheadPress: 33, pull: 42, legPress: 120, hipThrust: 75, row: 42, pullUps: 42, frontSquat: 51 },
  advanced: { benchPress: 70, squat: 105, deadlift: 120, overheadPress: 45, pull: 60, legPress: 165, hipThrust: 105, row: 60, pullUps: 60, frontSquat: 75 },
  elite: { benchPress: 90, squat: 135, deadlift: 150, overheadPress: 60, pull: 78, legPress: 210, hipThrust: 135, row: 78, pullUps: 78, frontSquat: 90 },
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
  hipThrust: [
    // English
    'hip thrust', 'hip thrusts', 'barbell hip thrust', 'glute bridge',
    'hip bridge', 'thrust', 'bb hip thrust',
    // Italian
    'hip thrust', 'spinta anca', 'spinta dell\'anca', 'ponte glutei',
    'thrust glutei', 'ponte con bilanciere', 'hip thrust bilanciere',
    // Variations
    'weighted hip thrust', 'single leg hip thrust', 'banded hip thrust',
    'elevated hip thrust', 'barbell bridge'
  ],
  row: [
    // English - Barbell rows
    'barbell row', 'bb row', 'bent over row', 'bent-over row',
    'pendlay row', 'yates row', 'underhand row',
    // Italian
    'rematore', 'rematore bilanciere', 'rematore con bilanciere',
    'rematore busto 90', 'rematore piegato', 'tirata orizzontale',
    // Variations - Note: exclude lat machine/pull-ups (those are in pullUps category)
    'barbell bent row', 't-bar row', 'tbar row', 'meadows row'
  ],
  pullUps: [
    // English - Pull-ups and chin-ups
    'pull up', 'pullup', 'pull-up', 'pull ups', 'pullups',
    'chin up', 'chinup', 'chin-up', 'chin ups', 'chinups',
    // Italian
    'trazioni', 'trazione', 'trazioni alla sbarra', 'trazioni sbarra',
    'trazione alla barra', 'chin up',
    // Variations
    'weighted pull up', 'weighted pullup', 'assisted pull up', 'assisted pullup',
    'wide grip pull up', 'close grip pull up', 'neutral grip pull up',
    'kipping pull up', 'strict pull up'
  ],
  frontSquat: [
    // English
    'front squat', 'front squats', 'frontsquat', 'fs',
    'olympic squat', 'clean grip squat',
    // Italian
    'front squat', 'squat frontale', 'squat anteriore',
    'accosciata frontale', 'squat front',
    // Variations
    'barbell front squat', 'bb front squat', 'cross arm front squat',
    'zercher squat', 'goblet squat'
  ],
} as const

export type LiftType = keyof typeof LIFT_NAME_MAPPINGS
