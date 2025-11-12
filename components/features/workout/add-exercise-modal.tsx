'use client'

import { useState, useEffect } from 'react'
import { X, Search, Dumbbell, Target, Sparkles, CheckCircle, AlertCircle, XCircle, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { suggestExerciseAdditionAction, validateExerciseAdditionAction } from '@/app/actions/ai-actions'
import type { ExerciseSuggestionInput } from '@/lib/agents/exercise-suggester.agent'
import type { ExerciseAdditionInput, ExerciseAdditionOutput } from '@/lib/agents/exercise-addition-validator.agent'
import { ExerciseValidationModal } from './exercise-validation-modal'
import { ExerciseAnimationModal } from './exercise-animation-modal'
import { useUIStore } from '@/lib/stores/ui.store'

interface Exercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  animationUrl?: string | null
  hasAnimation?: boolean
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: Exercise) => Promise<void>
  currentWorkoutType?: string
  excludeExercises?: string[] // Exercise names to exclude (already in workout)
  // AI enhancements (Phase 2)
  enableAISuggestions?: boolean
  enableAIValidation?: boolean
  userId?: string
  currentWorkoutContext?: {
    existingExercises: Array<{
      name: string
      sets: number
      muscleGroups: {
        primary: string[]
        secondary: string[]
      }
      movementPattern?: string
      isCompound: boolean
    }>
    totalExercises: number
    totalSets: number
  }
}

/**
 * Modal for selecting an exercise to add to the workout
 *
 * Phase 1: Basic search and selection
 * Phase 2: AI suggestions at the top + validation on selection
 */
