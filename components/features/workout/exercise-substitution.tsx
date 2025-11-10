'use client'

import { useState, useEffect } from 'react'

import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { suggestExerciseSubstitutionAction, validateCustomSubstitutionAction } from '@/app/actions/ai-actions'
import type { SubstitutionSuggestion, CurrentExerciseInfo, SubstitutionInput, CustomSubstitutionInput } from '@/lib/agents/exercise-substitution.agent'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, XCircle, Loader2, Sparkles, PlayCircle } from 'lucide-react'
import { ExerciseAnimationModal } from './exercise-animation-modal'

/**
 * Extract equipment variant from exercise name
 * Looks for patterns like "(Barbell)", "(Dumbbell)", etc.
 * Falls back to "Unknown" if not found
 */
function extractEquipmentVariant(exerciseName: string): string {
  const match = exerciseName.match(/\((Barbell|Dumbbell|Cable|Machine|Bodyweight)\)/i)
  if (match) {
    return match[1]
  }

  // Fallback: check if equipment type is mentioned in the name
  const lowerName = exerciseName.toLowerCase()
  if (lowerName.includes('barbell')) return 'Barbell'
  if (lowerName.includes('dumbbell') || lowerName.includes('db')) return 'Dumbbell'
  if (lowerName.includes('cable')) return 'Cable'
  if (lowerName.includes('machine')) return 'Machine'
  if (lowerName.includes('bodyweight')) return 'Bodyweight'

  return 'Unknown'
}

interface ExerciseSubstitutionProps {
  currentExercise: ExerciseExecution
  exerciseIndex: number
  userId: string
  onClose: () => void
  onRationaleInvalidate?: () => void
}

