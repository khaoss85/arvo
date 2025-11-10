'use client'

import type { TimelineDayData, VolumeComparison } from '@/lib/services/split-timeline.service'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import { cn } from '@/lib/utils/cn'

interface TimelineDayCardProps {
  dayData: TimelineDayData
  isCurrentDay: boolean
}

// Status styling configuration
const STATUS_STYLES = {
  completed: {
    border: 'border-green-300 dark:border-green-700',
    bg: 'bg-green-50 dark:bg-green-950/50',
    badgeBg: 'bg-green-500',
    badgeText: 'text-white',
    icon: '✓'
  },
  current: {
    border: 'border-purple-400 dark:border-purple-600',
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
    badgeBg: 'bg-purple-600 animate-pulse',
    badgeText: 'text-white',
    icon: '▶'
  },
  upcoming: {
    border: 'border-gray-200 dark:border-gray-700',
    bg: 'bg-white dark:bg-gray-900/50',
    badgeBg: 'bg-gray-400',
    badgeText: 'text-white',
    icon: '○'
  },
  rest: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    icon: '☾'
  }
} as const

// Variance indicator component
function VarianceIndicator({ variance }: { variance: VolumeComparison }) {
  const { diff, percentage } = variance

  if (diff === 0) {
    return (
      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
        ±0 ✓
      </span>
    )
  }

  const isPositive = diff > 0
  const color = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
  const icon = isPositive ? '↑' : '↓'
  const sign = isPositive ? '+' : ''

  return (
    <span className={cn('text-xs font-semibold', color)}>
      {sign}{diff} {icon}
      {Math.abs(percentage) >= 25 && (
        <span className="ml-1">({sign}{percentage}%)</span>
      )}
    </span>
  )
}

export function TimelineDayCard({ dayData, isCurrentDay }: TimelineDayCardProps) {
  const { day, status, session, completedWorkout } = dayData
  const styles = STATUS_STYLES[status]

  // Rest day layout
  if (!session) {
    return (
      <div
        className={cn(
          'flex-shrink-0 w-[280px] rounded-lg border-2 p-4 transition-all',
          styles.border,
          styles.bg
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Day {day}
          </span>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-bold',
            styles.badgeBg,
            styles.badgeText
          )}>
            Rest {styles.icon}
          </span>
        </div>

        {/* Rest day content */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">💤</span>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            Rest Day
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recovery is essential for muscle growth
          </p>
        </div>
      </div>
    )
  }

  const workoutTypeIcon = getWorkoutTypeIcon(session.workoutType)

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[280px] rounded-lg border-2 p-4 transition-all',
        styles.border,
        styles.bg,
        isCurrentDay && 'shadow-lg ring-2 ring-purple-400 dark:ring-purple-600'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Day {day}
        </span>
        <div className="flex items-center gap-2">
          {session.variation && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              {session.variation}
            </span>
          )}
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-bold',
            styles.badgeBg,
            styles.badgeText
          )}>
            {status === 'current' ? 'Current' : status === 'completed' ? 'Done' : 'Upcoming'} {styles.icon}
          </span>
        </div>
      </div>

      {/* Session name and type */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{workoutTypeIcon}</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {session.name}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {session.workoutType.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Target Volume */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Target Volume:
        </p>
        <div className="space-y-1.5">
          {Object.entries(session.targetVolume).slice(0, 4).map(([muscle, sets]) => (
            <div
              key={muscle}
              className="flex items-center justify-between text-sm bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {muscle}
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {sets} sets
              </span>
            </div>
          ))}
          {Object.keys(session.targetVolume).length > 4 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-2">
              +{Object.keys(session.targetVolume).length - 4} more
            </p>
          )}
        </div>
      </div>

      {/* Actual Performance (only for completed workouts) */}
      {completedWorkout && completedWorkout.variance && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Actual Performance:
          </p>
          <div className="space-y-1.5">
            {Object.entries(completedWorkout.variance).slice(0, 4).map(([muscle, variance]) => (
              <div
                key={muscle}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {muscle}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {variance.actual} sets
                  </span>
                  <VarianceIndicator variance={variance} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
