import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workout } from '@/lib/types/schemas'
import type { ProgressionOutput } from '@/lib/agents/progression-calculator.agent'
import type { AudioScriptsOutput } from '@/lib/agents/audio-script-generator.agent'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { AnimationService } from '@/lib/services/animation.service'
import { getExerciseName } from '@/lib/utils/exercise-helpers'
import type { AppliedTechnique, TechniqueExecutionState, TechniqueExecutionResult, TechniqueConfig } from '@/lib/types/advanced-techniques'
import {
  isTopSetBackoffConfig,
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
} from '@/lib/types/advanced-techniques'

export interface WarmupSet {
  setNumber: number
  weightPercentage: number
  weight: number
  reps: number
  rir: number
  restSeconds: number
  technicalFocus?: string
}

export interface SetGuidance {
  setNumber: number
  technicalFocus?: string
  mentalFocus?: string
}

export interface ExerciseExecution {
  exerciseId: string | null
  exerciseName: string
  equipmentVariant?: string // Equipment variation (e.g., "barbell", "dumbbell", "cable")
  targetSets: number
  targetReps: [number, number]
  targetWeight: number
  completedSets: Array<{
    id?: string // Set ID from database (for editing/deleting)
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number // Optional 1-5 rating
    notes?: string // Optional notes for the set
    loggedAt: Date
    isWarmup?: boolean // Track if this was a warmup set
  }>
  currentAISuggestion: ProgressionOutput | null
  technicalCues?: string[] // Brief technical cues for proper form
  warmupSets?: WarmupSet[] // Warmup progression (only for compound movements)
  setGuidance?: SetGuidance[] // Per-set technical and mental focus for working sets
  tempo?: string // Tempo prescription from approach (e.g., "3-1-1-1" for Kuba Method)
  restSeconds?: number // Rest period from approach (seconds between sets)
  animationUrl?: string // URL path to Lottie JSON animation (e.g., "/animations/exercises/barbell-squat.json")
  hasAnimation?: boolean // Whether a Lottie animation is available for this exercise
  warmupSetsSkipped?: number // Number of warmup sets that were skipped (used to calculate correct totalSets)

  // User modification tracking
  aiRecommendedSets?: number // Original AI recommendation (before user modifications)
  userAddedSets?: number // Number of sets added by user beyond AI recommendation
  userModifications?: {
    addedSets: number
    reason?: string // Optional: "felt good", "pump zone", etc.
    aiWarnings?: string[] // AI warnings shown to user
    userOverride: boolean // User proceeded despite warnings
    modifiedAt: string // ISO timestamp
  }

  // Exercise substitution tracking
  originalExerciseName?: string // If this exercise was substituted, stores the original exercise name
  substitutionReason?: string // Reason for substitution (e.g., "equipment_unavailable", "injury", "user_preference")

  // Advanced training technique (AI-generated)
  advancedTechnique?: AppliedTechnique // The technique applied to this exercise (drop_set, rest_pause, etc.)
  techniqueState?: TechniqueExecutionState // Current state during technique execution
  techniqueResult?: TechniqueExecutionResult // Final result after technique completion
}

interface WorkoutExecutionState {
  // Active workout data
  workoutId: string | null
  workout: Workout | null
  exercises: ExerciseExecution[]
  currentExerciseIndex: number
  audioScripts: AudioScriptsOutput | null // AI-generated audio coaching scripts

  // Workout metadata
  startedAt: Date | null
  lastActivityAt: Date | null
  overallMentalReadiness: number | null // Overall mental state (1-5, required when completing)

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
  logSet: (setData: { weight: number; reps: number; rir: number; mentalReadiness?: number; skipAutoAdvance?: boolean }) => Promise<void>
  editSet: (exerciseIndex: number, setIndex: number, setData: { weight: number; reps: number; rir: number; mentalReadiness?: number; notes?: string }) => Promise<void>
  deleteSet: (exerciseIndex: number, setIndex: number) => Promise<void>
  skipWarmupSets: (reason?: string) => Promise<void>

  // Mental readiness tracking
  setOverallMentalReadiness: (value: number) => void

  // AI suggestions
  setAISuggestion: (suggestion: ProgressionOutput) => void
  clearAISuggestion: () => void

  // Exercise substitution
  substituteExercise: (index: number, newExercise: ExerciseExecution) => void

