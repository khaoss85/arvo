/**
 * MuscleWiki Cache Service
 * Handles database caching of MuscleWiki exercise data for cross-user benefit
 * Reduces API calls by storing fetched exercises in Supabase
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { MuscleWikiExercise, MuscleWikiVideo } from './musclewiki.service'

export interface CachedExercise {
  id: string
  musclewiki_id: number | null
  name: string
  name_normalized: string
  category: string | null
  difficulty: string | null
  mechanic: string | null
  force: string | null
  primary_muscles: string[]
  grips: string[]
  steps: string[]
  videos: MuscleWikiVideo[]
  fetched_at: string
  access_count: number
}

export class MuscleWikiCacheService {
  private static readonly CACHE_TTL_DAYS = 30

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
   * Check if a cached entry is stale (older than TTL)
   */
  static isStale(fetchedAt: string | Date): boolean {
    const fetchDate = new Date(fetchedAt)
    const now = new Date()
    const diffDays = (now.getTime() - fetchDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays > this.CACHE_TTL_DAYS
  }

  /**
   * Get a single exercise from the database cache
   */
  static async getFromDatabase(exerciseName: string): Promise<CachedExercise | null> {
    try {
      const supabase = getSupabaseBrowserClient()
      const normalizedName = this.normalizeName(exerciseName)

      const { data, error } = await supabase
        .from('musclewiki_exercise_cache')
        .select('*')
        .eq('name_normalized', normalizedName)
        .single()

      if (error || !data) {
        return null
      }

      // Check if stale
      if (!data.fetched_at || this.isStale(data.fetched_at)) {
        console.log(`[MuscleWikiCache] Cache stale for "${exerciseName}", needs refresh`)
        return null // Return null to trigger API fetch
      }

      // Increment access count in background (fire and forget)
      this.incrementAccessCount(data.id).catch(() => {})

      return data as unknown as CachedExercise
    } catch (error) {
      console.error('[MuscleWikiCache] Error fetching from database:', error)
      return null
    }
  }

  /**
   * Get multiple exercises from the database cache
   * Optimized for batch lookups (e.g., loading a workout)
   */
  static async getMultipleFromDatabase(
    exerciseNames: string[]
  ): Promise<Map<string, CachedExercise>> {
    const result = new Map<string, CachedExercise>()

    if (exerciseNames.length === 0) return result

    try {
      const supabase = getSupabaseBrowserClient()
      const normalizedNames = exerciseNames.map((n) => this.normalizeName(n))

      const { data, error } = await supabase
        .from('musclewiki_exercise_cache')
        .select('*')
        .in('name_normalized', normalizedNames)

      if (error || !data) {
        return result
      }

      for (const exercise of data) {
        // Skip stale entries
        if (exercise.fetched_at && !this.isStale(exercise.fetched_at)) {
          result.set(exercise.name_normalized, exercise as unknown as CachedExercise)
        }
      }

      return result
    } catch (error) {
      console.error('[MuscleWikiCache] Error fetching multiple from database:', error)
      return result
    }
  }

  /**
   * Save an exercise to the database cache (upsert)
   */
  static async saveToDatabase(exercise: MuscleWikiExercise): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()
      const normalizedName = this.normalizeName(exercise.name)

      const cacheEntry = {
        musclewiki_id: exercise.id,
        name: exercise.name,
        name_normalized: normalizedName,
        category: exercise.category || null,
        difficulty: exercise.difficulty || null,
        mechanic: exercise.mechanic || null,
        force: exercise.force || null,
        primary_muscles: exercise.primary_muscles || [],
        grips: exercise.grips || [],
        steps: exercise.steps || [],
        videos: exercise.videos || [],
        fetched_at: new Date().toISOString(),
        access_count: 1,
      }

      const { error } = await supabase.from('musclewiki_exercise_cache').upsert(cacheEntry as any, {
        onConflict: 'name_normalized',
        ignoreDuplicates: false,
      })

      if (error) {
        console.error('[MuscleWikiCache] Error saving to database:', error)
      } else {
        console.log(`[MuscleWikiCache] Saved "${exercise.name}" to database cache`)
      }
    } catch (error) {
      console.error('[MuscleWikiCache] Error saving to database:', error)
    }
  }

  /**
   * Save multiple exercises to the database cache
   */
  static async saveMultipleToDatabase(exercises: MuscleWikiExercise[]): Promise<void> {
    if (exercises.length === 0) return

    try {
      const supabase = getSupabaseBrowserClient()

      const cacheEntries = exercises.map((exercise) => ({
        musclewiki_id: exercise.id,
        name: exercise.name,
        name_normalized: this.normalizeName(exercise.name),
        category: exercise.category || null,
        difficulty: exercise.difficulty || null,
        mechanic: exercise.mechanic || null,
        force: exercise.force || null,
        primary_muscles: exercise.primary_muscles || [],
        grips: exercise.grips || [],
        steps: exercise.steps || [],
        videos: exercise.videos || [],
        fetched_at: new Date().toISOString(),
        access_count: 1,
      }))

      const { error } = await supabase.from('musclewiki_exercise_cache').upsert(cacheEntries as any, {
        onConflict: 'name_normalized',
        ignoreDuplicates: false,
      })

      if (error) {
        console.error('[MuscleWikiCache] Error batch saving to database:', error)
      } else {
        console.log(`[MuscleWikiCache] Saved ${exercises.length} exercises to database cache`)
      }
    } catch (error) {
      console.error('[MuscleWikiCache] Error batch saving to database:', error)
    }
  }

  /**
   * Increment access count for analytics/popularity tracking
   */
  static async incrementAccessCount(id: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Use simple update instead of RPC for compatibility
      const { data } = await supabase
        .from('musclewiki_exercise_cache')
        .select('access_count')
        .eq('id', id)
        .single()

      if (data) {
        await supabase
          .from('musclewiki_exercise_cache')
          .update({ access_count: (data.access_count || 0) + 1 })
          .eq('id', id)
      }
    } catch {
      // Silently fail - this is non-critical
    }
  }

  /**
   * Convert cached exercise to MuscleWikiExercise format
   */
  static toMuscleWikiExercise(cached: CachedExercise): MuscleWikiExercise {
    return {
      id: cached.musclewiki_id || 0,
      name: cached.name,
      category: cached.category || '',
      difficulty: cached.difficulty as 'Novice' | 'Intermediate' | 'Advanced' | null,
      mechanic: cached.mechanic as 'Isolation' | 'Compound' | null,
      force: cached.force as 'Push' | 'Pull' | 'Static' | null,
      primary_muscles: cached.primary_muscles,
      grips: cached.grips,
      steps: cached.steps,
      videos: cached.videos,
    }
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  static async getCacheStats(): Promise<{
    totalCached: number
    staleCount: number
    mostAccessed: { name: string; count: number }[]
  }> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get total count
      const { count: totalCached } = await supabase
        .from('musclewiki_exercise_cache')
        .select('*', { count: 'exact', head: true })

      // Get most accessed
      const { data: mostAccessed } = await supabase
        .from('musclewiki_exercise_cache')
        .select('name, access_count')
        .order('access_count', { ascending: false })
        .limit(10)

      return {
        totalCached: totalCached || 0,
        staleCount: 0, // Would need separate query
        mostAccessed: (mostAccessed || []).map((e) => ({ name: e.name, count: e.access_count || 0 })),
      }
    } catch {
      return { totalCached: 0, staleCount: 0, mostAccessed: [] }
    }
  }
}
