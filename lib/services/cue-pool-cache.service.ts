/**
 * CuePoolCacheService
 *
 * Caches AI-generated realtime cue pools to avoid repeated expensive AI calls.
 * Pools are cached per exercise + language combination and reused across sets.
 */

import type { RealtimeCuePools } from '@/lib/agents/audio-script-generator.agent'

export class CuePoolCacheService {
  private static instance: CuePoolCacheService
  private cache: Map<string, RealtimeCuePools> = new Map()

  static getInstance(): CuePoolCacheService {
    if (!CuePoolCacheService.instance) {
      CuePoolCacheService.instance = new CuePoolCacheService()
    }
    return CuePoolCacheService.instance
  }

  /**
   * Generate cache key from exercise name and language
   */
  private getCacheKey(exerciseName: string, language: 'en' | 'it'): string {
    return `${exerciseName.toLowerCase()}-${language}`
  }

  /**
   * Get cached cue pools for exercise
   * Returns null if not cached
   */
  get(exerciseName: string, language: 'en' | 'it'): RealtimeCuePools | null {
    const key = this.getCacheKey(exerciseName, language)
    const cached = this.cache.get(key)

    if (cached) {
      console.log('[CuePoolCache] Cache HIT for', exerciseName, language)
      return cached
    }

    console.log('[CuePoolCache] Cache MISS for', exerciseName, language)
    return null
  }

  /**
   * Store cue pools in cache
   */
  set(exerciseName: string, language: 'en' | 'it', pools: RealtimeCuePools): void {
    const key = this.getCacheKey(exerciseName, language)
    this.cache.set(key, pools)
    console.log('[CuePoolCache] Cached pools for', exerciseName, language)
  }

  /**
   * Check if pools are cached
   */
  has(exerciseName: string, language: 'en' | 'it'): boolean {
    const key = this.getCacheKey(exerciseName, language)
    return this.cache.has(key)
  }

  /**
   * Clear specific exercise from cache
   */
  clear(exerciseName: string, language: 'en' | 'it'): void {
    const key = this.getCacheKey(exerciseName, language)
    this.cache.delete(key)
    console.log('[CuePoolCache] Cleared cache for', exerciseName, language)
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear()
    console.log('[CuePoolCache] Cleared entire cache')
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const cuePoolCacheService = CuePoolCacheService.getInstance()
