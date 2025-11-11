/**
 * Animation Service - ExerciseDB API Integration
 *
 * Maps exercise names to GIF animation URLs from ExerciseDB API.
 * Provides async animation loading with graceful fallback.
 */

import { ExerciseDBService } from './exercisedb.service'

interface ExerciseAnimationInput {
  name: string
  canonicalPattern?: string
  equipmentVariant?: string
}

export class AnimationService {
  /**
   * Get animation URL for an exercise
   * Now fetches from ExerciseDB API instead of local files
   *
   * Returns null if no animation is available (graceful degradation)
   */
  static async getAnimationUrl(exercise: ExerciseAnimationInput): Promise<string | null> {
    // Try ExerciseDB API with exercise name first
    const gifUrl = await ExerciseDBService.getGifUrl(exercise.name)
    if (gifUrl) {
      return gifUrl
    }

    // Try with canonical pattern + equipment if available
    // Example: "bench-press" + "barbell" → "barbell bench press"
    if (exercise.canonicalPattern && exercise.equipmentVariant) {
      const canonicalName = this.buildCanonicalName(
        exercise.canonicalPattern,
        exercise.equipmentVariant
      )
      const canonicalGif = await ExerciseDBService.getGifUrl(canonicalName)
      if (canonicalGif) {
        return canonicalGif
      }
    }

    // Try with just canonical pattern (no equipment)
    if (exercise.canonicalPattern) {
      const baseGif = await ExerciseDBService.getGifUrl(exercise.canonicalPattern)
      if (baseGif) {
        return baseGif
      }
    }

    // Graceful degradation - no animation available
    return null
  }

  /**
   * Check if animation exists for an exercise
   */
  static async hasAnimation(exercise: ExerciseAnimationInput): Promise<boolean> {
    const url = await this.getAnimationUrl(exercise)
    return url !== null
  }

  /**
   * Prefetch animations for multiple exercises
   * Useful for preloading GIFs when workout is generated
   */
  static async prefetchAnimations(exercises: ExerciseAnimationInput[]): Promise<void> {
    const names = exercises.map((e) => e.name)
    await ExerciseDBService.prefetchExercises(names)
  }

  /**
   * Build canonical exercise name from pattern and equipment
   * Example: ("bench-press", "barbell") -> "barbell bench press"
   * Example: ("back squat", "Barbell, Squat Rack") -> "barbell back squat"
   * Example: ("Cable Pec Fly", "Cable") -> "cable pec fly" (no duplication)
   * Example: ("T-Bar Row", "landmine t bar with plate load") -> "landmine t bar row"
   */
  private static buildCanonicalName(pattern: string, equipment: string): string {
    // Clean up pattern and equipment
    const cleanPattern = pattern.replace(/-/g, ' ').trim().toLowerCase()

    // Split equipment by comma and take only first item (primary equipment)
    // "Barbell, Squat Rack" -> "Barbell"
    let primaryEquipment = equipment.split(',')[0].trim()

    // Clean up overly descriptive equipment
    // "landmine t bar with plate load" -> "landmine t bar"
    // "cable machine" -> "cable"
    // "incline bench" -> "bench"
    primaryEquipment = primaryEquipment
      .replace(/\s+(with|using|on|at).*/i, '') // Remove "with plate load", "on bench", etc.
      .replace(/\s+machine$/i, '') // Remove trailing "machine"
      .replace(/^(incline|decline|flat|adjustable)\s+/i, '') // Remove bench angle modifiers

    const cleanEquipment = primaryEquipment.replace(/-/g, ' ').trim().toLowerCase()

    // Check if equipment is already at the start of the pattern
    // "Cable Pec Fly" + "Cable" -> "cable pec fly" (avoid duplicate)
    if (cleanPattern.startsWith(cleanEquipment + ' ')) {
      return cleanPattern
    }

    // Build name: equipment + pattern
    return `${cleanEquipment} ${cleanPattern}`.trim()
  }

  /**
   * Debug helper: show animation resolution chain
   * Useful for troubleshooting why an animation isn't showing
   */
  static async debugMapping(exercise: ExerciseAnimationInput): Promise<{
    exactMatch: string | null
    canonicalMatch: string | null
    baseMatch: string | null
    finalUrl: string | null
  }> {
    const exactMatch = await ExerciseDBService.getGifUrl(exercise.name)

    const canonicalMatch =
      exercise.canonicalPattern && exercise.equipmentVariant
        ? await ExerciseDBService.getGifUrl(
            this.buildCanonicalName(exercise.canonicalPattern, exercise.equipmentVariant)
          )
        : null

    const baseMatch = exercise.canonicalPattern
      ? await ExerciseDBService.getGifUrl(exercise.canonicalPattern)
      : null

    const finalUrl = await this.getAnimationUrl(exercise)

    return {
      exactMatch,
      canonicalMatch,
      baseMatch,
      finalUrl,
    }
  }
}
