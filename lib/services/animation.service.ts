/**
 * Animation Service - MuscleWiki API Integration
 *
 * Maps exercise names to video animation URLs from MuscleWiki API.
 * Uses lazy loading with database caching for cost optimization.
 * Supports multiple video angles (front, back, side) and gender variants.
 */

import {
  MuscleWikiService,
  type MuscleWikiVideo,
  type VideoAngle,
  type VideoGender,
} from './musclewiki.service'

interface ExerciseAnimationInput {
  name: string
  canonicalPattern?: string
  equipmentVariant?: string
}

export interface ExerciseAnimationResult {
  url: string | null
  videos: MuscleWikiVideo[] | null
  source: 'musclewiki' | null
}

export class AnimationService {
  /**
   * Get animation URL for an exercise (legacy method for backward compatibility)
   * Returns single URL (first available video)
   */
  static async getAnimationUrl(exercise: ExerciseAnimationInput): Promise<string | null> {
    const result = await this.getAnimation(exercise)
    return result.url
  }

  /**
   * Get full animation data including all video angles
   */
  static async getAnimation(
    exercise: ExerciseAnimationInput,
    preferredAngle: VideoAngle = 'front',
    preferredGender: VideoGender = 'male'
  ): Promise<ExerciseAnimationResult> {
    // Try direct name match
    let videos = await MuscleWikiService.getExerciseVideos(exercise.name)

    // Try with canonical pattern + equipment
    if (!videos?.length && exercise.canonicalPattern && exercise.equipmentVariant) {
      const canonicalName = this.buildCanonicalName(
        exercise.canonicalPattern,
        exercise.equipmentVariant
      )
      videos = await MuscleWikiService.getExerciseVideos(canonicalName)
    }

    // Try with just canonical pattern
    if (!videos?.length && exercise.canonicalPattern) {
      videos = await MuscleWikiService.getExerciseVideos(exercise.canonicalPattern)
    }

    if (videos && videos.length > 0) {
      // Find preferred video
      const preferred =
        videos.find((v) => v.angle === preferredAngle && v.gender === preferredGender) ||
        videos.find((v) => v.angle === preferredAngle) ||
        videos[0]

      return {
        url: preferred?.url || null,
        videos,
        source: 'musclewiki',
      }
    }

    return { url: null, videos: null, source: null }
  }

  /**
   * Get all video angles for an exercise
   */
  static async getExerciseVideos(
    exercise: ExerciseAnimationInput
  ): Promise<MuscleWikiVideo[] | null> {
    // Try direct name match
    let videos = await MuscleWikiService.getExerciseVideos(exercise.name)
    if (videos && videos.length > 0) return videos

    // Try with canonical pattern + equipment
    if (exercise.canonicalPattern && exercise.equipmentVariant) {
      const canonicalName = this.buildCanonicalName(
        exercise.canonicalPattern,
        exercise.equipmentVariant
      )
      videos = await MuscleWikiService.getExerciseVideos(canonicalName)
      if (videos && videos.length > 0) return videos
    }

    // Try with just canonical pattern
    if (exercise.canonicalPattern) {
      videos = await MuscleWikiService.getExerciseVideos(exercise.canonicalPattern)
      if (videos && videos.length > 0) return videos
    }

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
   * Uses batch lookup for efficiency
   */
  static async prefetchAnimations(exercises: ExerciseAnimationInput[]): Promise<void> {
    const names = exercises.map((e) => e.name)
    await MuscleWikiService.getMultipleExercises(names)
  }

  /**
   * Build canonical exercise name from pattern and equipment
   * Example: ("bench-press", "barbell") -> "barbell bench press"
   * Example: ("back squat", "Barbell, Squat Rack") -> "barbell back squat"
   * Example: ("Cable Pec Fly", "Cable") -> "cable pec fly" (no duplication)
   */
  private static buildCanonicalName(pattern: string, equipment: string): string {
    // Clean up pattern and equipment
    const cleanPattern = pattern.replace(/-/g, ' ').trim().toLowerCase()

    // Split equipment by comma and take only first item (primary equipment)
    let primaryEquipment = equipment.split(',')[0].trim()

    // Clean up overly descriptive equipment
    primaryEquipment = primaryEquipment
      .replace(/\s+(with|using|on|at).*/i, '')
      .replace(/\s+machine$/i, '')
      .replace(/^(incline|decline|flat|adjustable)\s+/i, '')

    const cleanEquipment = primaryEquipment.replace(/-/g, ' ').trim().toLowerCase()

    // Check if equipment is already at the start of the pattern
    if (cleanPattern.startsWith(cleanEquipment + ' ')) {
      return cleanPattern
    }

    // Build name: equipment + pattern
    return `${cleanEquipment} ${cleanPattern}`.trim()
  }

  /**
   * Debug helper: show animation resolution chain
   */
  static async debugMapping(exercise: ExerciseAnimationInput): Promise<{
    exerciseName: string
    videos: MuscleWikiVideo[] | null
    finalUrl: string | null
  }> {
    const videos = await this.getExerciseVideos(exercise)
    const finalUrl = await this.getAnimationUrl(exercise)

    return {
      exerciseName: exercise.name,
      videos,
      finalUrl,
    }
  }
}
