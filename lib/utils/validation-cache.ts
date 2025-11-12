/**
 * Validation Cache
 *
 * Simple in-memory cache for workout modification validation results.
 * Prevents duplicate AI calls for the same modification within a short time window.
 */

import type { ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'

interface CacheEntry {
  result: ModificationValidationOutput
  timestamp: number
}

/**
 * In-memory cache with TTL support
 */
class ValidationCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly TTL_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Generate cache key from exercise details
   */
  private generateKey(
    exerciseName: string,
    currentSets: number,
    proposedSets: number,
    userId: string
  ): string {
    // Normalize exercise name to handle minor variations
    const normalized = exerciseName.toLowerCase().trim()
    return `${userId}:${normalized}:${currentSets}->${proposedSets}`
  }

  /**
   * Check if cache entry is still valid (within TTL)
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.TTL_MS
  }

  /**
   * Get validation result from cache
   * Returns null if not found or expired
   */
  get(
    exerciseName: string,
    currentSets: number,
    proposedSets: number,
    userId: string
  ): ModificationValidationOutput | null {
    const key = this.generateKey(exerciseName, currentSets, proposedSets, userId)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (!this.isValid(entry)) {
      // Entry expired, remove it
      this.cache.delete(key)
      return null
    }

    console.log('[ValidationCache] Cache hit:', key)
    return entry.result
  }

  /**
   * Store validation result in cache
   */
  set(
    exerciseName: string,
    currentSets: number,
    proposedSets: number,
    userId: string,
    result: ModificationValidationOutput
  ): void {
    const key = this.generateKey(exerciseName, currentSets, proposedSets, userId)
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    })
    console.log('[ValidationCache] Cached:', key)
  }

  /**
   * Clear all expired entries (optional cleanup)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp >= this.TTL_MS) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear entire cache (useful for testing)
   */
  clear(): void {
    this.cache.clear()
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

// Singleton instance
export const validationCache = new ValidationCache()

// Optional: Run cleanup periodically (every 10 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    validationCache.cleanup()
  }, 10 * 60 * 1000)
}