  // Advanced technique
  setExerciseTechnique: (exerciseIndex: number, technique: AppliedTechnique | null) => void

  // Exercise reordering
  reorderExercises: (newOrder: ExerciseExecution[]) => void

  // Add extra sets
  addSetToExercise: (exerciseIndex: number) => { success: boolean; error?: string; message?: string; warning?: string }

  // Update technique configuration (for adding sets to techniques)
  updateTechniqueConfig: (exerciseIndex: number, updates: Partial<TechniqueConfig>) => { success: boolean; warning?: string }

  // Add extra exercise
  addExerciseToWorkout: (position: number, exercise: ExerciseExecution) => { success: boolean; error?: string; message?: string }

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
      audioScripts: null,
      startedAt: null,
      lastActivityAt: null,
      overallMentalReadiness: null,
      isActive: false,

      // Start a new workout
      startWorkout: async (workout: Workout) => {
        // Clear any stale persisted state from previous sessions
        localStorage.removeItem(STORAGE_KEY)

        console.log('[Store] startWorkout called with:', {
          workoutId: workout.id,
          hasExercises: Array.isArray(workout.exercises),
          exerciseCount: Array.isArray(workout.exercises) ? workout.exercises.length : 0,
          firstExercise: Array.isArray(workout.exercises) && workout.exercises.length > 0
            ? {
                name: (workout.exercises[0] as any).name,
                keys: Object.keys(workout.exercises[0])
              }
            : null
        })

        const exercises: ExerciseExecution[] = await Promise.all(
          (workout.exercises as any[] || []).map(async (ex, idx) => {
            // Get animation URL using AnimationService with fallback logic (async)
            const animationUrl =
              ex.animationUrl ||
              (await AnimationService.getAnimationUrl({
                name: getExerciseName(ex),
                canonicalPattern: ex.canonicalPattern,
                equipmentVariant: ex.equipment,
              }))

            const mapped: ExerciseExecution = {
              exerciseId: ex.id || crypto.randomUUID(), // Generate UUID if not present for caching
              exerciseName: ex.exerciseName || ex.name,
              equipmentVariant: ex.equipmentVariant || ex.equipment,
              targetSets: ex.sets || 2,
              targetReps: ex.repRange || [6, 10],
              targetWeight: ex.targetWeight || 0,
              completedSets: [],
              currentAISuggestion: null,
              technicalCues: ex.technicalCues || [],
              warmupSets: ex.warmupSets || [],
              setGuidance: ex.setGuidance || [],
              tempo: ex.tempo,
              restSeconds: ex.restSeconds || 90, // Default to 90s if not specified by approach
              animationUrl,
              hasAnimation: !!animationUrl,
              // Advanced training technique from AI
              advancedTechnique: ex.advancedTechnique || undefined,
              techniqueState: undefined,
              techniqueResult: undefined,
            }

            if (idx === 0) {
              console.log('[Store] First exercise mapped to:', mapped)
            }

            return mapped
          })
        )

        console.log('[Store] Total exercises mapped:', exercises.length)
        console.log('[Store] Animation status:', exercises.map(ex => ({
          name: ex.exerciseName,
          hasAnimation: ex.hasAnimation,
          animationUrl: ex.animationUrl
        })))

        set({
          workoutId: workout.id,
          workout,
          exercises,
          currentExerciseIndex: 0,
          audioScripts: (workout.audio_scripts as unknown as AudioScriptsOutput) || null,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          isActive: true
        })

        // Mark workout as started in database with retry logic
        try {
          await WorkoutService.markAsStarted(workout.id)
        } catch (err) {
          console.error('[Store] Failed to mark workout as started:', err)

          // Import UI store dynamically to avoid circular dependencies
          const { useUIStore } = await import('./ui.store')
          useUIStore.getState().addToast(
            'Workout started but sync failed. Your progress is saved locally.',
            'warning'
          )

          // Retry in background after 3 seconds
          setTimeout(async () => {
            try {
              await WorkoutService.markAsStarted(workout.id)
              console.log('[Store] Successfully synced workout status after retry')
            } catch (retryErr) {
              console.error('[Store] Retry failed for markAsStarted:', retryErr)
            }
          }, 3000)
        }
      },