export function AddExerciseModal({
  isOpen,
  onClose,
  onSelectExercise,
  currentWorkoutType = 'push',
  excludeExercises = [],
  enableAISuggestions = false,
  enableAIValidation = false,
  userId,
  currentWorkoutContext,
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  // AI suggestions state
  const [aiSuggestions, setAISuggestions] = useState<any[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map())

  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationResult, setValidationResult] = useState<ExerciseAdditionOutput | null>(null)
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null)

  // Animation modal state
  const [animationModalOpen, setAnimationModalOpen] = useState<string | null>(null)
  const [selectedExerciseForAnimation, setSelectedExerciseForAnimation] = useState<Exercise | null>(null)

  // Toast notifications
  const { addToast } = useUIStore()

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Load exercises from API
  useEffect(() => {
    if (!isOpen) return

    const loadExercises = async () => {
      setIsLoading(true)
      try {
        // Fetch from exercise_generations table
        const response = await fetch('/api/exercises/list')

        if (!response.ok) {
          throw new Error('Failed to load exercises')
        }

        const data = await response.json()
        setExercises(data.exercises || [])
      } catch (error) {
        console.error('Error loading exercises:', error)
        // Fallback to hardcoded popular exercises
        setExercises(getDefaultExercises())
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [isOpen])

  // Load AI suggestions (Phase 2)
  useEffect(() => {
    if (!isOpen || !enableAISuggestions || !userId || !currentWorkoutContext) return

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const input: ExerciseSuggestionInput = {
          currentWorkout: {
            workoutType: currentWorkoutType as any,
            existingExercises: currentWorkoutContext.existingExercises,
            totalExercises: currentWorkoutContext.totalExercises,
            totalSets: currentWorkoutContext.totalSets,
          },
          userContext: {
            userId,
            approachId: '', // Will be enriched server-side
          },
        }

        const result = await suggestExerciseAdditionAction(userId, input)

        if (result.success && result.suggestions) {
          setAISuggestions(result.suggestions.suggestions || [])
        }
      } catch (error) {
        console.error('Error loading AI suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    loadSuggestions()
  }, [isOpen, enableAISuggestions, userId, currentWorkoutContext, currentWorkoutType])

  // Filter exercises based on search and category
  useEffect(() => {
    let filtered = exercises

    // Exclude exercises already in workout
    if (excludeExercises.length > 0) {
      filtered = filtered.filter(
        ex => !excludeExercises.includes(ex.name.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => {
        if (selectedCategory === 'chest') return ex.bodyPart === 'chest' || ex.target.includes('pectoral')
        if (selectedCategory === 'back') return ex.bodyPart === 'back' || ex.target.includes('lats') || ex.target.includes('traps')
        if (selectedCategory === 'legs') return ex.bodyPart === 'legs' || ex.bodyPart === 'upper legs' || ex.bodyPart === 'lower legs'
        if (selectedCategory === 'shoulders') return ex.bodyPart === 'shoulders' || ex.target.includes('delts')
        if (selectedCategory === 'arms') return ex.bodyPart === 'upper arms' || ex.bodyPart === 'lower arms'
        return true
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        ex =>
          ex.name.toLowerCase().includes(query) ||
          ex.bodyPart.toLowerCase().includes(query) ||
          ex.equipment.toLowerCase().includes(query) ||
          ex.target.toLowerCase().includes(query)
      )
    }

    setFilteredExercises(filtered)
  }, [exercises, searchQuery, selectedCategory, excludeExercises])

  const validateExercise = async (exercise: Exercise) => {
    if (!enableAIValidation || !userId || !currentWorkoutContext) {
      return null
    }

    try {
      const input: ExerciseAdditionInput = {
        exerciseToAdd: {
          name: exercise.name,
          equipmentVariant: exercise.equipment,
          muscleGroups: {
            primary: exercise.primaryMuscles || [exercise.bodyPart],
            secondary: exercise.secondaryMuscles || [],
          },
          isCompound: exercise.name.toLowerCase().includes('press') ||
                      exercise.name.toLowerCase().includes('squat') ||
                      exercise.name.toLowerCase().includes('row'),
        },
        currentWorkout: {
          workoutType: currentWorkoutType as any,
          existingExercises: currentWorkoutContext.existingExercises,
          totalExercises: currentWorkoutContext.totalExercises,
          totalSets: currentWorkoutContext.totalSets,
          totalVolume: currentWorkoutContext.totalSets * 10, // Rough estimate
        },
        userContext: {
          userId,
          approachId: '', // Will be enriched server-side
        },
      }

      const result = await validateExerciseAdditionAction(userId, input)

      if (result.success && result.validation) {
        return result.validation
      }
    } catch (error) {
      console.error('Error validating exercise:', error)
    }

    return null
  }

  const handleSelectExercise = async (exercise: Exercise) => {
    setIsSelecting(true)
    try {
      // Validate if AI validation is enabled
      if (enableAIValidation) {
        const validation = await validateExercise(exercise)

        if (validation) {
          setValidationResults(new Map(validationResults).set(exercise.name, validation))

          // If rejected or caution, show modal
          if (validation.validation === 'rejected' || validation.validation === 'caution') {
            setValidationResult(validation)
            setPendingExercise(exercise)
            setShowValidationModal(true)
            setIsSelecting(false)
            return
          }

          // If approved, proceed automatically (no modal needed)
        }
      }

      await onSelectExercise(exercise)
      onClose()
    } catch (error) {
      console.error('Error selecting exercise:', error)
      addToast('Failed to add exercise. Please try again.', 'error')
    } finally {
      setIsSelecting(false)
    }
  }

  const handleProceedWithExercise = async () => {
    if (!pendingExercise) return

    setShowValidationModal(false)
    setIsSelecting(true)

    try {
      await onSelectExercise(pendingExercise)
      onClose()
    } catch (error) {
      console.error('Error selecting exercise:', error)
      addToast('Failed to add exercise. Please try again.', 'error')
    } finally {
      setIsSelecting(false)
      setPendingExercise(null)
      setValidationResult(null)
    }
  }

  const categories = [
    { id: 'all', label: 'All', icon: Dumbbell },
    { id: 'chest', label: 'Chest', icon: Target },
    { id: 'back', label: 'Back', icon: Target },
    { id: 'legs', label: 'Legs', icon: Target },
    { id: 'shoulders', label: 'Shoulders', icon: Target },
    { id: 'arms', label: 'Arms', icon: Target },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Exercise</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Suggestions (Phase 2) */}
        {enableAISuggestions && (
          <div className="p-4 border-b border-gray-800 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-400">AI Suggested Exercises</h3>
            </div>

            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-sm text-gray-400">Analyzing your workout...</span>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {aiSuggestions.slice(0, 5).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Find matching exercise in exercises list
                      const matchingExercise = exercises.find(
                        ex => ex.name.toLowerCase() === suggestion.name.toLowerCase()
                      )
                      if (matchingExercise) {
                        handleSelectExercise(matchingExercise)
                      }
                    }}
                    disabled={isSelecting}
                    className="w-full flex items-start gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-blue-500/30 hover:border-blue-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm">{suggestion.name}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            suggestion.priority === 'high'
                              ? 'bg-green-500/20 text-green-400'
                              : suggestion.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {suggestion.rationale}
                      </p>
                      {suggestion.expectedBenefit && (
                        <p className="text-xs text-blue-400 mt-1">
                          → {suggestion.expectedBenefit}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No suggestions available</p>
            )}
          </div>
        )}

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No exercises found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or category</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  disabled={isSelecting}
                  className="flex items-start gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {exercise.hasAnimation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnimationModalOpen(exercise.id)
                            setSelectedExerciseForAnimation(exercise)
                          }}
                          className="p-0.5 hover:bg-blue-600/20 rounded transition-colors group"
                          aria-label={`View ${exercise.name} animation`}
                          title="Visualizza esercizio"
                        >
                          <PlayCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </button>
                      )}
                      <h3 className="text-white font-medium">{exercise.name}</h3>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-700 rounded">
                        {exercise.bodyPart || 'General'}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded">
                        {exercise.equipment || 'Any'}
                      </span>
                      {exercise.target && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          {exercise.target}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            ESC to close • Select an exercise to add it to your workout
          </p>
        </div>
      </div>

      {/* Exercise Validation Modal */}
      {validationResult && pendingExercise && (
        <ExerciseValidationModal
          isOpen={showValidationModal}
          onClose={() => {
            setShowValidationModal(false)
            setPendingExercise(null)
            setValidationResult(null)
          }}
          onProceed={handleProceedWithExercise}
          validation={validationResult}
          exerciseName={pendingExercise.name}
        />
      )}

      {/* Exercise Animation Modal */}
      {animationModalOpen !== null && selectedExerciseForAnimation && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => {
            setAnimationModalOpen(null)
            setSelectedExerciseForAnimation(null)
          }}
          exerciseName={selectedExerciseForAnimation.name}
          animationUrl={selectedExerciseForAnimation.animationUrl || null}
        />
      )}
    </div>
  )
}

