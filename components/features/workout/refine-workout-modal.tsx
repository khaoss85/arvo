'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, RefreshCw, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { updateWorkoutStatusAction, updateWorkoutExercisesAction } from '@/app/actions/ai-actions'
import type { Workout } from '@/lib/types/schemas'

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
}

export function RefineWorkoutModal({
  workout,
  open,
  onClose,
  onWorkoutUpdated
}: RefineWorkoutModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null)

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

        <div className="space-y-4 py-4">
          {exercises.map((exercise, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                {/* Exercise Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exercise.name}</h3>
                    {exercise.equipmentVariant && (
                      <p className="text-sm text-muted-foreground">{exercise.equipmentVariant}</p>
                    )}
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
                    <p className="text-sm text-muted-foreground font-medium">Alternative exercises:</p>
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
