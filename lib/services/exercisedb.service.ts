/**
 * ExerciseDB API Integration Service
 * Provides exercise GIF URLs from ExerciseDB API
 * Supports both self-hosted and RapidAPI versions
 * Includes semantic search via embeddings for improved matching
 */

import { EmbeddingService } from './embedding.service'
import { EmbeddingStorage } from '../utils/embedding-storage'
import { generateQueryEmbedding } from '@/app/actions/embedding-actions'

export interface ExerciseDBExercise {
  id: string
  name: string
  gifUrl: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
  embedding?: number[] // Semantic search embedding (optional, generated on-demand)
}

interface ExerciseDBCache {
  exercises: Map<string, ExerciseDBExercise> // Indexed by normalized name for lookup
  allExercises: ExerciseDBExercise[] // Full array for search (no collisions)
  lastFetch: number
  embeddingsGenerated: boolean // Track if embeddings are available
}

export class ExerciseDBService {
  private static cache: ExerciseDBCache = {
    exercises: new Map(),
    allExercises: [],
    lastFetch: 0,
    embeddingsGenerated: false,
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
          // Normalize self-hosted API response to expected format
          const normalizedExercises = exercises.map((ex: any) => this.normalizeApiResponse(ex))
          allExercises.push(...normalizedExercises)

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

      // Build cache map and array
      this.cache.exercises.clear()
      this.cache.allExercises = [] // Reset array

      allExercises.forEach((exercise) => {
        // Store in array for search (preserves ALL exercises)
        this.cache.allExercises.push(exercise)

        // Store by normalized name for lookup (may have collisions, but that's ok for lookup)
        const normalizedName = this.normalizeName(exercise.name)
        this.cache.exercises.set(normalizedName, exercise)
      })

      this.cache.lastFetch = now

      console.log(`[ExerciseDB] Cached ${allExercises.length} exercises (${this.cache.exercises.size} unique normalized names)`)

      // Debug: Log sample exercises to verify content
      const sampleExercises = Array.from(this.cache.exercises.keys()).slice(0, 10)
      console.log(`[ExerciseDB] Sample exercises:`, sampleExercises)

      // Debug: Check for specific exercises
      const hasChestFly = this.debugSearchSync('chest fly')
      const hasPecFly = this.debugSearchSync('pec fly')
      const hasTricepsPushdown = this.debugSearchSync('triceps pushdown')
      console.log(`[ExerciseDB] Contains chest fly: ${hasChestFly.length > 0} (${hasChestFly.length} matches)`)
      console.log(`[ExerciseDB] Contains pec fly: ${hasPecFly.length > 0} (${hasPecFly.length} matches)`)
      console.log(`[ExerciseDB] Contains triceps pushdown: ${hasTricepsPushdown.length > 0} (${hasTricepsPushdown.length} matches)`)

      // Generate embeddings for semantic search (async, non-blocking)
      this.generateEmbeddings().catch((error) => {
        console.warn('[ExerciseDB] Failed to generate embeddings:', error)
        // Graceful degradation - semantic search won't be available
      })
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
    // Safety check: handle undefined/null/empty exercise names
    if (!exerciseName) {
      console.warn('[ExerciseDB] getGifUrl called with empty/undefined exerciseName')
      return null
    }

    // Ensure cache is initialized
    if (this.cache.exercises.size === 0) {
      await this.initializeCache()
    }

    // Filter out movement patterns (e.g., "horizontal_push", "vertical_pull")
    // These are metadata/classifications, not exercise names
    const movementPatterns = [
      'horizontal_push',
      'vertical_push',
      'horizontal_pull',
      'vertical_pull',
      'squat_pattern',
      'hinge_pattern',
      'lunge_pattern',
      'carry_pattern',
      'rotation_pattern',
    ]

    const lowerName = exerciseName.toLowerCase()
    if (
      movementPatterns.includes(lowerName) ||
      lowerName.includes('_push') ||
      lowerName.includes('_pull') ||
      lowerName.includes('_pattern')
    ) {
      console.warn(`[ExerciseDB] Skipping movement pattern: "${exerciseName}"`)
      return null
    }

    // Try exact match first
    const normalizedName = this.normalizeName(exerciseName)
    const exercise = this.cache.exercises.get(normalizedName)

    if (exercise?.gifUrl) {
      console.log(`[ExerciseDB] ✓ Found exact match for "${exerciseName}"`)
      return exercise.gifUrl
    }

    // Try fuzzy match (e.g., "flat barbell bench press" → "barbell bench press")
    const fuzzyMatch = this.fuzzyMatch(normalizedName)
    if (fuzzyMatch?.gifUrl) {
      console.log(`[ExerciseDB] ✓ Found fuzzy match for "${exerciseName}" → "${fuzzyMatch.name}"`)
      return fuzzyMatch.gifUrl
    }

    // Try semantic search as last resort (if embeddings available)
    if (this.cache.embeddingsGenerated) {
      const semanticMatch = await this.semanticSearch(normalizedName)
      if (semanticMatch?.gifUrl) {
        console.log(`[ExerciseDB] ✓ Found via semantic search for "${exerciseName}" → "${semanticMatch.name}"`)
        return semanticMatch.gifUrl
      }
    }

    // No match found - provide detailed debugging info
    console.warn(`[ExerciseDB] ✗ No animation found for "${exerciseName}"`)
    console.log(`  Tried: normalized="${normalizedName}"`)

    // Suggest similar exercises
    const suggestions = this.findSimilarExercises(normalizedName, 3)
    if (suggestions.length > 0) {
      console.log(`  Suggestions: ${suggestions.map((s) => `"${s}"`).join(', ')}`)
    }

    return null
  }

