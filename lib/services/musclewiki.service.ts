/**
 * MuscleWiki API Integration Service
 * Provides exercise video URLs from MuscleWiki API via RapidAPI
 * Uses lazy loading with database caching for cost optimization
 *
 * Flow:
 * 1. Check memory cache
 * 2. Check Supabase database cache
 * 3. Fetch from API only on miss
 * 4. Save to database for cross-user benefit
 */

import { MuscleWikiCacheService } from './musclewiki-cache.service'

export type VideoAngle = 'front' | 'back' | 'side'
export type VideoGender = 'male' | 'female'

export interface MuscleWikiVideo {
  url: string
  angle: VideoAngle
  gender: VideoGender
  og_image?: string
}

export interface MuscleWikiExercise {
  id: number
  name: string
  category: string
  difficulty: 'Novice' | 'Intermediate' | 'Advanced' | null
  mechanic: 'Isolation' | 'Compound' | null
  force: 'Push' | 'Pull' | 'Static' | null
  primary_muscles: string[]
  grips: string[]
  steps: string[]
  videos: MuscleWikiVideo[]
  video_count?: number
}

// In-memory cache for current session (fast lookups)
interface MemoryCache {
  exercises: Map<string, MuscleWikiExercise>
}

interface MuscleWikiSearchResponse {
  total: number
  limit: number
  offset: number
  count: number
  results: MuscleWikiExercise[]
}

/**
 * Legacy compatibility type for components that expect ExerciseDB format
 * This allows gradual migration from ExerciseDB to MuscleWiki
 */
export interface LegacyExercise {
  id: string
  name: string
  gifUrl: string | null
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

export class MuscleWikiService {
  private static memoryCache: MemoryCache = {
    exercises: new Map(),
  }

  private static readonly API_BASE = 'https://musclewiki-api.p.rapidapi.com'

  // Track in-flight requests to prevent duplicate API calls
  private static pendingRequests: Map<string, Promise<MuscleWikiExercise | null>> = new Map()

  // Rate limiting for API calls
  private static lastApiCallTime = 0
  private static readonly MIN_API_INTERVAL_MS = 200 // 200ms between API calls (5 req/sec max)

  /**
   * Get RapidAPI headers for authentication
   */
  private static getHeaders(): HeadersInit {
    const apiKey = process.env.NEXT_PUBLIC_MUSCLEWIKI_API_KEY
    if (!apiKey) {
      console.warn('[MuscleWiki] No API key configured - set NEXT_PUBLIC_MUSCLEWIKI_API_KEY')
    }
    return {
      'X-RapidAPI-Key': apiKey || '',
      'X-RapidAPI-Host': 'musclewiki-api.p.rapidapi.com',
    }
  }

