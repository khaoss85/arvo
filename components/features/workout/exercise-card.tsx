'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle, ChevronDown, Target, Clock, SkipForward, RefreshCw } from 'lucide-react'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { useProgressionSuggestion } from '@/lib/hooks/useAI'
import { explainExerciseSelectionAction, explainProgressionAction, validateWorkoutModificationAction } from '@/app/actions/ai-actions'
import type { ModificationValidationInput, ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { SetLogger } from './set-logger'
import { ExerciseSubstitution } from './exercise-substitution'
import { AddSetButton } from './add-set-button'
import { AddExerciseButton } from './add-exercise-button'
import { AddExerciseModal } from './add-exercise-modal'
import { UserModificationBadge } from './user-modification-badge'
import { Button } from '@/components/ui/button'
import { extractMuscleGroupsFromExercise } from '@/lib/utils/exercise-muscle-mapper'
import { inferWorkoutType } from '@/lib/services/muscle-groups.service'
import { validationCache } from '@/lib/utils/validation-cache'
import { transformToExerciseExecution } from '@/lib/utils/exercise-transformer'

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
  const { nextExercise, previousExercise, setAISuggestion, addSetToExercise, addExerciseToWorkout, exercises: allExercises, workout } = useWorkoutExecutionStore()
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
  const [showTechnicalCues, setShowTechnicalCues] = useState(false)
  const [showSubstitution, setShowSubstitution] = useState(false)
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false)

  // Rest timer state
  const [isResting, setIsResting] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [lastCompletedSetCount, setLastCompletedSetCount] = useState(0)

  // User demographics for personalized progression
  const [userExperienceYears, setUserExperienceYears] = useState<number | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)

  const warmupSetsCount = exercise.warmupSets?.length || 0
  const totalSets = warmupSetsCount + exercise.targetSets
  const currentSetNumber = exercise.completedSets.length + 1
  const isLastSet = currentSetNumber > totalSets
  const lastCompletedSet = exercise.completedSets[exercise.completedSets.length - 1]

  // Progress tracking
  const completedWarmupSets = Math.min(exercise.completedSets.length, warmupSetsCount)
  const completedWorkingSets = Math.max(0, exercise.completedSets.length - warmupSetsCount)

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

  // Rest timer management - start when a new set is completed
  useEffect(() => {
    // Check if a new set was just completed
    if (exercise.completedSets.length > lastCompletedSetCount && !isLastSet) {
      // A set was just logged - start rest timer
      const restSeconds = exercise.restSeconds || 90 // Default to 90s if not specified
      setRestTimeRemaining(restSeconds)
      setIsResting(true)
      setLastCompletedSetCount(exercise.completedSets.length)
    }
  }, [exercise.completedSets.length, lastCompletedSetCount, isLastSet, exercise.restSeconds])

  // Countdown timer
  useEffect(() => {
    if (isResting && restTimeRemaining > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (restTimeRemaining === 0 && isResting) {
      // Timer completed
      setIsResting(false)
    }

    return () => {
      if (restTimerRef.current) {
        clearTimeout(restTimerRef.current)
      }
    }
  }, [isResting, restTimeRemaining])

  // Skip rest function
  const skipRest = () => {
    setIsResting(false)
    setRestTimeRemaining(0)
    if (restTimerRef.current) {
      clearTimeout(restTimerRef.current)
    }
  }

  // Load exercise selection explanation
  const loadExerciseExplanation = async () => {
    if (exerciseExplanation) {
      setShowExerciseExplanation(!showExerciseExplanation)
      return
    }

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
            exerciseType: exercise.exerciseName.toLowerCase().includes('squat') ||
                         exercise.exerciseName.toLowerCase().includes('deadlift') ||
                         exercise.exerciseName.toLowerCase().includes('bench') ||
                         exercise.exerciseName.toLowerCase().includes('press')
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
  }, [lastCompletedSet, exercise.currentAISuggestion, isLastSet, currentSetNumber])

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
        alert(result.message || 'Failed to add exercise.')
        return
      }

      // Close modal on success
      setIsAddExerciseModalOpen(false)
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Failed to add exercise. Please try again.')
    }
  }

  const handleMoveToNext = () => {
    setShowSuggestion(false)
    if (exerciseIndex < totalExercises - 1) {
      nextExercise()
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      {/* Exercise Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{exercise.exerciseName}</h2>
            <button
              onClick={loadExerciseExplanation}
              disabled={loadingExerciseExplanation}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              title={t('exercise.whyThisExercise')}
            >
              {loadingExerciseExplanation ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-400" />
              )}
            </button>
          </div>
          <span className="text-sm text-gray-400">
            {t('exercise.exerciseNumber', { current: exerciseIndex + 1, total: totalExercises })}
          </span>
        </div>

        {/* Exercise Explanation */}
        {showExerciseExplanation && exerciseExplanation && (
          <div className="mb-3 bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
            <p className="text-sm text-blue-200">{exerciseExplanation}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-400">
          {warmupSetsCount > 0 && (
            <>
              <span className="text-amber-400">
                {t('exercise.warmupProgress', { current: completedWarmupSets, total: warmupSetsCount })}
              </span>
              <span>•</span>
            </>
          )}
          <span className="flex items-center gap-2">
            {t('exercise.setsProgress', { current: completedWorkingSets, total: exercise.targetSets })}
            {exercise.userAddedSets && exercise.userAddedSets > 0 && (
              <UserModificationBadge
                addedSets={exercise.userAddedSets}
                aiRecommendedSets={exercise.aiRecommendedSets || exercise.targetSets}
                variant="compact"
              />
            )}
          </span>
          <span>•</span>
          <span>{exercise.targetReps[0]}-{exercise.targetReps[1]} {t('exercise.reps')}</span>
          <span>•</span>
          <span>{t('exercise.target', { weight: exercise.targetWeight })}</span>
        </div>
      </div>

      {/* Technical Cues (Collapsible) */}
      {exercise.technicalCues && exercise.technicalCues.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowTechnicalCues(!showTechnicalCues)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">{t('exercise.techniqueCues')}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showTechnicalCues ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnicalCues && (
            <div className="mt-2 bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
              <ul className="space-y-2">
                {exercise.technicalCues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-base text-gray-200">{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Completed Sets Summary */}
      {exercise.completedSets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">{t('exercise.completedSets')}</h3>
          <div className="space-y-2">
            {exercise.completedSets.map((set, idx) => {
              const mentalReadiness = set.mentalReadiness ? getMentalReadinessEmoji(set.mentalReadiness) : null
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-800 rounded p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{t('exercise.set', { number: idx + 1 })}</span>
                    {mentalReadiness && (
                      <span
                        className="text-lg"
                        title={t('exercise.mentalStateLabel', { state: mentalReadiness.label })}
                      >
                        {mentalReadiness.emoji}
                      </span>
                    )}
                  </div>
                  <span className="text-white font-medium">
                    {set.weight}kg × {set.reps} @ RIR {set.rir}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {showSuggestion && exercise.currentAISuggestion && (
        <div className="mb-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-300">{t('exercise.aiSuggestion', { number: currentSetNumber })}</h3>
            <button
              onClick={loadProgressionExplanation}
              disabled={loadingProgressionExplanation}
              className="p-1 hover:bg-blue-800/50 rounded transition-colors disabled:opacity-50"
              title={t('exercise.whyThisProgression')}
            >
              {loadingProgressionExplanation ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-blue-400 hover:text-blue-300" />
              )}
            </button>
          </div>
          <div className="text-white font-medium mb-2">
            {exercise.currentAISuggestion.suggestion.weight}kg × {exercise.currentAISuggestion.suggestion.reps} @ RIR {exercise.currentAISuggestion.suggestion.rirTarget}
          </div>
          <p className="text-sm text-blue-200 mb-2">{exercise.currentAISuggestion.rationale}</p>

          {/* Progression Explanation */}
          {showProgressionExplanation && progressionExplanation && (
            <div className="mt-3 pt-3 border-t border-blue-800/50">
              <p className="text-xs text-blue-300 italic">{progressionExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Rest Timer */}
      {isResting && !isLastSet && (
        <div className="mb-6 bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-amber-500/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-lg font-medium text-amber-200">{t('exercise.restPeriod')}</h3>
            </div>
            <button
              onClick={skipRest}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded text-sm text-amber-300 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {t('exercise.skip')}
            </button>
          </div>

          {/* Countdown Display */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-6xl font-bold text-white font-mono mb-2">
              {Math.floor(restTimeRemaining / 60)}:{String(restTimeRemaining % 60).padStart(2, '0')}
            </div>
            <div className="text-sm text-amber-300">
              {exercise.restSeconds ? t('exercise.restSeconds', { seconds: exercise.restSeconds }) : t('exercise.defaultRestPeriod')}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${exercise.restSeconds ? ((exercise.restSeconds - restTimeRemaining) / exercise.restSeconds) * 100 : 0}%`
              }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center italic">
            {t('exercise.restDescription')}
          </p>
        </div>
      )}

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

          <Button
            onClick={handleMoveToNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
          >
            {exerciseIndex < totalExercises - 1 ? t('nextExercise') : t('finishWorkout')}
          </Button>
        </div>
      ) : (
        <>
          {!isResting && (
            <>
              <SetLogger
                exercise={exercise}
                setNumber={currentSetNumber}
                suggestion={exercise.currentAISuggestion?.suggestion}
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

      {/* Change Exercise Button */}
      {!isLastSet && !isResting && (
        <div className="mt-4 mb-2">
          <Button
            onClick={() => setShowSubstitution(true)}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:border-purple-600 hover:text-purple-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('exercise.changeExercise')}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {exerciseIndex > 0 && (
          <Button
            onClick={previousExercise}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300"
          >
            {t('exercise.previous')}
          </Button>
        )}
      </div>

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
        excludeExercises={allExercises.map(ex => ex.exerciseName.toLowerCase())}
        enableAISuggestions={true}
        enableAIValidation={true}
        userId={userId}
        currentWorkoutContext={{
          existingExercises: allExercises.map(ex => {
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
    </div>
  )
}
