'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Repeat, Check, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { MechanicalDropSetConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface MechanicalDropSetLoggerProps {
  config: MechanicalDropSetConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

interface VariationEntry {
  name: string
  reps: number
}

export function MechanicalDropSetLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: MechanicalDropSetLoggerProps) {
  const t = useTranslations('workout.techniques')

  // Initialize variations from config
  const [variations, setVariations] = useState<VariationEntry[]>(() =>
    config.variations.map(name => ({ name, reps: 0 }))
  )

  const [weight, setWeight] = useState(initialWeight)
  const [currentVariation, setCurrentVariation] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Update variation reps
  const updateVariation = (index: number, reps: number) => {
    setVariations(prev => {
      const newVariations = [...prev]
      newVariations[index] = { ...newVariations[index], reps }
      return newVariations
    })
  }

  // Move to next variation
  const confirmVariation = () => {
    if (currentVariation < variations.length - 1) {
      setCurrentVariation(prev => prev + 1)
    }
  }

  // Complete the mechanical drop set
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'mechanical_drop_set',
      config,
      dropReps: variations.map(v => v.reps),
      dropWeights: variations.map(() => weight), // Same weight throughout
      completedFully: variations.every(v => v.reps > 0),
      notes: `Variations: ${variations.map(v => `${v.name}:${v.reps}`).join(', ')}`,
    }

    onComplete(result)
  }

  // Check completion status
  const allVariationsLogged = variations.every(v => v.reps > 0)
  const canComplete = variations.slice(0, currentVariation + 1).every(v => v.reps > 0)

  // Handle case where no variations are configured
  if (variations.length === 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Configuration Error</span>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          No variations configured for this mechanical drop set.
        </p>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-400">
        <Repeat className="h-5 w-5" />
        <span className="font-semibold">Mechanical Drop Set</span>
        <span className="text-sm text-gray-400">
          ({variations.length} variations)
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        Keep the same weight, change the exercise variation to use mechanical advantage.
        {config.restBetween > 0 && ` Take ${config.restBetween}s rest between variations.`}
        {config.restBetween === 0 && ' No rest between variations!'}
      </div>

      {/* Weight input */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="text-xs text-gray-400 mb-1 block">Weight (kg) - same for all variations</label>
        <Input
          type="number"
          value={weight || ''}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className="bg-gray-900/50 border-gray-700"
          step={0.5}
        />
      </div>

      {/* Variations list */}
      <div className="space-y-3">
        {variations.map((variation, index) => {
          const isActive = index === currentVariation
          const isCompleted = index < currentVariation || (index === currentVariation && variation.reps > 0)
          const isFuture = index > currentVariation

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isActive && 'bg-amber-500/20 border-amber-500/50',
                isCompleted && !isActive && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Variation number indicator */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300',
                  isActive && !isCompleted && 'bg-amber-500 text-white'
                )}>
                  {isCompleted && index < currentVariation ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Variation name */}
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium capitalize',
                    isActive ? 'text-amber-300' : 'text-gray-400'
                  )}>
                    {variation.name}
                  </span>
                  {!isActive && !isFuture && variation.reps > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      {weight}kg × {variation.reps}
                    </span>
                  )}
                </div>

                {/* Target reps hint */}
                {(isActive || isFuture) && (
                  <span className="text-xs text-gray-500">
                    Target: {config.repsPerVariation}
                  </span>
                )}
              </div>

              {/* Input area for active variation */}
              {isActive && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 mb-1 block">Reps Achieved</label>
                  <Input
                    type="number"
                    value={variation.reps || ''}
                    onChange={(e) => updateVariation(index, parseInt(e.target.value) || 0)}
                    className="bg-gray-900/50 border-gray-700"
                    min={0}
                    placeholder={`Target: ${config.repsPerVariation}`}
                  />
                </div>
              )}

              {/* Confirm variation button */}
              {isActive && variation.reps > 0 && index < variations.length - 1 && (
                <Button
                  onClick={confirmVariation}
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Next Variation: {variations[index + 1].name}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Warning if not all variations completed */}
      {!allVariationsLogged && currentVariation === variations.length - 1 && variations[currentVariation].reps > 0 && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Some variations not logged</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete || isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete
        </Button>
      </div>
    </div>
  )
}
