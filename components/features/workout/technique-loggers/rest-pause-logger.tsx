'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Timer, Check, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { RestPauseConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface RestPauseLoggerProps {
  config: RestPauseConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

export function RestPauseLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: RestPauseLoggerProps) {
  const t = useTranslations('workout.techniques')

  // State for mini-sets
  const [miniSets, setMiniSets] = useState<number[]>(() =>
    Array(config.miniSets).fill(0)
  )
  const [currentMiniSet, setCurrentMiniSet] = useState(0)
  const [weight, setWeight] = useState(initialWeight)

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(config.restSeconds)
  const [showTimer, setShowTimer] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0) {
      setIsTimerActive(false)
      // Play a notification sound or vibrate
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerActive, timeRemaining])

  // Update reps for a mini-set
  const updateReps = (index: number, reps: number) => {
    setMiniSets(prev => {
      const newSets = [...prev]
      newSets[index] = reps
      return newSets
    })
  }

  // Confirm mini-set and start rest timer
  const confirmMiniSet = () => {
    if (currentMiniSet < config.miniSets - 1) {
      setShowTimer(true)
      setTimeRemaining(config.restSeconds)
      setIsTimerActive(true)
    }
  }

  // Move to next mini-set
  const nextMiniSet = () => {
    if (currentMiniSet < config.miniSets - 1) {
      setCurrentMiniSet(prev => prev + 1)
      setShowTimer(false)
      setTimeRemaining(config.restSeconds)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setTimeRemaining(config.restSeconds)
    setIsTimerActive(false)
  }

  // Complete the rest-pause set
  const handleComplete = () => {
    const result: TechniqueExecutionResult = {
      technique: 'rest_pause',
      config,
      miniSetReps: miniSets,
      completedFully: miniSets.every(r => r > 0),
    }

    onComplete(result)
  }

  // Check if current mini-set is logged
  const currentReps = miniSets[currentMiniSet]
  const canProceed = currentReps > 0
  const isLastMiniSet = currentMiniSet === config.miniSets - 1
  const totalReps = miniSets.reduce((a, b) => a + b, 0)

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-blue-400">
        <Timer className="h-5 w-5" />
        <span className="font-semibold">Rest-Pause</span>
        <span className="text-sm text-gray-400">
          ({config.miniSets} mini-sets, {config.restSeconds}s rest)
        </span>
      </div>

      {/* Weight input */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">Weight:</label>
        <Input
          type="number"
          value={weight || ''}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className="w-24 bg-gray-900/50 border-gray-700"
          step={0.5}
        />
        <span className="text-sm text-gray-400">kg (same for all mini-sets)</span>
      </div>

      {/* Mini-sets progress */}
      <div className="flex gap-2 items-center">
        {miniSets.map((reps, index) => {
          const isActive = index === currentMiniSet
          const isCompleted = index < currentMiniSet || (index === currentMiniSet && reps > 0 && !showTimer)
          const isFuture = index > currentMiniSet

          return (
            <div
              key={index}
              className={cn(
                'flex-1 p-2 rounded-lg border text-center transition-all',
                isActive && !showTimer && 'bg-blue-500/20 border-blue-500/50',
                isCompleted && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="text-xs text-gray-400 mb-1">Set {index + 1}</div>
              {isCompleted || (isActive && !showTimer) ? (
                <div className="font-bold text-lg">
                  {reps > 0 ? reps : '-'}
                </div>
              ) : (
                <div className="text-gray-500">-</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active mini-set input */}
      {!showTimer && currentMiniSet < config.miniSets && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-300">
              Mini-set {currentMiniSet + 1}: Reps to failure
            </span>
            <Input
              type="number"
              value={currentReps || ''}
              onChange={(e) => updateReps(currentMiniSet, parseInt(e.target.value) || 0)}
              className="w-20 bg-gray-900/50 border-gray-700"
              placeholder="Reps"
              autoFocus
            />
            {canProceed && !isLastMiniSet && (
              <Button
                onClick={confirmMiniSet}
                className="bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                Rest {config.restSeconds}s
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Rest timer */}
      {showTimer && (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">Rest before next mini-set</div>
          <div className={cn(
            'text-5xl font-mono font-bold mb-3',
            timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-blue-400'
          )}>
            {timeRemaining}s
          </div>
          <div className="flex gap-2 justify-center">
            {isTimerActive ? (
              <Button
                onClick={() => setIsTimerActive(false)}
                variant="outline"
                size="sm"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : timeRemaining > 0 ? (
              <Button
                onClick={() => setIsTimerActive(true)}
                variant="outline"
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : null}
            <Button
              onClick={resetTimer}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={nextMiniSet}
              className="bg-blue-500 hover:bg-blue-600"
              size="sm"
            >
              Start Next Set
            </Button>
          </div>
        </div>
      )}

      {/* Total reps summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Total reps:</span>
        <span className="font-bold text-white">{totalReps}</span>
      </div>

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
          disabled={!miniSets.some(r => r > 0)}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete Rest-Pause
        </Button>
      </div>
    </div>
  )
}
