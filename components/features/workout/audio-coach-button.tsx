'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useAudioCoaching } from '@/lib/hooks/use-audio-coaching'
import type { AudioScript } from '@/lib/services/audio-coaching.service'

interface AudioCoachButtonProps {
  script: AudioScript
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'full'
  disabled?: boolean
  className?: string
}

/**
 * AudioCoachButton
 *
 * Button to play audio coaching scripts during workouts.
 * Shows loading state during playback and allows stopping/replaying.
 */
export function AudioCoachButton({
  script,
  size = 'md',
  variant = 'icon',
  disabled = false,
  className = '',
}: AudioCoachButtonProps) {
  const { play, stop, isPlaying, currentScript, isSupported } = useAudioCoaching()
  const [isThisScriptPlaying, setIsThisScriptPlaying] = useState(false)

  // Check if THIS specific script is playing
  useEffect(() => {
    setIsThisScriptPlaying(
      isPlaying && currentScript?.id === script.id
    )
  }, [isPlaying, currentScript, script.id])

  const handleClick = () => {
    if (isThisScriptPlaying) {
      // Stop if already playing this script
      stop()
    } else {
      // Play this script
      play(script)
    }
  }

  // Don't render if audio is not supported
  if (!isSupported) {
    return null
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`${sizeClasses[size]} hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={isThisScriptPlaying ? 'Stop audio coaching' : 'Play audio coaching'}
        aria-label={isThisScriptPlaying ? 'Stop audio coaching' : 'Play audio coaching'}
      >
        {isThisScriptPlaying ? (
          <VolumeX className={`${iconSizes[size]} text-blue-400 animate-pulse`} />
        ) : (
          <Volume2 className={`${iconSizes[size]} text-gray-400 hover:text-blue-400`} />
        )}
      </button>
    )
  }

  // Full variant with text
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${sizeClasses[size]} px-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={isThisScriptPlaying ? 'Stop audio coaching' : 'Play audio coaching'}
    >
      {isThisScriptPlaying ? (
        <>
          <VolumeX className={`${iconSizes[size]} text-blue-400`} />
          <span className="text-sm font-medium text-blue-300">Playing...</span>
        </>
      ) : (
        <>
          <Volume2 className={`${iconSizes[size]} text-gray-400`} />
          <span className="text-sm font-medium text-gray-300">Listen to Coach</span>
        </>
      )}
    </button>
  )
}
