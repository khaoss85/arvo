'use client'

import { useEffect, useState, useRef } from 'react'
import { List } from 'lucide-react'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import type { Workout } from '@/lib/types/schemas'
import { ExerciseCard } from './exercise-card'
import { WorkoutProgress } from './workout-progress'
import { WorkoutSummary } from './workout-summary'
import { ReorderExercisesModal } from './reorder-exercises-modal'
import { WorkoutRationale } from './workout-rationale'
import { Button } from '@/components/ui/button'

interface WorkoutExecutionProps {
  workout: Workout
  userId: string
}

export function WorkoutExecution({ workout, userId }: WorkoutExecutionProps) {
  const {
    isActive,
    workoutId,
    startWorkout,
    resumeWorkout,
    currentExerciseIndex,
    exercises,
    endWorkout
  } = useWorkoutExecutionStore()
  const [showReorderModal, setShowReorderModal] = useState(false)
  const hasInitialized = useRef(false)

  // Initialize or resume workout on mount
  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) return

    const initWorkout = async () => {
      try {
        // If workout is marked as active but has no exercises (page refresh case)
        if (isActive && exercises.length === 0 && workoutId) {
          await resumeWorkout(workoutId)
        }
        // If workout is not active, start it fresh
        else if (!isActive) {
          startWorkout(workout)
        }

        hasInitialized.current = true
      } catch (error) {
        console.error('Failed to initialize workout:', error)
        // Fallback to starting fresh if resume fails
        startWorkout(workout)
        hasInitialized.current = true
      }
    }

    initWorkout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading state while exercises are being initialized
  if (exercises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading workout...</p>
        </div>
      </div>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]

  // Check if workout is complete - only if we have exercises loaded
  const isWorkoutComplete = exercises.length > 0 && exercises.every(
    ex => ex.completedSets.length >= ex.targetSets
  )

  if (isWorkoutComplete) {
    return <WorkoutSummary workoutId={workout.id} userId={userId} />
  }

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Loading workout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Progress Bar */}
      <WorkoutProgress
        currentIndex={currentExerciseIndex}
        exercises={exercises}
      />

      {/* Workout Rationale */}
      <div className="mt-4">
        <WorkoutRationale
          workoutType={workout.workout_type || 'general'}
          exercises={exercises}
          userId={userId}
        />
      </div>

      {/* Reorder Button */}
      <div className="mt-4">
        <Button
          onClick={() => setShowReorderModal(true)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-gray-700 text-gray-300"
        >
          <List className="w-4 h-4" />
          Reorder Exercises
        </Button>
      </div>

      {/* Current Exercise */}
      <div className="mt-4">
        <ExerciseCard
          exercise={currentExercise}
          exerciseIndex={currentExerciseIndex}
          totalExercises={exercises.length}
          userId={userId}
          approachId={workout.approach_id || ''}
        />
      </div>

      {/* Reorder Modal */}
      {showReorderModal && (
        <ReorderExercisesModal
          workoutType={workout.workout_type || 'general'}
          approachId={workout.approach_id || ''}
          onClose={() => setShowReorderModal(false)}
        />
      )}
    </div>
  )
}
