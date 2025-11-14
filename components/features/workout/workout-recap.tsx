'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Calendar, Clock, Dumbbell, Heart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import type { Workout } from '@/lib/types/schemas'
import { formatDuration } from '@/lib/utils/workout-helpers'
import { getExerciseName } from '@/lib/utils/exercise-helpers'

interface WorkoutRecapProps {
  workout: Workout
  totalVolume: number
  userId: string
  modifications?: {
    warmupSetsSkipped: number
    workingSetsSkipped: number
    totalSetsSkipped: number
    exercisesSubstituted: number
    substitutions: Array<{
      originalExercise: string
      newExercise: string
      reason: string | null
    }>
  }
}

// Mental readiness emoji mapping - labels will be translated
const MENTAL_READINESS_EMOJIS: Record<number, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '🔥',
}

export function WorkoutRecap({ workout, totalVolume, userId, modifications }: WorkoutRecapProps) {
  const router = useRouter()
  const t = useTranslations('workout.components.workoutRecap')
  const tExecution = useTranslations('workout.execution.mentalReadiness')

  const exercises = (workout.exercises as any[]) || []
  const workoutTypeIcon = workout.workout_type ? getWorkoutTypeIcon(workout.workout_type) : '💪'
  const mentalReadiness = workout.mental_readiness_overall || null

  // Calculate total sets
  const totalSets = exercises.reduce((sum, ex) => {
    const completedSets = ex.completedSets || ex.sets || []
    return sum + (Array.isArray(completedSets) ? completedSets.length : 0)
  }, 0)

  // Format date
  const completedDate = workout.completed_at
    ? new Date(workout.completed_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : t('stats.unknownDate')

  // Format duration
  const duration = workout.duration_seconds
    ? formatDuration(workout.duration_seconds)
    : t('stats.na')

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>

          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{workoutTypeIcon}</span>
              <div>
                <h1 className="text-3xl font-bold">
                  {workout.workout_name || workout.workout_type?.toUpperCase() || t('workout')}
                </h1>
                <p className="text-green-100 text-sm">{t('completedWorkout')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Date */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              <span>{t('stats.date')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {completedDate}
            </p>
          </div>

          {/* Duration */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>{t('stats.duration')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{duration}</p>
          </div>

          {/* Volume */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>{t('stats.volume')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalVolume.toLocaleString()} kg
            </p>
          </div>

          {/* Sets */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>{t('stats.totalSets')}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalSets}</p>
          </div>
        </div>

        {/* Workout Modifications */}
        {(() => {
          try {
            // Defensive checks for modifications data
            if (!modifications) return null

            const hasSkippedSets = typeof modifications.totalSetsSkipped === 'number' && modifications.totalSetsSkipped > 0
            const hasSubstitutions = typeof modifications.exercisesSubstituted === 'number' && modifications.exercisesSubstituted > 0

            if (!hasSkippedSets && !hasSubstitutions) return null

            return (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800 mb-6">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
                  {t('modifications.title')}
                </h3>
                <div className="space-y-2">
                  {hasSkippedSets && (
                    <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                      <span className="text-base">⚠️</span>
                      <span>
                        {t('modifications.setsSkipped', {
                          count: modifications.totalSetsSkipped,
                          warmup: modifications.warmupSetsSkipped || 0,
                          working: modifications.workingSetsSkipped || 0
                        })}
                      </span>
                    </div>
                  )}
                  {hasSubstitutions && (
                    <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                      <span className="text-base">🔄</span>
                      <span>
                        {t('modifications.exercisesSubstituted', { count: modifications.exercisesSubstituted })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          } catch (error) {
            // Gracefully fail - don't show modifications section if there's an error
            console.error('[WorkoutRecap] Error rendering modifications:', error)
            return null
          }
        })()}

        {/* Mental Readiness */}
        {mentalReadiness && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('mentalState.title')}</h2>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-5xl">{MENTAL_READINESS_EMOJIS[mentalReadiness]}</span>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {tExecution(mentalReadiness === 1 ? 'drained' : mentalReadiness === 2 ? 'struggling' : mentalReadiness === 3 ? 'neutral' : mentalReadiness === 4 ? 'engaged' : 'lockedIn')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('mentalState.readiness', { value: mentalReadiness })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Muscle Groups */}
        {workout.target_muscle_groups && workout.target_muscle_groups.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('muscleGroups.title')}</h2>
            <div className="flex flex-wrap gap-2">
              {workout.target_muscle_groups.map((group, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('exercises.titleWithCount', { count: exercises.length })}
          </h2>
          <div className="space-y-4">
            {exercises.map((exercise, idx) => {
              const completedSets = exercise.completedSets || exercise.sets || []
              const setCount = Array.isArray(completedSets) ? completedSets.length : 0

              return (
                <div
                  key={idx}
                  className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {getExerciseName(exercise) === 'Unknown Exercise' ? t('exercises.title') : getExerciseName(exercise)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {setCount} {t('exercises.sets', { count: setCount })}
                    </span>
                  </div>

                  {/* Sets */}
                  {Array.isArray(completedSets) && completedSets.length > 0 && (
                    <div className="space-y-1">
                      {completedSets.map((set: any, setIdx: number) => (
                        <div
                          key={setIdx}
                          className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span className="font-medium w-16">{t('exercises.set', { number: setIdx + 1 })}</span>
                          <span className="w-20">
                            {set.weight || set.actualWeight || 0} kg
                          </span>
                          <span className="w-20">
                            {set.reps || set.actualReps || 0} {t('exercises.reps')}
                          </span>
                          {set.rir !== undefined && set.rir !== null && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {t('exercises.rir', { value: set.rir })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        {workout.notes && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('notes.title')}</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{workout.notes}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Button>

          <Button
            onClick={() => router.push('/progress')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t('buttons.viewProgress')}
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