export function ExerciseSubstitution({
  currentExercise,
  exerciseIndex,
  userId,
  onClose,
  onRationaleInvalidate
}: ExerciseSubstitutionProps) {
  const { substituteExercise } = useWorkoutExecutionStore()
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestion[]>([])
  const [reasoning, setReasoning] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<SubstitutionSuggestion | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Custom input state
  const [customInput, setCustomInput] = useState<string>('')
  const [customValidating, setCustomValidating] = useState(false)
  const [customResult, setCustomResult] = useState<SubstitutionSuggestion | null>(null)
  const [customError, setCustomError] = useState<string | null>(null)

  // Animation modal state
  const [animationModalExercise, setAnimationModalExercise] = useState<{ name: string; url: string | null } | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [currentExercise])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build input for AI agent
      // Note: Server action will fetch user profile data (weak points, approach, equipment, etc.)
      const input: SubstitutionInput = {
        currentExercise: {
          name: currentExercise.exerciseName,
          equipmentVariant: extractEquipmentVariant(currentExercise.exerciseName),
          sets: currentExercise.targetSets,
          repRange: currentExercise.targetReps,
          targetWeight: currentExercise.targetWeight,
        },
        userId,
        // These will be loaded from user profile by the server action
        approachId: '', // Placeholder - server action loads from profile
        weakPoints: [],
        availableEquipment: [],
      }

      const result = await suggestExerciseSubstitutionAction(userId, input)

      if (result.success && result.data) {
        setSuggestions(result.data.suggestions)
        setReasoning(result.data.reasoning)
      } else {
        setError(result.error || 'Failed to load suggestions')
        setSuggestions([])
      }
    } catch (err) {
      console.error('Failed to load substitution suggestions:', err)
      setError('An unexpected error occurred')
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion: SubstitutionSuggestion) => {
    setSelectedSuggestion(suggestion)
    setShowConfirmation(true)
  }

  const handleConfirmSwap = () => {
    if (!selectedSuggestion) return

    // Create new exercise execution with substitution
    const newExercise: ExerciseExecution = {
      exerciseId: crypto.randomUUID(), // Temporary ID, will be replaced with actual DB ID
      exerciseName: selectedSuggestion.exercise.name,
      targetSets: selectedSuggestion.exercise.sets,
      targetReps: selectedSuggestion.exercise.repRange,
      targetWeight: selectedSuggestion.exercise.targetWeight,
      completedSets: currentExercise.completedSets, // Preserve completed sets
      currentAISuggestion: null
    }

    substituteExercise(exerciseIndex, newExercise)
    onRationaleInvalidate?.() // Invalidate rationale since exercise changed
    onClose()
  }

  const handleValidateCustom = async () => {
    if (!customInput.trim() || customInput.length < 3) return

    try {
      setCustomValidating(true)
      setCustomError(null)

      const input: CustomSubstitutionInput = {
        currentExercise: {
          name: currentExercise.exerciseName,
          equipmentVariant: extractEquipmentVariant(currentExercise.exerciseName),
          sets: currentExercise.targetSets,
          repRange: currentExercise.targetReps,
          targetWeight: currentExercise.targetWeight,
        },
        customExerciseName: customInput.trim(),
        userId,
        approachId: '',
        weakPoints: [],
        availableEquipment: [],
      }

      const result = await validateCustomSubstitutionAction(userId, input)

      if (result.success) {
        setCustomResult(result.data)
      } else {
        setCustomError(result.error)
      }
    } catch (err) {
      console.error('Failed to validate custom substitution:', err)
      setCustomError('An unexpected error occurred')
    } finally {
      setCustomValidating(false)
    }
  }

  const handleEditCustom = () => {
    setCustomResult(null)
    setCustomError(null)
  }

  const handleSelectCustom = () => {
    if (customResult) {
      handleSelectSuggestion(customResult)
    }
  }

  const getValidationIcon = (validation: string) => {
    switch (validation) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'caution':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'not_recommended':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getValidationBadgeColor = (validation: string) => {
    switch (validation) {
      case 'approved':
        return 'bg-green-900/50 border-green-700 text-green-300'
      case 'caution':
        return 'bg-yellow-900/50 border-yellow-700 text-yellow-300'
      case 'not_recommended':
        return 'bg-red-900/50 border-red-700 text-red-300'
      default:
        return 'bg-gray-800 border-gray-700 text-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Change Exercise</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Current Exercise Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-sm text-gray-400 mb-1">Current Exercise</h3>
            <div className="flex items-center gap-2">
              {/* Play icon for current exercise */}
              {currentExercise.hasAnimation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAnimationModalExercise({
                      name: currentExercise.exerciseName,
                      url: currentExercise.animationUrl || null
                    })
                  }}
                  className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                  aria-label={`View ${currentExercise.exerciseName} animation`}
                  title="Visualizza esercizio"
                >
                  <PlayCircle className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </button>
              )}
              <p className="text-lg font-medium text-white">{currentExercise.exerciseName}</p>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {currentExercise.targetSets} sets × {currentExercise.targetReps[0]}-{currentExercise.targetReps[1]} reps @ {currentExercise.targetWeight}kg
            </p>
          </div>

          {/* Custom Input Section - only show when not in confirmation */}
          {!showConfirmation && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <h3 className="text-sm font-semibold text-gray-300">Suggest Your Own</h3>
              </div>

              {/* Input or Result */}
              {!customResult ? (
                <>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !customValidating && customInput.trim().length >= 3) {
                        handleValidateCustom()
                      }
                    }}
                    placeholder="Type exercise name or describe what you want..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-3"
                    disabled={customValidating}
                    autoComplete="off"
                  />

                  {customError && (
                    <div className="text-sm text-red-400 mb-3">{customError}</div>
                  )}

                  <Button
                    onClick={handleValidateCustom}
                    disabled={customValidating || customInput.trim().length < 3}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {customValidating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validating with AI...
                      </>
                    ) : (
                      'Validate with AI →'
                    )}
                  </Button>
                </>
              ) : (
                /* Custom Result Card */
                <div className={`border-2 rounded-lg p-4 ${
                  customResult.validation === 'approved'
                    ? 'border-green-500 bg-green-950/20'
                    : customResult.validation === 'caution'
                    ? 'border-yellow-500 bg-yellow-950/20'
                    : 'border-red-500 bg-red-950/20'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {getValidationIcon(customResult.validation)}
                      <h4 className="font-semibold text-white text-base leading-tight">
                        {customResult.exercise.name}
                      </h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 ml-2 ${getValidationBadgeColor(customResult.validation)}`}>
                      {customResult.validation === 'approved' && '✓ Good'}
                      {customResult.validation === 'caution' && '⚠ Caution'}
                      {customResult.validation === 'not_recommended' && '✗ Not recommended'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-2 leading-relaxed">
                    {customResult.rationale}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-blue-400 font-medium">
                      → {customResult.exercise.targetWeight}kg
                    </span>
                    <span className="text-gray-500">
                      {customResult.swapImpact}
                    </span>
                  </div>

                  {customResult.rationalePreview && (
                    <div className="bg-purple-900/30 border border-purple-700 rounded p-2 mb-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-200 leading-snug">
                          {customResult.rationalePreview.workoutIntegration}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleEditCustom}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 min-h-[44px]"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={handleSelectCustom}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white min-h-[44px]"
                      disabled={customResult.validation === 'not_recommended'}
                    >
                      Select →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-gray-400">Finding smart alternatives...</p>
              <p className="text-sm text-gray-500 mt-1">AI is analyzing your training context</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{error}</p>
              <Button onClick={loadSuggestions} variant="outline" className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {!loading && !error && suggestions.length > 0 && !showConfirmation && (
            <>
              {/* Overall Reasoning */}
              {reasoning && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-300">{reasoning}</p>
                </div>
              )}

              {/* AI Suggestions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  🤖 AI Suggestions ({suggestions.length})
                </h3>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="relative bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-all border border-gray-700 hover:border-gray-600 hover:shadow-lg min-h-[88px] cursor-pointer"
                  >
                    {/* Exercise Name + Validation Icon */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Play icon for animation preview */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnimationModalExercise({ name: suggestion.exercise.name, url: null })
                          }}
                          className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group flex-shrink-0"
                          aria-label={`View ${suggestion.exercise.name} animation`}
                          title="Visualizza esercizio"
                        >
                          <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </button>
                        {getValidationIcon(suggestion.validation)}
                        <h4 className="font-semibold text-white text-base leading-tight">
                          {suggestion.exercise.name}
                        </h4>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 ml-2 ${getValidationBadgeColor(suggestion.validation)}`}>
                        {suggestion.validation === 'approved' && '✓ Good'}
                        {suggestion.validation === 'caution' && '⚠ Caution'}
                        {suggestion.validation === 'not_recommended' && '✗ Not recommended'}
                      </span>
                    </div>

                    {/* Rationale */}
                    <p className="text-sm text-gray-400 mb-2 leading-relaxed">
                      {suggestion.rationale}
                    </p>

                    {/* Weight + Impact */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400 font-medium">
                        → {suggestion.exercise.targetWeight}kg
                      </span>
                      <span className="text-gray-500">
                        {suggestion.swapImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fallback for no good options */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  None of these fit? <button className="text-blue-400 hover:text-blue-300 underline">Email Support</button>
                </p>
              </div>
            </>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && selectedSuggestion && (
            <div className="space-y-4">
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getValidationIcon(selectedSuggestion.validation)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Swap to {selectedSuggestion.exercise.name}?
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">
                      {selectedSuggestion.swapImpact}
                    </p>

                    {/* Rationale Preview */}
                    {selectedSuggestion.rationalePreview && (
                      <div className="bg-purple-800/30 border border-purple-600 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-purple-300 uppercase tracking-wide mb-1">
                              Impact on Workout
                            </p>
                            <p className="text-sm text-purple-100 leading-snug">
                              {selectedSuggestion.rationalePreview.workoutIntegration}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="font-medium text-gray-300">Sets:</span> {selectedSuggestion.exercise.sets}
                      </p>
                      <p className="text-gray-400">
                        <span className="font-medium text-gray-300">Reps:</span> {selectedSuggestion.exercise.repRange[0]}-{selectedSuggestion.exercise.repRange[1]}
                      </p>
                      <p className="text-gray-400">
                        <span className="font-medium text-gray-300">Weight:</span> {currentExercise.targetWeight}kg → <span className="text-blue-400 font-semibold">{selectedSuggestion.exercise.targetWeight}kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 min-h-[48px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmSwap}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold min-h-[48px]"
                >
                  Confirm Swap
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Button (when not in confirmation) */}
          {!loading && !showConfirmation && (
            <div className="mt-6">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 min-h-[48px]"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Animation Modal */}
      {animationModalExercise && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAnimationModalExercise(null)}
          exerciseName={animationModalExercise.name}
          animationUrl={animationModalExercise.url}
        />
      )}
    </div>
  )
}
