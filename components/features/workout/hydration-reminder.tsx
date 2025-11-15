'use client'

import { useTranslations } from 'next-intl'
import { Droplet, AlertTriangle, X } from 'lucide-react'
import type { HydrationOutput } from '@/lib/types/hydration'

interface HydrationReminderProps {
  suggestion: HydrationOutput
  onDismiss: () => void
  className?: string
}

/**
 * AI-powered hydration reminder component
 * Adapts messaging based on exercise type (normal vs heavy compound legs)
 * Based on ACSM guidelines and bodybuilding best practices
 */
export function HydrationReminder({
  suggestion,
  onDismiss,
  className = ''
}: HydrationReminderProps) {
  const t = useTranslations('workout.components.hydrationTips')

  if (!suggestion.shouldSuggest) {
    return null
  }

  // Message type styling (normal vs smallSipsOnly for compound legs)
  const messageTypeColors = {
    normal: 'border-blue-500/30 bg-blue-500/10',
    smallSipsOnly: 'border-amber-500/30 bg-amber-500/10'
  }

  const messageTypeTextColors = {
    normal: 'text-blue-300',
    smallSipsOnly: 'text-amber-300'
  }

  const messageTypeIconColors = {
    normal: 'text-blue-400',
    smallSipsOnly: 'text-amber-400'
  }

  // Urgency-based border intensity
  const urgencyBorder = {
    normal: '',
    important: 'border-2',
    critical: 'border-2 shadow-lg'
  }

  // Select icon based on message type
  const Icon = suggestion.messageType === 'smallSipsOnly' ? AlertTriangle : Droplet

  return (
    <div
      className={`
        relative flex flex-col gap-3 p-4 rounded-lg border
        ${messageTypeColors[suggestion.messageType]}
        ${urgencyBorder[suggestion.urgency]}
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
          ${messageTypeColors[suggestion.messageType]}
          border ${messageTypeColors[suggestion.messageType]}
        `}>
          <Icon className={`w-5 h-5 ${messageTypeIconColors[suggestion.messageType]}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${messageTypeTextColors[suggestion.messageType]}`}>
            {suggestion.messageType === 'normal' ? t('title') : t('titleSmallSips')}
          </h3>
          <p className="text-xs text-gray-300 mt-1">
            {suggestion.reason}
          </p>
          {suggestion.waterAmount && (
            <p className={`text-xs font-medium mt-2 ${messageTypeTextColors[suggestion.messageType]}`}>
              {suggestion.messageType === 'normal'
                ? t('recommendedAmount', { amount: suggestion.waterAmount })
                : t('smallSipsAmount', { amount: suggestion.waterAmount })
              }
            </p>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onDismiss}
          className={`
            flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
            ${messageTypeTextColors[suggestion.messageType]}
            ${messageTypeColors[suggestion.messageType]}
            border ${messageTypeColors[suggestion.messageType]}
            hover:bg-white/5 active:bg-white/10
            transition-colors touch-manipulation
            min-h-[44px]
          `}
        >
          {t('alreadyHydrated')}
        </button>
      </div>
    </div>
  )
}
