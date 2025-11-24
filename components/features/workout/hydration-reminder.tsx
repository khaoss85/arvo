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
        relative flex items-center gap-2 px-3 py-2 rounded-lg border
        ${messageTypeColors[suggestion.messageType]}
        ${urgencyBorder[suggestion.urgency]}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon className={`w-4 h-4 flex-shrink-0 ${messageTypeIconColors[suggestion.messageType]}`} />

      {/* Content */}
      <div className="flex-1 min-w-0 mr-1">
        <span className={`text-xs font-medium ${messageTypeTextColors[suggestion.messageType]}`}>
          {suggestion.messageType === 'normal' ? t('title') : t('titleSmallSips')}
        </span>
        {suggestion.waterAmount && (
          <span className="text-[10px] text-gray-400 ml-1.5">
            ({suggestion.waterAmount})
          </span>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label={t('dismiss')}
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  )
}
