'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimationService, type ExerciseAnimationResult } from '@/lib/services/animation.service'
import type { MuscleWikiVideo, VideoAngle, VideoGender } from '@/lib/services/musclewiki.service'

interface UseExerciseVideoOptions {
  exerciseName: string
  canonicalPattern?: string
  equipmentVariant?: string
  preferredAngle?: VideoAngle
  preferredGender?: VideoGender
  enabled?: boolean
}

interface UseExerciseVideoResult {
  url: string | null
  videos: MuscleWikiVideo[] | null
  source: 'musclewiki' | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch exercise video/animation URL
 * Uses MuscleWiki for multi-angle videos with lazy loading and database caching
 */
export function useExerciseVideo({
  exerciseName,
  canonicalPattern,
  equipmentVariant,
  preferredAngle = 'front',
  preferredGender = 'male',
  enabled = true,
}: UseExerciseVideoOptions): UseExerciseVideoResult {
  const [result, setResult] = useState<ExerciseAnimationResult>({
    url: null,
    videos: null,
    source: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideo = useCallback(async () => {
    if (!exerciseName || !enabled) {
      setResult({ url: null, videos: null, source: null })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const animationResult = await AnimationService.getAnimation(
        {
          name: exerciseName,
          canonicalPattern,
          equipmentVariant,
        },
        preferredAngle,
        preferredGender
      )

      setResult(animationResult)
    } catch (err) {
      console.error('[useExerciseVideo] Error fetching video:', err)
      setError(err instanceof Error ? err.message : 'Failed to load video')
      setResult({ url: null, videos: null, source: null })
    } finally {
      setIsLoading(false)
    }
  }, [exerciseName, canonicalPattern, equipmentVariant, preferredAngle, preferredGender, enabled])

  useEffect(() => {
    fetchVideo()
  }, [fetchVideo])

  return {
    ...result,
    isLoading,
    error,
    refetch: fetchVideo,
  }
}

/**
 * Hook to fetch all video angles for an exercise (MuscleWiki only)
 */
export function useExerciseVideos(
  exerciseName: string,
  options?: {
    canonicalPattern?: string
    equipmentVariant?: string
    enabled?: boolean
  }
): {
  videos: MuscleWikiVideo[] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
} {
  const [videos, setVideos] = useState<MuscleWikiVideo[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { canonicalPattern, equipmentVariant, enabled = true } = options || {}

  const fetchVideos = useCallback(async () => {
    if (!exerciseName || !enabled) {
      setVideos(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await AnimationService.getExerciseVideos({
        name: exerciseName,
        canonicalPattern,
        equipmentVariant,
      })

      setVideos(result)
    } catch (err) {
      console.error('[useExerciseVideos] Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
      setVideos(null)
    } finally {
      setIsLoading(false)
    }
  }, [exerciseName, canonicalPattern, equipmentVariant, enabled])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return {
    videos,
    isLoading,
    error,
    refetch: fetchVideos,
  }
}
