import {
  ExperienceLevel,
  MALE_STANDARDS,
  FEMALE_STANDARDS,
  ABSOLUTE_MALE_STANDARDS,
  ABSOLUTE_FEMALE_STANDARDS,
  LIFT_NAME_MAPPINGS,
  type LiftType,
} from '@/lib/constants/strength-standards'

export interface LiftData {
  weight: number // kg
  reps: number
  rir?: number // Reps in reserve (optional)
}

export interface StrengthBaseline {
  [exerciseName: string]: LiftData
}

export interface ExperienceEstimate {
  level: ExperienceLevel
  years: number
  confidence: number // 0-100, based on data quality
  breakdown: {
    liftName: string
    e1RM: number
    relativeStrength?: number // multiplier of bodyweight
    suggestedLevel: ExperienceLevel
  }[]
}

/**
 * Calculate estimated 1RM using Epley formula
 * e1RM = weight * (1 + reps/30)
 *
 * Alternative formulas considered:
 * - Brzycki: weight * (36 / (37 - reps))
 * - Lombardi: weight * reps^0.10
 *
 * Epley is preferred for its simplicity and accuracy in the 1-10 rep range
 */
export function calculateE1RM(weight: number, reps: number, rir: number = 0): number {
  // Adjust for RIR (if user left 2 reps in reserve, they could've done 2 more)
  const totalPossibleReps = reps + rir

  // Epley formula
  return weight * (1 + totalPossibleReps / 30)
}

/**
 * Map exercise name to standard lift type
 * Returns null if exercise doesn't match any standard lift
 */
export function identifyLiftType(exerciseName: string): LiftType | null {
  const name = exerciseName.toLowerCase()

  for (const [liftType, keywords] of Object.entries(LIFT_NAME_MAPPINGS)) {
    if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
      return liftType as LiftType
    }
  }

  return null
}

/**
 * Determine experience level from a single lift's e1RM
 */
function classifySingleLift(
  e1RM: number,
  liftType: LiftType,
  gender: 'male' | 'female' | 'other' = 'other',
  bodyweight?: number
): ExperienceLevel {
  const standards = gender === 'female' ? FEMALE_STANDARDS : MALE_STANDARDS

  // Use relative strength if bodyweight available, otherwise absolute
  if (bodyweight && bodyweight > 0) {
    const ratio = e1RM / bodyweight

    // Get the lift property name (e.g., 'benchPress' from 'bench')
    const liftProp = {
      bench: 'benchPress',
      squat: 'squat',
      deadlift: 'deadlift',
      overhead: 'overheadPress',
      pull: 'pull',
      legPress: 'legPress',
    }[liftType] as 'benchPress' | 'squat' | 'deadlift' | 'overheadPress' | 'pull' | 'legPress'

    // Find the highest level this lift qualifies for
    for (let i = standards.length - 1; i >= 0; i--) {
      if (ratio >= standards[i][liftProp]) {
        return standards[i].level
      }
    }
  } else {
    // Use absolute weight thresholds
    const absoluteStandards = gender === 'female' ? ABSOLUTE_FEMALE_STANDARDS : ABSOLUTE_MALE_STANDARDS

    const liftProp = {
      bench: 'benchPress',
      squat: 'squat',
      deadlift: 'deadlift',
      overhead: 'overheadPress',
      pull: 'pull',
      legPress: 'legPress',
    }[liftType] as 'benchPress' | 'squat' | 'deadlift' | 'overheadPress' | 'pull' | 'legPress'

    // Find the highest level this lift qualifies for
    const levels: ExperienceLevel[] = ['elite', 'advanced', 'intermediate', 'novice', 'beginner']
    for (const level of levels) {
      if (e1RM >= absoluteStandards[level][liftProp]) {
        return level
      }
    }
  }

  return 'beginner'
}

/**
 * Estimate training experience from strength baseline
 *
 * @param strengthBaseline - Object with exercise names as keys and lift data as values
 * @param gender - User's gender for appropriate strength standards
 * @param bodyweight - User's bodyweight in kg (optional but recommended)
 * @returns Experience estimate with confidence score
 */
