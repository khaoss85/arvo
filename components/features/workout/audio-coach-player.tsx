'use client'

import { Volume2, Pause, Play, SkipForward, X } from 'lucide-react'
import { useAudioCoaching } from '@/lib/hooks/use-audio-coaching'

/**
 * AudioCoachPlayer
 *
 * Floating mini player that shows current audio coaching playback status.
 * Provides controls to pause/resume, skip, and stop audio.
 * Only visible when audio is playing or paused.
 */
export function AudioCoachPlayer() {
  const {
    isPlaying,
    isPaused,
    currentScript,
    queueLength,
    pause,
    resume,
    skip,
    stop,
    isSupported,
  } = useAudioCoaching()

  // Don't render if audio is not supported or no audio is active
  if (!isSupported || (!isPlaying && !isPaused)) {
    return null
  }

  const getScriptTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      workout_intro: 'Workout Intro',
      exercise_transition: 'Exercise Transition',
      pre_set: 'Set Guidance',
      rest_countdown: 'Rest Countdown',
      workout_end: 'Workout Complete',
    }
    return labels[type] || 'Audio Coaching'
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-gradient-to-r from-blue-900/95 to-indigo-900/95 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-blue-700/50">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Icon + Script Type */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Volume2
                className={`w-5 h-5 text-blue-300 flex-shrink-0 ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white truncate">
                  {currentScript ? getScriptTypeLabel(currentScript.type) : 'Audio Coaching'}
                </span>
                {queueLength > 0 && (
                  <span className="text-xs text-blue-200">
                    {queueLength} more in queue
                  </span>
                )}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? pause : resume}
                className="p-2 hover:bg-blue-800/50 rounded-full transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>

              {/* Skip */}
              <button
                onClick={skip}
                className="p-2 hover:bg-blue-800/50 rounded-full transition-colors"
                aria-label="Skip"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>

              {/* Stop */}
              <button
                onClick={stop}
                className="p-2 hover:bg-red-800/50 rounded-full transition-colors"
                aria-label="Stop"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
