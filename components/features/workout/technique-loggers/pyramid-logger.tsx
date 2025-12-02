'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Triangle, Check, ChevronRight, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PyramidConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface PyramidLoggerProps {
  config: PyramidConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

interface PyramidEntry {
  weight: number
  reps: number
}

export function PyramidLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: PyramidLoggerProps) {
  const t = useTranslations('workout.techniques.pyramid')

  // Calculate total steps based on direction
  const totalSteps = config.direction === 'full' ? config.steps * 2 : config.steps

  // Calculate expected weights for each step
  const calculatePyramidWeights = useCallback(() => {
    const weights: number[] = []
    const weightIncrement = initialWeight * 0.05 // 5% per step

    if (config.direction === 'ascending') {
      // Start light, go heavy
      for (let i = 0; i < config.steps; i++) {
        const weight = initialWeight - weightIncrement * (config.steps - 1 - i)
        weights.push(Math.round(Math.max(weight, initialWeight * 0.7) * 2) / 2)
      }
    } else if (config.direction === 'descending') {
      // Start heavy, go light
      for (let i = 0; i < config.steps; i++) {
        const weight = initialWeight - weightIncrement * i
        weights.push(Math.round(Math.max(weight, initialWeight * 0.7) * 2) / 2)
      }
    } else {
      // Full pyramid: ascending then descending
      // Ascending phase
      for (let i = 0; i < config.steps; i++) {
        const weight = initialWeight - weightIncrement * (config.steps - 1 - i)
        weights.push(Math.round(Math.max(weight, initialWeight * 0.7) * 2) / 2)
      }
      // Descending phase (skip the peak, already done)
      for (let i = 1; i < config.steps; i++) {
        const weight = initialWeight - weightIncrement * i
        weights.push(Math.round(Math.max(weight, initialWeight * 0.7) * 2) / 2)
      }
    }

    return weights
  }, [initialWeight, config.steps, config.direction])

  // Calculate expected reps (inverse of weight progression)
  const calculatePyramidReps = useCallback(() => {
    const reps: number[] = []
    const baseReps = 12
    const minReps = 6

    if (config.direction === 'ascending') {
      // Start high reps, go low
      for (let i = 0; i < config.steps; i++) {
        const stepReps = baseReps - Math.floor((baseReps - minReps) * (i / (config.steps - 1 || 1)))
        reps.push(stepReps)
      }
    } else if (config.direction === 'descending') {
      // Start low reps, go high
      for (let i = 0; i < config.steps; i++) {
        const stepReps = minReps + Math.floor((baseReps - minReps) * (i / (config.steps - 1 || 1)))
        reps.push(stepReps)
      }
    } else {
      // Full pyramid
      // Ascending: high to low reps
      for (let i = 0; i < config.steps; i++) {
        const stepReps = baseReps - Math.floor((baseReps - minReps) * (i / (config.steps - 1 || 1)))
        reps.push(stepReps)
      }
      // Descending: low to high reps (skip peak)
      for (let i = 1; i < config.steps; i++) {
        const stepReps = minReps + Math.floor((baseReps - minReps) * (i / (config.steps - 1 || 1)))
        reps.push(stepReps)
      }
    }

    return reps
  }, [config.steps, config.direction])

  const expectedWeights = calculatePyramidWeights()
  const expectedReps = calculatePyramidReps()

  // Initialize pyramid entries
  const [entries, setEntries] = useState<PyramidEntry[]>(() =>
    expectedWeights.map((w, i) => ({ weight: w, reps: expectedReps[i] || 0 }))
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Handle entry update
  const updateEntry = (index: number, field: 'weight' | 'reps', value: number) => {
    setEntries(prev => {
      const newEntries = [...prev]
      newEntries[index] = { ...newEntries[index], [field]: value }
      return newEntries
    })
  }

  // Move to next step
  const confirmStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Complete the pyramid set
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'pyramid',
      config,
      pyramidWeights: entries.map(e => e.weight),
      pyramidReps: entries.map(e => e.reps),
      completedFully: entries.every(e => e.reps > 0),
    }

    onComplete(result)
  }

  // Check completion status
  const allStepsLogged = entries.every(e => e.reps > 0)
  const canComplete = entries.slice(0, currentStep + 1).every(e => e.reps > 0)

  // Get direction icon and label
  const getDirectionInfo = () => {
    switch (config.direction) {
      case 'ascending':
        return { icon: ArrowUp, label: t('ascending'), description: t('lightToHeavy') }
      case 'descending':
        return { icon: ArrowDown, label: t('descending'), description: t('heavyToLight') }
      case 'full':
        return { icon: ArrowUpDown, label: t('full'), description: t('upThenDown') }
    }
  }

  const directionInfo = getDirectionInfo()
  const DirectionIcon = directionInfo.icon

  // Determine if we're in ascending or descending phase (for full pyramid)
  const isAscendingPhase = config.direction === 'full' ? currentStep < config.steps : config.direction === 'ascending'

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-purple-400">
        <Triangle className="h-5 w-5" />
        <span className="font-semibold">{t('pyramidSet')}</span>
        <DirectionIcon className="h-4 w-4 ml-1" />
        <span className="text-sm text-gray-400">
          ({directionInfo.label} - {totalSteps} {t('steps')})
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        {directionInfo.description}. {t('restBetweenSteps')}
        {config.direction === 'full' && (
          <span className="block mt-1 text-purple-300">
            {t('peakAtStep', { step: config.steps })}
          </span>
        )}
      </div>

      {/* Pyramid visualization */}
      <div className="flex justify-center items-end gap-1 h-16 mb-2">
        {entries.map((_, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep || (index === currentStep && entries[index].reps > 0)

          // Calculate bar height based on expected weight
          const maxWeight = Math.max(...expectedWeights)
          const minWeight = Math.min(...expectedWeights)
          const normalizedHeight = maxWeight === minWeight
            ? 100
            : ((expectedWeights[index] - minWeight) / (maxWeight - minWeight)) * 60 + 40

          return (
            <div
              key={index}
              className={cn(
                'w-6 rounded-t transition-all',
                isCompleted ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-gray-700'
              )}
              style={{ height: `${normalizedHeight}%` }}
            />
          )
        })}
      </div>

      {/* Steps progress */}
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep || (index === currentStep && entry.reps > 0)
          const isFuture = index > currentStep

          // Determine step label
          let stepLabel = `${t('step')} ${index + 1}`
          if (config.direction === 'full') {
            if (index === config.steps - 1) {
              stepLabel = t('peak')
            } else if (index < config.steps - 1) {
              stepLabel = `${t('up')} ${index + 1}`
            } else {
              stepLabel = `${t('down')} ${index - config.steps + 2}`
            }
          }

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isActive && 'bg-purple-500/20 border-purple-500/50',
                isCompleted && !isActive && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Step number indicator */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300',
                  isActive && !isCompleted && 'bg-purple-500 text-white'
                )}>
                  {isCompleted && index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step label */}
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-purple-300' : 'text-gray-400'
                  )}>
                    {stepLabel}
                  </span>
                  {!isActive && !isFuture && (
                    <span className="ml-2 text-xs text-gray-500">
                      {entry.weight}kg x {entry.reps}
                    </span>
                  )}
                </div>

                {/* Expected values hint for future steps */}
                {isFuture && (
                  <span className="text-xs text-gray-500">
                    ~{expectedWeights[index]}kg x {expectedReps[index]}
                  </span>
                )}
              </div>

              {/* Input area for active step */}
              {isActive && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t('weightLabel')}</label>
                    <Input
                      type="number"
                      value={entry.weight || ''}
                      onChange={(e) => updateEntry(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t('repsLabel')}</label>
                    <Input
                      type="number"
                      value={entry.reps || ''}
                      onChange={(e) => updateEntry(index, 'reps', parseInt(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {/* Confirm step button */}
              {isActive && entry.reps > 0 && index < totalSteps - 1 && (
                <Button
                  onClick={confirmStep}
                  className="mt-3 w-full bg-purple-500 hover:bg-purple-600 text-white"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  {index === totalSteps - 2 ? t('finalStep') : t('nextStep')}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-400 pt-2 border-t border-gray-700">
        {t('totalReps')} {entries.reduce((sum, e) => sum + e.reps, 0)}
      </div>

      {/* Warning if not all steps completed */}
      {!allStepsLogged && currentStep === totalSteps - 1 && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{t('someStepsNotLogged')}</span>
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
          {t('cancel')}
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete || isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          {t('completePyramid')}
        </Button>
      </div>
    </div>
  )
}
