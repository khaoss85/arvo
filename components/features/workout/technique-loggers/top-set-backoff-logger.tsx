'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, Check, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TopSetBackoffConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface TopSetBackoffLoggerProps {
  config: TopSetBackoffConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

interface SetEntry {
  weight: number
  reps: number
  isTopSet: boolean
  topSetIndex?: number  // For multiple top sets: 1, 2, etc.
  backoffIndex?: number // For backoff sets: 1, 2, etc.
}

export function TopSetBackoffLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: TopSetBackoffLoggerProps) {
  const t = useTranslations('workout.techniques')

  // Calculate backoff weight
  const calculateBackoffWeight = useCallback(() => {
    const backoffWeight = initialWeight * (1 - config.backoffPercentage / 100)
    // Round to nearest 0.5kg
    return Math.round(backoffWeight * 2) / 2
  }, [initialWeight, config.backoffPercentage])

  const backoffWeight = calculateBackoffWeight()

  // Number of top sets (default 1 for backwards compatibility)
  const numTopSets = config.topSets || 1

  // Total sets: N top sets + M backoff sets
  const totalSets = numTopSets + config.backoffSets

  // Initialize sets state
  const [sets, setSets] = useState<SetEntry[]>(() => {
    const entries: SetEntry[] = []
    // Top sets (heavy, low reps)
    for (let i = 0; i < numTopSets; i++) {
      entries.push({ weight: initialWeight, reps: 0, isTopSet: true, topSetIndex: i + 1 })
    }
    // Backoff sets (lighter, higher reps)
    for (let i = 0; i < config.backoffSets; i++) {
      entries.push({ weight: backoffWeight, reps: 0, isTopSet: false, backoffIndex: i + 1 })
    }
    return entries
  })

  const [currentSet, setCurrentSet] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Handle weight/reps change for a set
  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    setSets(prev => {
      const newSets = [...prev]
      newSets[index] = { ...newSets[index], [field]: value }
      return newSets
    })
  }

  // Move to next set
  const confirmSet = () => {
    if (currentSet < totalSets - 1) {
      setCurrentSet(prev => prev + 1)
    }
  }

  // Complete the technique
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'top_set_backoff',
      config,
      // Store as pyramid weights/reps for consistency with existing types
      pyramidWeights: sets.map(s => s.weight),
      pyramidReps: sets.map(s => s.reps),
      completedFully: sets.every(s => s.reps > 0),
    }

    onComplete(result)
  }

  // Check if all sets are logged
  const allSetsLogged = sets.every(s => s.reps > 0)
  const canComplete = sets.slice(0, currentSet + 1).every(s => s.reps > 0)

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-red-400">
        <TrendingUp className="h-5 w-5" />
        <span className="font-semibold">{t('topSetBackoff.name')}</span>
        <span className="text-sm text-gray-400">
          ({numTopSets} top {numTopSets === 1 ? 'set' : 'sets'} + {config.backoffSets} backoff)
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        {t('topSetBackoff.instructions', {
          topReps: config.topSetReps,
          percentage: config.backoffPercentage,
          backoffSets: config.backoffSets,
          backoffReps: config.backoffReps,
        })}
      </div>

      {/* Sets progress */}
      <div className="space-y-3">
        {sets.map((set, index) => {
          const isActive = index === currentSet
          const isCompleted = index < currentSet || (index === currentSet && set.reps > 0)
          const isFuture = index > currentSet

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isActive && (set.isTopSet ? 'bg-red-500/20 border-red-500/50' : 'bg-amber-500/20 border-amber-500/50'),
                isCompleted && !isActive && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Set number indicator */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300',
                  isActive && !isCompleted && (set.isTopSet ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')
                )}>
                  {isCompleted && index < currentSet ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    set.isTopSet ? `T${numTopSets > 1 ? set.topSetIndex : ''}` : `B${set.backoffIndex}`
                  )}
                </div>

                {/* Set label */}
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? (set.isTopSet ? 'text-red-300' : 'text-amber-300') : 'text-gray-400'
                  )}>
                    {set.isTopSet
                      ? (numTopSets > 1 ? `${t('topSetBackoff.topSetLabel')} ${set.topSetIndex}` : t('topSetBackoff.topSetLabel'))
                      : `${t('topSetBackoff.backoffLabel')} ${set.backoffIndex}`
                    }
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {t('topSetBackoff.repsTarget', { reps: set.isTopSet ? config.topSetReps : config.backoffReps })}
                  </span>
                  {!isActive && !isFuture && (
                    <span className="ml-2 text-xs text-gray-500">
                      - {set.weight}kg × {set.reps}
                    </span>
                  )}
                </div>

                {/* Expected weight hint for future sets */}
                {isFuture && (
                  <span className="text-xs text-gray-500">
                    ~{set.isTopSet ? initialWeight : backoffWeight}kg
                  </span>
                )}
              </div>

              {/* Input area for active set */}
              {isActive && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
                    <Input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Reps</label>
                    <Input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                      className="bg-gray-900/50 border-gray-700"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {/* Confirm set button */}
              {isActive && set.reps > 0 && index < totalSets - 1 && (
                <Button
                  onClick={confirmSet}
                  className={cn(
                    "mt-3 w-full text-white",
                    set.isTopSet ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                  )}
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  {set.isTopSet && set.topSetIndex && set.topSetIndex < numTopSets
                    ? `${t('topSetBackoff.topSetLabel')} ${set.topSetIndex + 1}`
                    : set.isTopSet
                      ? t('topSetBackoff.startBackoff')
                      : index === totalSets - 2
                        ? t('topSetBackoff.finish')
                        : t('topSetBackoff.nextBackoff')
                  }
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Warning if not all sets completed */}
      {!allSetsLogged && currentSet === totalSets - 1 && (
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{t('topSetBackoff.setsNotLogged')}</span>
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
          {t('topSetBackoff.cancel')}
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete || isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          {t('topSetBackoff.complete')}
        </Button>
      </div>
    </div>
  )
}
