'use client'

import { useState, useEffect } from 'react'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { suggestExerciseSubstitutionAction } from '@/app/actions/ai-actions'
import type { SubstitutionSuggestion, CurrentExerciseInfo, SubstitutionInput } from '@/lib/agents/exercise-substitution.agent'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'

interface ExerciseSubstitutionProps {
  currentExercise: ExerciseExecution
  exerciseIndex: number
  userId: string
  onClose: () => void
}

export function ExerciseSubstitution({
  currentExercise,
  exerciseIndex,
  userId,
  onClose
}: ExerciseSubstitutionProps) {
  const { substituteExercise } = useWorkoutExecutionStore()
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestion[]>([])
  const [reasoning, setReasoning] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<SubstitutionSuggestion | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

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
          equipmentVariant: 'Barbell', // TODO: Extract from exercise name or metadata
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
      exerciseId: null, // Will be looked up or generated
      exerciseName: selectedSuggestion.exercise.name,
      targetSets: selectedSuggestion.exercise.sets,
      targetReps: selectedSuggestion.exercise.repRange,
      targetWeight: selectedSuggestion.exercise.targetWeight,
      completedSets: currentExercise.completedSets, // Preserve completed sets
      currentAISuggestion: null
    }

    substituteExercise(exerciseIndex, newExercise)
    onClose()
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
            <p className="text-lg font-medium text-white">{currentExercise.exerciseName}</p>
            <p className="text-sm text-gray-400">
              {currentExercise.targetSets} sets × {currentExercise.targetReps[0]}-{currentExercise.targetReps[1]} reps @ {currentExercise.targetWeight}kg
            </p>
          </div>

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
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-all border border-gray-700 hover:border-gray-600 hover:shadow-lg min-h-[88px]"
                  >
                    {/* Exercise Name + Validation Icon */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
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
                  </button>
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
    </div>
  )
}
