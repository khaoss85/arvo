'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { HelpCircle, ChevronDown, Target, Clock, SkipForward, RefreshCw, Pencil, Plus, Minus, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { useProgressionSuggestion } from '@/lib/hooks/useAI'
import { explainExerciseSelectionAction, explainProgressionAction, validateWorkoutModificationAction } from '@/app/actions/ai-actions'
import type { ModificationValidationInput, ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { SetLogger } from './set-logger'
import { RestTimer } from './rest-timer'
import { AISuggestionCard } from './ai-suggestion-card'
import { CompletedSetsList } from './completed-sets-list'
import { ExerciseSubstitution } from './exercise-substitution'
import { AddSetButton } from './add-set-button'
import { AddExerciseButton } from './add-exercise-button'
import { AddExerciseModal } from './add-exercise-modal'
import { UserModificationBadge } from './user-modification-badge'
import { EditSetModal } from './edit-set-modal'
import { WarmupSkipPrompt } from './warmup-skip-prompt'
import { HydrationReminder } from './hydration-reminder'
import { shouldSuggestWarmupSkip, getSkipReasonCode } from '@/lib/utils/warmup-skip-intelligence'
import { getHydrationSuggestionAction } from '@/app/actions/hydration-actions'
import type { HydrationOutput } from '@/lib/types/hydration'
import { Button } from '@/components/ui/button'
import { extractMuscleGroupsFromExercise } from '@/lib/utils/exercise-muscle-mapper'
import { inferWorkoutType } from '@/lib/services/muscle-groups.service'
import { validationCache } from '@/lib/utils/validation-cache'
import { getCachedExplanation, setCachedExplanation } from '@/lib/utils/exercise-explanation-cache'
import { transformToExerciseExecution } from '@/lib/utils/exercise-transformer'
import {
  calculateRestTimerLimits,
  getRestTimerStatusColor,
  inferExerciseType,
  type RestTimerStatus
} from '@/lib/utils/rest-timer-limits'
import type { AudioScript } from '@/lib/services/audio-coaching.service'

interface ExerciseCardProps {
  exercise: ExerciseExecution
  exerciseIndex: number
  totalExercises: number
  userId: string
  approachId: string
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  totalExercises,
  userId,
  approachId
}: ExerciseCardProps) {
  const t = useTranslations('workout.execution')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { nextExercise, previousExercise, setAISuggestion, addSetToExercise, addExerciseToWorkout, exercises: allExercises, workout, skipWarmupSets, overallMentalReadiness, audioScripts, currentExerciseIndex } = useWorkoutExecutionStore()
  const { mutate: getSuggestion, isPending: isSuggestionPending } = useProgressionSuggestion()

  // Mental readiness emoji mapping with translations
  const getMentalReadinessEmoji = (value: number): { emoji: string; label: string } => {
    const emojis: Record<number, string> = {
      1: '😫',
      2: '😕',
      3: '😐',
      4: '🙂',
      5: '🔥',
    }
    const labels: Record<number, string> = {
      1: t('mentalReadiness.drained'),
      2: t('mentalReadiness.struggling'),
      3: t('mentalReadiness.neutral'),
      4: t('mentalReadiness.engaged'),
      5: t('mentalReadiness.lockedIn'),
    }
    return { emoji: emojis[value], label: labels[value] }
  }

  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showExerciseExplanation, setShowExerciseExplanation] = useState(false)
  const [exerciseExplanation, setExerciseExplanation] = useState('')
  const [loadingExerciseExplanation, setLoadingExerciseExplanation] = useState(false)
  const [showProgressionExplanation, setShowProgressionExplanation] = useState(false)
  const [progressionExplanation, setProgressionExplanation] = useState('')
  const [loadingProgressionExplanation, setLoadingProgressionExplanation] = useState(false)
  const [showSubstitution, setShowSubstitution] = useState(false)
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false)
  const [editSetIndex, setEditSetIndex] = useState<number | null>(null)
  const [warmupSkipPromptDismissed, setWarmupSkipPromptDismissed] = useState(false)

  // Hydration reminder state
  const [hydrationDismissedAt, setHydrationDismissedAt] = useState<Date | null>(null)
  const [hydrationSuggestion, setHydrationSuggestion] = useState<HydrationOutput | null>(null)
  const [isLoadingHydration, setIsLoadingHydration] = useState(false)
  const [lastHydrationCheckTime, setLastHydrationCheckTime] = useState<number>(0)

  // Rest timer state
  const [isResting, setIsResting] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)
  const [originalRestSeconds, setOriginalRestSeconds] = useState(0)
  const [restStartTime, setRestStartTime] = useState<number | null>(null) // Timestamp when timer started
  const [restDuration, setRestDuration] = useState(0) // Total duration in seconds
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [lastCompletedSetCount, setLastCompletedSetCount] = useState(0)

  // User demographics for personalized progression
  const [userExperienceYears, setUserExperienceYears] = useState<number | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)

  // Approach name for rest timer validation
  const [approachName, setApproachName] = useState<string | undefined>(undefined)

  const warmupSetsCount = exercise.warmupSets?.length || 0
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
  const totalSets = remainingWarmupSets + exercise.targetSets
  const currentSetNumber = exercise.completedSets.length + 1
  const isLastSet = currentSetNumber > totalSets
  const lastCompletedSet = exercise.completedSets[exercise.completedSets.length - 1]

  // Progress tracking
  const completedWarmupSets = Math.min(exercise.completedSets.length, remainingWarmupSets)
  const completedWorkingSets = Math.max(0, exercise.completedSets.length - remainingWarmupSets)

  // Calculate warmup skip suggestion
  const warmupSkipSuggestion = workout ? shouldSuggestWarmupSkip(
    exercise,
    allExercises,
    {
      workout,
      exerciseIndex,
      totalExercises,
      completedSetsCount: allExercises.reduce((sum, ex) => sum + ex.completedSets.length, 0),
      mentalReadiness: overallMentalReadiness
    }
  ) : { shouldSuggest: false, reason: '', confidence: 'low' as const }

  const showWarmupSkipPrompt =
    warmupSetsCount > 0 &&
    exercise.completedSets.length === 0 &&
    warmupSkipSuggestion.shouldSuggest &&
    !warmupSkipPromptDismissed

  // Fetch user demographics for personalized progression
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserProfileService.getByUserId(userId)
        if (profile) {
          setUserExperienceYears(profile.experience_years)
          setUserAge(profile.age)
        }
      } catch (error) {
        console.error('Failed to fetch user profile for demographics:', error)
      }
    }

    fetchUserProfile()
  }, [userId])

  // Fetch approach name for rest timer validation
  useEffect(() => {
    const fetchApproachName = async () => {
      if (!approachId) return

      try {
        const approach = await TrainingApproachService.getById(approachId)
        if (approach) {
          setApproachName(approach.name)
        }
      } catch (error) {
        console.error('Failed to fetch approach name for rest timer validation:', error)
      }
    }

    fetchApproachName()
  }, [approachId])

  // Hydration suggestion - check periodically and after sets completed
  useEffect(() => {
    const checkHydration = async () => {
      if (!workout?.started_at || isLoadingHydration) return

      // Throttle: don't call AI more than once every 2 minutes (prevents duplicate checks)
      const timeSinceLastCheck = Date.now() - lastHydrationCheckTime
      if (lastHydrationCheckTime > 0 && timeSinceLastCheck < 120000) {
        return // Skip if checked less than 2 minutes ago
      }

      // Calculate total sets completed across all exercises
      const totalSetsCompleted = allExercises.reduce((sum, ex) => sum + ex.completedSets.length, 0)

      // Only check if at least one set has been completed
      if (totalSetsCompleted === 0) return

      try {
        setIsLoadingHydration(true)
        setLastHydrationCheckTime(Date.now()) // Update check timestamp

        // Calculate workout duration
        const workoutDurationMs = Date.now() - new Date(workout.started_at).getTime()

        // Infer exercise type and extract muscle groups
        const rawExerciseType = inferExerciseType(exercise.exerciseName)
        // Map to hydration-compatible type (compound | isolation only)
        const exerciseType: 'compound' | 'isolation' =
          rawExerciseType === 'compound' || rawExerciseType === 'explosive'
            ? 'compound'
            : 'isolation'
        const muscleGroups = extractMuscleGroupsFromExercise(exercise.exerciseName)

        // Get last set data for intensity indicators
        const lastSet = exercise.completedSets[exercise.completedSets.length - 1]

        const result = await getHydrationSuggestionAction(userId, {
          workoutDurationMs,
          totalSetsCompleted,
          currentSetNumber: currentSetNumber,
          exerciseType,
          exerciseName: exercise.exerciseName,
          muscleGroups,
          lastSetRIR: lastSet?.rir,
          mentalReadiness: lastSet?.mentalReadiness || overallMentalReadiness || undefined,
          restSeconds: exercise.restSeconds || 90,
          lastDismissedAt: hydrationDismissedAt
        })

        if (result.success && result.data) {
          setHydrationSuggestion(result.data)
        }
      } catch (error) {
        console.error('[ExerciseCard] Failed to get hydration suggestion:', error)
      } finally {
        setIsLoadingHydration(false)
      }
    }

    // Check on every 3 sets completed (throttle to avoid too many calls)
    const totalSets = allExercises.reduce((sum, ex) => sum + ex.completedSets.length, 0)
    if (totalSets > 0 && totalSets % 3 === 0) {
      checkHydration()
    }

    // Also set up periodic check every 5 minutes
    const intervalId = setInterval(() => {
      checkHydration()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(intervalId)
  }, [
    exercise.completedSets.length,
    allExercises,
    workout?.started_at,
    isResting,
    userId,
    exercise.exerciseName,
    exercise.restSeconds,
    currentSetNumber,
    overallMentalReadiness,
    hydrationDismissedAt,
    isLoadingHydration
  ])

  // Rest timer management - start when a new set is completed
  useEffect(() => {
    // Check if a new set was just completed
    if (exercise.completedSets.length > lastCompletedSetCount && !isLastSet) {
      // A set was just logged - start rest timer
      const restSeconds = exercise.restSeconds || 90 // Default to 90s if not specified
      setRestDuration(restSeconds)
      setRestStartTime(Date.now()) // Store when timer started
      setRestTimeRemaining(restSeconds)
      setOriginalRestSeconds(restSeconds)
      setIsResting(true)
      setLastCompletedSetCount(exercise.completedSets.length)
    }
  }, [exercise.completedSets.length, lastCompletedSetCount, isLastSet, exercise.restSeconds])

  // Countdown timer - timestamp-based for background resilience
  useEffect(() => {
    if (!isResting || !restStartTime || !restDuration) return

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - restStartTime) / 1000)
      const remaining = Math.max(0, restDuration - elapsed)

      setRestTimeRemaining(remaining)

      if (remaining === 0) {
        setIsResting(false)
        setRestStartTime(null)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    restTimerRef.current = setInterval(updateTimer, 1000)

    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current)
      }
    }
  }, [isResting, restStartTime, restDuration])

  // Recalculate timer when page becomes visible again (handles background/standby)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isResting && restStartTime && restDuration) {
        // Page became visible - recalculate elapsed time
        const elapsed = Math.floor((Date.now() - restStartTime) / 1000)
        const remaining = Math.max(0, restDuration - elapsed)
        setRestTimeRemaining(remaining)

        if (remaining === 0) {
          setIsResting(false)
          setRestStartTime(null)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isResting, restStartTime, restDuration])

  // Skip rest function
  const skipRest = () => {
    setIsResting(false)
    setRestTimeRemaining(0)
    setRestStartTime(null) // Clear start time
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current) // Changed from clearTimeout
    }
  }

  // Modify rest timer by ±15 seconds
  const modifyRestTimer = (delta: number) => {
    if (!restStartTime || !restDuration) return

    // Calculate current elapsed time
    const currentElapsed = Math.floor((Date.now() - restStartTime) / 1000)
    const newDuration = Math.max(15, restDuration + delta) // Minimum 15 seconds
    const newRemaining = Math.max(15, restTimeRemaining + delta)

    setRestDuration(newDuration)
    setRestTimeRemaining(newRemaining)
    // Adjust start time so that elapsed time matches
    setRestStartTime(Date.now() - (currentElapsed * 1000))
  }

  // Calculate rest timer limits and status
  const getRestTimerInfo = () => {
    if (!isResting || originalRestSeconds === 0) {
      return null
    }

    const exerciseType = inferExerciseType(exercise.exerciseName)

    const limits = calculateRestTimerLimits({
      approachName,
      exerciseType,
      currentRestSeconds: restTimeRemaining,
      originalRestSeconds
    })

    return limits
  }

  // Load exercise selection explanation
  const loadExerciseExplanation = async () => {
    if (exerciseExplanation) {
      setShowExerciseExplanation(!showExerciseExplanation)
      return
    }

    // Try to get from localStorage cache if exerciseId is available
    if (exercise.exerciseId) {
      const cached = getCachedExplanation(
        exercise.exerciseName,
        exercise.exerciseId,
        approachId,
        locale
      )

      if (cached) {
        setExerciseExplanation(cached)
        setShowExerciseExplanation(true)
        return
      }
    }

    // Cache miss or no exerciseId - fetch from API
    setLoadingExerciseExplanation(true)
    const result = await explainExerciseSelectionAction(
      userId,
      exercise.exerciseName,
      [], // Weak points would come from user profile
      'Selected by AI based on training approach',
      approachId
    )

    if (result.success && result.explanation) {
      setExerciseExplanation(result.explanation)
      setShowExerciseExplanation(true)

      // Cache the result if exerciseId is available
      if (exercise.exerciseId) {
        setCachedExplanation(
          exercise.exerciseName,
          exercise.exerciseId,
          approachId,
          locale,
          result.explanation
        )
      }
    }
    setLoadingExerciseExplanation(false)
  }

  // Load progression explanation
  const loadProgressionExplanation = async () => {
    if (!lastCompletedSet || !exercise.currentAISuggestion) return

    if (progressionExplanation) {
      setShowProgressionExplanation(!showProgressionExplanation)
      return
    }

    setLoadingProgressionExplanation(true)
    const result = await explainProgressionAction(
      userId,
      {
        weight: lastCompletedSet.weight,
        reps: lastCompletedSet.reps,
        rir: lastCompletedSet.rir
      },
      exercise.currentAISuggestion.rationale,
      approachId
    )

    if (result.success && result.explanation) {
      setProgressionExplanation(result.explanation)
      setShowProgressionExplanation(true)
    }
    setLoadingProgressionExplanation(false)
  }

  // Request AI suggestion after completing a set
  useEffect(() => {
    if (lastCompletedSet && !exercise.currentAISuggestion && !isLastSet) {
      getSuggestion(
        {
          userId,
          input: {
            lastSet: {
              weight: lastCompletedSet.weight,
              reps: lastCompletedSet.reps,
              rir: lastCompletedSet.rir,
              mentalReadiness: lastCompletedSet.mentalReadiness
            },
            setNumber: currentSetNumber,
            exerciseName: exercise.exerciseName,
            exerciseType: (exercise.exerciseName?.toLowerCase().includes('squat') ||
              exercise.exerciseName?.toLowerCase().includes('deadlift') ||
              exercise.exerciseName?.toLowerCase().includes('bench') ||
              exercise.exerciseName?.toLowerCase().includes('press'))
              ? 'compound'
              : 'isolation',
            approachId,
            experienceYears: userExperienceYears,
            userAge: userAge
          }
        },
        {
          onSuccess: (suggestion) => {
            if (suggestion) {
              setAISuggestion(suggestion)
              setShowSuggestion(true)
            }
          }
        }
      )
    }
  }, [
    lastCompletedSet,
    exercise.currentAISuggestion,
    exercise.exerciseName,
    isLastSet,
    currentSetNumber,
    getSuggestion,
    userId,
    approachId,
    userExperienceYears,
    userAge,
    setAISuggestion,
    setShowSuggestion
  ])

  const handleValidateAddSet = async (): Promise<ModificationValidationOutput | null> => {
    if (!exercise || !userId || !allExercises || !workout) return null

    try {
      // Check cache first
      const cached = validationCache.get(
        exercise.exerciseName,
        exercise.targetSets,
        exercise.targetSets + 1,
        userId
      )
      if (cached) {
        return cached
      }

      // Extract muscle groups
      const muscleGroups = extractMuscleGroupsFromExercise(
        exercise.exerciseName,
        exercise.equipmentVariant
      )

      // Build validation input
      const validationInput: ModificationValidationInput = {
        exerciseInfo: {
          name: exercise.exerciseName,
          equipmentVariant: exercise.equipmentVariant,
          currentSets: exercise.targetSets,
          proposedSets: exercise.targetSets + 1,
          muscleGroups,
        },
        workoutContext: {
          workoutType: inferWorkoutType(
            allExercises.map(ex => ({ name: ex.exerciseName }))
          ) as any,
          totalExercises: allExercises.length,
        },
        userContext: {
          userId,
          approachId: workout?.approach_id || approachId,
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
        exercise.exerciseName,
        exercise.targetSets,
        exercise.targetSets + 1,
        userId,
        result.validation
      )

      return result.validation
    } catch (error) {
      console.error('Error validating modification:', error)
      return null
    }
  }

  const handleOpenAddExercise = async () => {
    // Count user-added exercises
    const userAddedCount = allExercises.filter(ex => ex.aiRecommendedSets === undefined).length

    // Hard limit: max 3 extra exercises
    if (userAddedCount >= 3) {
      return {
        success: false,
        error: 'hard_limit',
        message: t('exercise.exerciseLimitReached')
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
    try {
      // Transform to ExerciseExecution format using transformer utility
      const newExercise = await transformToExerciseExecution(selectedExercise, {
        userId,
        userProfile: {
          experienceYears: userExperienceYears || 0,
        },
        workoutType: workout?.workout_type as any,
      })

      // Add exercise after current one (exerciseIndex + 1)
      const result = addExerciseToWorkout(exerciseIndex + 1, newExercise)

      if (!result.success) {
        alert(result.message || tCommon('errors.failedToAddExercise'))
        return
      }

      // Close modal on success
      setIsAddExerciseModalOpen(false)
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert(tCommon('errors.failedToAddExercise'))
    }
  }


  const handleSkipWarmup = async () => {
    try {
      const reason = getSkipReasonCode(warmupSkipSuggestion)
      await skipWarmupSets(reason)
      setWarmupSkipPromptDismissed(true)
    } catch (error) {
      console.error("Failed to skip warmup:", error)
      alert(tCommon("errors.failedToSkipWarmup"))
    }
  }

  const handleDismissSkipPrompt = () => {
    setWarmupSkipPromptDismissed(true)
  }
  const handleMoveToNext = () => {
    setShowSuggestion(false)
    if (exerciseIndex < totalExercises - 1) {
      nextExercise()
    }
  }

  // Helper: Create audio script for next set
  const getNextSetAudioScript = (): AudioScript | null => {
    if (isLastSet) return null // No more sets

    const nextSetNum = currentSetNumber
    const isWarmupSet = nextSetNum <= remainingWarmupSets

    // Try to get AI-generated script from workout.audio_scripts
    if (audioScripts && audioScripts.exercises && audioScripts.exercises[exerciseIndex]) {
      const exerciseScripts = audioScripts.exercises[exerciseIndex]
      const allSetScripts = exerciseScripts.sets || []

      // Find matching set script by set number and type
      const matchingScript = allSetScripts.find(s =>
        s.setNumber === nextSetNum &&
        s.setType === (isWarmupSet ? 'warmup' : 'working')
      )

      if (matchingScript) {
        return {
          id: `${exercise.exerciseName}-set-${nextSetNum}-ai`,
          type: 'pre_set',
          segments: matchingScript.script.segments,
          priority: 5
        }
      }
    }

    // Fallback: Create simple script if AI scripts not available
    const setType: 'warmup' | 'working' = isWarmupSet ? 'warmup' : 'working'
    let technicalFocus = ''
    let mentalFocus = ''

    if (isWarmupSet) {
      const warmupIndex = nextSetNum - 1
      technicalFocus = exercise.warmupSets?.[warmupIndex]?.technicalFocus || 'Feel the movement pattern'
    } else {
      const workingSetNum = nextSetNum - remainingWarmupSets
      const guidance = exercise.setGuidance?.[workingSetNum - 1]
      technicalFocus = guidance?.technicalFocus || ''
      mentalFocus = guidance?.mentalFocus || ''
    }

    const tempoText = exercise.tempo ? `Tempo: ${exercise.tempo}. ` : ''
    const techText = technicalFocus ? `Technical focus: ${technicalFocus}. ` : ''
    const mentalText = mentalFocus ? `Mental approach: ${mentalFocus}. ` : ''

    const scriptText = `${setType === 'warmup' ? 'Warmup ' : ''}Set ${nextSetNum}. ${tempoText}${techText}${mentalText}Start when ready.`

    return {
      id: `${exercise.exerciseName}-set-${nextSetNum}`,
      type: 'pre_set',
      text: scriptText,
      priority: 5
    }
  }

  const nextSetScript = getNextSetAudioScript()

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      {/* Exercise Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {t('exercise.exerciseNumber', { current: exerciseIndex + 1, total: totalExercises })}
              </span>
              {exercise.userAddedSets && exercise.userAddedSets > 0 && (
                <UserModificationBadge
                  addedSets={exercise.userAddedSets}
                  aiRecommendedSets={exercise.aiRecommendedSets || exercise.targetSets}
                  variant="compact"
                />
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {exercise.exerciseName}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadExerciseExplanation}
              disabled={loadingExerciseExplanation}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
              title={t('exercise.whyThisExercise')}
            >
              {loadingExerciseExplanation ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-5 h-5 text-gray-400 hover:text-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Exercise Explanation */}
        {showExerciseExplanation && exerciseExplanation && (
          <div className="mb-4 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-blue-200 leading-relaxed">{exerciseExplanation}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('exercise.setsLabel')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">
                {completedWorkingSets}
              </span>
              <span className="text-sm text-gray-500 font-medium">/ {exercise.targetSets}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('exercise.reps')}</span>
            <span className="text-xl font-bold text-white">
              {exercise.targetReps[0]}-{exercise.targetReps[1]}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">{t('exercise.target')}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-bold text-white">{exercise.targetWeight}</span>
              <span className="text-xs text-gray-500 font-medium">kg</span>
            </div>
          </div>
        </div>

        {/* Warmup Progress (if applicable) */}
        {warmupSetsCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>
              {t('exercise.warmupProgress', { current: completedWarmupSets, total: warmupSetsCount })}
            </span>
          </div>
        )}
      </div>

      {/* Completed Sets Summary */}
      {exercise.completedSets.length > 0 && (
        <CompletedSetsList
          sets={exercise.completedSets}
          remainingWarmupSets={remainingWarmupSets}
          targetSets={exercise.targetSets}
          onEditSet={setEditSetIndex}
        />
      )}

      {/* AI Suggestion */}
      {showSuggestion && exercise.currentAISuggestion && (
        <div className="mb-6">
          <AISuggestionCard
            suggestion={exercise.currentAISuggestion}
            setNumber={currentSetNumber}
            onExplain={loadProgressionExplanation}
            isLoadingExplanation={loadingProgressionExplanation}
            explanation={progressionExplanation}
            showExplanation={showProgressionExplanation}
          />
        </div>
      )}

      {/* Rest Timer */}
      {isResting && !isLastSet && (() => {
        return (
          <div className="mb-6">
            <RestTimer
              restTimeRemaining={restTimeRemaining}
              originalRestSeconds={originalRestSeconds}
              onSkip={skipRest}
              onModify={modifyRestTimer}
              defaultRestSeconds={exercise.restSeconds || 90}
            />
          </div>
        )
      })()}

      {/* Current Set Logger or Next Exercise */}
      {isLastSet ? (
        <div className="text-center py-8">
          <div className="mb-4 text-green-400">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('exercise.exerciseComplete')}</h3>
          <p className="text-gray-400 mb-6">{t('exercise.greatWork', { exerciseName: exercise.exerciseName })}</p>

          {/* Only show add options if this is the current active exercise */}
          {exerciseIndex === currentExerciseIndex && (
            <>
              {/* Add Extra Set Option */}
              <div className="mb-4">
                <AddSetButton
                  currentSets={exercise.targetSets}
                  onAddSet={() => addSetToExercise(exerciseIndex)}
                  variant="full"
                  userAddedSets={exercise.userAddedSets}
                  enableAIValidation={true}
                  onRequestValidation={handleValidateAddSet}
                  exerciseName={exercise.exerciseName}
                />
              </div>

              {/* Add Extra Exercise Option */}
              <div className="mb-4">
                <AddExerciseButton
                  position="after"
                  onAddExercise={handleOpenAddExercise}
                  variant="full"
                  currentExerciseCount={totalExercises}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 border-t border-gray-700"></div>
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-700"></div>
              </div>
            </>
          )}

          <Button
            onClick={handleMoveToNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
          >
            {exerciseIndex < totalExercises - 1 ? t('nextExercise') : t('finishWorkout')}
          </Button>
        </div>
      ) : (
        <>
          {/* Hydration reminder can show DURING rest (ideal moment for drinking!) */}
          {hydrationSuggestion && hydrationSuggestion.shouldSuggest && (
            <HydrationReminder
              suggestion={hydrationSuggestion}
              onDismiss={() => {
                setHydrationDismissedAt(new Date())
                setHydrationSuggestion(null)
              }}
              className="mb-4"
            />
          )}

          {!isResting && (
            <>
              {showWarmupSkipPrompt && (
                <WarmupSkipPrompt
                  suggestion={warmupSkipSuggestion}
                  warmupCount={warmupSetsCount}
                  onSkip={handleSkipWarmup}
                  onDismiss={handleDismissSkipPrompt}
                  className="mb-4"
                />
              )}

              <SetLogger
                exercise={exercise}
                setNumber={currentSetNumber}
                suggestion={exercise.currentAISuggestion?.suggestion}
                technicalCues={exercise.technicalCues}
              />

              {isSuggestionPending && (
                <div className="mt-4 text-center text-sm text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  {t('exercise.gettingAiSuggestion')}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Action Buttons */}
      {!isLastSet && !isResting && (
        <div className="mt-4 mb-2 grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowSubstitution(true)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:border-purple-600 hover:text-purple-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('exercise.changeExercise')}
          </Button>

          <Button
            onClick={() => addSetToExercise(exerciseIndex)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi set
          </Button>
        </div>
      )}

      {/* Exercise Substitution Modal */}
      {showSubstitution && (
        <ExerciseSubstitution
          currentExercise={exercise}
          exerciseIndex={exerciseIndex}
          userId={userId}
          onClose={() => setShowSubstitution(false)}
        />
      )}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onSelectExercise={handleSelectExercise}
        currentWorkoutType={workout?.workout_type || 'general'}
        excludeExercises={allExercises.filter(ex => ex.exerciseName).map(ex => ex.exerciseName.toLowerCase())}
        enableAISuggestions={true}
        enableAIValidation={true}
        userId={userId}
        currentWorkoutContext={{
          existingExercises: allExercises.filter(ex => ex.exerciseName).map(ex => {
            const muscleGroups = extractMuscleGroupsFromExercise(ex.exerciseName, ex.equipmentVariant)
            return {
              name: ex.exerciseName,
              sets: ex.targetSets + (ex.userAddedSets || 0),
              muscleGroups: {
                primary: muscleGroups.primary,
                secondary: muscleGroups.secondary,
              },
              movementPattern: undefined, // Could be enhanced later
              isCompound: ex.exerciseName.toLowerCase().includes('press') ||
                ex.exerciseName.toLowerCase().includes('squat') ||
                ex.exerciseName.toLowerCase().includes('deadlift') ||
                ex.exerciseName.toLowerCase().includes('row') ||
                ex.exerciseName.toLowerCase().includes('pull-up') ||
                ex.exerciseName.toLowerCase().includes('chin-up'),
            }
          }),
          totalExercises: allExercises.length,
          totalSets: allExercises.reduce((sum, ex) => sum + ex.targetSets + (ex.userAddedSets || 0), 0),
        }}
      />

      {/* Edit Set Modal */}
      {editSetIndex !== null && exercise.completedSets[editSetIndex] && (
        <EditSetModal
          isOpen={true}
          onClose={() => setEditSetIndex(null)}
          exerciseIndex={exerciseIndex}
          setIndex={editSetIndex}
          setData={{
            weight: exercise.completedSets[editSetIndex].weight,
            reps: exercise.completedSets[editSetIndex].reps,
            rir: exercise.completedSets[editSetIndex].rir,
            mentalReadiness: exercise.completedSets[editSetIndex].mentalReadiness,
            notes: exercise.completedSets[editSetIndex].notes,
          }}
        />
      )}
      {/* Exercise Substitution Modal */}
      {showSubstitution && (
        <ExerciseSubstitution
          currentExercise={exercise}
          exerciseIndex={exerciseIndex}
          userId={userId}
          onClose={() => setShowSubstitution(false)}
          onRationaleInvalidate={() => {
            // Optional: invalidate rationale if needed
          }}
        />
      )}
    </div>
  )
}
