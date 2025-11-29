/**
 * Body Type (Morphotype) Configuration
 *
 * Defines body types for personalized training adjustments.
 * Female: gynoid, android, mixed
 * Male: ectomorph, mesomorph, endomorph
 */

// Type definitions
export type FemaleBodyType = 'gynoid' | 'android' | 'mixed'
export type MaleBodyType = 'ectomorph' | 'mesomorph' | 'endomorph'
export type BodyType = FemaleBodyType | MaleBodyType

export const FEMALE_BODY_TYPES: FemaleBodyType[] = ['gynoid', 'android', 'mixed']
export const MALE_BODY_TYPES: MaleBodyType[] = ['ectomorph', 'mesomorph', 'endomorph']

// Volume adjustment configuration per muscle group
export interface MuscleVolumeAdjustment {
  muscle: string
  multiplier: number // 1.0 = normal, 1.3 = +30%, 0.9 = -10%
}

export interface BodyTypeConfig {
  id: BodyType
  gender: 'male' | 'female'
  emoji: string
  volumeAdjustments: MuscleVolumeAdjustment[]
  trainingEmphasis: string // Brief description for AI context
  exercisePreferences: {
    prioritize?: string[] // Movement patterns to prioritize
    reduce?: string[] // Movement patterns to reduce
  }
}

// =============================================================================
// FEMALE BODY TYPES
// =============================================================================

const GYNOID_CONFIG: BodyTypeConfig = {
  id: 'gynoid',
  gender: 'female',
  emoji: '🍐',
  volumeAdjustments: [
    // Upper body emphasis to balance proportions
    { muscle: 'shoulders', multiplier: 1.3 },
    { muscle: 'shoulders_side', multiplier: 1.35 },
    { muscle: 'shoulders_rear', multiplier: 1.25 },
    { muscle: 'lats', multiplier: 1.25 },
    { muscle: 'upper_back', multiplier: 1.2 },
    { muscle: 'chest', multiplier: 1.15 },
    { muscle: 'chest_upper', multiplier: 1.2 },
    // Lower body - maintain, don't over-emphasize
    { muscle: 'quads', multiplier: 0.9 },
    { muscle: 'glutes', multiplier: 1.0 },
    { muscle: 'hamstrings', multiplier: 1.0 },
  ],
  trainingEmphasis: 'Upper body emphasis to create balanced proportions. Focus on shoulder width and back development for V-taper effect. Lower body already well-developed - maintain volume without excessive emphasis.',
  exercisePreferences: {
    prioritize: ['lateral raises', 'overhead press', 'pull-ups', 'rows', 'face pulls'],
    reduce: ['leg press', 'leg extensions'],
  },
}

const ANDROID_CONFIG: BodyTypeConfig = {
  id: 'android',
  gender: 'female',
  emoji: '🍎',
  volumeAdjustments: [
    // Lower body emphasis to balance proportions
    { muscle: 'glutes', multiplier: 1.4 },
    { muscle: 'hamstrings', multiplier: 1.3 },
    { muscle: 'quads', multiplier: 1.2 },
    // Upper body - moderate volume
    { muscle: 'shoulders', multiplier: 0.9 },
    { muscle: 'chest', multiplier: 0.9 },
    // Core emphasis for midsection
    { muscle: 'abs', multiplier: 1.2 },
    { muscle: 'obliques', multiplier: 1.15 },
  ],
  trainingEmphasis: 'Lower body and glute emphasis to create balanced proportions. Core stability work for midsection definition. Upper body already well-developed - maintain without excessive volume.',
  exercisePreferences: {
    prioritize: ['hip thrusts', 'romanian deadlifts', 'glute bridges', 'lunges', 'cable kickbacks'],
    reduce: ['overhead press', 'lateral raises'],
  },
}

const MIXED_FEMALE_CONFIG: BodyTypeConfig = {
  id: 'mixed',
  gender: 'female',
  emoji: '⚖️',
  volumeAdjustments: [
    // Balanced with slight aesthetic emphasis
    { muscle: 'glutes', multiplier: 1.15 },
    { muscle: 'shoulders_side', multiplier: 1.1 },
    { muscle: 'lats', multiplier: 1.1 },
  ],
  trainingEmphasis: 'Balanced proportions with slight emphasis on aesthetic muscle groups (glutes, shoulders, lats). Standard volume distribution across all muscle groups.',
  exercisePreferences: {
    prioritize: [],
    reduce: [],
  },
}

// =============================================================================
// MALE BODY TYPES
// =============================================================================

const ECTOMORPH_CONFIG: BodyTypeConfig = {
  id: 'ectomorph',
  gender: 'male',
  emoji: '🦒',
  volumeAdjustments: [
    // Focus on mass-building for major muscle groups
    { muscle: 'chest', multiplier: 1.2 },
    { muscle: 'lats', multiplier: 1.25 },
    { muscle: 'shoulders', multiplier: 1.2 },
    { muscle: 'quads', multiplier: 1.15 },
    { muscle: 'glutes', multiplier: 1.1 },
    // Reduce isolation-heavy work that burns calories without adding mass
    { muscle: 'calves', multiplier: 0.85 },
    { muscle: 'forearms', multiplier: 0.85 },
    { muscle: 'abs', multiplier: 0.9 },
  ],
  trainingEmphasis: 'Compound movement focus for maximum mass building. Prioritize big lifts (squat, bench, deadlift, rows). Minimize isolation exercises that burn calories without significant hypertrophy stimulus. Consider longer rest periods between sets.',
  exercisePreferences: {
    prioritize: ['compound movements', 'barbell exercises', 'heavy rows', 'squats', 'bench press'],
    reduce: ['isolation exercises', 'high-rep burnout sets', 'excessive cardio-style circuits'],
  },
}

