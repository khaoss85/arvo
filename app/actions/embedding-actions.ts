/**
 * Server Actions for Embedding Generation
 * Generates embeddings server-side to keep OpenAI API key secure
 */

'use server'

import { EmbeddingService } from '@/lib/services/embedding.service'

// In-memory cache for query embeddings
// Reduces cost and latency for repeated queries
const embeddingCache = new Map<
  string,
  { embedding: number[]; timestamp: number }
>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Keep cache size manageable

/**
 * Generate embedding for a query string
 * Uses server-side OpenAI API (secure)
 * Caches results to reduce costs
 *
 * @param query - The text to generate embedding for
 * @returns Embedding vector (1536 dimensions) or null if failed
 */
export async function generateQueryEmbedding(
  query: string
): Promise<number[] | null> {
  try {
    const normalized = query.toLowerCase().trim()

    if (!normalized) {
      console.warn('[EmbeddingAction] Empty query provided')
      return null
    }

    // Check cache first
    const cached = embeddingCache.get(normalized)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[EmbeddingAction] ✓ Cache hit for: "${normalized}"`)
      return cached.embedding
    }

    // Generate fresh embedding
    console.log(`[EmbeddingAction] Generating embedding for: "${normalized}"`)
    const embedding = await EmbeddingService.generateEmbedding(normalized)

    // Store in cache
    embeddingCache.set(normalized, {
      embedding,
      timestamp: Date.now(),
    })

    // Cleanup old entries if cache is too large
    if (embeddingCache.size > MAX_CACHE_SIZE) {
      // Remove oldest entry (first in Map)
      const oldestKey = embeddingCache.keys().next().value
      if (oldestKey) {
        embeddingCache.delete(oldestKey)
        console.log(`[EmbeddingAction] Cache cleanup: removed "${oldestKey}"`)
      }
    }

    console.log(`[EmbeddingAction] ✓ Generated embedding (${embedding.length} dimensions)`)
    return embedding
  } catch (error) {
    console.error('[EmbeddingAction] Failed to generate embedding:', error)
    console.error('[EmbeddingAction] Query:', query)
    return null
  }
}

/**
 * Clear embedding cache
 * Useful for testing or after API key rotation
 */
export async function clearEmbeddingCache(): Promise<void> {
  embeddingCache.clear()
  console.log('[EmbeddingAction] ✓ Cache cleared')
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 */
export async function getEmbeddingCacheStats(): Promise<{
  size: number
  maxSize: number
  ttlMinutes: number
}> {
  return {
    size: embeddingCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMinutes: CACHE_TTL / (60 * 1000),
  }
}
