/**
 * In-memory cache for workout generation requests
 * Provides resilience for mobile disconnections and prevents duplicate generations
 *
 * LIMITATION: Single-server only (for multi-server, migrate to Redis)
 * Cache entries auto-expire after 10 minutes
 */

import { getPhaseFromProgress } from '@/components/ui/progress-feedback'

interface CachedGeneration {
  workout: any | null
  insightInfluencedChanges: any[]
  timestamp: number
  status: 'in_progress' | 'complete' | 'error'
  error?: string
}

const generationCache = new Map<string, CachedGeneration>()

export class GenerationCache {
  /**
   * Mark generation as started
   * Call this when generation begins to enable reconnection
   */
  static start(requestId: string): void {
    generationCache.set(requestId, {
      workout: null,
      insightInfluencedChanges: [],
      timestamp: Date.now(),
      status: 'in_progress'
    })

    console.log(`[GenerationCache] Started: ${requestId}`)
  }

  /**
   * Store completed generation
   * Cache expires after 10 minutes
   */
  static complete(requestId: string, workout: any, insightInfluencedChanges: any[] = []): void {
    generationCache.set(requestId, {
      workout,
      insightInfluencedChanges,
      timestamp: Date.now(),
      status: 'complete'
    })

    console.log(`[GenerationCache] Completed: ${requestId}`, {
      workoutId: workout?.id,
      changesCount: insightInfluencedChanges.length
    })

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      if (generationCache.has(requestId)) {
        generationCache.delete(requestId)
        console.log(`[GenerationCache] Expired: ${requestId}`)
      }
    }, 600000) // 10 minutes
  }

  /**
   * Store failed generation
   */
  static error(requestId: string, error: string): void {
    generationCache.set(requestId, {
      workout: null,
      insightInfluencedChanges: [],
      timestamp: Date.now(),
      status: 'error',
      error
    })

    console.log(`[GenerationCache] Error: ${requestId}`, { error })

    // Auto-cleanup after 5 minutes for errors
    setTimeout(() => {
      if (generationCache.has(requestId)) {
        generationCache.delete(requestId)
      }
    }, 300000) // 5 minutes
  }

  /**
   * Get generation status
   * Returns null if not found or expired
   */
  static get(requestId: string): CachedGeneration | null {
    const entry = generationCache.get(requestId)
    if (!entry) {
      return null
    }

    // Check expiration (10 minutes)
    const age = Date.now() - entry.timestamp
    if (age > 600000) {
      generationCache.delete(requestId)
      console.log(`[GenerationCache] Expired on read: ${requestId}`)
      return null
    }

    return entry
  }

  /**
   * Calculate estimated progress based on elapsed time
   * Used for polling when actual progress is unknown
   * Returns both progress percentage and derived phase (synchronized)
   */
  static getEstimatedProgress(requestId: string): { progress: number; phase: string } {
    const entry = generationCache.get(requestId)
    if (!entry) return { progress: 0, phase: 'profile' }
    if (entry.status === 'complete') return { progress: 100, phase: 'finalize' }
    if (entry.status === 'error') return { progress: 0, phase: 'profile' }

    // Estimate progress: ~1.5% per second, capped at 90%
    // (actual completion sends 100%)
    const elapsed = Date.now() - entry.timestamp
    const progress = Math.min(90, Math.floor(elapsed / 1500))

    // Derive phase from progress to keep them synchronized
    const phase = getPhaseFromProgress(progress)

    return { progress, phase }
  }

  /**
   * Clear all cache (for testing/debugging)
   */
  static clear(): void {
    const count = generationCache.size
    generationCache.clear()
    console.log(`[GenerationCache] Cleared ${count} entries`)
  }

  /**
   * Get cache stats (for monitoring)
   */
  static stats(): { size: number; byStatus: Record<string, number> } {
    const byStatus: Record<string, number> = {
      in_progress: 0,
      complete: 0,
      error: 0
    }

    for (const entry of Array.from(generationCache.values())) {
      byStatus[entry.status]++
    }

    return {
      size: generationCache.size,
      byStatus
    }
  }
}
