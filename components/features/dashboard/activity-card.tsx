'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import type { Activity, ActivityType } from '@/lib/types/activity.types'
import {
  isWorkoutCompletedActivity,
  isCycleCompletedActivity,
  isSplitModifiedActivity,
  isOnboardingCompletedActivity,
  isFirstWorkoutCompletedActivity,
  isProgressCheckMilestoneActivity,
} from '@/lib/types/activity.types'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import { getRelativeTime, formatDuration } from '@/lib/utils/date-helpers'
import { cn } from '@/lib/utils/cn'
import { Clock, Weight, Layers, Target, Camera } from 'lucide-react'
import { ShareButton } from '@/components/features/sharing/share-button'

interface ActivityCardProps {
  activity: Activity
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

// Activity type icons
const ACTIVITY_ICONS: Record<ActivityType, string> = {
  workout_completed: '💪',
  cycle_completed: '🎯',
  split_modified: '⚙️',
  onboarding_completed: '🎉',
  first_workout_completed: '🏆',
  progress_check_milestone: '📸',
}

// Activity type colors for badges
const ACTIVITY_COLORS: Record<ActivityType, { bg: string; text: string; border: string }> = {
  workout_completed: {
    bg: 'bg-blue-100 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  cycle_completed: {
    bg: 'bg-purple-100 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
  },
  split_modified: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  onboarding_completed: {
    bg: 'bg-green-100 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
  first_workout_completed: {
    bg: 'bg-pink-100 dark:bg-pink-950',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-700',
  },
  progress_check_milestone: {
    bg: 'bg-teal-100 dark:bg-teal-950',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
  },
}

export function ActivityCard({ activity, className }: ActivityCardProps) {
  const t = useTranslations('dashboard.activityFeed')
  const tWorkout = useTranslations('dashboard.workoutCard')
  const locale = useLocale() as 'en' | 'it'

  const relativeTime = getRelativeTime(new Date(activity.timestamp), locale)
  const colors = ACTIVITY_COLORS[activity.type]

  // Workout Completed Activity
  if (isWorkoutCompletedActivity(activity)) {
    const { workoutId, workoutName, workoutType, totalVolume, durationSeconds, totalSets, mentalReadiness } =
      activity.data
    const workoutIcon = workoutType ? getWorkoutTypeIcon(workoutType) : ACTIVITY_ICONS.workout_completed
    const duration = durationSeconds ? formatDuration(durationSeconds, locale) : null
    const volume = totalVolume ? Math.round(totalVolume) : null
    const mentalEmoji = mentalReadiness ? MENTAL_READINESS_EMOJI[mentalReadiness] : null

    return (
      <Link
        href={`/workout/${workoutId}/recap`}
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
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl" role="img" aria-label="workout">
              {workoutIcon}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {workoutName}
              </h3>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  colors.bg,
                  colors.text,
                  'border',
                  colors.border
                )}
              >
                {t('types.workout_completed')}
              </span>
            </div>
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {relativeTime}
          </time>
        </div>

        <div className="flex items-center gap-4 mb-2">
          {volume !== null && (
            <div className="flex items-center gap-1.5">
              <Weight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {volume.toLocaleString(locale)} {tWorkout('kg')}
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
          {totalSets !== null && (
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {totalSets} {tWorkout('sets')}
              </span>
            </div>
          )}
        </div>

        {mentalEmoji && mentalReadiness && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-lg" role="img" aria-label="mental state">
              {mentalEmoji}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {tWorkout(`mentalReadiness.${mentalReadiness}`)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div onClick={(e) => e.preventDefault()}>
            <ShareButton
              shareType="workout"
              entityId={workoutId}
              variant="ghost"
              size="sm"
              iconOnly
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {tWorkout('viewRecap')} →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Cycle Completed Activity
  if (isCycleCompletedActivity(activity)) {
    const { cycleNumber, totalVolume, totalWorkouts, avgMentalReadiness, totalSets } = activity.data
    const volume = Math.round(totalVolume)
    const mentalEmoji = avgMentalReadiness ? MENTAL_READINESS_EMOJI[Math.round(avgMentalReadiness)] : null

    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl" role="img" aria-label="cycle milestone">
              {ACTIVITY_ICONS.cycle_completed}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('cycleCompleted.title', { number: cycleNumber })}
              </h3>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  colors.bg,
                  colors.text,
                  'border',
                  colors.border
                )}
              >
                {t('types.cycle_completed')}
              </span>
            </div>
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {relativeTime}
          </time>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Weight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {volume.toLocaleString(locale)} {tWorkout('kg')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {totalWorkouts} {t('cycleCompleted.workouts')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {totalSets} {tWorkout('sets')}
            </span>
          </div>
        </div>

        {mentalEmoji && avgMentalReadiness && (
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-lg" role="img" aria-label="average mental state">
              {mentalEmoji}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('cycleCompleted.avgMentalReadiness')}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Split Modified Activity
  if (isSplitModifiedActivity(activity)) {
    const { modificationType } = activity.data

    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl" role="img" aria-label="split modified">
              {ACTIVITY_ICONS.split_modified}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('splitModified.title')}
              </h3>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  colors.bg,
                  colors.text,
                  'border',
                  colors.border
                )}
              >
                {t(`splitModified.types.${modificationType}`)}
              </span>
            </div>
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {relativeTime}
          </time>
        </div>
      </div>
    )
  }

  // Onboarding Completed Activity
  if (isOnboardingCompletedActivity(activity)) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl" role="img" aria-label="onboarding completed">
              {ACTIVITY_ICONS.onboarding_completed}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('onboardingCompleted.title')}
              </h3>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  colors.bg,
                  colors.text,
                  'border',
                  colors.border
                )}
              >
                {t('types.onboarding_completed')}
              </span>
            </div>
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {relativeTime}
          </time>
        </div>
      </div>
    )
  }

  // First Workout Completed Activity
  if (isFirstWorkoutCompletedActivity(activity)) {
    const { workoutName } = activity.data

    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700',
          'rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl" role="img" aria-label="first workout completed">
              {ACTIVITY_ICONS.first_workout_completed}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('firstWorkoutCompleted.title')}
              </h3>
              {workoutName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{workoutName}</p>
              )}
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded mt-1',
                  colors.bg,
                  colors.text,
                  'border',
                  colors.border
                )}
              >
                {t('types.first_workout_completed')}
              </span>
            </div>
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {relativeTime}
          </time>
        </div>
      </div>
    )
  }

  // Progress Check Milestone Activity
  if (isProgressCheckMilestoneActivity(activity)) {
    const { checkId, cycleNumber, cycleDay, weight, photoCount, hasMeasurements } = activity.data

    return (
      <div className={cn('rounded-lg border p-4', colors.border, colors.bg, className)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">📸</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('progressCheckMilestone.title')}
              </h3>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
                {t(`types.progress_check_milestone`)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {relativeTime}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {t('progressCheckMilestone.photos', { count: photoCount })}
                </span>
              </div>
              {weight && (
                <div className="flex items-center gap-1.5">
                  <Weight className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('progressCheckMilestone.weight', { weight })}
                  </span>
                </div>
              )}
              {cycleNumber && cycleDay && (
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('progressCheckMilestone.cycleDay', { cycle: cycleNumber, day: cycleDay })}
                  </span>
                </div>
              )}
              {hasMeasurements && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('progressCheckMilestone.withMeasurements')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (should never happen)
  return null
}
