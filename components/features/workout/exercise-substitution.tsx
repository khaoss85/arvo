'use client'

import { useState, useEffect } from 'react'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { ExerciseService } from '@/lib/services/exercise.service'
import { adjustWeightForEquipment, extractMovementPattern } from '@/lib/utils/workout-helpers'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/types/schemas'

interface ExerciseSubstitutionProps {
  currentExercise: ExerciseExecution
  exerciseIndex: number
  onClose: () => void
}

export function ExerciseSubstitution({
  currentExercise,
  exerciseIndex,
  onClose
}: ExerciseSubstitutionProps) {
  const { substituteExercise } = useWorkoutExecutionStore()
  const [alternatives, setAlternatives] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')

  useEffect(() => {
    loadAlternatives()
  }, [currentExercise])

  const loadAlternatives = async () => {
    try {
      setLoading(true)

      // Get movement pattern from exercise name
      const pattern = extractMovementPattern(currentExercise.exerciseName)

      // Fetch similar exercises
      const exercises = await ExerciseService.getByPattern(pattern)

      // Filter out current exercise
      const filtered = exercises.filter(ex => ex.name !== currentExercise.exerciseName)

      setAlternatives(filtered)
    } catch (error) {
      console.error('Failed to load alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubstitute = (alternative: Exercise) => {
    // Extract equipment from exercise variants
    const equipmentVariants = alternative.equipment_variants as any
    const currentEquipment = selectedEquipment || 'Barbell'
    const newEquipment = equipmentVariants?.[0] || 'Barbell'

    // Adjust weight based on equipment change
    const adjustedWeight = adjustWeightForEquipment(
      currentExercise.targetWeight,
      currentEquipment,
      newEquipment
    )

    // Create new exercise execution
    const newExercise: ExerciseExecution = {
      exerciseId: alternative.id,
      exerciseName: alternative.name,
      targetSets: currentExercise.targetSets,
      targetReps: currentExercise.targetReps,
      targetWeight: adjustedWeight,
      completedSets: currentExercise.completedSets, // Preserve completed sets
      currentAISuggestion: null
    }

    substituteExercise(exerciseIndex, newExercise)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Substitute Exercise</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
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
              Target: {currentExercise.targetWeight}kg × {currentExercise.targetReps[0]}-{currentExercise.targetReps[1]} reps
            </p>
          </div>

          {/* Equipment Selector */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              What equipment are you switching to?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Barbell', 'Dumbbells', 'Machine', 'Cables', 'Bodyweight'].map((equipment) => (
                <button
                  key={equipment}
                  onClick={() => setSelectedEquipment(equipment)}
                  className={`p-3 rounded border text-sm font-medium transition-colors ${
                    selectedEquipment === equipment
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
          </div>

          {/* Alternative Exercises */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
              <p className="text-gray-400">Loading alternatives...</p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No alternatives found for this exercise pattern.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Similar Exercises ({alternatives.length})
              </h3>
              {alternatives.map((exercise) => {
                const equipmentVariants = exercise.equipment_variants as any
                const newEquipment = selectedEquipment || equipmentVariants?.[0] || 'Barbell'
                const adjustedWeight = adjustWeightForEquipment(
                  currentExercise.targetWeight,
                  'Barbell', // Assume current is barbell
                  newEquipment
                )

                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleSubstitute(exercise)}
                    className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors border border-gray-700 hover:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{exercise.name}</h4>
                      {selectedEquipment && (
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                          Adjusted weight
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Pattern: {exercise.pattern || 'N/A'}</span>
                      {selectedEquipment && (
                        <span className="text-blue-400 font-medium">
                          → {adjustedWeight}kg
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
