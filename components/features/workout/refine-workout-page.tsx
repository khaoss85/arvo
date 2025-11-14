'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw, Check, Play, ChevronDown, ChevronUp, List, PlayCircle, AlertCircle, CheckCircle, XCircle, Trash2, Camera, Type, Loader2 } from 'lucide-react'
import { updateWorkoutStatusAction, updateWorkoutExercisesAction, suggestExerciseSubstitutionAction, validateCustomSubstitutionAction, validateWorkoutModificationAction, extractEquipmentNameFromImageAction } from '@/app/actions/ai-actions'
import type { SubstitutionSuggestion, SubstitutionInput, CustomSubstitutionInput } from '@/lib/agents/exercise-substitution.agent'
import type { ModificationValidationInput, ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import type { Workout } from '@/lib/types/schemas'
import { WorkoutRationale, WorkoutRationaleHandle } from './workout-rationale'
import { ExerciseAnimationModal } from './exercise-animation-modal'
import { AnimationService } from '@/lib/services/animation.service'
import { ReorderExercisesReviewModal } from './reorder-exercises-review-modal'
import { AddSetButton } from './add-set-button'
import { AddExerciseButton } from './add-exercise-button'
import { AddExerciseModal } from './add-exercise-modal'
import { UserModificationBadge } from './user-modification-badge'
import { ConfirmDialog } from './confirm-dialog'
import { PhotoUploader } from '@/components/ui/photo-uploader'
import { extractMuscleGroupsFromExercise } from '@/lib/utils/exercise-muscle-mapper'
import { inferWorkoutType } from '@/lib/services/muscle-groups.service'
import { validationCache } from '@/lib/utils/validation-cache'
import { transformToExerciseExecution } from '@/lib/utils/exercise-transformer'

interface Exercise {
  name: string
  equipmentVariant?: string
  sets: number
  repRange: [number, number]
  restSeconds: number
  targetWeight: number
  targetReps: number
  rationale?: string
  alternatives?: Array<{
    name: string
    equipmentVariant?: string
    rationale: string
  }>
  animationUrl?: string
  hasAnimation?: boolean

  // User modification tracking (matches ExerciseExecution)
  aiRecommendedSets?: number
  userAddedSets?: number
  userModifications?: {
    addedSets: number
    reason?: string
    aiWarnings?: string[]
    userOverride: boolean
    modifiedAt: string
  }
}

interface RefineWorkoutPageProps {
  workout: Workout
  userId: string
}

export function RefineWorkoutPage({
  workout,
  userId
}: RefineWorkoutPageProps) {
  const router = useRouter()
  const t = useTranslations('workout.modals.refineWorkout')
  const [exercises, setExercises] = useState<Exercise[]>(workout?.exercises as unknown as Exercise[] || [])
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null)
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false)
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false)
  const [customInputs, setCustomInputs] = useState<Map<number, string>>(new Map())
  const [animationModalOpen, setAnimationModalOpen] = useState<number | null>(null)
  const rationaleRef = useRef<WorkoutRationaleHandle>(null)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'confirm' | 'alert' | 'warning'
    title: string
    message: string
    onConfirm?: () => void
    confirmText?: string
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  })

  // AI Alternatives state
  const [alternatives, setAlternatives] = useState<Map<number, SubstitutionSuggestion[]>>(new Map())
  const [alternativesLoading, setAlternativesLoading] = useState<Map<number, boolean>>(new Map())
  const [alternativeAnimationModal, setAlternativeAnimationModal] = useState<{
    name: string
    equipmentVariant?: string
    animationUrl: string | null
  } | null>(null)

  // Custom input validation state
  const [customValidationResults, setCustomValidationResults] = useState<Map<number, SubstitutionSuggestion>>(new Map())
  const [customValidating, setCustomValidating] = useState<Map<number, boolean>>(new Map())

  // Photo mode state
  const [photoMode, setPhotoMode] = useState<Map<number, boolean>>(new Map())
  const [uploadedImages, setUploadedImages] = useState<Map<number, string | null>>(new Map())
  const [extractingNames, setExtractingNames] = useState<Map<number, boolean>>(new Map())

  // Initialize exercises when workout changes
  React.useEffect(() => {
    const loadExercisesWithAnimations = async () => {
      if (workout?.exercises) {
        const exercisesWithAnimations = await Promise.all(
          (workout.exercises as unknown as Exercise[]).map(async (ex) => {
            const animationUrl = await AnimationService.getAnimationUrl({
              name: ex.name,
              canonicalPattern: ex.name,
              equipmentVariant: ex.equipmentVariant
            })
            return {
              ...ex,
              animationUrl: animationUrl || undefined,
              hasAnimation: !!animationUrl
            }
          })
        )
        setExercises(exercisesWithAnimations)
      }
    }

    loadExercisesWithAnimations()
  }, [workout])

  const toggleExerciseExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
      // Load alternatives if not already loaded
      if (!alternatives.has(index) && !alternativesLoading.get(index)) {
        loadAlternatives(index)
      }
    }
    setExpandedExercises(newExpanded)
  }

  const loadAlternatives = async (index: number) => {
    const exercise = exercises[index]
    if (!exercise) return

    // Set loading state
    setAlternativesLoading(new Map(alternativesLoading).set(index, true))

    try {
      const input: SubstitutionInput = {
        currentExercise: {
          name: exercise.name,
          equipmentVariant: exercise.equipmentVariant || '',
          sets: exercise.sets,
          repRange: exercise.repRange,
          targetWeight: exercise.targetWeight,
        },
        userId,
        approachId: '',
        weakPoints: [],
        availableEquipment: [],
      }

      const result = await suggestExerciseSubstitutionAction(userId, input)

      if (result.success && result.data) {
        setAlternatives(new Map(alternatives).set(index, result.data.suggestions))
      }
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setAlternativesLoading(new Map(alternativesLoading).set(index, false))
    }
  }

  const handleValidateCustom = async (index: number) => {
    const customInput = customInputs.get(index)
    const exercise = exercises[index]

    if (!customInput?.trim() || customInput.length < 3 || !exercise) return

    // Set validating state
    setCustomValidating(new Map(customValidating).set(index, true))

    try {
      const input: CustomSubstitutionInput = {
        currentExercise: {
          name: exercise.name,
          equipmentVariant: exercise.equipmentVariant || '',
          sets: exercise.sets,
          repRange: exercise.repRange,
          targetWeight: exercise.targetWeight,
        },
        customExerciseName: customInput.trim(),
        userId,
        approachId: '',
        weakPoints: [],
        availableEquipment: [],
      }

      const result = await validateCustomSubstitutionAction(userId, input)

      if (result.success && result.data) {
        setCustomValidationResults(new Map(customValidationResults).set(index, result.data))
      }
    } catch (error) {
      console.error('Failed to validate custom input:', error)
    } finally {
      setCustomValidating(new Map(customValidating).set(index, false))
    }
  }

  const handleModeSwitch = (index: number, isPhotoMode: boolean) => {
    setPhotoMode(new Map(photoMode).set(index, isPhotoMode))
    if (!isPhotoMode) {
      // Clear photo data when switching to text mode
      setUploadedImages(new Map(uploadedImages).set(index, null))
      setExtractingNames(new Map(extractingNames).set(index, false))
    }
    // Clear validation result and custom input when switching modes
    setCustomValidationResults(new Map(customValidationResults).set(index, undefined as any))
    setCustomInputs(new Map(customInputs).set(index, ''))
  }

  const handlePhotoUpload = async (index: number, base64: string) => {
    setUploadedImages(new Map(uploadedImages).set(index, base64))
    setExtractingNames(new Map(extractingNames).set(index, true))
    setCustomValidationResults(new Map(customValidationResults).set(index, undefined as any))

    try {
      const result = await extractEquipmentNameFromImageAction(base64)

      if (result.success) {
        setCustomInputs(new Map(customInputs).set(index, result.detectedName))
        setExtractingNames(new Map(extractingNames).set(index, false))
        // Auto-validate after successful extraction
        await handleValidateCustomWithName(index, result.detectedName)
      } else {
        console.error('Failed to extract equipment name:', result.error)
        setUploadedImages(new Map(uploadedImages).set(index, null))
      }
    } catch (error) {
      console.error('Failed to extract equipment name:', error)
      setUploadedImages(new Map(uploadedImages).set(index, null))
    } finally {
      setExtractingNames(new Map(extractingNames).set(index, false))
    }
  }

  const handleValidateCustomWithName = async (index: number, equipmentName: string) => {
    const exercise = exercises[index]

    if (!equipmentName?.trim() || equipmentName.length < 3 || !exercise) return

    // Set validating state
    setCustomValidating(new Map(customValidating).set(index, true))

    try {
      const input: CustomSubstitutionInput = {
        currentExercise: {
          name: exercise.name,
          equipmentVariant: exercise.equipmentVariant || '',
          sets: exercise.sets,
          repRange: exercise.repRange,
          targetWeight: exercise.targetWeight,
        },
        customExerciseName: equipmentName.trim(),
        userId,
        approachId: '',
        weakPoints: [],
        availableEquipment: [],
      }

      const result = await validateCustomSubstitutionAction(userId, input)

      if (result.success && result.data) {
        setCustomValidationResults(new Map(customValidationResults).set(index, result.data))
      }
    } catch (error) {
      console.error('Failed to validate custom input:', error)
    } finally {
      setCustomValidating(new Map(customValidating).set(index, false))
    }
  }

  const handleClearPhoto = (index: number) => {
    setUploadedImages(new Map(uploadedImages).set(index, null))
    setCustomInputs(new Map(customInputs).set(index, ''))
    setCustomValidationResults(new Map(customValidationResults).set(index, undefined as any))
  }

  const handleSwapExercise = async (exerciseIndex: number, alternativeIndex: number) => {
    const exercise = exercises[exerciseIndex]
    const exerciseAlternatives = alternatives.get(exerciseIndex)
    const alternative = exerciseAlternatives?.[alternativeIndex]

    if (!alternative || !workout) return

    // Replace exercise with alternative
    const newExercises = [...exercises]
    newExercises[exerciseIndex] = {
      ...exercise,
      name: alternative.exercise.name,
      equipmentVariant: alternative.exercise.equipmentVariant || exercise.equipmentVariant,
      rationale: alternative.rationale
    }

    setExercises(newExercises)

    // Invalidate workout rationale since exercises changed
    rationaleRef.current?.invalidate()

    // Save changes to workout
    try {
      const result = await updateWorkoutExercisesAction(workout.id, newExercises)
      if (!result.success) {
        console.error('Failed to save exercise swap:', result.error)
        alert(t('errors.failedToSave'))
      }
    } catch (error) {
      console.error('Error saving exercise swap:', error)
      alert(t('errors.failedToSave'))
    }
  }

  const handleCustomSwap = async (exerciseIndex: number) => {
    const validationResult = customValidationResults.get(exerciseIndex)

    if (!validationResult || !workout) return

    const exercise = exercises[exerciseIndex]

    // Replace exercise with validated custom input
    const newExercises = [...exercises]
    newExercises[exerciseIndex] = {
      ...exercise,
      name: validationResult.exercise.name,
      equipmentVariant: validationResult.exercise.equipmentVariant,
      sets: validationResult.exercise.sets,
      repRange: validationResult.exercise.repRange,
      targetWeight: validationResult.exercise.targetWeight,
      rationale: validationResult.rationale
    }

    setExercises(newExercises)
    setCustomInputs(new Map(customInputs).set(exerciseIndex, ''))
    setCustomValidationResults(new Map(customValidationResults))
    customValidationResults.delete(exerciseIndex)

    // Invalidate workout rationale since exercises changed
    rationaleRef.current?.invalidate()

    // Save changes to workout
    try {
      const result = await updateWorkoutExercisesAction(workout.id, newExercises)
      if (!result.success) {
        console.error('Failed to save custom exercise:', result.error)
        alert(t('errors.failedToSave'))
      }
    } catch (error) {
      console.error('Error saving custom exercise:', error)
      alert(t('errors.failedToSave'))
    }
  }

  const handleValidateAddSet = async (exerciseIndex: number): Promise<ModificationValidationOutput | null> => {
    const exercise = exercises[exerciseIndex]
    if (!exercise || !workout || !userId) return null

    try {
      // Check cache first
      const cached = validationCache.get(
        exercise.name,
        exercise.sets,
        exercise.sets + 1,
        userId
      )
      if (cached) {
        return cached
      }

      // Extract muscle groups
      const muscleGroups = extractMuscleGroupsFromExercise(
        exercise.name,
        exercise.equipmentVariant
      )

      // Build validation input
      const validationInput: ModificationValidationInput = {
        exerciseInfo: {
          name: exercise.name,
          equipmentVariant: exercise.equipmentVariant,
          currentSets: exercise.sets,
          proposedSets: exercise.sets + 1,
          muscleGroups,
          // TODO: Could enrich with movement pattern, ROM emphasis, stimulus-to-fatigue from exercise database
        },
        workoutContext: {
          workoutType: inferWorkoutType(exercises) as any,
          totalExercises: exercises.length,
          // TODO: Could calculate weekly volume from user's completed workouts
        },
        userContext: {
          userId,
          approachId: workout.approach_id || '', // Will be enriched server-side
        },
      }

      // Call validation action
      const result = await validateWorkoutModificationAction(userId, validationInput)

      if (!result.success || !result.validation) {
        console.error('Validation failed:', result.error)
        return null
      }

      // Cache the result
      validationCache.set(
        exercise.name,
        exercise.sets,
        exercise.sets + 1,
        userId,
        result.validation
      )

      return result.validation
    } catch (error) {
      console.error('Error validating modification:', error)
      return null
    }
  }

  const handleAddSet = async (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex]
    if (!exercise || !workout) return { success: false }

    try {
      // Calculate new added sets count
      const currentAddedSets = exercise.userAddedSets || 0
      const newAddedSets = currentAddedSets + 1

      // HARD LIMIT: Maximum 5 extra sets
      if (newAddedSets > 5) {
        alert(t('alerts.maxExtraSets'))
        return { success: false, error: 'hard_limit' }
      }

      // SOFT WARNING: At 3+ extra sets
      if (newAddedSets >= 3) {
        const proceed = confirm(t('alerts.highVolumeWarning', { count: newAddedSets }))
        if (!proceed) return { success: false, error: 'user_cancelled' }
      }

      // Update local state
      const newExercises = [...exercises]
      const warnings: string[] = newAddedSets >= 3 ? [t('alerts.highVolumeLabel')] : []

      newExercises[exerciseIndex] = {
        ...exercise,
        sets: exercise.sets + 1,
        aiRecommendedSets: exercise.aiRecommendedSets || exercise.sets,
        userAddedSets: newAddedSets,
        userModifications: {
          addedSets: newAddedSets,
          aiWarnings: warnings,
          userOverride: newAddedSets >= 3,
          modifiedAt: new Date().toISOString()
        }
      }

      setExercises(newExercises)

      // Invalidate workout rationale since exercises changed
      rationaleRef.current?.invalidate()

      // Save changes to workout
      const result = await updateWorkoutExercisesAction(workout.id, newExercises)
      if (!result.success) {
        console.error('Failed to add set:', result.error)
        alert(t('errors.failedToAddSet'))
        // Revert on failure
        setExercises([...exercises])
        return { success: false }
      }

      return {
        success: true,
        warning: newAddedSets >= 3 ? warnings[0] : undefined
      }
    } catch (error) {
      console.error('Error adding set:', error)
      alert(t('errors.failedToAddSet'))
      // Revert on failure
      setExercises([...exercises])
      return { success: false }
    }
  }

  const handleRegenerateExercise = async (exerciseIndex: number) => {
    setIsRegenerating(exerciseIndex)

    try {
      // TODO: Call AI to regenerate single exercise
      // const newExercise = await regenerateSingleExercise(workout.id, exerciseIndex)
      // const newExercises = [...exercises]
      // newExercises[exerciseIndex] = newExercise
      // setExercises(newExercises)

      // Placeholder: simulate regeneration
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Regenerate exercise', exerciseIndex)
    } catch (error) {
      console.error('Failed to regenerate exercise:', error)
      alert(t('errors.failedToRegenerate'))
    } finally {
      setIsRegenerating(null)
    }
  }

  const handleReorderComplete = (reorderedExercises: Exercise[]) => {
    setExercises(reorderedExercises)
    rationaleRef.current?.invalidate()
  }

  const handleMarkAsReady = async () => {
    if (!workout) return

    setIsMarkingReady(true)

    try {
      const result = await updateWorkoutStatusAction(workout.id, 'ready')

      if (result.success) {
        router.push('/dashboard')
      } else {
        alert(t('errors.failedToMarkReady'))
      }
    } catch (error) {
      console.error('Failed to mark workout as ready:', error)
      alert(t('errors.failedToMarkReady'))
    } finally {
      setIsMarkingReady(false)
    }
  }

  const handleStartWorkout = async () => {
    if (!workout) return

    // Mark as ready first if not already
    if (workout.status !== 'ready') {
      setIsMarkingReady(true)
      try {
        const result = await updateWorkoutStatusAction(workout.id, 'ready')
        if (!result.success) {
          alert(t('errors.failedToPrepareWorkout', { error: result.error || 'Unknown error' }))
          return
        }
      } catch (error) {
        console.error('Failed to prepare workout:', error)
        alert(t('errors.failedToPrepareWorkoutGeneric'))
        return
      } finally {
        setIsMarkingReady(false)
      }
    }

    // Navigate to workout execution
    router.push(`/workout/${workout.id}`)
  }

  const handleOpenAddExercise = async () => {
    // Count user-added exercises (those without AI recommendation)
    // User-added exercises have aiRecommendedSets === undefined
    const userAddedCount = exercises.filter(ex => ex.aiRecommendedSets === undefined).length

    // Hard limit: max 3 extra exercises
    if (userAddedCount >= 3) {
      return {
        success: false,
        error: 'hard_limit',
        message: t('addExercise.hardLimitReached')
      }
    }

    setIsAddExerciseModalOpen(true)
    return { success: true }
  }

  const handleSelectExercise = async (selectedExercise: {
    id: string
    name: string
    bodyPart: string
    equipment: string
    target: string
    primaryMuscles?: string[]
    secondaryMuscles?: string[]
    animationUrl?: string | null
    hasAnimation?: boolean
  }) => {
    if (!workout) return

    try {
      // Transform to Exercise format (not ExerciseExecution)
      const newExercise: Exercise = {
        name: selectedExercise.name,
        equipmentVariant: selectedExercise.equipment,
        sets: selectedExercise.bodyPart?.toLowerCase().includes('chest') ||
              selectedExercise.bodyPart?.toLowerCase().includes('back') ||
              selectedExercise.bodyPart?.toLowerCase().includes('legs') ? 3 : 2,
        repRange: selectedExercise.name.toLowerCase().includes('curl') ||
                  selectedExercise.name.toLowerCase().includes('raise') ? [10, 15] : [8, 12],
        restSeconds: selectedExercise.name.toLowerCase().includes('squat') ||
                     selectedExercise.name.toLowerCase().includes('deadlift') ? 180 : 90,
        targetWeight: 20,
        targetReps: 10,
        animationUrl: selectedExercise.animationUrl || undefined,
        hasAnimation: selectedExercise.hasAnimation || false,
        // Mark as user-added (not AI-recommended)
        aiRecommendedSets: undefined,
        userAddedSets: undefined,
      }

      // Add to end of exercises array
      const newExercises = [...exercises, newExercise]
      setExercises(newExercises)

      // Invalidate workout rationale since exercises changed
      rationaleRef.current?.invalidate()

      // Save changes to workout
      const result = await updateWorkoutExercisesAction(workout.id, newExercises)
      if (!result.success) {
        console.error('Failed to add exercise:', result.error)
        // Revert on failure
        setExercises([...exercises])
        setConfirmDialog({
          isOpen: true,
          type: 'alert',
          title: t('errors.error'),
          message: t('errors.failedToAddExercise'),
        })
        return
      }

      // Close modal on success
      setIsAddExerciseModalOpen(false)
    } catch (error) {
      console.error('Error adding exercise:', error)
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: t('errors.error'),
        message: t('errors.failedToAddExercise'),
      })
    }
  }

  const handleRemoveExercise = (indexToRemove: number) => {
    if (!workout) return

    const exerciseToRemove = exercises[indexToRemove]

    // Only allow removing user-added exercises
    if (exerciseToRemove.aiRecommendedSets !== undefined) {
      setConfirmDialog({
        isOpen: true,
        type: 'alert',
        title: t('removeDialog.cannotRemoveTitle'),
        message: t('removeDialog.cannotRemoveMessage'),
      })
      return
    }

    // Confirm removal
    setConfirmDialog({
      isOpen: true,
      type: 'warning',
      title: t('removeDialog.confirmTitle'),
      message: t('removeDialog.confirmMessage', { name: exerciseToRemove.name }),
      confirmText: t('removeDialog.removeButton'),
      onConfirm: async () => {
        try {
          // Remove exercise from array
          const newExercises = exercises.filter((_, index) => index !== indexToRemove)
          setExercises(newExercises)

          // Invalidate workout rationale since exercises changed
          rationaleRef.current?.invalidate()

          // Save changes to workout
          const result = await updateWorkoutExercisesAction(workout.id, newExercises)
          if (!result.success) {
            console.error('Failed to remove exercise:', result.error)
            // Revert on failure
            setExercises([...exercises])
            setConfirmDialog({
              isOpen: true,
              type: 'alert',
              title: t('errors.error'),
              message: t('errors.failedToRemoveExercise'),
            })
            return
          }
          // Close dialog on success
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        } catch (error) {
          console.error('Error removing exercise:', error)
          setConfirmDialog({
            isOpen: true,
            type: 'alert',
            title: t('errors.error'),
            message: t('errors.failedToRemoveExercise'),
          })
        }
      },
    })
  }

  if (!workout) return null

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header with Actions */}
      {exercises.length > 1 && (
        <div className="flex justify-end items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setIsReorderModalOpen(true)}
            disabled={isMarkingReady}
            size="sm"
          >
            <List className="w-4 h-4 mr-2" />
            {t('buttons.reorder')}
          </Button>
        </div>
      )}

      {/* Workout Rationale - Overall plan understanding */}
      {exercises.length > 0 && (
        <div className="mb-6">
          <WorkoutRationale
            ref={rationaleRef}
            workoutType={workout.workout_type || 'general'}
            exercises={exercises.map(ex => ({
              exerciseName: ex.name,
              targetSets: ex.sets,
              targetReps: ex.repRange,
              targetWeight: ex.targetWeight
            }))}
            userId={userId}
          />
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4 mb-6">
        {exercises.map((exercise, index) => (
          <Card key={`exercise-${index}`} className="p-4">
            <div className="space-y-3">
              {/* Exercise Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {exercise.hasAnimation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnimationModalOpen(index)
                          }}
                          className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                          aria-label={t('exercise.viewAnimationAria', { name: exercise.name })}
                          title={t('exercise.viewAnimation')}
                        >
                          <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </button>
                      )}
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                      {exercise.userAddedSets && exercise.userAddedSets > 0 && (
                        <UserModificationBadge
                          addedSets={exercise.userAddedSets}
                          aiRecommendedSets={exercise.aiRecommendedSets || exercise.sets}
                          variant="compact"
                        />
                      )}
                    </div>
                    {exercise.equipmentVariant && (
                      <p className="text-sm text-muted-foreground">{exercise.equipmentVariant}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Show remove button only for user-added exercises */}
                  {exercise.aiRecommendedSets === undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title={t('exercise.removeExercise')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExerciseExpanded(index)}
                  >
                    {expandedExercises.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Exercise Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('exercise.sets')}</span>
                  <span className="ml-2 font-medium">{exercise.sets}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('exercise.reps')}</span>
                  <span className="ml-2 font-medium">
                    {exercise.repRange ? `${exercise.repRange[0]}-${exercise.repRange[1]}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('exercise.weight')}</span>
                  <span className="ml-2 font-medium">{exercise.targetWeight} {t('exercise.units.kg')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('exercise.rest')}</span>
                  <span className="ml-2 font-medium">{exercise.restSeconds}{t('exercise.units.seconds')}</span>
                </div>
              </div>

              {/* Add Set Button */}
              <div className="flex justify-end pt-1">
                <AddSetButton
                  currentSets={exercise.sets}
                  onAddSet={() => handleAddSet(index)}
                  variant="inline"
                  userAddedSets={exercise.userAddedSets}
                  enableAIValidation={true}
                  onRequestValidation={() => handleValidateAddSet(index)}
                  exerciseName={exercise.name}
                />
              </div>

              {/* User Modification Details */}
              {exercise.userAddedSets && exercise.userAddedSets > 0 && (
                <div className="pt-2 text-xs text-gray-400 flex items-center justify-between">
                  <span>
                    {t('userModifications.aiRecommended', { count: exercise.aiRecommendedSets || exercise.sets })} •
                    {' '}{t('userModifications.youAdded', { count: exercise.userAddedSets })}
                  </span>
                  {exercise.userModifications?.aiWarnings && exercise.userModifications.aiWarnings.length > 0 && (
                    <span className="text-yellow-400">{t('userModifications.volumeWarning')}</span>
                  )}
                </div>
              )}

              {/* Rationale (Expanded) */}
              {expandedExercises.has(index) && exercise.rationale && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">{t('rationale.title')}</p>
                  <p className="text-sm">{exercise.rationale}</p>
                </div>
              )}

              {/* Alternatives (Expanded) */}
              {expandedExercises.has(index) && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">{t('rationale.alternatives')}</p>
                  {alternativesLoading.get(index) ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-muted-foreground">{t('rationale.loadingAlternatives')}</span>
                    </div>
                  ) : alternatives.get(index) && alternatives.get(index)!.length > 0 ? (
                    alternatives.get(index)!.map((alt, altIndex) => (
                      <div
                        key={altIndex}
                        className="flex items-start justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {/* Animation Preview Icon */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Load animation URL dynamically
                                const animationUrl = await AnimationService.getAnimationUrl({
                                  name: alt.exercise.name,
                                  canonicalPattern: alt.exercise.name,
                                  equipmentVariant: alt.exercise.equipmentVariant,
                                })
                                setAlternativeAnimationModal({
                                  name: alt.exercise.name,
                                  equipmentVariant: alt.exercise.equipmentVariant,
                                  animationUrl: animationUrl || null,
                                })
                              }}
                              className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                              aria-label={t('exercise.viewAnimationAria', { name: alt.exercise.name })}
                              title={t('exercise.viewAnimation')}
                            >
                              <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                            </button>
                            <p className="font-medium text-sm">{alt.exercise.name}</p>
                          </div>
                          {alt.exercise.equipmentVariant && (
                            <p className="text-xs text-muted-foreground">{alt.exercise.equipmentVariant}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{alt.rationale}</p>
                        </div>
                        <Button
                          variant="outline"
                        size="sm"
                        onClick={() => handleSwapExercise(index, altIndex)}
                      >
                        {t('buttons.swap')}
                      </Button>
                    </div>
                  ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">{t('rationale.noAlternatives')}</p>
                  )}

                  {/* Custom Exercise Input */}
                  <div className="pt-2 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{t('rationale.custom')}</p>
                    {!customValidationResults.get(index) ? (
                      <>
                        {/* Mode Toggle */}
                        <div className="flex gap-2 mb-3">
                          <Button
                            variant={!photoMode.get(index) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleModeSwitch(index, false)}
                          >
                            <Type className="w-4 h-4 mr-2" />
                            {t('customInput.textMode')}
                          </Button>
                          <Button
                            variant={photoMode.get(index) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleModeSwitch(index, true)}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {t('customInput.photoMode')}
                          </Button>
                        </div>

                        {/* Conditional Input */}
                        {!photoMode.get(index) ? (
                          <>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={t('customInput.placeholder')}
                                value={customInputs.get(index) || ''}
                                onChange={(e) => {
                                  const newInputs = new Map(customInputs)
                                  newInputs.set(index, e.target.value)
                                  setCustomInputs(newInputs)
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && customInputs.get(index)?.trim()) {
                                    handleValidateCustom(index)
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleValidateCustom(index)}
                                disabled={!customInputs.get(index)?.trim() || customValidating.get(index)}
                              >
                                {customValidating.get(index) ? t('customInput.validating') : t('customInput.validate')}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('customInput.hint')}
                            </p>
                          </>
                        ) : (
                          <div>
                            <PhotoUploader
                              onUpload={(base64) => handlePhotoUpload(index, base64)}
                              onClear={() => handleClearPhoto(index)}
                              isLoading={extractingNames.get(index) || customValidating.get(index)}
                            />
                            {extractingNames.get(index) && (
                              <div className="mt-2 p-2 bg-blue-950/20 rounded-lg border border-blue-800">
                                <p className="text-sm text-blue-400 flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {t('customInput.recognizing')}
                                </p>
                              </div>
                            )}
                            {customInputs.get(index) && !extractingNames.get(index) && (
                              <div className="mt-2 p-2 bg-blue-950/20 border border-blue-800 rounded-lg">
                                <p className="text-xs text-blue-400">
                                  <strong>{t('customInput.detected')}:</strong> {customInputs.get(index)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={`border-2 rounded-lg p-3 ${
                        customValidationResults.get(index)!.validation === 'approved'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : customValidationResults.get(index)!.validation === 'caution'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                          : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      }`}>
                        <div className="flex items-start gap-2 mb-2">
                          {customValidationResults.get(index)!.validation === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : customValidationResults.get(index)!.validation === 'caution' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {/* Animation Preview Icon */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  // Load animation URL dynamically
                                  const animationUrl = await AnimationService.getAnimationUrl({
                                    name: customValidationResults.get(index)!.exercise.name,
                                    canonicalPattern: customValidationResults.get(index)!.exercise.name,
                                    equipmentVariant: customValidationResults.get(index)!.exercise.equipmentVariant,
                                  })
                                  setAlternativeAnimationModal({
                                    name: customValidationResults.get(index)!.exercise.name,
                                    equipmentVariant: customValidationResults.get(index)!.exercise.equipmentVariant,
                                    animationUrl: animationUrl || null,
                                  })
                                }}
                                className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                                aria-label={t('exercise.viewAnimationAria', { name: customValidationResults.get(index)!.exercise.name })}
                                title={t('exercise.viewAnimation')}
                              >
                                <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                              </button>
                              <p className="font-medium text-sm">{customValidationResults.get(index)!.exercise.name}</p>
                            </div>
                            {customValidationResults.get(index)!.validation === 'caution' ? (
                              <p className="text-xs mt-1 font-medium text-yellow-700 dark:text-yellow-400">
                                {t('validation.caution', { rationale: customValidationResults.get(index)!.rationale })}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">{customValidationResults.get(index)!.rationale}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newResults = new Map(customValidationResults)
                              newResults.delete(index)
                              setCustomValidationResults(newResults)
                            }}
                          >
                            {t('validation.edit')}
                          </Button>
                          {(customValidationResults.get(index)!.validation === 'approved' ||
                            customValidationResults.get(index)!.validation === 'caution') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCustomSwap(index)}
                            >
                              {t('buttons.swap')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateExercise(index)}
                  disabled={isRegenerating === index}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating === index ? 'animate-spin' : ''}`} />
                  {isRegenerating === index ? t('buttons.regenerating') : t('buttons.regenerate')}
                </Button>
              </div>
                    </div>
                  </Card>
                ))}
              </div>

      {/* Add Exercise Section */}
      <div className="mb-6">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-500">
            {t('addExercise.extraExercises', { current: exercises.filter(ex => ex.aiRecommendedSets === undefined).length, max: 3 })}
          </p>
        </div>
        <AddExerciseButton
          position="end"
          onAddExercise={handleOpenAddExercise}
          variant="full"
          currentExerciseCount={exercises.length}
        />
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleMarkAsReady}
            disabled={isMarkingReady}
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            {isMarkingReady ? t('buttons.saving') : t('buttons.saveAndReturn')}
          </Button>
        </div>
      </div>

      {/* Exercise Animation Modal */}
      {animationModalOpen !== null && exercises[animationModalOpen] && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAnimationModalOpen(null)}
          exerciseName={exercises[animationModalOpen].name}
          animationUrl={exercises[animationModalOpen].animationUrl || null}
        />
      )}

      {/* Animation Modal for AI Alternatives */}
      {alternativeAnimationModal && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAlternativeAnimationModal(null)}
          exerciseName={alternativeAnimationModal.name}
          animationUrl={alternativeAnimationModal.animationUrl}
        />
      )}

      {/* Reorder Exercises Modal */}
      {isReorderModalOpen && (
        <ReorderExercisesReviewModal
          exercises={exercises}
          workoutId={workout.id}
          workoutType={workout.workout_type || 'general'}
          approachId={workout.approach_id || ''}
          onClose={() => setIsReorderModalOpen(false)}
          onReorderComplete={handleReorderComplete}
          onRationaleInvalidate={() => rationaleRef.current?.invalidate()}
        />
      )}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onSelectExercise={handleSelectExercise}
        currentWorkoutType={workout.workout_type || 'general'}
        excludeExercises={exercises.map(ex => ex.name.toLowerCase())}
        enableAISuggestions={true}
        enableAIValidation={true}
        userId={userId}
        currentWorkoutContext={{
          existingExercises: exercises.map(ex => {
            const muscleGroups = extractMuscleGroupsFromExercise(ex.name, ex.equipmentVariant)
            return {
              name: ex.name,
              sets: ex.sets,
              muscleGroups: {
                primary: muscleGroups.primary,
                secondary: muscleGroups.secondary,
              },
              movementPattern: undefined, // Could be enhanced later
              isCompound: ex.name.toLowerCase().includes('press') ||
                         ex.name.toLowerCase().includes('squat') ||
                         ex.name.toLowerCase().includes('deadlift') ||
                         ex.name.toLowerCase().includes('row') ||
                         ex.name.toLowerCase().includes('pull-up') ||
                         ex.name.toLowerCase().includes('chin-up'),
            }
          }),
          totalExercises: exercises.length,
          totalSets: exercises.reduce((sum, ex) => sum + ex.sets, 0),
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
    </div>
  )
}
