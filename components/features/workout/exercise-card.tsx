'use client'

import { useState, useEffect, useRef } from 'react'
import { HelpCircle, ChevronDown, Target, Clock, SkipForward } from 'lucide-react'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { useProgressionSuggestion } from '@/lib/hooks/useAI'
import { explainExerciseSelectionAction, explainProgressionAction } from '@/app/actions/ai-actions'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { SetLogger } from './set-logger'
import { Button } from '@/components/ui/button'

// Mental readiness emoji mapping
const MENTAL_READINESS_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😫', label: 'Drained' },
  2: { emoji: '😕', label: 'Struggling' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '🙂', label: 'Engaged' },
  5: { emoji: '🔥', label: 'Locked In' },
}

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
  const { nextExercise, previousExercise, setAISuggestion } = useWorkoutExecutionStore()
  const { mutate: getSuggestion, isPending: isSuggestionPending } = useProgressionSuggestion()
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showExerciseExplanation, setShowExerciseExplanation] = useState(false)
  const [exerciseExplanation, setExerciseExplanation] = useState('')
  const [loadingExerciseExplanation, setLoadingExerciseExplanation] = useState(false)
  const [showProgressionExplanation, setShowProgressionExplanation] = useState(false)
  const [progressionExplanation, setProgressionExplanation] = useState('')
  const [loadingProgressionExplanation, setLoadingProgressionExplanation] = useState(false)
  const [showTechnicalCues, setShowTechnicalCues] = useState(false)

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
              title="Why this exercise?"
            >
              {loadingExerciseExplanation ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-400" />
              )}
            </button>
          </div>
          <span className="text-sm text-gray-400">
            Exercise {exerciseIndex + 1} of {totalExercises}
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
                Riscaldamento: {completedWarmupSets}/{warmupSetsCount}
              </span>
              <span>•</span>
            </>
          )}
          <span>
            Serie: {completedWorkingSets}/{exercise.targetSets}
          </span>
          <span>•</span>
          <span>{exercise.targetReps[0]}-{exercise.targetReps[1]} reps</span>
          <span>•</span>
          <span>Target: {exercise.targetWeight}kg</span>
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
              <span className="text-sm font-medium text-gray-300">Tecnica Esercizio</span>
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
          <h3 className="text-sm font-medium text-gray-400 mb-3">Completed Sets</h3>
          <div className="space-y-2">
            {exercise.completedSets.map((set, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-800 rounded p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Set {idx + 1}</span>
                  {set.mentalReadiness && (
                    <span
                      className="text-lg"
                      title={`Mental state: ${MENTAL_READINESS_EMOJIS[set.mentalReadiness].label}`}
                    >
                      {MENTAL_READINESS_EMOJIS[set.mentalReadiness].emoji}
                    </span>
                  )}
                </div>
                <span className="text-white font-medium">
                  {set.weight}kg × {set.reps} @ RIR {set.rir}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {showSuggestion && exercise.currentAISuggestion && (
        <div className="mb-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-300">AI Suggestion for Set {currentSetNumber}</h3>
            <button
              onClick={loadProgressionExplanation}
              disabled={loadingProgressionExplanation}
              className="p-1 hover:bg-blue-800/50 rounded transition-colors disabled:opacity-50"
              title="Why this progression?"
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
              <h3 className="text-lg font-medium text-amber-200">Rest Period</h3>
            </div>
            <button
              onClick={skipRest}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 rounded text-sm text-amber-300 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>

          {/* Countdown Display */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-6xl font-bold text-white font-mono mb-2">
              {Math.floor(restTimeRemaining / 60)}:{String(restTimeRemaining % 60).padStart(2, '0')}
            </div>
            <div className="text-sm text-amber-300">
              {exercise.restSeconds ? `${exercise.restSeconds}s rest prescribed` : 'Default rest period'}
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
            Rest allows ATP recovery for optimal performance on your next set
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
          <h3 className="text-xl font-bold text-white mb-2">Exercise Complete!</h3>
          <p className="text-gray-400 mb-6">Great work on {exercise.exerciseName}</p>
          <Button
            onClick={handleMoveToNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
          >
            {exerciseIndex < totalExercises - 1 ? 'Next Exercise' : 'Finish Workout'}
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
                  Getting AI suggestion...
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {exerciseIndex > 0 && (
          <Button
            onClick={previousExercise}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300"
          >
            ← Previous
          </Button>
        )}
      </div>
    </div>
  )
}
