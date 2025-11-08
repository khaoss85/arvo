'use client'

import { useEffect } from 'react'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import type { Workout } from '@/lib/types/schemas'
import { ExerciseCard } from './exercise-card'
import { WorkoutProgress } from './workout-progress'
import { WorkoutSummary } from './workout-summary'

interface WorkoutExecutionProps {
  workout: Workout
  userId: string
}

export function WorkoutExecution({ workout, userId }: WorkoutExecutionProps) {
  const {
    isActive,
    startWorkout,
    currentExerciseIndex,
    exercises,
    endWorkout
  } = useWorkoutExecutionStore()

  // Initialize workout on mount
  useEffect(() => {
    if (!isActive) {
      startWorkout(workout)
    }
  }, [workout, isActive, startWorkout])

  const currentExercise = exercises[currentExerciseIndex]
  const isWorkoutComplete = exercises.every(
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

      {/* Current Exercise */}
      <div className="mt-6">
        <ExerciseCard
          exercise={currentExercise}
          exerciseIndex={currentExerciseIndex}
          totalExercises={exercises.length}
          userId={userId}
          approachId={workout.approach_id}
        />
      </div>
    </div>
  )
}