  /**
   * Normalize self-hosted API response to expected format
   * Self-hosted API returns: exerciseId, targetMuscles[], bodyParts[], equipments[]
   * Expected format: id, target, bodyPart, equipment
   */
  private static normalizeApiResponse(ex: any): ExerciseDBExercise {
    return {
      id: ex.exerciseId || ex.id || '',
      name: ex.name || '',
      gifUrl: ex.gifUrl || '',
      target: Array.isArray(ex.targetMuscles) ? ex.targetMuscles[0] || '' : (ex.target || ''),
      bodyPart: Array.isArray(ex.bodyParts) ? ex.bodyParts[0] || '' : (ex.bodyPart || ''),
      equipment: Array.isArray(ex.equipments) ? ex.equipments[0] || '' : (ex.equipment || ''),
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
    }
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
        // Remove descriptive prefixes with em dash or regular dash
        .replace(/^(optional\s+)?(finisher|warm-?up|cool-?down|bonus|activation)\s*[—\-]\s*/i, '')
        // Remove common prefixes - CONSERVATIVE: only flat and standing
        // Keep important prefixes like "incline", "decline", "seated" that affect exercise selection
        .replace(/^(flat|standing)\s+/i, '')
        // Remove tempo/pause suffixes
        .replace(/\s+-\s+.*$/, '')
        // Remove paused/tempo patterns
        .replace(/\s+paused\s+\d+s?\s+(at|on)\s+\w+/i, '')
        .replace(/\s+\d+-\d+-\d+-\d+/i, '')
        // Normalize em dash to space
        .replace(/—/g, ' ')
        // Normalize slash to space (e.g., "pec deck / chest fly" → "pec deck chest fly")
        .replace(/\s*\/\s*/g, ' ')
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
      'bulgarian split squat': 'dumbbell single leg split squat',

      // Bench press variations
      'flat bench press': 'barbell bench press',
      'bench press': 'barbell bench press',

      // Deadlift variations
      'conventional deadlift': 'barbell deadlift',

      // Row variations
      'bent over row': 'barbell bent over row',
      'bent-over row': 'barbell bent over row',
      'barbell row': 'barbell bent over row',
      't bar row': 'leverage t bar row',
      'landmine t bar row': 'leverage t bar row',
      'chest supported t bar row': 'leverage t bar row',
      'dumbbell row': 'dumbbell one arm row',
      'cable row': 'cable seated row',
      'seated cable row': 'cable seated row',
      'chest supported row machine': 'lever seated row',
      'chest-supported row machine': 'lever seated row',
      'chest supported row': 'lever seated row',
      'chest-supported row': 'lever seated row',

      // Chest fly variations
      'cable pec fly': 'cable chest fly',
      'pec fly': 'chest fly',
      'pec deck': 'lever seated fly',  // Fixed: was 'pec deck fly' (doesn't exist)
      'pec deck fly': 'lever seated fly',
      'pec fly machine': 'lever seated fly',
      'chest fly machine': 'lever seated fly',
      'pec deck machine': 'lever seated fly',
      'pec deck machine fly': 'lever seated fly',
      'pec fly pec deck': 'lever seated fly',
      'seated pec fly': 'lever seated fly',
      'seated chest fly machine': 'lever seated fly',
      'cable fly': 'cable chest fly',

      // Curl variations
      'incline dumbbell curl': 'dumbbell incline curl',
      'dumbbell curl': 'dumbbell biceps curl',

      // Face pull / rear delt fly variations
      // ExerciseDB has "cable standing rear delt row (with rope)" as the canonical name
      'cable face pull': 'cable standing rear delt row (with rope)',
      'face pull': 'cable standing rear delt row (with rope)',
      'cable rear delt fly': 'cable standing rear delt row (with rope)',
      'rear delt fly': 'cable standing rear delt row (with rope)',
      'cable rear delt fly cross-over style': 'cable standing rear delt row (with rope)',
      'cable rear delt fly cross over style': 'cable standing rear delt row (with rope)',

      // Triceps pushdown variations
      'rope triceps pushdown': 'cable triceps pushdown',
      'rope pushdown': 'cable triceps pushdown',
      'triceps rope pushdown': 'cable triceps pushdown',
      'pushdown': 'cable triceps pushdown',
      'tricep pushdown': 'cable triceps pushdown',

      // EZ-bar triceps extension variations
      'ez bar skullcrusher': 'ez barbell lying triceps extension',
      'ez-bar skullcrusher': 'ez barbell lying triceps extension',
      'ez bar skull crusher': 'ez barbell lying triceps extension',
      'ez-bar skull crusher': 'ez barbell lying triceps extension',
      'ez bar lying skullcrusher': 'ez barbell lying triceps extension',
      'ez-bar lying skullcrusher': 'ez barbell lying triceps extension',
      'ez bar lying triceps extension': 'ez barbell lying triceps extension',
      'ez-bar lying triceps extension': 'ez barbell lying triceps extension',
      'skullcrusher': 'lying triceps extension',
      'skull crusher': 'lying triceps extension',
      'lying skullcrusher': 'lying triceps extension',

      // EZ-bar curl variations
      'ez bar curl': 'ez barbell curl',
      'ez-bar curl': 'ez barbell curl',
      'ez bar bicep curl': 'ez barbell curl',
      'ez-bar bicep curl': 'ez barbell curl',
      'ez bar preacher curl': 'ez barbell preacher curl',
      'ez-bar preacher curl': 'ez barbell preacher curl',
      'ez bar close grip curl': 'ez barbell close grip curl',
      'ez-bar close grip curl': 'ez barbell close grip curl',
      'ez bar spider curl': 'ez barbell spider curl',
      'ez-bar spider curl': 'ez barbell spider curl',

      // Trap bar variations
      'trap bar deadlift': 'trap bar deadlift',
      'hex bar deadlift': 'trap bar deadlift',

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
    // Expanded to include compound equipment names like "ez bar", "t bar", "trap bar"
    const equipmentList = [
      'barbell',
      'dumbbell',
      'cable',
      'machine',
      'smith',
      'bodyweight',
      'band',
      'ez bar',
      'ez-bar',
      'ez barbell',
      't bar',
      't-bar',
      'trap bar',
      'hex bar',
      'landmine',
      'kettlebell',
      'resistance band',
      'suspension',
    ].join('|')

    const variations = [
      normalizedName,
      normalizedName.replace(new RegExp(`^(${equipmentList})\\s+`, 'i'), ''),
      normalizedName.replace(new RegExp(`\\s+(${equipmentList})$`, 'i'), ''),
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
   * Load embeddings from static file
   * Embeddings are pre-generated via scripts/generate-embeddings.ts
   */
  private static async generateEmbeddings(): Promise<void> {
    try {
      // Load embeddings from static file
      const cachedData = await EmbeddingStorage.loadEmbeddings()

      if (!cachedData || cachedData.embeddings.size === 0) {
        console.warn('[ExerciseDB] ⚠️  Embeddings file not found or empty')
        console.warn('[ExerciseDB] Semantic search will be unavailable')
        console.warn('[ExerciseDB] To enable semantic search, run: npm run generate:embeddings')
        this.cache.embeddingsGenerated = false
        return
      }

      // Apply embeddings to exercises in memory
      let matchedCount = 0
      cachedData.embeddings.forEach((embedding, exerciseName) => {
        const exercise = this.cache.exercises.get(exerciseName)
        if (exercise) {
          exercise.embedding = embedding
          matchedCount++
        }
      })

      this.cache.embeddingsGenerated = true
      console.log(
        `[ExerciseDB] ✓ Loaded ${cachedData.embeddings.size} embeddings (${matchedCount} matched current exercises)`
      )

      // Warn if mismatch in counts (might indicate outdated embeddings file)
      if (matchedCount < cachedData.embeddings.size * 0.9) {
        console.warn(
          `[ExerciseDB] ⚠️  Only ${matchedCount}/${cachedData.embeddings.size} embeddings matched`
        )
        console.warn('[ExerciseDB] Consider regenerating: npm run generate:embeddings')
      }
    } catch (error) {
      console.error('[ExerciseDB] Failed to load embeddings:', error)
      // Graceful degradation - semantic search won't be available
      this.cache.embeddingsGenerated = false
    }
  }

  /**
   * Semantic search using embeddings
   * Returns best matching exercise if similarity > threshold
   */
  private static async semanticSearch(
    normalizedName: string,
    threshold: number = 0.70
  ): Promise<ExerciseDBExercise | null> {
    // Check if embeddings are available
    if (!this.cache.embeddingsGenerated) {
      console.log('[ExerciseDB] Semantic search not available (embeddings not generated)')
      return null
    }

    try {
      // Generate embedding for query (server-side for security)
      console.log(`[ExerciseDB] Generating query embedding for: "${normalizedName}"`)
      const queryEmbedding = await generateQueryEmbedding(normalizedName)

      if (!queryEmbedding) {
        console.warn('[ExerciseDB] ⚠️  Failed to generate query embedding (server action returned null)')
        return null
      }

      console.log('[ExerciseDB] ✓ Query embedding generated, calculating similarities...')

      // Calculate similarities with all exercises
      const candidates: Array<{ exercise: ExerciseDBExercise; similarity: number }> = []

      this.cache.exercises.forEach((exercise) => {
        if (exercise.embedding) {
          const similarity = EmbeddingService.cosineSimilarity(
            queryEmbedding,
            exercise.embedding
          )
          candidates.push({ exercise, similarity })
        }
      })

      // Sort by similarity (descending)
      candidates.sort((a, b) => b.similarity - a.similarity)

      // Return best match if above threshold
      if (candidates.length > 0 && candidates[0].similarity >= threshold) {
        const match = candidates[0]
        console.log(
          `[ExerciseDB] ✓ Semantic match: "${normalizedName}" → "${match.exercise.name}" (similarity: ${match.similarity.toFixed(3)})`
        )

        // Log top 3 candidates for debugging
        const top3 = candidates.slice(0, 3).map((c) => `"${c.exercise.name}" (${c.similarity.toFixed(3)})`)
        console.log(`  Top matches: ${top3.join(', ')}`)

        return match.exercise
      }

      // Below threshold
      console.log(
        `[ExerciseDB] No semantic match above threshold ${threshold} (best: ${candidates[0]?.similarity.toFixed(3) || 'N/A'})`
      )
      return null
    } catch (error) {
      console.error('[ExerciseDB] Semantic search error:', error)
      console.error('[ExerciseDB] Query:', normalizedName)
      console.error(
        '[ExerciseDB] Error details:',
        error instanceof Error ? error.message : error
      )
      return null
    }
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
   * Find similar exercises to suggest when no match is found
   */
  private static findSimilarExercises(normalizedName: string, limit: number = 3): string[] {
    const words = normalizedName.split(/\s+/).filter((w) => w.length > 2) // Extract meaningful words
    const suggestions: Array<{ name: string; score: number }> = []

    // Score exercises based on word overlap
    this.cache.exercises.forEach((exercise, key) => {
      let score = 0

      // Check how many words from the search term appear in the exercise name
      words.forEach((word) => {
        if (key.includes(word)) {
          score += 1
        }
      })

      // Only include exercises with at least one matching word
      if (score > 0) {
        suggestions.push({ name: exercise.name, score })
      }
    })

    // Sort by score (descending) and return top N
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.name)
  }

  /**
   * Debug: Search cache synchronously for exercises matching a keyword
   * Used during initialization to verify database content
   */
  private static debugSearchSync(searchTerm: string): string[] {
    const matches: string[] = []
    const lowerSearch = searchTerm.toLowerCase()

    this.cache.exercises.forEach((exercise, key) => {
      if (
        key.includes(lowerSearch) ||
        exercise.name.toLowerCase().includes(lowerSearch)
      ) {
        matches.push(exercise.name)
      }
    })

    return matches
  }

  /**
   * Debug: Search cache for exercises (async version for external use)
   */
  static async debugSearch(searchTerm: string): Promise<string[]> {
    await this.initializeCache()
    return this.debugSearchSync(searchTerm)
  }

  /**
   * Common search aliases for gym equipment/machine names
   * Maps user-friendly terms to muscles and equipment separately
   * Muscles are prioritized in search, equipment is used as tiebreaker
   */
  private static readonly SEARCH_ALIASES: Record<string, { muscles: string[], keywords: string[] }> = {
    'lat machine': { muscles: ['lats'], keywords: ['lat pulldown', 'pulldown'] },
    'lat pulldown': { muscles: ['lats'], keywords: ['pulldown'] },
    'chest press': { muscles: ['pectorals', 'chest'], keywords: [] },
    'leg press': { muscles: ['quads'], keywords: ['sled'] },
    'shoulder press': { muscles: ['delts', 'shoulders'], keywords: [] },
    'row machine': { muscles: ['back', 'lats'], keywords: ['row'] },
    'curl machine': { muscles: ['biceps'], keywords: [] },
    'tricep machine': { muscles: ['triceps'], keywords: [] },
    'fly machine': { muscles: ['pectorals', 'chest'], keywords: ['pec deck', 'fly'] },
    'pec deck': { muscles: ['pectorals', 'chest'], keywords: ['fly'] },
    'leg curl': { muscles: ['hamstrings'], keywords: ['lever lying leg curl', 'lever seated leg curl', 'lever kneeling leg curl', 'inverse leg curl', 'lying leg curl', 'seated leg curl'] },
    'leg extension': { muscles: ['quads'], keywords: [] },
    'calf machine': { muscles: ['calves'], keywords: [] },
    'ab machine': { muscles: ['abs'], keywords: [] },
    'smith machine': { muscles: [], keywords: ['smith'] },
    'cable machine': { muscles: [], keywords: ['cable'] },
    'pull up': { muscles: ['lats', 'back'], keywords: ['pullup', 'pull-up'] },
    'push up': { muscles: ['pectorals', 'chest'], keywords: ['pushup', 'push-up'] },
  }

  /**
   * Search exercises for autocomplete/library mode
   * Returns full exercise objects matching the query
   * Priority: exact name match > all tokens in name > target muscle > keywords
   * Does NOT match by equipment alone (too generic)
   */
  static async searchExercises(query: string, limit: number = 20): Promise<ExerciseDBExercise[]> {
    if (!query || query.length < 2) return []

    await this.initializeCache()

    // Verify cache is populated
    if (this.cache.allExercises.length === 0) {
      console.warn('[ExerciseDB] Cache is empty, cannot search')
      return []
    }

    console.log(`[ExerciseDB] Searching "${query}" in ${this.cache.allExercises.length} exercises`)

    const normalizedQuery = query.toLowerCase().trim()

    // Tokenize query for multi-word searches (e.g., "leg curl" → ["leg", "curl"])
    const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length >= 2)

    // Find matching alias to get muscles and keywords
    let aliasMuscles: string[] = []
    let aliasKeywords: string[] = []
    for (const [alias, config] of Object.entries(this.SEARCH_ALIASES)) {
      if (normalizedQuery.includes(alias) || alias.includes(normalizedQuery)) {
        aliasMuscles = [...aliasMuscles, ...config.muscles]
        aliasKeywords = [...aliasKeywords, ...config.keywords]
        console.log(`[ExerciseDB] Matched alias "${alias}": muscles=${config.muscles.join(',')}, keywords=${config.keywords.length}`)
      }
    }

    const results: Array<{ exercise: ExerciseDBExercise; priority: number }> = []
    const seenIds = new Set<string>()

    // Use allExercises array to search ALL exercises
    for (const exercise of this.cache.allExercises) {
      // Skip duplicates
      if (exercise.id && seenIds.has(exercise.id)) continue

      const exerciseNameLower = exercise.name?.toLowerCase() ?? ''
      const targetLower = exercise.target?.toLowerCase() ?? ''
      const bodyPartLower = exercise.bodyPart?.toLowerCase() ?? ''

      let matched = false
      let bestPriority = 999

      // Priority 0: Name starts with the exact query
      if (exerciseNameLower.startsWith(normalizedQuery)) {
        matched = true
        bestPriority = 0
      }
      // Priority 1: Name contains the exact query
      else if (exerciseNameLower.includes(normalizedQuery)) {
        matched = true
        bestPriority = 1
      }
      // Priority 2: All tokens present in name (e.g., "lying leg curl" matches "leg curl")
      else if (queryTokens.length > 1) {
        const allTokensMatch = queryTokens.every(token => exerciseNameLower.includes(token))
        if (allTokensMatch) {
          matched = true
          bestPriority = 2
        }
      }

      // Priority 3: Target muscle matches alias muscles (e.g., "hamstrings" for "leg curl")
      if (!matched && aliasMuscles.length > 0) {
        const muscleMatch = aliasMuscles.some(muscle =>
          targetLower.includes(muscle) || bodyPartLower.includes(muscle)
        )
        if (muscleMatch) {
          matched = true
          bestPriority = 3
        }
      }

      // Priority 4: Name contains alias keywords (e.g., "pulldown" for "lat pulldown")
      if (!matched && aliasKeywords.length > 0) {
        const keywordMatch = aliasKeywords.some(keyword => exerciseNameLower.includes(keyword))
        if (keywordMatch) {
          matched = true
          bestPriority = 4
        }
      }

      // Priority 5: Secondary muscles match alias muscles
      if (!matched && aliasMuscles.length > 0) {
        const secondaryMatch = exercise.secondaryMuscles?.some(m =>
          aliasMuscles.some(muscle => m?.toLowerCase().includes(muscle))
        ) ?? false
        if (secondaryMatch) {
          matched = true
          bestPriority = 5
        }
      }

      if (matched) {
        if (exercise.id) seenIds.add(exercise.id)
        results.push({ exercise, priority: bestPriority })
        if (results.length >= limit * 3) break // Get extra for sorting
      }
    }

    // Sort by priority, then alphabetically
    results.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return a.exercise.name.localeCompare(b.exercise.name)
    })

    return results.slice(0, limit).map(r => r.exercise)
  }

  /**
   * Clear cache (for testing)
   */
  static clearCache(): void {
    this.cache.exercises.clear()
    this.cache.allExercises = []
    this.cache.lastFetch = 0
    console.log('[ExerciseDB] Cache cleared')
  }
}
