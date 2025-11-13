'use client'

import { useTranslations } from 'next-intl'
import { Zap, X } from 'lucide-react'
import { useState } from 'react'
import type { WarmupSkipSuggestion } from '@/lib/utils/warmup-skip-intelligence'

interface WarmupSkipPromptProps {
  suggestion: WarmupSkipSuggestion
  warmupCount: number
  onSkip: () => void
  onDismiss: () => void
  className?: string
}

/**
 * Smart prompt component that suggests skipping warmup when appropriate
 * Only appears when AI determines it's safe and beneficial
 */
export function WarmupSkipPrompt({
  suggestion,
  warmupCount,
  onSkip,
  onDismiss,
  className = ''
}: WarmupSkipPromptProps) {
  const t = useTranslations('workout.components.warmupSkipPrompt')
  const [isSkipping, setIsSkipping] = useState(false)

  if (!suggestion.shouldSuggest) {
    return null
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      await onSkip()
    } catch (error) {
      console.error('Failed to skip warmup:', error)
      setIsSkipping(false)
    }
  }

  // Confidence-based styling
  const confidenceColors = {
    high: 'border-amber-500/30 bg-amber-500/10',
    medium: 'border-orange-500/30 bg-orange-500/10',
    low: 'border-yellow-500/30 bg-yellow-500/10'
  }

  const confidenceTextColors = {
    high: 'text-amber-300',
    medium: 'text-orange-300',
    low: 'text-yellow-300'
  }

  return (
    <div
      className={`
        relative flex flex-col gap-3 p-4 rounded-lg border
        ${confidenceColors[suggestion.confidence]}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 transition-colors"
        aria-label={t('dismiss')}
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      {/* Header with icon */}
      <div className="flex items-start gap-3 pr-6">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full
          ${confidenceColors[suggestion.confidence]}
          border ${confidenceColors[suggestion.confidence]}
        `}>
          <Zap className={`w-5 h-5 ${confidenceTextColors[suggestion.confidence]}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${confidenceTextColors[suggestion.confidence]}`}>
            {t('title')}
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            {suggestion.reason}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSkip}
          disabled={isSkipping}
          className={`
            flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
            ${confidenceTextColors[suggestion.confidence]}
            ${confidenceColors[suggestion.confidence]}
            border ${confidenceColors[suggestion.confidence]}
            hover:bg-white/5 active:bg-white/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors touch-manipulation
            min-h-[44px]
          `}
        >
          {isSkipping ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('skipping')}
            </span>
          ) : (
            t('skipButton', { count: warmupCount })
          )}
        </button>

        <button
          onClick={onDismiss}
          disabled={isSkipping}
          className="
            flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
            text-gray-300 bg-gray-700/50
            border border-gray-600/50
            hover:bg-gray-700 active:bg-gray-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors touch-manipulation
            min-h-[44px]
          "
        >
          {t('performWarmup')}
        </button>
      </div>
    </div>
  )
}
