'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import type { Workout } from '@/lib/types/schemas'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import { getRelativeTime, formatDuration } from '@/lib/utils/date-helpers'
import { cn } from '@/lib/utils/cn'
import { Clock, Weight, Layers } from 'lucide-react'

interface RecentWorkoutCardProps {
  workout: Workout
  className?: string
}

// Mental readiness emoji mapping
const MENTAL_READINESS_EMOJI: Record<number, string> = {
  1: '😫', // Exhausted
  2: '😓', // Tired
  3: '😐', // Okay
  4: '😊', // Good
  5: '😎', // Great
}

// Workout type badge colors
const WORKOUT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  push: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  pull: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  legs: { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  upper: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  lower: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  full_body: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  chest: { bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
  back: { bg: 'bg-teal-100 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
  shoulders: { bg: 'bg-pink-100 dark:bg-pink-950', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
  arms: { bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
}

export function RecentWorkoutCard({ workout, className }: RecentWorkoutCardProps) {
  const t = useTranslations('dashboard.workoutCard')
  const locale = useLocale() as 'en' | 'it'

  // Extract data
  const workoutIcon = workout.workout_type ? getWorkoutTypeIcon(workout.workout_type) : '💪'
  const workoutName = workout.workout_name || t('unnamedWorkout')
  const completedDate = workout.completed_at ? new Date(workout.completed_at) : null
  const relativeTime = completedDate ? getRelativeTime(completedDate, locale) : ''
  const duration = workout.duration_seconds ? formatDuration(workout.duration_seconds, locale) : null
  const volume = workout.total_volume ? Math.round(workout.total_volume) : null
  const sets = workout.total_sets || null
  const mentalReadiness = workout.mental_readiness_overall
  const mentalEmoji = mentalReadiness ? MENTAL_READINESS_EMOJI[mentalReadiness] : null

  // Get workout type colors
  const typeColors = workout.workout_type
    ? WORKOUT_TYPE_COLORS[workout.workout_type] || WORKOUT_TYPE_COLORS.push
    : WORKOUT_TYPE_COLORS.push

  return (
    <Link
      href={`/workout/${workout.id}/recap`}
      className={cn(
        'block group',
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg p-4',
        'hover:border-gray-300 dark:hover:border-gray-600',
        'hover:shadow-md dark:hover:shadow-gray-950/50',
        'transition-all duration-200',
        'active:scale-[0.98]',
        className
      )}
    >
      {/* Header: Icon, Name, and Time */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl" role="img" aria-label={workout.workout_type || 'workout'}>
            {workoutIcon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {workoutName}
            </h3>
            {workout.workout_type && (
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  typeColors.bg,
                  typeColors.text,
                  'border',
                  typeColors.border
                )}
              >
                {t(workout.workout_type)}
              </span>
            )}
          </div>
        </div>
        <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
          {relativeTime}
        </time>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center gap-4 mb-2">
        {volume !== null && (
          <div className="flex items-center gap-1.5">
            <Weight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {volume.toLocaleString(locale)} {t('kg')}
            </span>
          </div>
        )}

        {duration && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {duration}
            </span>
          </div>
        )}

        {sets !== null && (
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {sets} {t('sets')}
            </span>
          </div>
        )}
      </div>

      {/* Mental Readiness */}
      {mentalEmoji && mentalReadiness && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-lg" role="img" aria-label="mental state">
            {mentalEmoji}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t(`mentalReadiness.${mentalReadiness}`)}
          </span>
        </div>
      )}

      {/* Hover indicator */}
      <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {t('viewRecap')} →
        </span>
      </div>
    </Link>
  )
}
