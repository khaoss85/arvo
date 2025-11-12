/**
 * Embedding Storage
 * Loads pre-generated exercise embeddings from static file
 * Embeddings are generated once via scripts/generate-embeddings.ts and distributed to all users
 */

// Cache version - must match the generated file version
const EMBEDDING_VERSION = '1.0.0'
const STATIC_FILE_PATH = '/data/exercise-embeddings.json'

export interface EmbeddingCacheData {
  version: string
  model: string
  embeddings: Map<string, number[]> // exerciseName -> embedding
  timestamp: number
  exerciseCount?: number
  metadata?: {
    generatedAt: string
    apiModel: string
    dimensions: number
    precision: string
  }
}

export class EmbeddingStorage {
  private static memoryCache: EmbeddingCacheData | null = null

  /**
   * Load embeddings from static file
   * Returns null if file doesn't exist or is invalid
   */
  static async loadEmbeddings(): Promise<EmbeddingCacheData | null> {
    // Return memory cache if already loaded
    if (this.memoryCache) {
      return this.memoryCache
    }

    try {
      console.log(`[EmbeddingStorage] Loading embeddings from ${STATIC_FILE_PATH}...`)

      // Fetch from public directory
      const response = await fetch(STATIC_FILE_PATH)

      if (!response.ok) {
        console.warn(
          `[EmbeddingStorage] Failed to fetch embeddings file: ${response.status} ${response.statusText}`
        )
        return null
      }

      const data = await response.json()

      // Validate version
      if (data.version !== EMBEDDING_VERSION) {
        console.warn(
          `[EmbeddingStorage] Version mismatch: file=${data.version}, expected=${EMBEDDING_VERSION}`
        )
        console.warn('[EmbeddingStorage] Consider regenerating embeddings: npm run generate:embeddings')
        // Continue anyway - embeddings might still be compatible
      }

      // Convert plain object to Map
      const embeddings = new Map<string, number[]>(
        Object.entries(data.embeddings) as Array<[string, number[]]>
      )

      const cacheData: EmbeddingCacheData = {
        version: data.version,
        model: data.model,
        embeddings,
        timestamp: data.timestamp,
        exerciseCount: data.exerciseCount,
        metadata: data.metadata,
      }

      // Cache in memory for subsequent calls
      this.memoryCache = cacheData

      console.log(`[EmbeddingStorage] ✓ Loaded ${embeddings.size} embeddings from static file`)
      if (data.metadata?.generatedAt) {
        console.log(`[EmbeddingStorage]   Generated: ${data.metadata.generatedAt}`)
      }

      return cacheData
    } catch (error) {
      console.error('[EmbeddingStorage] Error loading embeddings:', error)
      console.error('[EmbeddingStorage] Make sure to run: npm run generate:embeddings')
      return null // Graceful degradation
    }
  }

  /**
   * Clear memory cache (useful for testing or forcing reload)
   */
  static clearCache(): void {
    this.memoryCache = null
    console.log('[EmbeddingStorage] Memory cache cleared')
  }

  /**
   * Get cache info
   */
  static async getCacheInfo(): Promise<{
    exists: boolean
    version?: string
    count?: number
    generatedAt?: string
  }> {
    const data = await this.loadEmbeddings()

    if (!data) {
      return { exists: false }
    }

    return {
      exists: true,
      version: data.version,
      count: data.embeddings.size,
      generatedAt: data.metadata?.generatedAt,
    }
  }

  /**
   * Check if embeddings are available
   */
  static async isAvailable(): Promise<boolean> {
    const data = await this.loadEmbeddings()
    return data !== null && data.embeddings.size > 0
  }

  /**
   * Get current embedding version
   */
  static getEmbeddingVersion(): string {
    return EMBEDDING_VERSION
  }

  /**
   * Get static file path
   */
  static getStaticFilePath(): string {
    return STATIC_FILE_PATH
  }
}
