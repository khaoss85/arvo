/**
 * ExerciseDB API Integration Service
 * Provides exercise GIF URLs from ExerciseDB API
 * Supports both self-hosted and RapidAPI versions
 */

interface ExerciseDBExercise {
  id: string
  name: string
  gifUrl: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

interface ExerciseDBCache {
  exercises: Map<string, ExerciseDBExercise>
  lastFetch: number
}

export class ExerciseDBService {
  private static cache: ExerciseDBCache = {
    exercises: new Map(),
    lastFetch: 0,
  }

  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private static readonly API_BASE =
    process.env.NEXT_PUBLIC_EXERCISEDB_API_URL || 'https://exercisedb.p.rapidapi.com'

  /**
   * Initialize cache by fetching all exercises
   * Call this on app initialization or first use
   */
  static async initializeCache(): Promise<void> {
    const now = Date.now()

    // Use cache if fresh
    if (this.cache.exercises.size > 0 && now - this.cache.lastFetch < this.CACHE_TTL) {
      console.log(`[ExerciseDB] Using cached ${this.cache.exercises.size} exercises`)
      return
    }

    try {
      console.log('[ExerciseDB] Fetching exercises from API...')

      let allExercises: ExerciseDBExercise[] = []

      // Self-hosted API requires pagination (max 100 per page)
      if (this.API_BASE.includes('vercel.app')) {
        const pageSize = 100
        let offset = 0
        let hasMore = true

        while (hasMore) {
          const endpoint = `${this.API_BASE}/api/v1/exercises?limit=${pageSize}&offset=${offset}`
          const response = await fetch(endpoint, {
            headers: this.getHeaders(),
          })

          if (!response.ok) {
            throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText}`)
          }

          const responseData = await response.json()
          const exercises = responseData.data || []
          allExercises.push(...exercises)

          // Check if there are more pages
          const totalExercises = responseData.metadata?.totalExercises || 0
          hasMore = allExercises.length < totalExercises

          if (hasMore) {
            offset += pageSize
            console.log(`[ExerciseDB] Fetched ${allExercises.length}/${totalExercises} exercises...`)
          }
        }
      } else {
        // RapidAPI format: single request for all exercises
        const endpoint = `${this.API_BASE}/exercises`
        const response = await fetch(endpoint, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText}`)
        }

        allExercises = await response.json()
      }

      // Build cache map
      this.cache.exercises.clear()
      allExercises.forEach((exercise) => {
        // Store by normalized name for easy lookup
        const normalizedName = this.normalizeName(exercise.name)
        this.cache.exercises.set(normalizedName, exercise)
      })

      this.cache.lastFetch = now

      console.log(`[ExerciseDB] Cached ${allExercises.length} exercises`)
    } catch (error) {
      console.error('[ExerciseDB] Failed to initialize cache:', error)
      // Don't throw - gracefully degrade to no animations
    }
  }

  /**
   * Get GIF URL for an exercise
   * Returns null if not found (graceful degradation)
   */
  static async getGifUrl(exerciseName: string): Promise<string | null> {
    // Ensure cache is initialized
    if (this.cache.exercises.size === 0) {
      await this.initializeCache()
    }

    // Try exact match first
    const normalizedName = this.normalizeName(exerciseName)
    const exercise = this.cache.exercises.get(normalizedName)

    if (exercise?.gifUrl) {
      console.log(`[ExerciseDB] Found exact match for "${exerciseName}"`)
      return exercise.gifUrl
    }

    // Try fuzzy match (e.g., "flat barbell bench press" → "barbell bench press")
    const fuzzyMatch = this.fuzzyMatch(normalizedName)
    if (fuzzyMatch?.gifUrl) {
      console.log(`[ExerciseDB] Found fuzzy match for "${exerciseName}" → "${fuzzyMatch.name}"`)
      return fuzzyMatch.gifUrl
    }

    // No match found - graceful degradation
    console.warn(`[ExerciseDB] No animation found for "${exerciseName}"`)
    return null
  }

