/**
 * Animation Service - Hybrid mapping for exercise animations
 *
 * Maps exercise names to Lottie animation files using a 4-level fallback strategy:
 * 1. Exact match (slug-based)
 * 2. Canonical pattern + equipment variant
 * 3. Base canonical pattern (ignores equipment)
 * 4. Graceful null (no animation available)
 */

interface ExerciseAnimationInput {
  name: string
  canonicalPattern?: string
  equipmentVariant?: string
}

export class AnimationService {
  private static readonly ANIMATIONS_BASE_PATH = '/animations/exercises'

  /**
   * Get animation URL for an exercise (synchronous)
   * Returns null if no animation is available (graceful degradation)
   *
   * Note: This does NOT check if file actually exists - that's done lazily
   * by ExerciseAnimation component when loading. This keeps workout generation fast.
   */
  static getAnimationUrl(exercise: ExerciseAnimationInput): string | null {
    // Level 1: Try exact match on exercise name
    const exactMatch = this.tryExact(exercise.name)
    if (exactMatch) return exactMatch

    // Level 2: Try canonical pattern + equipment variant
    if (exercise.canonicalPattern && exercise.equipmentVariant) {
      const variantMatch = this.tryPattern(exercise.canonicalPattern, exercise.equipmentVariant)
      if (variantMatch) return variantMatch
    }

    // Level 3: Fallback to base canonical pattern (no equipment)
    if (exercise.canonicalPattern) {
      const baseMatch = this.tryPattern(exercise.canonicalPattern)
      if (baseMatch) return baseMatch
    }

    // Level 4: No animation available - graceful degradation
    return null
  }

  /**
   * Check if animation exists for an exercise
   */
  static hasAnimation(exercise: ExerciseAnimationInput): boolean {
    return this.getAnimationUrl(exercise) !== null
  }

  /**
   * Try exact match on exercise name (slug-based)
   * Example: "Barbell Bench Press" -> "/animations/exercises/barbell-bench-press.json"
   */
  private static tryExact(exerciseName: string): string | null {
    const slug = this.normalizeToSlug(exerciseName)

    // If slug is empty, return null (no animation available)
    if (!slug) {
      return null
    }

    const path = `${this.ANIMATIONS_BASE_PATH}/${slug}.json`

    // In production, this would check file existence
    // For now, we assume the file exists if we built the path
    // The ExerciseAnimation component will handle 404s gracefully
    return path
  }

  /**
   * Try canonical pattern with optional equipment variant
   * Examples:
   * - ("bench-press", "barbell") -> "/animations/exercises/barbell-bench-press.json"
   * - ("bench-press", "smith-machine") -> tries smith-machine variant, falls back to base
   * - ("bench-press") -> "/animations/exercises/bench-press.json"
   */
  private static tryPattern(canonicalPattern: string, equipment?: string): string | null {
    if (equipment) {
      // Try equipment-specific variant first
      const equipmentSlug = this.normalizeToSlug(equipment)
      const patternSlug = this.normalizeToSlug(canonicalPattern)
      const variantPath = `${this.ANIMATIONS_BASE_PATH}/${equipmentSlug}-${patternSlug}.json`

      // Would check file existence here
      // For now, assume it exists if common equipment
      if (this.isCommonEquipment(equipment)) {
        return variantPath
      }
    }

    // Fallback to base pattern
    const patternSlug = this.normalizeToSlug(canonicalPattern)
    return `${this.ANIMATIONS_BASE_PATH}/${patternSlug}.json`
  }

  /**
   * Normalize exercise name to slug format
   * Handles multi-language, special characters, and strips common position/angle prefixes/suffixes
   */
  private static normalizeToSlug(name: string): string {
    // Guard against undefined/null/empty values
    if (!name || typeof name !== 'string') {
      return ''
    }

    let normalized = name
      .toLowerCase()
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove special characters except hyphens
      .replace(/[^\w-]/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')

    // Strip technical suffixes (tempo, pauses, etc) that are often AI-generated
    // This allows "Barbell Bench Press - Paused 1s at Bottom" to match "barbell-bench-press.json"
    const suffixPatternsToStrip = [
      /-paused-\d+s?-at-(top|bottom|chest|start|end)/,
      /-\d+\d+-tempo/,
      /-\d+-\d+-\d+-\d+/, // tempo notation like 3-1-1-0
      /-with-pause/,
      /-explosive/,
      /-controlled/,
      /-slow-eccentric/,
      /-fast-concentric/,
    ]

    for (const pattern of suffixPatternsToStrip) {
      normalized = normalized.replace(pattern, '')
    }

    // Strip common position/angle prefixes for better animation matching
    // This allows "Flat Barbell Bench Press" to match "barbell-bench-press.json"
    const prefixesToStrip = [
      'flat-',
      'incline-',
      'decline-',
      'seated-',
      'standing-',
      'lying-',
      'prone-',
      'supine-',
      'single-arm-',
      'single-leg-',
      'two-arm-',
      'two-leg-',
      'unilateral-',
      'bilateral-',
      'high-',
      'low-',
      'close-grip-',
      'wide-grip-',
      'narrow-',
      'wide-'
    ]

    for (const prefix of prefixesToStrip) {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.substring(prefix.length)
        break // Only strip one prefix to avoid over-normalization
      }
    }

    return normalized
  }

  /**
   * Check if equipment type commonly has specific animations
   * This helps decide whether to try equipment-specific variant
   */
  private static isCommonEquipment(equipment: string): boolean {
    const commonEquipment = [
      'barbell',
      'dumbbell',
      'cable',
      'machine',
      'smith-machine',
      'bodyweight'
    ]

    const normalized = this.normalizeToSlug(equipment)
    return commonEquipment.includes(normalized)
  }

  /**
   * Get list of all available animations
   * Useful for admin/analytics to see coverage
   */
  static getAvailableAnimations(): string[] {
    // In a real implementation, this would scan the animations directory
    // For now, return empty array (to be populated as we add animations)
    return []
  }

  /**
   * Debug helper: show mapping chain for an exercise
   * Useful for troubleshooting why an animation isn't showing
   */
  static debugMapping(exercise: ExerciseAnimationInput): {
    exactMatch: string | null
    variantMatch: string | null
    baseMatch: string | null
    finalUrl: string | null
  } {
    const exactMatch = this.tryExact(exercise.name)
    const variantMatch = exercise.canonicalPattern && exercise.equipmentVariant
      ? this.tryPattern(exercise.canonicalPattern, exercise.equipmentVariant)
      : null
    const baseMatch = exercise.canonicalPattern
      ? this.tryPattern(exercise.canonicalPattern)
      : null
    const finalUrl = this.getAnimationUrl(exercise)

    return {
      exactMatch,
      variantMatch,
      baseMatch,
      finalUrl
    }
  }
}
