/**
 * Powerlifting-specific calculations for percentage-based training
 * Used by approaches like Wendler 5/3/1, Sheiko, RTS/DUP, Westside
 */

// Re-export calculateE1RM for convenience
export { calculateE1RM } from './experience-calculator'

/**
 * Round weight to nearest plate increment
 * Default 2.5kg for metric (Olympic bar increments)
 */
export function roundToPlate(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment
}

/**
 * Calculate weight from percentage of E1RM or Training Max
 * Returns rounded to plate increment
 */
export function calculateWeightFromPercentage(
  maxWeight: number,
  percentage: number,
  plateIncrement: number = 2.5
): number {
  const rawWeight = maxWeight * (percentage / 100)
  return roundToPlate(rawWeight, plateIncrement)
}

/**
 * Calculate Training Max (typically 85-90% of true 1RM)
 * Wendler uses 90%, some prefer 85%
 */
export function calculateTrainingMax(
  e1rm: number,
  percentage: number = 90,
  plateIncrement: number = 2.5
): number {
  return roundToPlate(e1rm * (percentage / 100), plateIncrement)
}

/**
 * Convert RPE (Rate of Perceived Exertion) to RIR (Reps in Reserve)
 * RPE 10 = 0 RIR (failure)
 * RPE 9 = 1 RIR
 * RPE 8 = 2 RIR
 * etc.
 */
export function rpeToRir(rpe: number): number {
  return Math.max(0, 10 - rpe)
}

/**
 * Convert RIR to RPE
 */
export function rirToRpe(rir: number): number {
  return Math.max(0, Math.min(10, 10 - rir))
}

/**
 * Estimate RPE from actual reps vs target reps
 * If user did 8 reps when target was 5, RPE was lower than intended
 */
export function estimateRpeFromPerformance(
  actualReps: number,
  targetReps: number,
  targetRpe: number = 8
): number {
  // Each extra rep beyond target = ~0.5 RPE lower
  const repDiff = actualReps - targetReps
  const estimatedRpe = targetRpe - repDiff * 0.5
  return Math.max(5, Math.min(10, estimatedRpe))
}

/**
 * RPE-based percentage chart (Tuchscherer RPE table)
 * Returns approximate percentage of 1RM for given reps at given RPE
 */
export function getRpePercentage(reps: number, rpe: number): number {
  // Simplified RPE chart based on Tuchscherer's research
  // Format: reps -> { rpe: percentage }
  const rpeChart: Record<number, Record<number, number>> = {
    1: { 10: 100, 9.5: 98, 9: 96, 8.5: 94, 8: 92, 7.5: 89, 7: 86 },
    2: { 10: 96, 9.5: 94, 9: 92, 8.5: 90, 8: 88, 7.5: 85, 7: 82 },
    3: { 10: 93, 9.5: 91, 9: 89, 8.5: 87, 8: 85, 7.5: 82, 7: 79 },
    4: { 10: 90, 9.5: 88, 9: 86, 8.5: 84, 8: 82, 7.5: 79, 7: 76 },
    5: { 10: 87, 9.5: 85, 9: 83, 8.5: 81, 8: 79, 7.5: 76, 7: 74 },
    6: { 10: 84, 9.5: 82, 9: 80, 8.5: 78, 8: 76, 7.5: 74, 7: 72 },
    7: { 10: 81, 9.5: 79, 9: 77, 8.5: 75, 8: 74, 7.5: 72, 7: 70 },
    8: { 10: 78, 9.5: 76, 9: 74, 8.5: 73, 8: 72, 7.5: 70, 7: 68 },
    9: { 10: 76, 9.5: 74, 9: 72, 8.5: 71, 8: 70, 7.5: 68, 7: 66 },
    10: { 10: 74, 9.5: 72, 9: 71, 8.5: 69, 8: 68, 7.5: 67, 7: 65 },
  }

  const repsData = rpeChart[Math.min(10, Math.max(1, Math.round(reps)))]
  if (!repsData) return 70 // Fallback

  // Handle half RPEs
  const roundedRpe = Math.round(rpe * 2) / 2
  const clampedRpe = Math.min(10, Math.max(7, roundedRpe))

  return repsData[clampedRpe] || 75 // Fallback
}

/**
 * Calculate suggested weight for RTS/DUP style training
 * Given target reps and RPE, suggest weight based on E1RM
 */
export function calculateRtsWeight(
  e1rm: number,
  targetReps: number,
  targetRpe: number = 8,
  plateIncrement: number = 2.5
): number {
  const percentage = getRpePercentage(targetReps, targetRpe)
  return roundToPlate(e1rm * (percentage / 100), plateIncrement)
}

/**
 * Wendler 5/3/1 weekly percentages
 */