  /**
   * Normalize exercise name for matching
   */
  private static normalizeName(name: string): string {
    if (!name || typeof name !== 'string') {
      return ''
    }

    const normalized = (
      name
        .toLowerCase()
        .trim()
        // Remove parenthetical content (e.g., "(Supinated)", "(Torso-Supported)")
        .replace(/\s*\([^)]*\)/g, '')
        // Remove common prefixes - CONSERVATIVE: only flat and standing
        // Keep important prefixes like "incline", "decline", "seated" that affect exercise selection
        .replace(/^(flat|standing)\s+/i, '')
        // Remove tempo/pause suffixes
        .replace(/\s+-\s+.*$/, '')
        // Remove paused/tempo patterns
        .replace(/\s+paused\s+\d+s?\s+(at|on)\s+\w+/i, '')
        .replace(/\s+\d+-\d+-\d+-\d+/i, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
    )

    // Apply common exercise name variation mappings
    // Maps AI-generated names to ExerciseDB canonical names
    const nameVariations: Record<string, string> = {
      // Squat variations
      'back squat': 'barbell squat',
      'barbell back squat': 'barbell squat',
      'high bar squat': 'barbell squat',
      'low bar squat': 'barbell squat',
      'high-bar squat': 'barbell squat',
      'low-bar squat': 'barbell squat',

      // Bench press variations
      'flat bench press': 'barbell bench press',
      'bench press': 'barbell bench press',

      // Deadlift variations
      'conventional deadlift': 'barbell deadlift',

      // Row variations
      'bent over row': 'barbell bent over row',
      'bent-over row': 'barbell bent over row',

      // Add more mappings as needed based on ExerciseDB content
    }

    // Apply mapping if exists
    return nameVariations[normalized] || normalized
  }

  /**
   * Fuzzy match exercise name
   */
  private static fuzzyMatch(normalizedName: string): ExerciseDBExercise | null {
    // Try removing equipment prefix/suffix variations
    const variations = [
      normalizedName,
      normalizedName.replace(/^(barbell|dumbbell|cable|machine|smith|bodyweight|band)\s+/i, ''),
      normalizedName.replace(/\s+(barbell|dumbbell|cable|machine|smith|bodyweight|band)$/i, ''),
    ]

    for (const variation of variations) {
      // Check for exact match on variation
      const exact = this.cache.exercises.get(variation)
      if (exact) {
        return exact
      }

      // Check for partial match
      for (const [key, exercise] of Array.from(this.cache.exercises.entries())) {
        // Match if variation is contained in key or vice versa
        if (
          (key.length > 5 && variation.includes(key)) ||
          (variation.length > 5 && key.includes(variation))
        ) {
          return exercise
        }
      }
    }

    return null
  }

  /**
   * Get API headers
   */
  private static getHeaders(): HeadersInit {
    const apiKey = process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY

    if (!apiKey) {
      // Fallback to self-hosted API (no auth needed)
      return {
        'Content-Type': 'application/json',
      }
    }

    // RapidAPI headers
    return {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    }
  }

  /**
   * Prefetch exercises for a workout
   * Useful for preloading GIFs
   */
  static async prefetchExercises(exerciseNames: string[]): Promise<void> {
    await this.initializeCache()

    // Get GIF URLs
    const gifUrls = await Promise.all(exerciseNames.map((name) => this.getGifUrl(name)))

    // Preload GIF images (browser will cache automatically)
    gifUrls
      .filter((url): url is string => url !== null)
      .forEach((gifUrl) => {
        const img = new Image()
        img.src = gifUrl
      })

    console.log(`[ExerciseDB] Prefetched ${gifUrls.filter(Boolean).length} GIFs`)
  }

  /**
   * Get exercise details (for future use)
   */
  static async getExercise(exerciseName: string): Promise<ExerciseDBExercise | null> {
    await this.initializeCache()

    const normalizedName = this.normalizeName(exerciseName)
    return this.cache.exercises.get(normalizedName) || this.fuzzyMatch(normalizedName)
  }

  /**
   * Clear cache (for testing)
   */
  static clearCache(): void {
    this.cache.exercises.clear()
    this.cache.lastFetch = 0
    console.log('[ExerciseDB] Cache cleared')
  }
}
