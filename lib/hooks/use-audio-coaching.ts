/**
 * useAudioCoaching Hook
 *
 * React hook for managing audio coaching playback during workouts.
 * Provides access to AudioCoachingService with React state management.
 */

import { useEffect, useState, useCallback } from 'react'
import {
  audioCoachingService,
  AudioScript,
  PlaybackState,
  AudioCoachingSettings,
} from '@/lib/services/audio-coaching.service'

interface UseAudioCoachingReturn {
  // State
  isPlaying: boolean
  isPaused: boolean
  isIdle: boolean
  currentScript: AudioScript | null
  queueLength: number
  settings: AudioCoachingSettings
  isSupported: boolean

  // Actions
  play: (script: AudioScript) => void
  playMany: (scripts: AudioScript[]) => void
  pause: () => void
  resume: () => void
  stop: () => void
  skip: () => void
  clearQueue: () => void
  updateSettings: (settings: Partial<AudioCoachingSettings>) => void

  // Utility
  preloadVoices: () => Promise<SpeechSynthesisVoice[]>
}

/**
 * Hook for audio coaching playback
 *
 * @example
 * ```tsx
 * const { play, isPlaying, settings } = useAudioCoaching()
 *
 * const handlePlayGuidance = () => {
 *   play({
 *     id: 'set-1',
 *     type: 'pre_set',
 *     text: 'Set 1. Tempo: 3-1-1-1. Focus on control.',
 *     priority: 5
 *   })
 * }
 * ```
 */
export function useAudioCoaching(): UseAudioCoachingReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [currentScript, setCurrentScript] = useState<AudioScript | null>(null)
  const [queueLength, setQueueLength] = useState(0)
  const [settings, setSettings] = useState<AudioCoachingSettings>(
    audioCoachingService.getSettings()
  )

  // Subscribe to playback state changes
  useEffect(() => {
    const unsubscribe = audioCoachingService.onStateChange((newState) => {
      setPlaybackState(newState)
      setCurrentScript(audioCoachingService.getCurrentScript())
      setQueueLength(audioCoachingService.getQueueLength())
    })

    // Preload voices on mount (some browsers need this)
    audioCoachingService.preloadVoices()

    return unsubscribe
  }, [])

  // Sync settings from service
  useEffect(() => {
    const syncSettings = () => {
      setSettings(audioCoachingService.getSettings())
    }
    syncSettings()
  }, [])

  const play = useCallback((script: AudioScript) => {
    audioCoachingService.playImmediate(script)
  }, [])

  const playMany = useCallback((scripts: AudioScript[]) => {
    audioCoachingService.enqueueMany(scripts)
  }, [])

  const pause = useCallback(() => {
    audioCoachingService.pause()
  }, [])

  const resume = useCallback(() => {
    audioCoachingService.resume()
  }, [])

  const stop = useCallback(() => {
    audioCoachingService.stop()
  }, [])

  const skip = useCallback(() => {
    audioCoachingService.skip()
  }, [])

  const clearQueue = useCallback(() => {
    audioCoachingService.clearQueue()
  }, [])

  const updateSettings = useCallback((newSettings: Partial<AudioCoachingSettings>) => {
    audioCoachingService.updateSettings(newSettings)
    setSettings(audioCoachingService.getSettings())
  }, [])

  const preloadVoices = useCallback(() => {
    return audioCoachingService.preloadVoices()
  }, [])

  return {
    // State
    isPlaying: playbackState === 'playing',
    isPaused: playbackState === 'paused',
    isIdle: playbackState === 'idle',
    currentScript,
    queueLength,
    settings,
    isSupported: audioCoachingService.isSupported(),

    // Actions
    play,
    playMany,
    pause,
    resume,
    stop,
    skip,
    clearQueue,
    updateSettings,

    // Utility
    preloadVoices,
  }
}