      // Resume an interrupted workout
      resumeWorkout: async (workoutId: string) => {
        const workout = await WorkoutService.getById(workoutId)
        if (!workout) {
          throw new Error('Workout not found')
        }

        // Load completed sets from database
        const sets = await SetLogService.getByWorkoutId(workoutId)

        // STATE RECOVERY: If sets exist but workout status is "ready", auto-fix to "in_progress"
        if (sets.length > 0 && workout.status === 'ready' && !workout.started_at) {
          console.warn('[Store] Inconsistent state detected: sets exist but workout not started. Auto-recovering...')

          try {
            // Calculate started_at from first set
            const firstSetTime = sets.reduce((earliest, set) => {
              const setTime = new Date(set.created_at!)
              return setTime < earliest ? setTime : earliest
            }, new Date(sets[0].created_at!))

            // Update workout to in_progress with calculated started_at
            await WorkoutService.markAsStarted(workout.id, firstSetTime.toISOString())

            // Update local workout object
            workout.status = 'in_progress'
            workout.started_at = firstSetTime.toISOString()

            // Import UI store dynamically
            const { useUIStore } = await import('./ui.store')
            useUIStore.getState().addToast(
              'Workout state recovered. You can continue where you left off.',
              'success'
            )

            console.log('[Store] State recovery successful. Workout marked as in_progress.')
          } catch (err) {
            console.error('[Store] State recovery failed:', err)
            // Continue anyway - local state will still work
          }
        }

        // Reconstruct exercise execution state
        const exercises: ExerciseExecution[] = await Promise.all(
          (workout.exercises as any[] || []).map(async (ex) => {
            const exerciseSets = sets.filter((s) => {
              const exId = ex.id || ex.exerciseId || null
              const exerciseName = getExerciseName(ex)
              const nameMatch = s.exercise_name?.toLowerCase().trim() === exerciseName.toLowerCase().trim()

              // Priority-based matching to prevent cross-contamination:
              // 1. If exercise has ID: match ONLY by ID (ignore name)
              if (exId) {
                return s.exercise_id === exId
              }

              // 2. If exercise has no ID: match by name ONLY if set also has no exercise_id
              // This prevents exercises without IDs from picking up sets from exercises with IDs
              return !s.exercise_id && nameMatch
            })

            // Filter out skipped sets - they should NOT be in completedSets
            const completedSetsOnly = exerciseSets.filter((s) => !(s as any).skipped)
            const skippedSetsOnly = exerciseSets.filter((s) => (s as any).skipped)
            const warmupSetsSkipped = skippedSetsOnly.filter((s) => (s as any).set_type === 'warmup').length

            // Debug logging for completed sets loading
            console.log('[Store] Exercise sets loaded:', {
              exerciseName: getExerciseName(ex),
              exerciseId: ex.id,
              setsFound: exerciseSets.length,
              completedSetsOnly: completedSetsOnly.length,
              skippedSets: skippedSetsOnly.length,
              warmupSetsSkipped,
              totalSetsInDB: sets.length
            })

            // Get animation URL using AnimationService with fallback logic (async)
            const animationUrl =
              ex.animationUrl ||
              (await AnimationService.getAnimationUrl({
                name: getExerciseName(ex),
                canonicalPattern: ex.canonicalPattern,
                equipmentVariant: ex.equipment,
              }))

            return {
              exerciseId: ex.id || null,
              exerciseName: ex.exerciseName || ex.name,
              equipmentVariant: ex.equipmentVariant || ex.equipment,
              targetSets: ex.sets || 2,
              targetReps: ex.repRange || [6, 10],
              targetWeight: ex.targetWeight || 0,
              completedSets: completedSetsOnly.map((s) => ({
                id: s.id, // Include set ID for editing/deleting
                weight: s.weight_actual || 0,
                reps: s.reps_actual || 0,
                rir: s.rir_actual || 0,
                mentalReadiness: s.mental_readiness || undefined,
                notes: s.notes || undefined,
                loggedAt: s.created_at ? new Date(s.created_at) : new Date(),
                // Note: isWarmup info is lost on resume - we rely on set_number and warmupSets length
              })),
              currentAISuggestion: null,
              technicalCues: ex.technicalCues || [],
              warmupSets: ex.warmupSets || [],
              warmupSetsSkipped: warmupSetsSkipped > 0 ? warmupSetsSkipped : undefined,
              setGuidance: ex.setGuidance || [],
              tempo: ex.tempo,
              restSeconds: ex.restSeconds || 90, // Default to 90s if not specified by approach
              animationUrl,
              hasAnimation: !!animationUrl,
              // Advanced training technique from AI (preserve on resume)
              advancedTechnique: ex.advancedTechnique || undefined,
              techniqueState: undefined, // Reset state on resume
              techniqueResult: undefined, // Reset results on resume
            }
          })
        )

        // Find first incomplete exercise
        // Must account for TOTAL expected sets (warmup + working), not just working sets
        const firstIncompleteIndex = exercises.findIndex((ex) => {
          const warmupSetsExpected = (ex.warmupSets?.length || 0) - (ex.warmupSetsSkipped || 0)
          const totalExpectedSets = warmupSetsExpected + ex.targetSets
          return ex.completedSets.length < totalExpectedSets
        })

        console.log('[Store] Resume - Animation status:', exercises.map(ex => ({
          name: ex.exerciseName,
          hasAnimation: ex.hasAnimation,
          animationUrl: ex.animationUrl
        })))

        // Preserve startedAt from persisted state, or use DB value, or set to now
        const persistedStartedAt = get().startedAt

        set({
          workoutId: workout.id,
          workout,
          exercises,
          currentExerciseIndex: firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0,
          audioScripts: (workout.audio_scripts as unknown as AudioScriptsOutput) || null,
          startedAt: persistedStartedAt || (workout.started_at ? new Date(workout.started_at) : new Date()),
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
      logSet: async (setData: { weight: number; reps: number; rir: number; mentalReadiness?: number; skipAutoAdvance?: boolean }) => {
        const { workoutId, exercises, currentExerciseIndex } = get()

        if (!workoutId) {
          throw new Error('No active workout')
        }

        const currentExercise = exercises[currentExerciseIndex]
        if (!currentExercise) {
          throw new Error('No current exercise')
        }

        // Check if all sets are already completed
        const warmupSetsCount = currentExercise.warmupSets?.length || 0
        const warmupSetsSkipped = currentExercise.warmupSetsSkipped || 0
        const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
        const totalSets = remainingWarmupSets + currentExercise.targetSets

        if (currentExercise.completedSets.length >= totalSets) {
          throw new Error('All sets already completed for this exercise')
        }

        // Save to database
        try {
          // Determine if this is a warmup or working set
          const isWarmupSet = currentExercise.completedSets.length < remainingWarmupSets

          const createdSet = await SetLogService.create({
            workout_id: workoutId,
            exercise_id: currentExercise.exerciseId || null,
            exercise_name: currentExercise.exerciseName,
            set_number: currentExercise.completedSets.length + 1,
            weight_target: currentExercise.targetWeight,
            weight_actual: setData.weight,
            reps_target: currentExercise.targetReps[0],
            reps_actual: setData.reps,
            rir_actual: setData.rir,
            mental_readiness: setData.mentalReadiness || null,
            notes: null,
            set_type: isWarmupSet ? 'warmup' : 'working',
            skipped: false,
            skip_reason: null,
            // Track exercise substitution if applicable
            original_exercise_name: currentExercise.originalExerciseName || null,
            substitution_reason: currentExercise.substitutionReason || null
          })

          // Update local state
          const updatedExercises = [...exercises]
          updatedExercises[currentExerciseIndex] = {
            ...currentExercise,
            completedSets: [
              ...currentExercise.completedSets,
              {
                id: createdSet.id, // Save set ID for editing/deleting
                weight: setData.weight,
                reps: setData.reps,
                rir: setData.rir,
                mentalReadiness: setData.mentalReadiness,
                loggedAt: new Date()
              }
            ],
            // Clear AI suggestion to allow recalculation for next set
            currentAISuggestion: null
          }

          // Dynamically update targetWeight if actual performance significantly exceeds prediction
          // This ensures warmup calculations adapt to real user strength
          if (!isWarmupSet && setData.weight > currentExercise.targetWeight * 1.2) {
            updatedExercises[currentExerciseIndex].targetWeight = setData.weight
          }

          // For warmup sets, also update targetWeight if performance exceeds expectations
          // Use a lower threshold (10%) since warmup sets should inform working set predictions
          if (isWarmupSet && setData.weight > currentExercise.targetWeight * 1.1) {
            updatedExercises[currentExerciseIndex].targetWeight = setData.weight
          }

          set({
            exercises: updatedExercises,
            lastActivityAt: new Date()
          })

          // Save progress to database
          await get().saveProgress()

          // Auto-advance to next exercise if all sets are completed
          const newCompletedCount = currentExercise.completedSets.length + 1

          if (newCompletedCount >= totalSets && !setData.skipAutoAdvance) {
            // Exercise is now complete - auto-advance to next exercise
            const { currentExerciseIndex, exercises } = get()
            if (currentExerciseIndex < exercises.length - 1) {
              get().nextExercise()
            }
          }
        } catch (error) {
          console.error('Failed to log set:', error)
          throw error
        }
      },

      // Edit a logged set
      editSet: async (exerciseIndex: number, setIndex: number, setData: { weight: number; reps: number; rir: number; mentalReadiness?: number; notes?: string }) => {
        const { exercises } = get()
        const exercise = exercises[exerciseIndex]

        if (!exercise) {
          throw new Error('Exercise not found')
        }

        const currentSet = exercise.completedSets[setIndex]
        if (!currentSet || !currentSet.id) {
          throw new Error('Set not found or missing ID')
        }

        try {
          // Update in database
          await SetLogService.update(currentSet.id, {
            weight_actual: setData.weight,
            reps_actual: setData.reps,
            rir_actual: setData.rir,
            mental_readiness: setData.mentalReadiness || null,
            notes: setData.notes || null,
            // Preserve exercise substitution tracking if applicable
            original_exercise_name: exercise.originalExerciseName || null,
            substitution_reason: exercise.substitutionReason || null,
          })

          // Update local state
          const updatedExercises = [...exercises]
          updatedExercises[exerciseIndex] = {
            ...exercise,
            completedSets: exercise.completedSets.map((s, idx) =>
              idx === setIndex
                ? {
                    ...s,
                    weight: setData.weight,
                    reps: setData.reps,
                    rir: setData.rir,
                    mentalReadiness: setData.mentalReadiness,
                    notes: setData.notes,
                  }
                : s
            ),
          }

          set({
            exercises: updatedExercises,
            lastActivityAt: new Date(),
          })

          // Clear AI suggestion as the set data changed
          if (exerciseIndex === get().currentExerciseIndex) {
            get().clearAISuggestion()
          }
        } catch (error) {
          console.error('Failed to edit set:', error)
          throw error
        }
      },

      // Delete a logged set
      deleteSet: async (exerciseIndex: number, setIndex: number) => {
        const { exercises } = get()
        const exercise = exercises[exerciseIndex]

        if (!exercise) {
          throw new Error('Exercise not found')
        }

        const currentSet = exercise.completedSets[setIndex]
        if (!currentSet || !currentSet.id) {
          throw new Error('Set not found or missing ID')
        }

        try {
          // Delete from database
          await SetLogService.delete(currentSet.id)

          // Update local state
          const updatedExercises = [...exercises]
          const newCompletedSets = exercise.completedSets.filter((_, idx) => idx !== setIndex)

          updatedExercises[exerciseIndex] = {
            ...exercise,
            completedSets: newCompletedSets,
          }

          // If this was a user-added set, decrement targetSets and userAddedSets
          if (exercise.userAddedSets && exercise.userAddedSets > 0) {
            const originalTargetSets = exercise.aiRecommendedSets || exercise.targetSets
            if (newCompletedSets.length < originalTargetSets && exercise.targetSets > originalTargetSets) {
              updatedExercises[exerciseIndex].targetSets -= 1
              updatedExercises[exerciseIndex].userAddedSets = (exercise.userAddedSets || 1) - 1
            }
          }

          set({
            exercises: updatedExercises,
            lastActivityAt: new Date(),
          })

          // Clear AI suggestion as the set data changed
          if (exerciseIndex === get().currentExerciseIndex) {
            get().clearAISuggestion()
          }

          // Save progress
          await get().saveProgress()
        } catch (error) {
          console.error('Failed to delete set:', error)
          throw error
        }
      },

      // Skip all warmup sets for current exercise
      skipWarmupSets: async (reason?: string) => {
        const { workoutId, exercises, currentExerciseIndex } = get()

        if (!workoutId) {
          throw new Error('No active workout')
        }

        const currentExercise = exercises[currentExerciseIndex]
        if (!currentExercise) {
          throw new Error('No current exercise')
        }

        const warmupSetsCount = currentExercise.warmupSets?.length || 0
        if (warmupSetsCount === 0) {
          throw new Error('No warmup sets to skip for this exercise')
        }

        // Check if any sets have already been completed
        if (currentExercise.completedSets.length > 0) {
          throw new Error('Cannot skip warmup after sets have been logged')
        }

        try {
          // Log warmup sets as skipped in database
          const skippedSetsData = currentExercise.warmupSets!.map((warmupSet, index) => ({
            workout_id: workoutId,
            exercise_id: currentExercise.exerciseId || undefined,
            exercise_name: currentExercise.exerciseName,
            set_number: index + 1,
            set_type: 'warmup' as const,
            skip_reason: reason || 'user_manual',
          }))

          await SetLogService.createSkippedSets(skippedSetsData)

          // Note: We do NOT add these to completedSets
          // This way, the set counter will start from 1 for working sets
          // And the user can immediately start logging their first working set

          // Update local state to track skipped warmups
          const updatedExercises = [...exercises]
          updatedExercises[currentExerciseIndex] = {
            ...currentExercise,
            warmupSetsSkipped: warmupSetsCount
          }

          set({
            exercises: updatedExercises,
            lastActivityAt: new Date()
          })

          // Save progress
          await get().saveProgress()
        } catch (error) {
          console.error('Failed to skip warmup sets:', error)
          throw error
        }
      },

      // Set overall mental readiness for the workout
      setOverallMentalReadiness: (value: number) => {
        if (value < 1 || value > 5) {
          throw new Error('Mental readiness must be between 1 and 5')
        }
        set({ overallMentalReadiness: value })
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

      // Set advanced technique for exercise
      setExerciseTechnique: (exerciseIndex: number, technique: AppliedTechnique | null) => {
        const { exercises } = get()
        const updatedExercises = [...exercises]

        if (!updatedExercises[exerciseIndex]) {
          console.error('Exercise not found at index:', exerciseIndex)
          return
        }

        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          advancedTechnique: technique || undefined
        }

        set({
          exercises: updatedExercises,
          lastActivityAt: new Date()
        })
      },

      // Reorder exercises
      reorderExercises: (newOrder: ExerciseExecution[]) => {
        const { currentExerciseIndex, exercises } = get()
        const currentExercise = exercises[currentExerciseIndex]

        // Find new index of current exercise
        const newCurrentIndex = newOrder.findIndex(
          ex => ex.exerciseName === currentExercise?.exerciseName
        )

        set({
          exercises: newOrder,
          currentExerciseIndex: newCurrentIndex >= 0 ? newCurrentIndex : currentExerciseIndex,
          lastActivityAt: new Date()
        })
      },

      // Add extra set to exercise
      addSetToExercise: (exerciseIndex: number) => {
        const { exercises } = get()
        const updatedExercises = [...exercises]
        const exercise = updatedExercises[exerciseIndex]

        if (!exercise) {
          console.error('Exercise not found at index:', exerciseIndex)
          return { success: false, error: 'not_found', message: 'Exercise not found' }
        }

        // Save original AI recommendation on first modification
        if (!exercise.aiRecommendedSets) {
          exercise.aiRecommendedSets = exercise.targetSets
        }

        const currentAddedSets = exercise.userAddedSets || 0
        const newAddedSets = currentAddedSets + 1

        // HARD LIMIT: Maximum 5 extra sets
        if (newAddedSets > 5) {
          console.warn('Hard limit reached: Cannot add more than 5 extra sets')
          return {
            success: false,
            error: 'hard_limit',
            message: 'Maximum 5 extra sets allowed. You\'ve reached your limit to prevent overtraining.'
          }
        }

        // SOFT WARNING: At 3+ extra sets
        const warnings: string[] = []
        if (newAddedSets >= 3) {
          warnings.push('You\'re adding significant volume beyond the AI recommendation. Monitor recovery closely.')
        }

        // Increment target sets
        exercise.targetSets += 1

        // Track user-added sets
        exercise.userAddedSets = newAddedSets

        // Update user modifications metadata
        exercise.userModifications = {
          addedSets: newAddedSets,
          reason: undefined, // Can be set later by user input
          aiWarnings: warnings, // Now populated with actual warnings
          userOverride: newAddedSets >= 3, // Track if user proceeded with warning
          modifiedAt: new Date().toISOString()
        }

        set({
          exercises: updatedExercises,
          lastActivityAt: new Date()
        })

        // Save to database
        get().saveProgress()

        return {
          success: true,
          warning: newAddedSets >= 3 ? warnings[0] : undefined
        }
      },

      // Update technique configuration (for adding sets to techniques)
      updateTechniqueConfig: (exerciseIndex: number, updates: Partial<TechniqueConfig>) => {
        const { exercises } = get()
        const updatedExercises = [...exercises]
        const exercise = updatedExercises[exerciseIndex]

        if (!exercise || !exercise.advancedTechnique) {
          console.error('Exercise or technique not found at index:', exerciseIndex)
          return { success: false }
        }

        // Save original AI recommendation on first modification
        if (!exercise.aiRecommendedSets) {
          exercise.aiRecommendedSets = exercise.targetSets
        }

        // Track user modifications
        const currentAddedSets = exercise.userAddedSets || 0
        const newAddedSets = currentAddedSets + 1

        // HARD LIMIT: Maximum 5 extra sets
        if (newAddedSets > 5) {
          console.warn('Hard limit reached: Cannot add more than 5 extra technique sets')
          return { success: false }
        }

        // Merge updates into existing config
        const currentConfig = exercise.advancedTechnique.config
        const newConfig = { ...currentConfig, ...updates } as TechniqueConfig

        // Calculate new targetSets based on technique config
        let newTargetSets = 0
        if (isTopSetBackoffConfig(newConfig)) {
          newTargetSets = (newConfig.topSets || 1) + newConfig.backoffSets
        } else if (isDropSetConfig(newConfig)) {
          // Initial set + drops
          newTargetSets = 1 + newConfig.drops
        } else if (isRestPauseConfig(newConfig)) {
          // Initial set + mini-sets
          newTargetSets = 1 + newConfig.miniSets
        } else if (isMyoRepsConfig(newConfig)) {
          // Activation set + mini-sets
          newTargetSets = 1 + newConfig.miniSets
        } else if (isClusterSetConfig(newConfig)) {
          newTargetSets = newConfig.clusters
        } else {
          // Fallback: keep existing targetSets
          newTargetSets = exercise.targetSets
        }

        // Update exercise
        exercise.advancedTechnique = {
          ...exercise.advancedTechnique,
          config: newConfig,
        }
        exercise.targetSets = newTargetSets
        exercise.userAddedSets = newAddedSets

        // Track modifications
        exercise.userModifications = {
          addedSets: newAddedSets,
          reason: undefined,
          aiWarnings: newAddedSets >= 3 ? ['You\'re adding significant volume beyond the AI recommendation.'] : [],
          userOverride: newAddedSets >= 3,
          modifiedAt: new Date().toISOString()
        }

        set({
          exercises: updatedExercises,
          lastActivityAt: new Date()
        })

        // Save to database
        get().saveProgress()

        return {
          success: true,
          warning: newAddedSets >= 3 ? 'You\'re adding significant volume beyond the AI recommendation.' : undefined
        }
      },

      // Add extra exercise to workout
      addExerciseToWorkout: (position: number, exercise: ExerciseExecution) => {
        const { exercises, currentExerciseIndex } = get()
        const updatedExercises = [...exercises]

        // Hard limit: max 3 extra exercises
        // Count exercises that were not AI-recommended (user-added)
        const userAddedCount = exercises.filter(ex => ex.aiRecommendedSets === undefined).length
        if (userAddedCount >= 3) {
          return {
            success: false,
            error: 'hard_limit',
            message: 'Hai raggiunto il limite di 3 esercizi extra. Rimuovi un esercizio per aggiungerne uno nuovo.'
          }
        }

        // Insert exercise at specified position
        updatedExercises.splice(position, 0, exercise)

        // Update currentExerciseIndex if insertion point is before or at current position
        const newIndex = position <= currentExerciseIndex ? currentExerciseIndex + 1 : currentExerciseIndex

        set({
          exercises: updatedExercises,
          currentExerciseIndex: newIndex,
          lastActivityAt: new Date()
        })

        // Save to database
        get().saveProgress()

        return { success: true }
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
          overallMentalReadiness: null,
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
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          // Convert date strings back to Date objects after deserialization
          return {
            state: {
              ...state,
              startedAt: state.startedAt ? new Date(state.startedAt) : null,
              lastActivityAt: state.lastActivityAt ? new Date(state.lastActivityAt) : null
            }
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      }
    }
  )
)
