'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Dumbbell, Heart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import type { Workout } from '@/lib/types/schemas'
import { formatDuration } from '@/lib/utils/workout-helpers'

interface WorkoutRecapProps {
  workout: Workout
  totalVolume: number
  userId: string
}

// Mental readiness emoji mapping
const MENTAL_READINESS_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😫', label: 'Drained' },
  2: { emoji: '😕', label: 'Struggling' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '🙂', label: 'Engaged' },
  5: { emoji: '🔥', label: 'Locked In' },
}

export function WorkoutRecap({ workout, totalVolume, userId }: WorkoutRecapProps) {
  const router = useRouter()
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
    : 'Unknown date'

  // Format duration
  const duration = workout.duration_seconds
    ? formatDuration(workout.duration_seconds)
    : 'N/A'

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
            Back to Dashboard
          </Button>

          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{workoutTypeIcon}</span>
              <div>
                <h1 className="text-3xl font-bold">
                  {workout.workout_name || workout.workout_type?.toUpperCase() || 'Workout'}
                </h1>
                <p className="text-green-100 text-sm">Completed Workout</p>
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
              <span>Date</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {completedDate}
            </p>
          </div>

          {/* Duration */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>Duration</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{duration}</p>
          </div>

          {/* Volume */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Volume</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalVolume.toLocaleString()} kg
            </p>
          </div>

          {/* Sets */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Total Sets</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalSets}</p>
          </div>
        </div>

        {/* Mental Readiness */}
        {mentalReadiness && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mental State</h2>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-5xl">{MENTAL_READINESS_EMOJIS[mentalReadiness]?.emoji}</span>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {MENTAL_READINESS_EMOJIS[mentalReadiness]?.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mental readiness: {mentalReadiness}/5</p>
              </div>
            </div>
          </div>
        )}

        {/* Muscle Groups */}
        {workout.target_muscle_groups && workout.target_muscle_groups.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Muscle Groups</h2>
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
            Exercises ({exercises.length})
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
                      {exercise.name || exercise.exerciseName || exercise.exercise_name || 'Exercise'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {setCount} {setCount === 1 ? 'set' : 'sets'}
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
                          <span className="font-medium w-16">Set {setIdx + 1}</span>
                          <span className="w-20">
                            {set.weight || set.actualWeight || 0} kg
                          </span>
                          <span className="w-20">
                            {set.reps || set.actualReps || 0} reps
                          </span>
                          {set.rir !== undefined && set.rir !== null && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                              RIR: {set.rir}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Notes</h2>
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
            Back to Dashboard
          </Button>

          <Button
            onClick={() => router.push('/progress')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Progress
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
