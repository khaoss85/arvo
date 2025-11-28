'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import type { SportGoal } from '@/lib/types/schemas'

interface SportGoalSelectorProps {
  value: SportGoal | undefined
  onChange: (value: SportGoal) => void
  className?: string
}

const SPORT_GOALS: Array<{ value: SportGoal; icon: string }> = [
  { value: 'none', icon: '🎯' },
  { value: 'running', icon: '🏃' },
  { value: 'swimming', icon: '🏊' },
  { value: 'cycling', icon: '🚴' },
  { value: 'soccer', icon: '⚽' },
  { value: 'skiing', icon: '⛷️' },
  { value: 'hyrox', icon: '🏋️' },
  { value: 'triathlon', icon: '🏆' },
  { value: 'climbing', icon: '🧗' },
  { value: 'martial_arts', icon: '🥋' },
  { value: 'tennis', icon: '🎾' },
  { value: 'basketball', icon: '🏀' },
  { value: 'rowing', icon: '🚣' },
  { value: 'other', icon: '🏅' },
]

export function SportGoalSelector({
  value,
  onChange,
  className
}: SportGoalSelectorProps) {
  const t = useTranslations('onboarding.steps.approach.sportGoal')

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('title')}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({t('optional')})
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('description')}
      </p>
      <div className="flex flex-wrap gap-2">
        {SPORT_GOALS.map((goal) => (
          <button
            key={goal.value}
            type="button"
            onClick={() => onChange(goal.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
              'border',
              value === goal.value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
            )}
          >
            <span>{goal.icon}</span>
            <span>{t(`options.${goal.value}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
