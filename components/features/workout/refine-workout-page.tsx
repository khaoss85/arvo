'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw, Check, Play, ChevronDown, ChevronUp, List, PlayCircle, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { updateWorkoutStatusAction, updateWorkoutExercisesAction, suggestExerciseSubstitutionAction, validateCustomSubstitutionAction } from '@/app/actions/ai-actions'
import type { SubstitutionSuggestion, SubstitutionInput, CustomSubstitutionInput } from '@/lib/agents/exercise-substitution.agent'
import type { Workout } from '@/lib/types/schemas'
import { WorkoutRationale, WorkoutRationaleHandle } from './workout-rationale'
import { ExerciseAnimationModal } from './exercise-animation-modal'
import { AnimationService } from '@/lib/services/animation.service'
import { ReorderExercisesReviewModal } from './reorder-exercises-review-modal'
import { AddSetButton } from './add-set-button'
import { UserModificationBadge } from './user-modification-badge'

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
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null)
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false)
  const [customInputs, setCustomInputs] = useState<Map<number, string>>(new Map())
  const [animationModalOpen, setAnimationModalOpen] = useState<number | null>(null)
  const rationaleRef = useRef<WorkoutRationaleHandle>(null)

  // AI Alternatives state
  const [alternatives, setAlternatives] = useState<Map<number, SubstitutionSuggestion[]>>(new Map())
  const [alternativesLoading, setAlternativesLoading] = useState<Map<number, boolean>>(new Map())

  // Custom input validation state
  const [customValidationResults, setCustomValidationResults] = useState<Map<number, SubstitutionSuggestion>>(new Map())
  const [customValidating, setCustomValidating] = useState<Map<number, boolean>>(new Map())

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
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Error saving exercise swap:', error)
      alert('Failed to save changes. Please try again.')
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
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Error saving custom exercise:', error)
      alert('Failed to save changes. Please try again.')
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
        alert('Maximum 5 extra sets allowed. You\'ve reached your limit to prevent overtraining.')
        return { success: false, error: 'hard_limit' }
      }

      // SOFT WARNING: At 3+ extra sets
      if (newAddedSets >= 3) {
        const proceed = confirm(
          `You're adding set #${newAddedSets} beyond AI recommendation.\n\n` +
          'This increases fatigue and recovery needs. Continue?'
        )
        if (!proceed) return { success: false, error: 'user_cancelled' }
      }

      // Update local state
      const newExercises = [...exercises]
      const warnings: string[] = newAddedSets >= 3 ? ['High volume - monitor recovery'] : []

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
        alert('Failed to add set. Please try again.')
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
      alert('Failed to add set. Please try again.')
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
      alert('Failed to regenerate exercise. Please try again.')
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
        alert(`Failed to mark workout as ready: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to mark workout as ready:', error)
      alert('Failed to mark workout as ready. Please try again.')
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
          alert(`Failed to prepare workout: ${result.error}`)
          return
        }
      } catch (error) {
        console.error('Failed to prepare workout:', error)
        alert('Failed to prepare workout. Please try again.')
        return
      } finally {
        setIsMarkingReady(false)
      }
    }

    // Navigate to workout execution
    router.push(`/workout/${workout.id}`)
  }

  if (!workout) return null

  return (
    <div className="max-w-4xl mx-auto">
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
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                      {exercise.userAddedSets && exercise.userAddedSets > 0 && (
                        <UserModificationBadge
                          addedSets={exercise.userAddedSets}
                          aiRecommendedSets={exercise.aiRecommendedSets || exercise.sets}
                          variant="compact"
                        />
                      )}
                      {exercise.hasAnimation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnimationModalOpen(index)
                          }}
                          className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                          aria-label={`View ${exercise.name} animation`}
                          title="Visualizza esercizio"
                        >
                          <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </button>
                      )}
                    </div>
                    {exercise.equipmentVariant && (
                      <p className="text-sm text-muted-foreground">{exercise.equipmentVariant}</p>
                    )}
                  </div>
                </div>
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

              {/* Exercise Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sets:</span>
                  <span className="ml-2 font-medium">{exercise.sets}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reps:</span>
                  <span className="ml-2 font-medium">
                    {exercise.repRange ? `${exercise.repRange[0]}-${exercise.repRange[1]}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-2 font-medium">{exercise.targetWeight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rest:</span>
                  <span className="ml-2 font-medium">{exercise.restSeconds}s</span>
                </div>
              </div>

              {/* Add Set Button */}
              <div className="flex justify-end pt-1">
                <AddSetButton
                  currentSets={exercise.sets}
                  onAddSet={() => handleAddSet(index)}
                  variant="inline"
                  userAddedSets={exercise.userAddedSets}
                />
              </div>

              {/* User Modification Details */}
              {exercise.userAddedSets && exercise.userAddedSets > 0 && (
                <div className="pt-2 text-xs text-gray-400 flex items-center justify-between">
                  <span>
                    AI recommended: {exercise.aiRecommendedSets || exercise.sets} sets •
                    You added: +{exercise.userAddedSets}
                  </span>
                  {exercise.userModifications?.aiWarnings && exercise.userModifications.aiWarnings.length > 0 && (
                    <span className="text-yellow-400">⚠️ Volume warning</span>
                  )}
                </div>
              )}

              {/* Rationale (Expanded) */}
              {expandedExercises.has(index) && exercise.rationale && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Why this exercise:</p>
                  <p className="text-sm">{exercise.rationale}</p>
                </div>
              )}

              {/* Alternatives (Expanded) */}
              {expandedExercises.has(index) && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">AI-suggested alternatives:</p>
                  {alternativesLoading.get(index) ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading alternatives...</span>
                    </div>
                  ) : alternatives.get(index) && alternatives.get(index)!.length > 0 ? (
                    alternatives.get(index)!.map((alt, altIndex) => (
                      <div
                        key={altIndex}
                        className="flex items-start justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alt.exercise.name}</p>
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
                        Swap
                      </Button>
                    </div>
                  ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No alternatives available</p>
                  )}

                  {/* Custom Exercise Input */}
                  <div className="pt-2 space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Or enter your own:</p>
                    {!customValidationResults.get(index) ? (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type exercise name..."
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
                            {customValidating.get(index) ? 'Validating...' : 'Validate'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter any exercise name. The AI will validate it fits the workout.
                        </p>
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
                            <p className="font-medium text-sm">{customValidationResults.get(index)!.exercise.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{customValidationResults.get(index)!.rationale}</p>
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
                            Edit
                          </Button>
                          {customValidationResults.get(index)!.validation === 'approved' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCustomSwap(index)}
                            >
                              Use This
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
                  {isRegenerating === index ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
                    </div>
                  </Card>
                ))}
              </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center gap-4 sticky bottom-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAsReady}
            disabled={isMarkingReady}
          >
            <Check className="w-4 h-4 mr-2" />
            {isMarkingReady ? 'Saving...' : 'Save & Return'}
          </Button>
          {exercises.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setIsReorderModalOpen(true)}
              disabled={isMarkingReady}
            >
              <List className="w-4 h-4 mr-2" />
              Reorder
            </Button>
          )}
        </div>
        <Button
          onClick={handleStartWorkout}
          disabled={isMarkingReady}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Workout
        </Button>
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
    </div>
  )
}
