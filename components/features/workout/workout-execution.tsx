'use client'

import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import type { Workout } from '@/lib/types/schemas'
import { ExerciseCard } from './exercise-card'
import { WorkoutProgress } from './workout-progress'
import { WorkoutSummary } from './workout-summary'
import { ReorderExercisesModal } from './reorder-exercises-modal'
import { Button } from '@/components/ui/button'

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
  const [showReorderModal, setShowReorderModal] = useState(false)

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
