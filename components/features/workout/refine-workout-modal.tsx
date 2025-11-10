'use client'

import React, { useState, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw, Check, X, ChevronDown, ChevronUp, GripVertical, List } from 'lucide-react'
import { updateWorkoutStatusAction, updateWorkoutExercisesAction } from '@/app/actions/ai-actions'
import type { Workout } from '@/lib/types/schemas'
import { WorkoutRationale, WorkoutRationaleHandle } from './workout-rationale'

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
}

interface RefineWorkoutModalProps {
  workout: Workout | null
  open: boolean
  onClose: () => void
  onWorkoutUpdated: () => void
  userId: string
}

export function RefineWorkoutModal({
  workout,
  open,
  onClose,
  onWorkoutUpdated,
  userId
}: RefineWorkoutModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [customInputs, setCustomInputs] = useState<Map<number, string>>(new Map())
  const rationaleRef = useRef<WorkoutRationaleHandle>(null)

  // Initialize exercises when workout changes
  React.useEffect(() => {
    if (workout?.exercises) {
      setExercises(workout.exercises as unknown as Exercise[])
    }
  }, [workout])

  const toggleExerciseExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedExercises(newExpanded)
  }

  const handleSwapExercise = async (exerciseIndex: number, alternativeIndex: number) => {
    const exercise = exercises[exerciseIndex]
    const alternative = exercise.alternatives?.[alternativeIndex]

    if (!alternative || !workout) return

    // Replace exercise with alternative
    const newExercises = [...exercises]
    newExercises[exerciseIndex] = {
      ...exercise,
      name: alternative.name,
      equipmentVariant: alternative.equipmentVariant || exercise.equipmentVariant,
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
    const customName = customInputs.get(exerciseIndex)
    if (!customName || !customName.trim() || !workout) return

    const exercise = exercises[exerciseIndex]

    // Replace exercise with custom input
    const newExercises = [...exercises]
    newExercises[exerciseIndex] = {
      ...exercise,
      name: customName.trim(),
      rationale: 'Custom exercise selected by user'
    }

    setExercises(newExercises)
    setCustomInputs(new Map(customInputs).set(exerciseIndex, ''))

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !workout) return

    const items = Array.from(exercises)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setExercises(items)
    rationaleRef.current?.invalidate()

    // Save reordered exercises
    try {
      const result = await updateWorkoutExercisesAction(workout.id, items)
      if (!result.success) {
        console.error('Failed to save reorder:', result.error)
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Error saving reorder:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  const handleMarkAsReady = async () => {
    if (!workout) return

    setIsMarkingReady(true)

    try {
      const result = await updateWorkoutStatusAction(workout.id, 'ready')

      if (result.success) {
        onWorkoutUpdated()
        onClose()
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

  if (!workout) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Refine Workout - {workout.workout_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Review and customize your pre-generated workout before starting
          </p>
        </DialogHeader>

        {/* Reorder Mode Toggle */}
        {exercises.length > 1 && (
          <div className="flex justify-end px-6 pt-4">
            <Button
              variant={isReorderMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsReorderMode(!isReorderMode)}
            >
              <List className="w-4 h-4 mr-2" />
              {isReorderMode ? 'Done Reordering' : 'Reorder Exercises'}
            </Button>
          </div>
        )}

        {/* Workout Rationale - Overall plan understanding */}
        {exercises.length > 0 && (
          <div className="mt-4">
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises" isDropDisabled={!isReorderMode}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 py-4"
              >
                {exercises.map((exercise, index) => (
                  <Draggable
                    key={`exercise-${index}`}
                    draggableId={`exercise-${index}`}
                    index={index}
                    isDragDisabled={!isReorderMode}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-purple-500' : ''}`}
                      >
                        <div className="space-y-3">
                          {/* Exercise Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {isReorderMode && (
                                <div {...provided.dragHandleProps} className="pt-1 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{exercise.name}</h3>
                                {exercise.equipmentVariant && (
                                  <p className="text-sm text-muted-foreground">{exercise.equipmentVariant}</p>
                                )}
                              </div>
                            </div>
                            {!isReorderMode && (
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
                            )}
                          </div>

                {/* Exercise Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sets:</span>
                    <span className="ml-2 font-medium">{exercise.sets}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reps:</span>
                    <span className="ml-2 font-medium">{exercise.repRange[0]}-{exercise.repRange[1]}</span>
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

                {/* Rationale (Expanded) */}
                {expandedExercises.has(index) && exercise.rationale && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Why this exercise:</p>
                    <p className="text-sm">{exercise.rationale}</p>
                  </div>
                )}

                {/* Alternatives (Expanded) */}
                {expandedExercises.has(index) && exercise.alternatives && exercise.alternatives.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">AI-suggested alternatives:</p>
                    {exercise.alternatives.map((alt, altIndex) => (
                      <div
                        key={altIndex}
                        className="flex items-start justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alt.name}</p>
                          {alt.equipmentVariant && (
                            <p className="text-xs text-muted-foreground">{alt.equipmentVariant}</p>
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
                    ))}

                    {/* Custom Exercise Input */}
                    <div className="pt-2 space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">Or enter your own:</p>
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
                            if (e.key === 'Enter') {
                              handleCustomSwap(index)
                            }
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCustomSwap(index)}
                          disabled={!customInputs.get(index)?.trim()}
                        >
                          Use This
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter any exercise name. The AI will validate it fits the workout.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isReorderMode && (
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
                )}
              </div>
            </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose} disabled={isMarkingReady}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleMarkAsReady} disabled={isMarkingReady}>
            <Check className="w-4 h-4 mr-2" />
            {isMarkingReady ? 'Marking as Ready...' : 'Mark as Ready'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