  /**
   * Wait for rate limit before making API call
   */
  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastApiCallTime
    if (timeSinceLastCall < this.MIN_API_INTERVAL_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.MIN_API_INTERVAL_MS - timeSinceLastCall)
      )
    }
    this.lastApiCallTime = Date.now()
  }

  /**
   * Normalize exercise name for consistent lookups
   */
  static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
  }

  /**
   * Get exercise by name with lazy loading
   * Primary method for fetching exercise data
   */
  static async getExerciseByName(exerciseName: string): Promise<MuscleWikiExercise | null> {
    const normalizedName = this.normalizeName(exerciseName)

    // 1. Check memory cache first (instant)
    const memoryCached = this.memoryCache.exercises.get(normalizedName)
    if (memoryCached) {
      console.log(`[MuscleWiki] Memory cache hit for "${exerciseName}"`)
      return memoryCached
    }

    // 2. Check database cache (fast, cross-user)
    const dbCached = await MuscleWikiCacheService.getFromDatabase(exerciseName)
    if (dbCached) {
      const exercise = MuscleWikiCacheService.toMuscleWikiExercise(dbCached)
      // Populate memory cache
      this.memoryCache.exercises.set(normalizedName, exercise)
      console.log(`[MuscleWiki] Database cache hit for "${exerciseName}"`)
      return exercise
    }

    // 3. Fetch from API (expensive, avoid if possible)
    // Use request coalescing to prevent duplicate concurrent requests
    const pendingKey = normalizedName
    if (this.pendingRequests.has(pendingKey)) {
      console.log(`[MuscleWiki] Waiting for pending request for "${exerciseName}"`)
      return this.pendingRequests.get(pendingKey)!
    }

    const fetchPromise = this.fetchFromApi(exerciseName, normalizedName)
    this.pendingRequests.set(pendingKey, fetchPromise)

    try {
      const result = await fetchPromise
      return result
    } finally {
      this.pendingRequests.delete(pendingKey)
    }
  }

  /**
   * Fetch exercise from MuscleWiki API
   */
  private static async fetchFromApi(
    exerciseName: string,
    normalizedName: string
  ): Promise<MuscleWikiExercise | null> {
    console.log(`[MuscleWiki] Fetching from API: "${exerciseName}"`)

    try {
      // Wait for rate limit before making API call
      await this.waitForRateLimit()

      // Use search endpoint to find exercise by name
      const searchUrl = `${this.API_BASE}/search?q=${encodeURIComponent(exerciseName)}&limit=5`
      const response = await fetch(searchUrl, { headers: this.getHeaders() })

      if (!response.ok) {
        console.error(`[MuscleWiki] API error: ${response.status}`)
        return null
      }

      const data: MuscleWikiSearchResponse = await response.json()

      if (!data.results || data.results.length === 0) {
        console.log(`[MuscleWiki] No results found for "${exerciseName}"`)
        return null
      }

      // Find best match
      const bestMatch = this.findBestMatch(exerciseName, data.results)
      if (!bestMatch) {
        console.log(`[MuscleWiki] No suitable match for "${exerciseName}"`)
        return null
      }

      // Save to database cache (fire and forget)
      MuscleWikiCacheService.saveToDatabase(bestMatch).catch(() => {})

      // Save to memory cache
      this.memoryCache.exercises.set(normalizedName, bestMatch)
      this.memoryCache.exercises.set(this.normalizeName(bestMatch.name), bestMatch)

      console.log(`[MuscleWiki] Found and cached "${bestMatch.name}" for "${exerciseName}"`)
      return bestMatch
    } catch (error) {
      console.error(`[MuscleWiki] Failed to fetch "${exerciseName}":`, error)
      return null
    }
  }

  /**
   * Find best matching exercise from search results
   */
  private static findBestMatch(
    query: string,
    results: MuscleWikiExercise[]
  ): MuscleWikiExercise | null {
    const normalizedQuery = this.normalizeName(query)

    // Priority 1: Exact match
    const exactMatch = results.find(
      (r) => this.normalizeName(r.name) === normalizedQuery
    )
    if (exactMatch) return exactMatch

    // Priority 2: Name starts with query
    const startsWithMatch = results.find((r) =>
      this.normalizeName(r.name).startsWith(normalizedQuery)
    )
    if (startsWithMatch) return startsWithMatch

    // Priority 3: Query starts with name
    const queryStartsMatch = results.find((r) =>
      normalizedQuery.startsWith(this.normalizeName(r.name))
    )
    if (queryStartsMatch) return queryStartsMatch

    // Priority 4: Name contains query
    const containsMatch = results.find((r) =>
      this.normalizeName(r.name).includes(normalizedQuery)
    )
    if (containsMatch) return containsMatch

    // Priority 5: First result
    return results[0] || null
  }

  /**
   * Get videos for an exercise by name
   * Returns all available video angles/genders
   */
  static async getExerciseVideos(exerciseName: string): Promise<MuscleWikiVideo[] | null> {
    const exercise = await this.getExerciseByName(exerciseName)
    if (!exercise) return null
    return exercise.videos || null
  }

  /**
   * Get a specific video URL for an exercise
   */
  static async getVideoUrl(
    exerciseName: string,
    angle: VideoAngle = 'front',
    gender: VideoGender = 'male'
  ): Promise<string | null> {
    const videos = await this.getExerciseVideos(exerciseName)
    if (!videos || videos.length === 0) return null

    // Find video matching angle and gender
    const video = videos.find((v) => v.angle === angle && v.gender === gender)
    if (video) return video.url

    // Fallback: any video with same angle
    const angleMatch = videos.find((v) => v.angle === angle)
    if (angleMatch) return angleMatch.url

    // Fallback: first available video
    return videos[0]?.url || null
  }

  /**
   * Get all video URLs for an exercise organized by angle and gender
   */
  static async getVideosByAngle(
    exerciseName: string
  ): Promise<Record<VideoGender, Record<VideoAngle, string | null>> | null> {
    const videos = await this.getExerciseVideos(exerciseName)
    if (!videos || videos.length === 0) return null

    const result: Record<VideoGender, Record<VideoAngle, string | null>> = {
      male: { front: null, back: null, side: null },
      female: { front: null, back: null, side: null },
    }

    videos.forEach((video) => {
      if (result[video.gender] && video.angle in result[video.gender]) {
        result[video.gender][video.angle] = video.url
      }
    })

    return result
  }

  /**
   * Search exercises by query (uses API directly with result caching)
   */
  static async searchExercises(
    query: string,
    limit: number = 20,
    filters?: {
      muscles?: string[]
      equipment?: string[]
      difficulty?: string[]
      force?: string[]
    }
  ): Promise<MuscleWikiExercise[]> {
    if (!query || query.trim().length < 2) return []

    try {
      // Build query params
      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
      })

      if (filters?.muscles?.length) {
        params.set('muscles', filters.muscles.join(','))
      }
      if (filters?.equipment?.length) {
        params.set('category', filters.equipment.join(','))
      }
      if (filters?.difficulty?.length) {
        params.set('difficulty', filters.difficulty[0])
      }
      if (filters?.force?.length) {
        params.set('force', filters.force[0])
      }

      // Wait for rate limit before making API call
      await this.waitForRateLimit()

      const response = await fetch(`${this.API_BASE}/search?${params}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        console.error(`[MuscleWiki] Search API error: ${response.status}`)
        return []
      }

      const data: MuscleWikiSearchResponse = await response.json()
      const results = data.results || []

      // Cache all results in background (for future lookups)
      if (results.length > 0) {
        MuscleWikiCacheService.saveMultipleToDatabase(results).catch(() => {})

        // Also populate memory cache
        results.forEach((exercise) => {
          const normalizedName = this.normalizeName(exercise.name)
          this.memoryCache.exercises.set(normalizedName, exercise)
        })
      }

      return results
    } catch (error) {
      console.error('[MuscleWiki] Search error:', error)
      return []
    }
  }

  /**
   * Get multiple exercises at once (optimized batch lookup)
   */
  static async getMultipleExercises(
    exerciseNames: string[]
  ): Promise<Map<string, MuscleWikiExercise>> {
    const result = new Map<string, MuscleWikiExercise>()
    const toFetch: string[] = []

    // Check memory cache first
    for (const name of exerciseNames) {
      const normalizedName = this.normalizeName(name)
      const cached = this.memoryCache.exercises.get(normalizedName)
      if (cached) {
        result.set(normalizedName, cached)
      } else {
        toFetch.push(name)
      }
    }

    if (toFetch.length === 0) return result

    // Check database cache
    const dbCached = await MuscleWikiCacheService.getMultipleFromDatabase(toFetch)
    const stillToFetch: string[] = []

    for (const name of toFetch) {
      const normalizedName = this.normalizeName(name)
      const cached = dbCached.get(normalizedName)
      if (cached) {
        const exercise = MuscleWikiCacheService.toMuscleWikiExercise(cached)
        result.set(normalizedName, exercise)
        this.memoryCache.exercises.set(normalizedName, exercise)
      } else {
        stillToFetch.push(name)
      }
    }

    // Fetch remaining from API (in parallel, limited)
    if (stillToFetch.length > 0) {
      const batchSize = 5
      for (let i = 0; i < stillToFetch.length; i += batchSize) {
        const batch = stillToFetch.slice(i, i + batchSize)
        const promises = batch.map((name) => this.getExerciseByName(name))
        const exercises = await Promise.all(promises)

        exercises.forEach((exercise, idx) => {
          if (exercise) {
            const normalizedName = this.normalizeName(batch[idx])
            result.set(normalizedName, exercise)
          }
        })
      }
    }

    return result
  }

  /**
   * Get exercise by ID (fetches from API if needed)
   */
  static async getExerciseById(id: number): Promise<MuscleWikiExercise | null> {
    try {
      await this.waitForRateLimit()
      const response = await fetch(`${this.API_BASE}/exercises/${id}`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) return null

      const exercise: MuscleWikiExercise = await response.json()

      // Cache it
      const normalizedName = this.normalizeName(exercise.name)
      this.memoryCache.exercises.set(normalizedName, exercise)
      MuscleWikiCacheService.saveToDatabase(exercise).catch(() => {})

      return exercise
    } catch {
      return null
    }
  }

  /**
   * Get available muscle groups (from API metadata endpoint)
   */
  static async getMuscleGroups(): Promise<string[]> {
    try {
      await this.waitForRateLimit()
      const response = await fetch(`${this.API_BASE}/muscles`, {
        headers: this.getHeaders(),
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.map((m: { name: string }) => m.name)
    } catch {
      return []
    }
  }

  /**
   * Get available equipment categories (from API metadata endpoint)
   */
  static async getEquipmentCategories(): Promise<string[]> {
    try {
      await this.waitForRateLimit()
      const response = await fetch(`${this.API_BASE}/categories`, {
        headers: this.getHeaders(),
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.map((c: { name: string }) => c.name)
    } catch {
      return []
    }
  }

  /**
   * Check if exercise is in memory cache
   */
  static isInMemoryCache(exerciseName: string): boolean {
    const normalizedName = this.normalizeName(exerciseName)
    return this.memoryCache.exercises.has(normalizedName)
  }

  /**
   * Get memory cache statistics
   */
  static getMemoryCacheStats(): { exerciseCount: number } {
    return {
      exerciseCount: this.memoryCache.exercises.size,
    }
  }

  /**
   * Clear memory cache (for testing)
   */
  static clearMemoryCache(): void {
    this.memoryCache.exercises.clear()
  }

  // ===============================
  // Legacy Compatibility Methods
  // (For gradual migration from ExerciseDB)
  // ===============================

  /**
   * Convert MuscleWikiExercise to legacy ExerciseDB-compatible format
   */
  static toLegacyExercise(exercise: MuscleWikiExercise): LegacyExercise {
    const video = exercise.videos?.[0]
    return {
      id: String(exercise.id),
      name: exercise.name,
      gifUrl: video?.url || null,
      bodyPart: exercise.category || '',
      equipment: exercise.category || '',
      target: exercise.primary_muscles?.[0] || '',
      secondaryMuscles: exercise.primary_muscles?.slice(1) || [],
      instructions: exercise.steps || [],
    }
  }

  /**
   * Search exercises and return legacy format (ExerciseDB-compatible)
   * Used by components migrating from ExerciseDB
   */
  static async searchExercisesLegacy(
    query: string,
    limit: number = 20,
    filters?: {
      bodyParts?: string[]
      equipments?: string[]
      difficulty?: string[]
      force?: string[]
    }
  ): Promise<LegacyExercise[]> {
    const results = await this.searchExercises(query, limit, {
      muscles: filters?.bodyParts,
      equipment: filters?.equipments,
      difficulty: filters?.difficulty,
      force: filters?.force,
    })
    return results.map((ex) => this.toLegacyExercise(ex))
  }

  /**
   * Get filter options for search UI
   * Returns available body parts and equipment types
   */
  static async getFilterOptions(): Promise<{ bodyParts: string[]; equipments: string[] }> {
    try {
      const [muscles, categories] = await Promise.all([
        this.getMuscleGroups(),
        this.getEquipmentCategories(),
      ])

      return {
        bodyParts: muscles.length > 0 ? muscles : [
          'chest', 'back', 'shoulders', 'biceps', 'triceps',
          'forearms', 'abs', 'quads', 'hamstrings', 'glutes', 'calves'
        ],
        equipments: categories.length > 0 ? categories : [
          'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band'
        ],
      }
    } catch {
      // Return defaults if API fails
      return {
        bodyParts: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'quads', 'hamstrings', 'glutes', 'calves'],
        equipments: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band'],
      }
    }
  }

  /**
   * Get video/gif URL for an exercise by name
   * Legacy method for components that just need a URL
   */
  static async getGifUrl(exerciseName: string): Promise<string | null> {
    const exercise = await this.getExerciseByName(exerciseName)
    if (!exercise) return null
    return exercise.videos?.[0]?.url || null
  }

  /**
   * Get exercise in legacy format by name
   */
  static async getLegacyExercise(exerciseName: string): Promise<LegacyExercise | null> {
    const exercise = await this.getExerciseByName(exerciseName)
    if (!exercise) return null
    return this.toLegacyExercise(exercise)
  }
}
