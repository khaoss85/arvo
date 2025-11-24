'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import type { Workout } from '@/lib/types/schemas'
import { ExerciseCard } from './exercise-card'
import { WorkoutProgress } from './workout-progress'
import { WorkoutSummary } from './workout-summary'
import { ReorderExercisesModal } from './reorder-exercises-modal'
import { WorkoutRationale, type WorkoutRationaleHandle } from './workout-rationale'
import { ExerciseSubstitution } from './exercise-substitution'
import { AudioCoachPlayer } from './audio-coach-player'

interface WorkoutExecutionProps {
  workout: Workout
  userId: string
}

export function WorkoutExecution({ workout, userId }: WorkoutExecutionProps) {
  const t = useTranslations('workout.execution')
  const {
    isActive,
    workoutId,
    startWorkout,
    resumeWorkout,
    currentExerciseIndex,
    exercises,
    endWorkout: _endWorkout
  } = useWorkoutExecutionStore()
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [swapExerciseIndex, setSwapExerciseIndex] = useState<number | null>(null)
  const hasInitialized = useRef(false)
  const rationaleRef = useRef<WorkoutRationaleHandle>(null)

  // Callback to invalidate rationale when exercises are modified
  const handleRationaleInvalidate = () => {
    rationaleRef.current?.invalidate()
  }

  // Initialize or resume workout on mount
  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) return

    const initWorkout = async () => {
      try {
        // If workout is marked as active but has no exercises (page refresh case)
        if (isActive && exercises.length === 0 && workoutId) {
          console.log('[WorkoutExecution] Resuming workout (page refresh):', workoutId)
          await resumeWorkout(workoutId)
        }
        // If workout is not active, always use resumeWorkout for existing workouts
        // This ensures we load complete data from DB instead of relying on passed workout object
        else if (!isActive && workout.id) {
          console.log('[WorkoutExecution] Loading workout from DB:', workout.id)
          await resumeWorkout(workout.id)
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
          <p className="text-gray-400">{t('loadingWorkout')}</p>
        </div>
      </div>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]

  // Check if workout is complete - only if we have exercises loaded
  // Must account for warmup sets + working sets (same logic as store's logSet)
  const isWorkoutComplete = exercises.length > 0 && exercises.every(ex => {
    const warmupSetsCount = ex.warmupSets?.length || 0
    const warmupSetsSkipped = ex.warmupSetsSkipped || 0
    const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
    const totalRequiredSets = remainingWarmupSets + ex.targetSets
    return ex.completedSets.length >= totalRequiredSets
  })

  // Debug logging for completion check
  if (exercises.length > 0) {
    console.log('[WorkoutExecution] Completion check:', exercises.map(ex => {
      const warmupSetsCount = ex.warmupSets?.length || 0
      const warmupSetsSkipped = ex.warmupSetsSkipped || 0
      const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
      return {
        name: ex.exerciseName,
        completedSets: ex.completedSets.length,
        warmupSets: warmupSetsCount,
        warmupSetsSkipped,
        remainingWarmupSets,
        targetSets: ex.targetSets,
        totalRequired: remainingWarmupSets + ex.targetSets,
        isComplete: ex.completedSets.length >= (remainingWarmupSets + ex.targetSets)
      }
    }))
  }

  if (isWorkoutComplete) {
    return <WorkoutSummary workoutId={workout.id} userId={userId} />
  }

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">{t('loadingWorkout')}</p>
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
        onSwapExercise={(index) => setSwapExerciseIndex(index)}
        onReorder={() => setShowReorderModal(true)}
      />

      {/* Workout Rationale */}
      <div className="mt-4">
        <WorkoutRationale
          ref={rationaleRef}
          workoutType={workout.workout_type || 'general'}
          exercises={exercises}
          userId={userId}
        />
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
          onRationaleInvalidate={handleRationaleInvalidate}
        />
      )}

      {/* Exercise Substitution Modal */}
      {swapExerciseIndex !== null && (
        <ExerciseSubstitution
          currentExercise={exercises[swapExerciseIndex]}
          exerciseIndex={swapExerciseIndex}
          userId={userId}
          onClose={() => setSwapExerciseIndex(null)}
          onRationaleInvalidate={handleRationaleInvalidate}
        />
      )}

      {/* Audio Coach Player (Floating) */}
      <AudioCoachPlayer />
    </div>
  )
}
