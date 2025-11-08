'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { X, GripVertical, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { validateReorderAction } from '@/app/actions/ai-actions'
import type { ReorderValidationOutput } from '@/lib/agents/reorder-validator.agent'
import { Button } from '@/components/ui/button'

interface ReorderExercisesModalProps {
  workoutType: string
  approachId: string
  onClose: () => void
}

export function ReorderExercisesModal({ workoutType, approachId, onClose }: ReorderExercisesModalProps) {
  const { exercises, reorderExercises } = useWorkoutExecutionStore()
  const [orderedExercises, setOrderedExercises] = useState<ExerciseExecution[]>(exercises)
  const [validation, setValidation] = useState<ReorderValidationOutput | null>(null)
  const [validating, setValidating] = useState(false)
  const [hasReordered, setHasReordered] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(orderedExercises)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setOrderedExercises(items)
    setHasReordered(true)
    setValidation(null) // Clear previous validation
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const originalOrder = exercises.map(ex => ex.exerciseName)
      const newOrder = orderedExercises.map(ex => ex.exerciseName)

      const result = await validateReorderAction({
        originalOrder,
        newOrder,
        workoutType: workoutType as any,
        approachId
      })

      if (result.success && result.validation) {
        setValidation(result.validation)
      }
    } catch (error) {
      console.error('Failed to validate reorder:', error)
    } finally {
      setValidating(false)
    }
  }

  const handleApply = () => {
    reorderExercises(orderedExercises)
    onClose()
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed':
        return 'green'
      case 'caution':
        return 'yellow'
      case 'not_recommended':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'caution':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'not_recommended':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reorder Exercises
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag exercises to reorder. AI will validate your changes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="exercises">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${
                    snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2' : ''
                  }`}
                >
                  {orderedExercises.map((exercise, index) => (
                    <Draggable
                      key={exercise.exerciseName}
                      draggableId={exercise.exerciseName}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 ${
                            snapshot.isDragging
                              ? 'border-blue-500 shadow-lg'
                              : 'border-transparent'
                          }`}
                        >
                          <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {index + 1}. {exercise.exerciseName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {exercise.completedSets.length}/{exercise.targetSets} sets completed
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Validation Section */}
          {hasReordered && !validation && (
            <div className="mt-6">
              <Button
                onClick={handleValidate}
                disabled={validating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {validating ? 'Validating with AI...' : 'Validate Reorder with AI'}
              </Button>
            </div>
          )}

          {/* Validation Results */}
          {validation && (
            <div className="mt-6 space-y-4">
              <div className={`border-2 rounded-lg p-4 ${
                validation.recommendation === 'proceed'
                  ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/20'
                  : validation.recommendation === 'caution'
                  ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20'
              }`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(validation.recommendation)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      AI Recommendation: {validation.recommendation.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {validation.reasoning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {validation.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-orange-800 dark:text-orange-200">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {validation.suggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Better Alternatives
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {validation.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasReordered || (validation ? validation.isValid === false : false)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Reorder
          </Button>
        </div>
      </div>
    </div>
  )
}
