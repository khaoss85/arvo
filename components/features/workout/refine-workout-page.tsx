'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw, Check, Play, ChevronDown, ChevronUp, List, PlayCircle, AlertCircle, CheckCircle, XCircle, Trash2, Camera, Type, Loader2, BookOpen, Search, History } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
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
import { SplitReferenceCard } from './split-reference-card'
import { calculateMuscleGroupVolumes } from '@/lib/utils/workout-helpers'
import { ExerciseDBService, type ExerciseDBExercise } from '@/lib/services/exercisedb.service'
import { ExerciseHistoryModal } from './exercise-history-modal'
import { getProgressiveTargetAction } from '@/app/actions/exercise-history-actions'

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
  splitPlan?: any
  sessionDefinition?: any
}

export function RefineWorkoutPage({
  workout,
  userId,
  splitPlan,
  sessionDefinition
}: RefineWorkoutPageProps) {
  const router = useRouter()
  const t = useTranslations('workout.modals.refineWorkout')
  const [exercises, setExercises] = useState<Exercise[]>(workout?.exercises as unknown as Exercise[] || [])
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())
  const [isMarkingReady, setIsMarkingReady] = useState(false)
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

  // Input mode state: 'text' | 'photo' | 'library'
  const [inputMode, setInputMode] = useState<Map<number, 'text' | 'photo' | 'library'>>(new Map())
  const [uploadedImages, setUploadedImages] = useState<Map<number, string | null>>(new Map())
  const [extractingNames, setExtractingNames] = useState<Map<number, boolean>>(new Map())

  // Library search state
  const [librarySearchQuery, setLibrarySearchQuery] = useState<Map<number, string>>(new Map())
  const [libraryResults, setLibraryResults] = useState<Map<number, ExerciseDBExercise[]>>(new Map())
  const [isSearchingLibrary, setIsSearchingLibrary] = useState<Map<number, boolean>>(new Map())

  // Exercise history modal state
  const [historyModalExercise, setHistoryModalExercise] = useState<string | null>(null)

  // Calculate actual muscle group volumes from current exercises
  const actualVolumes = useMemo(() => {
    if (!sessionDefinition) return {}

    return calculateMuscleGroupVolumes(
      exercises.filter(ex => ex.name).map(ex => ({
        name: ex.name,
        sets: ex.sets,
        primaryMuscles: (ex as any).primaryMuscles,
        secondaryMuscles: (ex as any).secondaryMuscles
      }))
    )
  }, [exercises, sessionDefinition])

  // Initialize exercises when workout changes
  React.useEffect(() => {
    const loadExercisesWithAnimations = async () => {
      if (workout?.exercises) {
        // Normalize exercises: use exerciseName as fallback for name field
        const normalizedExercises = (workout.exercises as any[]).map((ex: any) => ({
          ...ex,
          name: ex.name || ex.exerciseName || 'Unknown Exercise'
        })).filter((ex: any) => ex.name && ex.name !== 'Unknown Exercise')

        // Log if any exercises were filtered out
        const filteredCount = (workout.exercises as any[]).length - normalizedExercises.length
        if (filteredCount > 0) {
          console.warn(`[RefineWorkout] Filtered out ${filteredCount} exercises with missing names`, {
            totalExercises: (workout.exercises as any[]).length,
            validExercises: normalizedExercises.length
          })
        }

        const exercisesWithAnimations = await Promise.all(
          normalizedExercises.map(async (ex: Exercise) => {
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

  const handleModeSwitch = (index: number, mode: 'text' | 'photo' | 'library') => {
    setInputMode(new Map(inputMode).set(index, mode))
    if (mode !== 'photo') {
      // Clear photo data when switching away from photo mode
      setUploadedImages(new Map(uploadedImages).set(index, null))
      setExtractingNames(new Map(extractingNames).set(index, false))
    }
    if (mode !== 'library') {
      // Clear library data when switching away from library mode
      setLibrarySearchQuery(new Map(librarySearchQuery).set(index, ''))
      setLibraryResults(new Map(libraryResults).set(index, []))
    }
    // Clear validation result and custom input when switching modes
    setCustomValidationResults(new Map(customValidationResults).set(index, undefined as any))
    setCustomInputs(new Map(customInputs).set(index, ''))
  }

  // Library search handler with debounce
  const handleLibrarySearch = async (index: number, query: string) => {
    setLibrarySearchQuery(new Map(librarySearchQuery).set(index, query))

    if (query.length < 2) {
      setLibraryResults(new Map(libraryResults).set(index, []))
      return
    }

    setIsSearchingLibrary(new Map(isSearchingLibrary).set(index, true))

    try {
      const results = await ExerciseDBService.searchExercises(query, 15)
      setLibraryResults(new Map(libraryResults).set(index, results))
    } catch (err) {
      console.error('Library search failed:', err)
      setLibraryResults(new Map(libraryResults).set(index, []))
    } finally {
      setIsSearchingLibrary(new Map(isSearchingLibrary).set(index, false))
    }
  }

  // Handle library exercise selection (direct swap without AI validation)
  const handleLibrarySelect = async (index: number, libraryExercise: ExerciseDBExercise) => {
    if (!workout) return

    const currentExercise = exercises[index]

    // Check if user has history for this exercise
    let targetWeight = currentExercise.targetWeight
    let targetReps = currentExercise.targetReps
    let rationale = t('library.selectedFrom')

    try {
      const historyResult = await getProgressiveTargetAction(libraryExercise.name, currentExercise.repRange)
      if (historyResult.success && historyResult.data?.hasHistory) {
        targetWeight = historyResult.data.weight
        targetReps = historyResult.data.reps
        rationale = t('library.basedOnHistory')
      }
    } catch (err) {
      console.error('[handleLibrarySelect] Failed to get progressive target:', err)
    }

    const newExercises = [...exercises]

    newExercises[index] = {
      ...currentExercise,
      name: libraryExercise.name,
      equipmentVariant: libraryExercise.equipment,
      animationUrl: libraryExercise.gifUrl || undefined,
      hasAnimation: !!libraryExercise.gifUrl,
      targetWeight,
      targetReps,
      rationale,
    }

    setExercises(newExercises)

    // Clear library search state
    setLibrarySearchQuery(new Map(librarySearchQuery).set(index, ''))
    setLibraryResults(new Map(libraryResults).set(index, []))
    setAlternatives(new Map(alternatives).set(index, []))

    // Invalidate workout rationale since exercises changed
    rationaleRef.current?.invalidate()

    // Save changes to workout
    try {
      const result = await updateWorkoutExercisesAction(workout.id, newExercises)
      if (!result.success) {
        console.error('Failed to save library swap:', result.error)
        alert(t('errors.failedToSave'))
      }
    } catch (error) {
      console.error('Error saving library swap:', error)
      alert(t('errors.failedToSave'))
    }
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
    // Expand the exercise card if not already expanded
    const newExpanded = new Set(expandedExercises)
    if (!newExpanded.has(exerciseIndex)) {
      newExpanded.add(exerciseIndex)
      setExpandedExercises(newExpanded)
    }

    // Load alternatives (which will show AI-suggested alternatives)
    if (!alternativesLoading.get(exerciseIndex)) {
      loadAlternatives(exerciseIndex)
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
            <List className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('buttons.reorder')}</span>
          </Button>
        </div>
      )}

      {/* Split Reference - Target vs Actual Volume Comparison */}
      {sessionDefinition && splitPlan && workout.cycle_day && (
        <SplitReferenceCard
          sessionDefinition={sessionDefinition}
          splitPlan={splitPlan}
          cycleDay={workout.cycle_day}
          actualVolumes={actualVolumes}
        />
      )}

      {/* Workout Rationale - Overall plan understanding */}
      {exercises.length > 0 && (
        <div className="mb-6">
          <WorkoutRationale
            ref={rationaleRef}
            workoutType={workout.workout_type || 'general'}
            exercises={exercises.filter(ex => ex.name).map(ex => ({
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
        {exercises.filter(ex => ex.name).map((exercise, index) => (
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setHistoryModalExercise(exercise.name)
                        }}
                        className="p-0.5 hover:bg-green-600/20 rounded transition-colors group"
                        aria-label={t('exercise.viewHistoryAria', { name: exercise.name })}
                        title={t('exercise.viewHistory')}
                      >
                        <History className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                      </button>
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
                  {/* Replace Button (formerly Regenerate) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!expandedExercises.has(index)) {
                        toggleExerciseExpanded(index)
                      }
                      // If alternatives not loaded, load them. If loaded, maybe just focus? 
                      // For now, let's just ensure it opens the section.
                      // If we want to force re-fetch, we'd call handleRegenerateExercise(index)
                      // But usually "Replace" implies "Show me alternatives".
                      // If the user wants to explicitly re-generate via AI, we might keep that logic inside the expanded view.
                      // Let's make this button toggle the expanded view AND trigger generation if empty.
                      if (!alternatives.get(index)) {
                        handleRegenerateExercise(index)
                      }
                    }}
                    className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    title={t('buttons.replace')}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="sr-only">{t('buttons.replace')}</span>
                  </Button>

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
                <div className="pt-3 border-t space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('rationale.alternatives')}</p>
                  {alternativesLoading.get(index) ? (
                    <div className="flex items-center justify-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-sm text-gray-500">{t('rationale.loadingAlternatives')}</span>
                    </div>
                  ) : alternatives.get(index) && alternatives.get(index)!.length > 0 ? (
                    <div className="space-y-2">
                      {alternatives.get(index)!.map((alt, altIndex) => (
                        <div
                          key={altIndex}
                          className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-purple-200 dark:hover:border-purple-800 transition-all"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="flex items-center gap-2 mb-0.5">
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
                                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors group flex-shrink-0"
                                aria-label={t('exercise.viewAnimationAria', { name: alt.exercise.name })}
                                title={t('exercise.viewAnimation')}
                              >
                                <PlayCircle className="w-4 h-4 text-purple-500 group-hover:text-purple-600 transition-colors" />
                              </button>
                              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{alt.exercise.name}</p>
                            </div>
                            {alt.exercise.equipmentVariant && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{alt.exercise.equipmentVariant}</p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{alt.rationale}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 px-3 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40 border-0"
                            onClick={() => handleSwapExercise(index, altIndex)}
                          >
                            {t('buttons.swap')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic py-2 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg">{t('rationale.noAlternatives')}</p>
                  )}

                  {/* Custom Exercise Input */}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('rationale.custom')}</p>
                    </div>

                    {!customValidationResults.get(index) ? (
                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        {/* 3-Tab Segmented Control: Text / Photo / Library */}
                        <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3">
                          <button
                            onClick={() => handleModeSwitch(index, 'text')}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                              (inputMode.get(index) || 'text') === 'text'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            <Type className="w-3.5 h-3.5" />
                            {t('customInput.textMode')}
                          </button>
                          <button
                            onClick={() => handleModeSwitch(index, 'photo')}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                              inputMode.get(index) === 'photo'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {t('customInput.photoMode')}
                          </button>
                          <button
                            onClick={() => handleModeSwitch(index, 'library')}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                              inputMode.get(index) === 'library'
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            {t('customInput.libraryMode')}
                          </button>
                        </div>

                        {/* Text Mode */}
                        {(inputMode.get(index) || 'text') === 'text' && (
                          <div className="space-y-2">
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
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
                              />
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                              onClick={() => handleValidateCustom(index)}
                              disabled={!customInputs.get(index)?.trim() || customValidating.get(index)}
                            >
                              {customValidating.get(index) ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                  {t('customInput.validating')}
                                </>
                              ) : t('customInput.validate')}
                            </Button>
                            <p className="text-[10px] text-gray-400 text-center">
                              {t('customInput.hint')}
                            </p>
                          </div>
                        )}

                        {/* Photo Mode */}
                        {inputMode.get(index) === 'photo' && (
                          <div>
                            <PhotoUploader
                              onUpload={(base64) => handlePhotoUpload(index, base64)}
                              onClear={() => handleClearPhoto(index)}
                              isLoading={extractingNames.get(index) || customValidating.get(index)}
                            />
                            {extractingNames.get(index) && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  {t('customInput.recognizing')}
                                </p>
                              </div>
                            )}
                            {customInputs.get(index) && !extractingNames.get(index) && (
                              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-lg text-center">
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <strong>{t('customInput.detected')}:</strong> {customInputs.get(index)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Library Mode */}
                        {inputMode.get(index) === 'library' && (
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={t('library.searchPlaceholder')}
                                value={librarySearchQuery.get(index) || ''}
                                onChange={(e) => handleLibrarySearch(index, e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
                                autoComplete="off"
                              />
                              {isSearchingLibrary.get(index) && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
                              )}
                            </div>

                            {/* Search Results */}
                            {(libraryResults.get(index)?.length || 0) > 0 && (
                              <div className="max-h-[200px] overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 bg-white dark:bg-gray-800">
                                {libraryResults.get(index)!.map((exercise, resultIndex) => (
                                  <button
                                    key={exercise.id || `exercise-${resultIndex}`}
                                    onClick={() => handleLibrarySelect(index, exercise)}
                                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                  >
                                    {exercise.gifUrl && (
                                      <img
                                        src={exercise.gifUrl}
                                        alt={exercise.name}
                                        className="w-10 h-10 rounded object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-600"
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate capitalize">
                                        {exercise.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {exercise.target} • {exercise.equipment}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* No results */}
                            {(librarySearchQuery.get(index)?.length || 0) >= 2 && !isSearchingLibrary.get(index) && (libraryResults.get(index)?.length || 0) === 0 && (
                              <p className="text-xs text-gray-500 text-center py-3">
                                {t('library.noResults')}
                              </p>
                            )}

                            {/* Hint */}
                            {(librarySearchQuery.get(index)?.length || 0) < 2 && (
                              <p className="text-[10px] text-gray-400 text-center">
                                {t('library.hint')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`border-2 rounded-lg p-3 ${customValidationResults.get(index)!.validation === 'approved'
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

              {/* Action Buttons - Removed old Regenerate button as it's now in header */}
              {/* <div className="flex gap-2 pt-2">
                <Button ... > ... </Button>
              </div> */}
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
      <div className="sticky bottom-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md py-4 px-4 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="default"
            onClick={handleMarkAsReady}
            disabled={isMarkingReady}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all h-12 text-base font-semibold"
          >
            {isMarkingReady ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('buttons.saving')}
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                {t('buttons.saveAndReturn')}
              </>
            )}
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
        excludeExercises={exercises.filter(ex => ex.name).map(ex => ex.name.toLowerCase())}
        enableAISuggestions={true}
        enableAIValidation={true}
        userId={userId}
        currentWorkoutContext={{
          existingExercises: exercises.filter(ex => ex.name).map(ex => {
            const muscleGroups = extractMuscleGroupsFromExercise(ex.name, ex.equipmentVariant)
            const exerciseName = ex.name.toLowerCase()
            return {
              name: ex.name,
              sets: ex.sets,
              muscleGroups: {
                primary: muscleGroups.primary,
                secondary: muscleGroups.secondary,
              },
              movementPattern: undefined, // Could be enhanced later
              isCompound: exerciseName.includes('press') ||
                exerciseName.includes('squat') ||
                exerciseName.includes('deadlift') ||
                exerciseName.includes('row') ||
                exerciseName.includes('pull-up') ||
                exerciseName.includes('chin-up'),
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

      {/* Exercise History Modal */}
      {historyModalExercise && (
        <ExerciseHistoryModal
          isOpen={true}
          onClose={() => setHistoryModalExercise(null)}
          exerciseName={historyModalExercise}
        />
      )}
    </div>
  )
}