// Default exercises fallback (most popular compound movements)
function getDefaultExercises(): Exercise[] {
  return [
    // Chest
    { id: '1', name: 'Barbell Bench Press', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals', hasAnimation: true },
    { id: '2', name: 'Dumbbell Bench Press', bodyPart: 'chest', equipment: 'dumbbell', target: 'pectorals', hasAnimation: true },
    { id: '3', name: 'Incline Barbell Press', bodyPart: 'chest', equipment: 'barbell', target: 'upper pectorals', hasAnimation: true },
    { id: '4', name: 'Cable Fly', bodyPart: 'chest', equipment: 'cable', target: 'pectorals', hasAnimation: false },

    // Back
    { id: '5', name: 'Barbell Row', bodyPart: 'back', equipment: 'barbell', target: 'lats', hasAnimation: true },
    { id: '6', name: 'Pull-up', bodyPart: 'back', equipment: 'bodyweight', target: 'lats', hasAnimation: true },
    { id: '7', name: 'Lat Pulldown', bodyPart: 'back', equipment: 'cable', target: 'lats', hasAnimation: true },
    { id: '8', name: 'Dumbbell Row', bodyPart: 'back', equipment: 'dumbbell', target: 'lats', hasAnimation: true },

    // Legs
    { id: '9', name: 'Barbell Squat', bodyPart: 'legs', equipment: 'barbell', target: 'quadriceps', hasAnimation: true },
    { id: '10', name: 'Romanian Deadlift', bodyPart: 'legs', equipment: 'barbell', target: 'hamstrings', hasAnimation: true },
    { id: '11', name: 'Leg Press', bodyPart: 'legs', equipment: 'machine', target: 'quadriceps', hasAnimation: true },
    { id: '12', name: 'Leg Curl', bodyPart: 'legs', equipment: 'machine', target: 'hamstrings', hasAnimation: false },

    // Shoulders
    { id: '13', name: 'Overhead Press', bodyPart: 'shoulders', equipment: 'barbell', target: 'deltoids', hasAnimation: true },
    { id: '14', name: 'Dumbbell Lateral Raise', bodyPart: 'shoulders', equipment: 'dumbbell', target: 'lateral deltoids', hasAnimation: true },
    { id: '15', name: 'Face Pull', bodyPart: 'shoulders', equipment: 'cable', target: 'rear deltoids', hasAnimation: false },

    // Arms
    { id: '16', name: 'Barbell Curl', bodyPart: 'upper arms', equipment: 'barbell', target: 'biceps', hasAnimation: true },
    { id: '17', name: 'Tricep Pushdown', bodyPart: 'upper arms', equipment: 'cable', target: 'triceps', hasAnimation: true },
    { id: '18', name: 'Dumbbell Hammer Curl', bodyPart: 'upper arms', equipment: 'dumbbell', target: 'biceps', hasAnimation: false },
  ]
}