export function estimateExperience(
  strengthBaseline: StrengthBaseline,
  gender: 'male' | 'female' | 'other' = 'other',
  bodyweight?: number
): ExperienceEstimate {
  const breakdown: ExperienceEstimate['breakdown'] = []
  const levelScores: Record<ExperienceLevel, number> = {
    beginner: 0,
    novice: 0,
    intermediate: 0,
    advanced: 0,
    elite: 0,
  }

  let validLiftsCount = 0

  // Analyze each lift in the baseline
  for (const [exerciseName, liftData] of Object.entries(strengthBaseline)) {
    const liftType = identifyLiftType(exerciseName)

    if (!liftType) {
      // Skip exercises that don't match standard lifts
      continue
    }

    const e1RM = calculateE1RM(liftData.weight, liftData.reps, liftData.rir)
    const level = classifySingleLift(e1RM, liftType, gender, bodyweight)

    breakdown.push({
      liftName: exerciseName,
      e1RM: Math.round(e1RM * 10) / 10, // Round to 1 decimal
      relativeStrength: bodyweight ? Math.round((e1RM / bodyweight) * 100) / 100 : undefined,
      suggestedLevel: level,
    })

    levelScores[level]++
    validLiftsCount++
  }

  // No valid lifts found
  if (validLiftsCount === 0) {
    return {
      level: 'beginner',
      years: 0,
      confidence: 0,
      breakdown: [],
    }
  }

  // Determine overall level (take the most common, or lean conservative if tied)
  let finalLevel: ExperienceLevel = 'beginner'
  let maxScore = 0

  // Iterate in order from beginner to elite, so ties favor lower (more conservative) level
  const levels: ExperienceLevel[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']
  for (const level of levels) {
    if (levelScores[level] > maxScore) {
      maxScore = levelScores[level]
      finalLevel = level
    }
  }

  // Map level to years using standards
  const standards = gender === 'female' ? FEMALE_STANDARDS : MALE_STANDARDS
  const years = standards.find(s => s.level === finalLevel)?.years || 0

  // Calculate confidence score
  // Higher confidence if:
  // - More lifts analyzed (max 4 standard lifts)
  // - Bodyweight available (more accurate standards)
  // - All lifts agree on level (low variance)

  const dataQualityScore = (validLiftsCount / 4) * 50 // Max 50 points for having all 4 lifts
  const bodyweightBonus = bodyweight ? 25 : 0 // 25 points if bodyweight available

  const variance = Object.values(levelScores).filter(s => s > 0).length
  const consistencyScore = variance === 1 ? 25 : variance === 2 ? 15 : variance === 3 ? 10 : 5

  const confidence = Math.min(100, dataQualityScore + bodyweightBonus + consistencyScore)

  return {
    level: finalLevel,
    years: Math.round(years * 10) / 10, // Round to 1 decimal
    confidence: Math.round(confidence),
    breakdown,
  }
}

/**
 * Get human-readable description of experience level
 */
export function getExperienceLevelDescription(level: ExperienceLevel): {
  title: string
  timeRange: string
  description: string
} {
  const descriptions = {
    beginner: {
      title: 'Beginner',
      timeRange: '0-6 months',
      description: 'New to structured training. Focus on learning proper form and building base strength.',
    },
    novice: {
      title: 'Novice',
      timeRange: '6-12 months',
      description: 'Consistent linear progression. Building foundational strength across major lifts.',
    },
    intermediate: {
      title: 'Intermediate',
      timeRange: '1-2 years',
      description: 'Established base strength. Progress requires more deliberate programming.',
    },
    advanced: {
      title: 'Advanced',
      timeRange: '2-5 years',
      description: 'Strong across all major lifts. Progress measured in months, not weeks.',
    },
    elite: {
      title: 'Elite',
      timeRange: '5+ years',
      description: 'Exceptional strength levels. Approaching genetic potential in some lifts.',
    },
  }

  return descriptions[level]
}
