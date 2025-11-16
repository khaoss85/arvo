/**
 * Exercise Explanation Cache
 *
 * localStorage-based cache for "why this exercise" explanations.
 * Each exerciseId gets a unique cached explanation to ensure context accuracy
 * after exercise swaps or modifications.
 */

interface CacheEntry {
  explanation: string
  timestamp: number
}

const CACHE_PREFIX = 'arvo:explanation:'
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Generate cache key from exercise details
 */
function generateKey(
  exerciseName: string,
  exerciseId: string,
  approachId: string,
  locale: string
): string {
  // Normalize exercise name to handle minor variations
  const normalized = exerciseName.toLowerCase().trim()
  return `${CACHE_PREFIX}${normalized}:${exerciseId}:${approachId}:${locale}`
}

/**
 * Check if cache entry is still valid (within TTL)
 */
function isValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < TTL_MS
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get cached explanation
 * Returns null if not found, expired, or localStorage unavailable
 */
export function getCachedExplanation(
  exerciseName: string,
  exerciseId: string,
  approachId: string,
  locale: string
): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const key = generateKey(exerciseName, exerciseId, approachId, locale)
    const cached = localStorage.getItem(key)

    if (!cached) {
      return null
    }

    const entry: CacheEntry = JSON.parse(cached)

    if (!isValid(entry)) {
      // Entry expired, remove it
      localStorage.removeItem(key)
      return null
    }

    console.log('[ExerciseExplanationCache] Cache hit:', key)
    return entry.explanation
  } catch (error) {
    console.error('[ExerciseExplanationCache] Error reading cache:', error)
    return null
  }
}

/**
 * Store explanation in cache
 */
export function setCachedExplanation(
  exerciseName: string,
  exerciseId: string,
  approachId: string,
  locale: string,
  explanation: string
): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const key = generateKey(exerciseName, exerciseId, approachId, locale)
    const entry: CacheEntry = {
      explanation,
      timestamp: Date.now(),
    }

    localStorage.setItem(key, JSON.stringify(entry))
    console.log('[ExerciseExplanationCache] Cached:', key)

    // Cleanup old entries opportunistically (every ~10 writes)
    if (Math.random() < 0.1) {
      cleanupExpiredEntries()
    }
  } catch (error) {
    // Handle quota exceeded or other localStorage errors
    console.error('[ExerciseExplanationCache] Error writing cache:', error)

    // If quota exceeded, try to cleanup and retry once
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      cleanupExpiredEntries()
      try {
        const key = generateKey(exerciseName, exerciseId, approachId, locale)
        const entry: CacheEntry = {
          explanation,
          timestamp: Date.now(),
        }
        localStorage.setItem(key, JSON.stringify(entry))
      } catch {
        // Silent fail if still can't write
        console.warn('[ExerciseExplanationCache] Cache write failed after cleanup')
      }
    }
  }
}

/**
 * Remove all expired cache entries
 */
export function cleanupExpiredEntries(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const now = Date.now()
    const keysToRemove: string[] = []

    // Find all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(CACHE_PREFIX)) {
        continue
      }

      try {
        const cached = localStorage.getItem(key)
        if (!cached) {
          continue
        }

        const entry: CacheEntry = JSON.parse(cached)
        if (now - entry.timestamp >= TTL_MS) {
          keysToRemove.push(key)
        }
      } catch {
        // Invalid entry, mark for removal
        keysToRemove.push(key)
      }
    }

    // Remove expired entries
    keysToRemove.forEach((key) => localStorage.removeItem(key))

    if (keysToRemove.length > 0) {
      console.log(
        `[ExerciseExplanationCache] Cleaned up ${keysToRemove.length} expired entries`
      )
    }
  } catch (error) {
    console.error('[ExerciseExplanationCache] Error during cleanup:', error)
  }
}

/**
 * Clear all exercise explanation cache entries (useful for testing/debugging)
 */
export function clearAllExplanationCache(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
    console.log(
      `[ExerciseExplanationCache] Cleared ${keysToRemove.length} cache entries`
    )
  } catch (error) {
    console.error('[ExerciseExplanationCache] Error clearing cache:', error)
  }
}

/**
 * Get cache statistics
 */
export function getExplanationCacheStats(): {
  totalEntries: number
  validEntries: number
  expiredEntries: number
} {
  if (!isLocalStorageAvailable()) {
    return { totalEntries: 0, validEntries: 0, expiredEntries: 0 }
  }

  try {
    let totalEntries = 0
    let validEntries = 0
    let expiredEntries = 0
    const now = Date.now()

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(CACHE_PREFIX)) {
        continue
      }

      totalEntries++

      try {
        const cached = localStorage.getItem(key)
        if (!cached) {
          continue
        }

        const entry: CacheEntry = JSON.parse(cached)
        if (now - entry.timestamp < TTL_MS) {
          validEntries++
        } else {
          expiredEntries++
        }
      } catch {
        expiredEntries++
      }
    }

    return { totalEntries, validEntries, expiredEntries }
  } catch (error) {
    console.error('[ExerciseExplanationCache] Error getting stats:', error)
    return { totalEntries: 0, validEntries: 0, expiredEntries: 0 }
  }
}
