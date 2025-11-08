import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workout } from '@/lib/types/schemas'
import type { ProgressionOutput } from '@/lib/agents/progression-calculator.agent'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'

export interface ExerciseExecution {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: [number, number]
  targetWeight: number
  completedSets: Array<{
    weight: number
    reps: number
    rir: number
    loggedAt: Date
  }>
  currentAISuggestion: ProgressionOutput | null
}

interface WorkoutExecutionState {
  // Active workout data
  workoutId: string | null
  workout: Workout | null
  exercises: ExerciseExecution[]
  currentExerciseIndex: number

  // Workout metadata
  startedAt: Date | null
  lastActivityAt: Date | null

  // State management
  isActive: boolean

  // Actions
  startWorkout: (workout: Workout) => void
  resumeWorkout: (workoutId: string) => Promise<void>
  endWorkout: () => void

  // Exercise navigation
  nextExercise: () => void
  previousExercise: () => void
  goToExercise: (index: number) => void

  // Set logging
  logSet: (setData: { weight: number; reps: number; rir: number }) => Promise<void>

  // AI suggestions
  setAISuggestion: (suggestion: ProgressionOutput) => void
  clearAISuggestion: () => void

  // Exercise substitution
  substituteExercise: (index: number, newExercise: ExerciseExecution) => void

  // Persistence
  saveProgress: () => Promise<void>

  // Reset
  reset: () => void
}

const STORAGE_KEY = 'workout-execution-storage'

export const useWorkoutExecutionStore = create<WorkoutExecutionState>()(
  persist(
    (set, get) => ({
      // Initial state
      workoutId: null,
      workout: null,
      exercises: [],
      currentExerciseIndex: 0,
      startedAt: null,
      lastActivityAt: null,
      isActive: false,

      // Start a new workout
      startWorkout: (workout: Workout) => {
        const exercises: ExerciseExecution[] = (workout.exercises as any[] || []).map((ex) => ({
          exerciseId: ex.id || '',
          exerciseName: ex.name,
          targetSets: ex.sets || 2,
          targetReps: ex.repRange || [6, 10],
          targetWeight: ex.targetWeight || 0,
          completedSets: [],
          currentAISuggestion: null
        }))

        set({
          workoutId: workout.id,
          workout,
          exercises,
          currentExerciseIndex: 0,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          isActive: true
        })
      },

      // Resume an interrupted workout
      resumeWorkout: async (workoutId: string) => {
        const workout = await WorkoutService.getById(workoutId)
        if (!workout) {
          throw new Error('Workout not found')
        }

        // Load completed sets from database
        const sets = await SetLogService.getByWorkoutId(workoutId)

        // Reconstruct exercise execution state
        const exercises: ExerciseExecution[] = (workout.exercises as any[] || []).map((ex) => {
          const exerciseSets = sets.filter(s => s.exercise_id === ex.id)

          return {
            exerciseId: ex.id || '',
            exerciseName: ex.name,
            targetSets: ex.sets || 2,
            targetReps: ex.repRange || [6, 10],
            targetWeight: ex.targetWeight || 0,
            completedSets: exerciseSets.map(s => ({
              weight: s.weight_actual || 0,
              reps: s.reps_actual || 0,
              rir: s.rir_actual || 0,
              loggedAt: new Date(s.created_at)
            })),
            currentAISuggestion: null
          }
        })

        // Find first incomplete exercise
        const firstIncompleteIndex = exercises.findIndex(
          ex => ex.completedSets.length < ex.targetSets
        )

        set({
          workoutId: workout.id,
          workout,
          exercises,
          currentExerciseIndex: firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0,
          lastActivityAt: new Date(),
          isActive: true
        })
      },

      // End the workout
      endWorkout: () => {
        set({
          isActive: false
        })
      },

      // Navigation
      nextExercise: () => {
        const { currentExerciseIndex, exercises } = get()
        if (currentExerciseIndex < exercises.length - 1) {
          set({
            currentExerciseIndex: currentExerciseIndex + 1,
            lastActivityAt: new Date()
          })
        }
      },

      previousExercise: () => {
        const { currentExerciseIndex } = get()
        if (currentExerciseIndex > 0) {
          set({
            currentExerciseIndex: currentExerciseIndex - 1,
            lastActivityAt: new Date()
          })
        }
      },

      goToExercise: (index: number) => {
        const { exercises } = get()
        if (index >= 0 && index < exercises.length) {
          set({
            currentExerciseIndex: index,
            lastActivityAt: new Date()
          })
        }
      },

      // Log a set
      logSet: async (setData: { weight: number; reps: number; rir: number }) => {
        const { workoutId, exercises, currentExerciseIndex } = get()

        if (!workoutId) {
          throw new Error('No active workout')
        }

        const currentExercise = exercises[currentExerciseIndex]
        if (!currentExercise) {
          throw new Error('No current exercise')
        }

        // Save to database
        try {
          await SetLogService.create({
            workout_id: workoutId,
            exercise_id: currentExercise.exerciseId,
            set_number: currentExercise.completedSets.length + 1,
            weight_target: currentExercise.targetWeight,
            weight_actual: setData.weight,
            reps_target: currentExercise.targetReps[0],
            reps_actual: setData.reps,
            rir_actual: setData.rir,
            notes: null
          })

          // Update local state
          const updatedExercises = [...exercises]
          updatedExercises[currentExerciseIndex] = {
            ...currentExercise,
            completedSets: [
              ...currentExercise.completedSets,
              {
                ...setData,
                loggedAt: new Date()
              }
            ]
          }

          set({
            exercises: updatedExercises,
            lastActivityAt: new Date()
          })

          // Save progress to database
          await get().saveProgress()
        } catch (error) {
          console.error('Failed to log set:', error)
          throw error
        }
      },

      // AI suggestions
      setAISuggestion: (suggestion: ProgressionOutput) => {
        const { exercises, currentExerciseIndex } = get()
        const updatedExercises = [...exercises]

        updatedExercises[currentExerciseIndex] = {
          ...updatedExercises[currentExerciseIndex],
          currentAISuggestion: suggestion
        }

        set({ exercises: updatedExercises })
      },

      clearAISuggestion: () => {
        const { exercises, currentExerciseIndex } = get()
        const updatedExercises = [...exercises]

        updatedExercises[currentExerciseIndex] = {
          ...updatedExercises[currentExerciseIndex],
          currentAISuggestion: null
        }

        set({ exercises: updatedExercises })
      },

      // Exercise substitution
      substituteExercise: (index: number, newExercise: ExerciseExecution) => {
        const { exercises } = get()
        const updatedExercises = [...exercises]
        updatedExercises[index] = newExercise

        set({
          exercises: updatedExercises,
          lastActivityAt: new Date()
        })
      },

      // Save progress to database
      saveProgress: async () => {
        const { workoutId, exercises } = get()

        if (!workoutId) return

        try {
          // Update workout with current exercise state
          await WorkoutService.savePartialProgress(workoutId, exercises as any)
        } catch (error) {
          console.error('Failed to save progress:', error)
        }
      },

      // Reset state
      reset: () => {
        set({
          workoutId: null,
          workout: null,
          exercises: [],
          currentExerciseIndex: 0,
          startedAt: null,
          lastActivityAt: null,
          isActive: false
        })
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        // Only persist essential data
        workoutId: state.workoutId,
        currentExerciseIndex: state.currentExerciseIndex,
        startedAt: state.startedAt,
        lastActivityAt: state.lastActivityAt,
        isActive: state.isActive
      })
    }
  )
)
