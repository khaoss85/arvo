'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { updatePreferredSplitAction } from '@/app/actions/ai-actions'
import type { SplitType } from '@/lib/services/muscle-groups.service'
import { Card } from '@/components/ui/card'

interface SplitOption {
  type: SplitType
  days: number
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    type: 'push_pull_legs',
    days: 3,
  },
  {
    type: 'upper_lower',
    days: 2,
  },
  {
    type: 'full_body',
    days: 1,
  },
  {
    type: 'bro_split',
    days: 5,
  },
  {
    type: 'weak_point_focus',
    days: 4,
  },
]

interface SplitSelectorProps {
  userId: string
  currentSplit?: string | null
}

export function SplitSelector({ userId, currentSplit }: SplitSelectorProps) {
  const t = useTranslations('settings.splitSelector')
  const [selectedSplit, setSelectedSplit] = useState<SplitType>(
    (currentSplit as SplitType) || 'push_pull_legs'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSplitChange = async (splitType: SplitType) => {
    setSelectedSplit(splitType)
    setIsLoading(true)
    setMessage(null)

    const result = await updatePreferredSplitAction(userId, splitType)

    setIsLoading(false)

    if (result.success) {
      setMessage({ type: 'success', text: t('success') })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error || t('error') })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SPLIT_OPTIONS.map((option) => (
          <Card
            key={option.type}
            className={`p-4 cursor-pointer transition-all ${
              selectedSplit === option.type
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-accent'
            }`}
            onClick={() => handleSplitChange(option.type)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{t(`splits.${option.type}.name`)}</h4>
                {selectedSplit === option.type && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{t(`splits.${option.type}.description`)}</p>

              <div className="pt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{t('rotation')}:</span>
                  <span className="text-muted-foreground">{t('days', { count: option.days })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{t('sequence')}:</span>
                  <span className="text-muted-foreground">{t(`splits.${option.type}.schedule`)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {t('updating')}
        </div>
      )}
    </div>
  )
}
