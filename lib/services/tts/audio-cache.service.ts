/**
 * AudioCacheService
 *
 * IndexedDB-based caching for TTS audio to minimize API costs.
 * Caches audio blobs with TTL (time-to-live) management.
 */

export interface CachedAudio {
  key: string // Hash of text + voice + settings
  blob: Blob
  timestamp: number
  metadata: {
    text: string
    voice: string
    provider: string
    language: string
  }
}

export class AudioCacheService {
  private static instance: AudioCacheService
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'arvo-audio-cache'
  private readonly STORE_NAME = 'audio-clips'
  private readonly DB_VERSION = 1
  private readonly TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

  private constructor() {}

  static getInstance(): AudioCacheService {
    if (!AudioCacheService.instance) {
      AudioCacheService.instance = new AudioCacheService()
    }
    return AudioCacheService.instance
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return // Already initialized

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported, audio caching disabled')
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.cleanupExpired() // Clean old entries on init
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('provider', 'metadata.provider', { unique: false })
        }
      }
    })
  }

  /**
   * Generate cache key from text and voice settings
   */
  private generateKey(
    text: string,
    voice: string,
    provider: string,
    language: string,
    speed: number
  ): string {
    // Simple hash function for cache key
    const data = `${text}|${voice}|${provider}|${language}|${speed}`
    return this.simpleHash(data)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `audio_${Math.abs(hash).toString(36)}`
  }

  /**
   * Get cached audio blob
   */
  async get(
    text: string,
    voice: string,
    provider: string,
    language: string,
    speed: number
  ): Promise<Blob | null> {
    if (!this.db) {
      await this.init()
      if (!this.db) return null
    }

    const key = this.generateKey(text, voice, provider, language, speed)

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const cached = request.result as CachedAudio | undefined

        if (!cached) {
          resolve(null)
          return
        }

        // Check if expired
        const age = Date.now() - cached.timestamp
        if (age > this.TTL_MS) {
          // Expired, delete it
          this.delete(key)
          resolve(null)
          return
        }

        resolve(cached.blob)
      }

      request.onerror = () => {
        console.error('Failed to get cached audio:', request.error)
        resolve(null)
      }
    })
  }

  /**
   * Cache audio blob
   */
  async set(
    text: string,
    voice: string,
    provider: string,
    language: string,
    speed: number,
    blob: Blob
  ): Promise<void> {
    if (!this.db) {
      await this.init()
      if (!this.db) return
    }

    const key = this.generateKey(text, voice, provider, language, speed)
    const cached: CachedAudio = {
      key,
      blob,
      timestamp: Date.now(),
      metadata: {
        text: text.substring(0, 100), // Store first 100 chars for debugging
        voice,
        provider,
        language,
      },
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.put(cached)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to cache audio:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Delete a specific cached entry
   */
  private async delete(key: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to delete cached audio:', request.error)
        resolve()
      }
    })
  }

  /**
   * Clear all cached audio
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.init()
      if (!this.db) return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('Audio cache cleared')
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to clear audio cache:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
      const store = transaction.objectStore(this.STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor()

      const now = Date.now()
      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor) {
          const cached = cursor.value as CachedAudio
          const age = now - cached.timestamp

          if (age > this.TTL_MS) {
            cursor.delete()
            deletedCount++
          }

          cursor.continue()
        } else {
          if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired audio cache entries`)
          }
          resolve()
        }
      }

      request.onerror = () => {
        console.error('Failed to cleanup expired audio:', request.error)
        resolve()
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number
    totalSize: number
    oldestEntry: number | null
    newestEntry: number | null
  }> {
    if (!this.db) {
      await this.init()
      if (!this.db) {
        return {
          totalEntries: 0,
          totalSize: 0,
          oldestEntry: null,
          newestEntry: null,
        }
      }
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
      const store = transaction.objectStore(this.STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const entries = request.result as CachedAudio[]
        const totalSize = entries.reduce((sum, entry) => sum + entry.blob.size, 0)
        const timestamps = entries.map((e) => e.timestamp)

        resolve({
          totalEntries: entries.length,
          totalSize,
          oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
          newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
        })
      }

      request.onerror = () => {
        console.error('Failed to get cache stats:', request.error)
        resolve({
          totalEntries: 0,
          totalSize: 0,
          oldestEntry: null,
          newestEntry: null,
        })
      }
    })
  }
}

export const audioCacheService = AudioCacheService.getInstance()
