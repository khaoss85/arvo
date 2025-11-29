'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Check, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DropSetConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface DropSetLoggerProps {
  config: DropSetConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

interface DropEntry {
  weight: number
  reps: number
}

export function DropSetLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: DropSetLoggerProps) {
  const t = useTranslations('workout.techniques')

  // Calculate expected weights for each drop
  const calculateDropWeights = useCallback(() => {
    const weights: number[] = [initialWeight]
    for (let i = 1; i <= config.drops; i++) {
      const prevWeight = weights[weights.length - 1]
      const dropWeight = prevWeight * (1 - config.dropPercentage / 100)
      // Round to nearest 0.5kg
      weights.push(Math.round(dropWeight * 2) / 2)
    }
    return weights
  }, [initialWeight, config.drops, config.dropPercentage])

  const expectedWeights = calculateDropWeights()

  // Initialize drops state
  const [drops, setDrops] = useState<DropEntry[]>(() =>
    expectedWeights.map(w => ({ weight: w, reps: 0 }))
  )

  const [currentDrop, setCurrentDrop] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Handle weight change for a drop
  const updateDrop = (index: number, field: 'weight' | 'reps', value: number) => {
    setDrops(prev => {
      const newDrops = [...prev]
      newDrops[index] = { ...newDrops[index], [field]: value }
      return newDrops
    })
  }

  // Move to next drop
  const confirmDrop = () => {
    if (currentDrop < config.drops) {
      setCurrentDrop(prev => prev + 1)
    }
  }

  // Complete the drop set
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'drop_set',
      config,
      dropWeights: drops.map(d => d.weight),
      dropReps: drops.map(d => d.reps),
      completedFully: drops.every(d => d.reps > 0),
    }

    onComplete(result)
  }

  // Check if all drops are logged
  const allDropsLogged = drops.every(d => d.reps > 0)
  const canComplete = drops.slice(0, currentDrop + 1).every(d => d.reps > 0)

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-orange-400">
        <Zap className="h-5 w-5" />
        <span className="font-semibold">Drop Set</span>
        <span className="text-sm text-gray-400">
          ({config.drops} drops, -{config.dropPercentage}% each)
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        Perform reps to failure, then immediately reduce weight and continue.
        No rest between drops!
      </div>

      {/* Drops progress */}
      <div className="space-y-3">
        {drops.map((drop, index) => {
          const isActive = index === currentDrop
          const isCompleted = index < currentDrop || (index === currentDrop && drop.reps > 0)
          const isFuture = index > currentDrop

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isActive && 'bg-orange-500/20 border-orange-500/50',
                isCompleted && !isActive && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Drop number indicator */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300',
                  isActive && !isCompleted && 'bg-orange-500 text-white'
                )}>
                  {isCompleted && index < currentDrop ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index === 0 ? 'T' : index
                  )}
                </div>

                {/* Drop label */}
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-orange-300' : 'text-gray-400'
                  )}>
                    {index === 0 ? 'Top Set' : `Drop ${index}`}
                  </span>
                  {!isActive && !isFuture && (
                    <span className="ml-2 text-xs text-gray-500">
                      {drop.weight}kg × {drop.reps}
                    </span>
                  )}
                </div>

                {/* Expected weight hint for future drops */}
                {isFuture && (
                  <span className="text-xs text-gray-500">
                    ~{expectedWeights[index]}kg
                  </span>
                )}
              </div>

              {/* Input area for active drop */}
              {isActive && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
                    <Input
                      type="number"
                      value={drop.weight || ''}
                      onChange={(e) => updateDrop(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Reps</label>
                    <Input
                      type="number"
                      value={drop.reps || ''}
                      onChange={(e) => updateDrop(index, 'reps', parseInt(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {/* Confirm drop button */}
              {isActive && drop.reps > 0 && index < config.drops && (
                <Button
                  onClick={confirmDrop}
                  className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  {index === config.drops - 1 ? 'Finish Drop Set' : 'Next Drop'}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Warning if not all drops completed */}
      {!allDropsLogged && currentDrop === config.drops && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Some drops not logged</span>
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
          Complete Drop Set
        </Button>
      </div>
    </div>
  )
}
