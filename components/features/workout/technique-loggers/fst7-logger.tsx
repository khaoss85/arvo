'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Flame, Check, Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Fst7ProtocolConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface Fst7LoggerProps {
  config: Fst7ProtocolConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

interface SetEntry {
  reps: number
  weight: number
}

export function Fst7Logger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: Fst7LoggerProps) {
  const t = useTranslations('workout.techniques')

  // Initialize 7 sets
  const [sets, setSets] = useState<SetEntry[]>(() =>
    Array(7).fill(null).map(() => ({ reps: 0, weight: initialWeight }))
  )

  const [currentSet, setCurrentSet] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState<number>(config.restSeconds)
  const [isCompleting, setIsCompleting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Rest timer
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setRestTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (isResting && restTimeLeft === 0) {
      // Rest complete - auto-advance to next set
      setIsResting(false)
      setRestTimeLeft(config.restSeconds)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isResting, restTimeLeft, config.restSeconds])

  // Update set data
  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    setSets(prev => {
      const newSets = [...prev]
      newSets[index] = { ...newSets[index], [field]: value }
      return newSets
    })
  }

  // Complete current set and start rest
  const confirmSet = () => {
    if (currentSet < 6) {
      setIsResting(true)
      setCurrentSet(prev => prev + 1)
    }
  }

  // Skip rest period
  const skipRest = () => {
    setIsResting(false)
    setRestTimeLeft(config.restSeconds)
  }

  // Complete the FST-7 protocol
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'fst7_protocol',
      config,
      miniSetReps: sets.map(s => s.reps),
      completedFully: sets.every(s => s.reps > 0),
    }

    onComplete(result)
  }

  // Check if all sets are logged
  const allSetsLogged = sets.every(s => s.reps > 0)
  const canComplete = sets.slice(0, currentSet + 1).every(s => s.reps > 0)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-purple-400">
        <Flame className="h-5 w-5" />
        <span className="font-semibold">FST-7 Protocol</span>
        <span className="text-sm text-gray-400">
          (7 sets, {config.restSeconds}s rest)
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        Perform 7 sets with {config.restSeconds} seconds rest between each.
        Target {config.targetReps} reps per set for maximum pump.
      </div>

      {/* Progress indicator - 7 dots */}
      <div className="flex justify-center gap-2">
        {Array(7).fill(null).map((_, index) => {
          const isCompleted = index < currentSet || (index === currentSet && sets[index].reps > 0)
          const isCurrent = index === currentSet

          return (
            <div
              key={index}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                isCompleted && 'bg-purple-500 text-white',
                isCurrent && !isCompleted && 'bg-purple-500/30 border-2 border-purple-500 text-purple-400',
                !isCompleted && !isCurrent && 'bg-gray-700 text-gray-500'
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>
          )
        })}
      </div>

      {/* Rest timer */}
      {isResting && (
        <div className="bg-purple-500/20 rounded-lg p-4 text-center space-y-3">
          <div className="text-sm text-purple-300 uppercase tracking-wide">Rest Period</div>
          <div className="text-4xl font-mono font-bold text-purple-400">
            {formatTime(restTimeLeft)}
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={skipRest}
              className="border-purple-500/50 text-purple-400"
            >
              Skip Rest
            </Button>
          </div>
        </div>
      )}

      {/* Current set input */}
      {!isResting && (
        <div className="bg-purple-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-purple-300 font-medium">Set {currentSet + 1} of 7</span>
            <span className="text-sm text-gray-400">Target: {config.targetReps} reps</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                value={sets[currentSet].weight || ''}
                onChange={(e) => updateSet(currentSet, 'weight', parseFloat(e.target.value) || 0)}
                className="bg-gray-900/50 border-gray-700"
                step={0.5}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reps</label>
              <Input
                type="number"
                value={sets[currentSet].reps || ''}
                onChange={(e) => updateSet(currentSet, 'reps', parseInt(e.target.value) || 0)}
                className="bg-gray-900/50 border-gray-700"
                min={0}
              />
            </div>
          </div>

          {sets[currentSet].reps > 0 && currentSet < 6 && (
            <Button
              onClick={confirmSet}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              size="sm"
            >
              <Play className="h-4 w-4 mr-1" />
              Complete Set & Start Rest
            </Button>
          )}
        </div>
      )}

      {/* Completed sets summary */}
      {currentSet > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Completed Sets</div>
          <div className="flex flex-wrap gap-2">
            {sets.slice(0, currentSet).map((set, index) => (
              <div key={index} className="text-xs bg-gray-800 px-2 py-1 rounded">
                Set {index + 1}: {set.weight}kg × {set.reps}
              </div>
            ))}
          </div>
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
          disabled={!canComplete || isCompleting || isResting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete FST-7
        </Button>
      </div>
    </div>
  )
}