const MESOMORPH_CONFIG: BodyTypeConfig = {
  id: 'mesomorph',
  gender: 'male',
  emoji: '💪',
  volumeAdjustments: [
    // Balanced - responds well to variety
    { muscle: 'shoulders_rear', multiplier: 1.1 },
    { muscle: 'hamstrings', multiplier: 1.1 },
    { muscle: 'calves', multiplier: 1.05 },
  ],
  trainingEmphasis: 'Balanced approach with variety. Responds well to both compound and isolation work. Can handle higher training frequency and volume. Focus on symmetry and detail work for lagging areas.',
  exercisePreferences: {
    prioritize: [],
    reduce: [],
  },
}

const ENDOMORPH_CONFIG: BodyTypeConfig = {
  id: 'endomorph',
  gender: 'male',
  emoji: '🐻',
  volumeAdjustments: [
    // V-taper emphasis to counteract wider midsection
    { muscle: 'shoulders_side', multiplier: 1.3 },
    { muscle: 'lats', multiplier: 1.25 },
    // Metabolically demanding leg work
    { muscle: 'quads', multiplier: 1.15 },
    { muscle: 'glutes', multiplier: 1.1 },
    // Core for midsection definition
    { muscle: 'abs', multiplier: 1.2 },
    { muscle: 'obliques', multiplier: 1.15 },
    // Reduce areas that add visual bulk without V-taper effect
    { muscle: 'traps', multiplier: 0.85 },
  ],
  trainingEmphasis: 'V-taper emphasis (wide shoulders, wide lats, narrow waist). Prioritize shoulder width and lat development. Include metabolically demanding compound movements. Core work for midsection definition. Avoid excessive trap work that can make neck appear thick.',
  exercisePreferences: {
    prioritize: ['lateral raises', 'pull-ups', 'lat pulldowns', 'overhead press', 'compound leg exercises'],
    reduce: ['shrugs', 'upright rows'],
  },
}

// =============================================================================
// CONFIGURATION MAP & HELPERS
// =============================================================================

export const BODY_TYPE_CONFIGS: Record<BodyType, BodyTypeConfig> = {
  gynoid: GYNOID_CONFIG,
  android: ANDROID_CONFIG,
  mixed: MIXED_FEMALE_CONFIG,
  ectomorph: ECTOMORPH_CONFIG,
  mesomorph: MESOMORPH_CONFIG,
  endomorph: ENDOMORPH_CONFIG,
}

/**
 * Get body types available for a specific gender
 */
export function getBodyTypesForGender(gender: 'male' | 'female' | 'other' | null): BodyType[] {
  if (gender === 'female') {
    return FEMALE_BODY_TYPES
  }
  if (gender === 'male') {
    return MALE_BODY_TYPES
  }
  return [] // 'other' or null - no body type options
}

/**
 * Get configuration for a specific body type
 */
export function getBodyTypeConfig(bodyType: BodyType): BodyTypeConfig {
  return BODY_TYPE_CONFIGS[bodyType]
}

/**
 * Get volume multiplier for a specific muscle based on body type
 */
export function getVolumeMultiplier(bodyType: BodyType | null, muscle: string): number {
  if (!bodyType) return 1.0

  const config = BODY_TYPE_CONFIGS[bodyType]
  const adjustment = config.volumeAdjustments.find(a =>
    a.muscle === muscle || muscle.includes(a.muscle) || a.muscle.includes(muscle)
  )

  return adjustment?.multiplier ?? 1.0
}

/**
 * Generate AI context string for body type adjustments.
 * This is injected into agent prompts to inform exercise selection and volume distribution.
 */
export function getBodyTypeAIContext(
  bodyType: BodyType | null,
  gender: 'male' | 'female' | 'other' | null
): string {
  if (!bodyType || !gender || gender === 'other') {
    return ''
  }

  const config = BODY_TYPE_CONFIGS[bodyType]

  let context = `
=== BODY TYPE CONTEXT ===
Body Type: ${bodyType.toUpperCase()} (${gender})
Training Emphasis: ${config.trainingEmphasis}

Volume Adjustments by Muscle Group:
${config.volumeAdjustments
  .map(adj => {
    const percentage = Math.round((adj.multiplier - 1) * 100)
    const sign = percentage >= 0 ? '+' : ''
    return `- ${adj.muscle}: ${sign}${percentage}%`
  })
  .join('\n')}
`

  if (config.exercisePreferences.prioritize && config.exercisePreferences.prioritize.length > 0) {
    context += `
Exercise Preferences:
- Prioritize: ${config.exercisePreferences.prioritize.join(', ')}
`
  }

  if (config.exercisePreferences.reduce && config.exercisePreferences.reduce.length > 0) {
    context += `- Reduce emphasis on: ${config.exercisePreferences.reduce.join(', ')}
`
  }

  context += `
Consider these body type adjustments alongside weak points and other user preferences when selecting exercises and distributing volume.
=== END BODY TYPE CONTEXT ===
`

  return context
}