export const WENDLER_PERCENTAGES = {
  week1: {
    // 5/5/5+ week
    warmup: [40, 50, 60],
    working: [65, 75, 85], // Last set is AMRAP (5+)
  },
  week2: {
    // 3/3/3+ week
    warmup: [40, 50, 60],
    working: [70, 80, 90], // Last set is AMRAP (3+)
  },
  week3: {
    // 5/3/1+ week
    warmup: [40, 50, 60],
    working: [75, 85, 95], // Last set is AMRAP (1+)
  },
  week4: {
    // Deload week
    warmup: [40, 50, 60],
    working: [40, 50, 60], // Light week
  },
} as const

/**
 * Get Wendler sets for a given week
 */
export function getWendlerSets(
  trainingMax: number,
  week: 1 | 2 | 3 | 4,
  plateIncrement: number = 2.5
): {
  warmup: { weight: number; reps: number }[]
  working: { weight: number; reps: number; amrap?: boolean }[]
} {
  const weekKey = `week${week}` as keyof typeof WENDLER_PERCENTAGES
  const percentages = WENDLER_PERCENTAGES[weekKey]

  const repsPerWeek = {
    week1: [5, 5, 5],
    week2: [3, 3, 3],
    week3: [5, 3, 1],
    week4: [5, 5, 5],
  }

  return {
    warmup: percentages.warmup.map((pct) => ({
      weight: roundToPlate(trainingMax * (pct / 100), plateIncrement),
      reps: 5,
    })),
    working: percentages.working.map((pct, idx) => ({
      weight: roundToPlate(trainingMax * (pct / 100), plateIncrement),
      reps: repsPerWeek[weekKey][idx],
      amrap: week !== 4 && idx === 2, // Last working set is AMRAP (except deload)
    })),
  }
}

/**
 * Calculate Training Max increase after Wendler cycle
 * Based on AMRAP performance in week 3
 */
export function calculateWendlerTmIncrease(
  isUpperBody: boolean,
  amrapReps: number,
  targetReps: number = 1
): number {
  // Standard Wendler progression:
  // Upper body: +2.5kg per cycle
  // Lower body: +5kg per cycle
  // If AMRAP significantly exceeds target, consider bigger jump
  const baseIncrease = isUpperBody ? 2.5 : 5

  if (amrapReps >= targetReps + 5) {
    // Exceptional performance: double the increase
    return baseIncrease * 2
  }

  if (amrapReps < targetReps) {
    // Underperformance: no increase, consider TM reset
    return 0
  }

  return baseIncrease
}

/**
 * Sheiko average intensity calculation
 * Sheiko programs typically use 68-72% average intensity with high volume
 */
export function calculateSheikoVolume(
  e1rm: number,
  liftType: 'squat' | 'bench' | 'deadlift',
  skillLevel: 'intermediate' | 'advanced' = 'intermediate'
): {
  avgIntensity: number
  weeklyReps: number
  suggestionNote: string
} {
  // Sheiko guidelines (approximate)
  const guidelines = {
    squat: {
      intermediate: { avgIntensity: 68, weeklyReps: 50 },
      advanced: { avgIntensity: 70, weeklyReps: 70 },
    },
    bench: {
      intermediate: { avgIntensity: 70, weeklyReps: 80 },
      advanced: { avgIntensity: 72, weeklyReps: 100 },
    },
    deadlift: {
      intermediate: { avgIntensity: 66, weeklyReps: 35 },
      advanced: { avgIntensity: 68, weeklyReps: 50 },
    },
  }

  const config = guidelines[liftType][skillLevel]

  return {
    avgIntensity: config.avgIntensity,
    weeklyReps: config.weeklyReps,
    suggestionNote: `Target ~${config.avgIntensity}% of E1RM with ${config.weeklyReps} weekly reps for ${liftType}`,
  }
}

/**
 * Check if a lift is a competition lift (SBD)
 */
export function isCompetitionLift(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase()
  const competitionKeywords = [
    'squat',
    'bench press',
    'deadlift',
    'competition',
    'back squat',
    'flat bench',
    'conventional deadlift',
    'sumo deadlift',
  ]

  return competitionKeywords.some((keyword) => name.includes(keyword))
}

/**
 * Determine lift type for powerlifting tracking
 */
export function getPowerliftingLiftType(
  exerciseName: string
): 'squat' | 'bench' | 'deadlift' | 'accessory' {
  const name = exerciseName.toLowerCase()

  if (name.includes('squat') && !name.includes('front') && !name.includes('leg press')) {
    return 'squat'
  }
  if (name.includes('bench') && name.includes('press') && !name.includes('incline') && !name.includes('decline')) {
    return 'bench'
  }
  if (name.includes('deadlift')) {
    return 'deadlift'
  }

  return 'accessory'
}
