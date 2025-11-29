'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Flame, Check, Play, Pause, RotateCcw, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { MyoRepsConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface MyoRepsLoggerProps {
  config: MyoRepsConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

type Phase = 'activation' | 'rest' | 'miniset'

export function MyoRepsLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: MyoRepsLoggerProps) {
  const t = useTranslations('workout.techniques')

  // State
  const [weight, setWeight] = useState(initialWeight)
  const [activationReps, setActivationReps] = useState(0)
  const [miniSetReps, setMiniSetReps] = useState<number[]>([])
  const [currentPhase, setCurrentPhase] = useState<Phase>('activation')
  const [currentMiniSetIndex, setCurrentMiniSetIndex] = useState(0)

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(config.restSeconds)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && isTimerActive) {
      setIsTimerActive(false)
      // Vibrate on timer end
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerActive, timeRemaining])

  // Confirm activation set
  const confirmActivation = () => {
    if (activationReps >= config.activationReps - 2) {
      setCurrentPhase('rest')
      setTimeRemaining(config.restSeconds)
      setIsTimerActive(true)
    }
  }

  // Start mini-set
  const startMiniSet = () => {
    setCurrentPhase('miniset')
    setIsTimerActive(false)
  }

  // Confirm mini-set
  const confirmMiniSet = (reps: number) => {
    setMiniSetReps(prev => [...prev, reps])

    // Check if we should stop (reps dropped below target or max mini-sets reached)
    if (reps < config.miniSetReps || miniSetReps.length + 1 >= config.miniSets) {
      // Done with myo-reps
      setCurrentPhase('activation') // Reset phase to show completion
    } else {
      // Continue to next mini-set
      setCurrentMiniSetIndex(prev => prev + 1)
      setCurrentPhase('rest')
      setTimeRemaining(config.restSeconds)
      setIsTimerActive(true)
    }
  }

  // Add another mini-set manually
  const addMiniSet = () => {
    setCurrentMiniSetIndex(prev => prev + 1)
    setCurrentPhase('rest')
    setTimeRemaining(config.restSeconds)
    setIsTimerActive(true)
  }

  // Complete the myo-reps
  const handleComplete = () => {
    const result: TechniqueExecutionResult = {
      technique: 'myo_reps',
      config,
      activationReps,
      miniSetReps: miniSetReps,
      completedFully: activationReps >= config.activationReps - 2 && miniSetReps.length > 0,
    }

    onComplete(result)
  }

  // Calculate total reps
  const totalReps = activationReps + miniSetReps.reduce((a, b) => a + b, 0)
  const hasStarted = activationReps > 0 || miniSetReps.length > 0

  return (
    <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-pink-400">
        <Flame className="h-5 w-5" />
        <span className="font-semibold">Myo-Reps</span>
        <span className="text-sm text-gray-400">
          ({config.activationReps} activation + {config.miniSets}×{config.miniSetReps}, {config.restSeconds}s rest)
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
        <span className="text-sm text-gray-400">kg</span>
      </div>

      {/* Progress visualization */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Activation set */}
        <div className={cn(
          'px-3 py-2 rounded-lg border text-center min-w-[60px]',
          currentPhase === 'activation' && activationReps === 0 && 'bg-pink-500/20 border-pink-500/50',
          activationReps > 0 && 'bg-green-500/10 border-green-500/30'
        )}>
          <div className="text-xs text-gray-400">Activation</div>
          <div className="font-bold">{activationReps > 0 ? activationReps : '-'}</div>
        </div>

        {/* Mini-sets */}
        {miniSetReps.map((reps, idx) => (
          <div
            key={idx}
            className="px-3 py-2 rounded-lg border bg-green-500/10 border-green-500/30 text-center min-w-[50px]"
          >
            <div className="text-xs text-gray-400">+{idx + 1}</div>
            <div className="font-bold">{reps}</div>
          </div>
        ))}

        {/* Current mini-set placeholder */}
        {currentPhase === 'miniset' && (
          <div className="px-3 py-2 rounded-lg border bg-pink-500/20 border-pink-500/50 text-center min-w-[50px]">
            <div className="text-xs text-gray-400">+{miniSetReps.length + 1}</div>
            <div className="font-bold">?</div>
          </div>
        )}
      </div>

      {/* Activation set input */}
      {currentPhase === 'activation' && activationReps === 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-pink-300 mb-2">
            Activation Set: Perform {config.activationReps} reps to 1-2 RIR
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={activationReps || ''}
              onChange={(e) => setActivationReps(parseInt(e.target.value) || 0)}
              className="w-20 bg-gray-900/50 border-gray-700"
              placeholder="Reps"
              autoFocus
            />
            <Button
              onClick={confirmActivation}
              disabled={activationReps === 0}
              className="bg-pink-500 hover:bg-pink-600"
              size="sm"
            >
              Start Mini-Sets
            </Button>
          </div>
        </div>
      )}

      {/* Rest timer between mini-sets */}
      {currentPhase === 'rest' && (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">
            Brief rest ({config.restSeconds}s) - Stay tight!
          </div>
          <div className={cn(
            'text-5xl font-mono font-bold mb-3',
            timeRemaining <= 2 ? 'text-red-400 animate-pulse' : 'text-pink-400'
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
              onClick={startMiniSet}
              className="bg-pink-500 hover:bg-pink-600"
              size="sm"
            >
              Go!
            </Button>
          </div>
        </div>
      )}

      {/* Mini-set input */}
      {currentPhase === 'miniset' && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-pink-300 mb-2">
            Mini-set {miniSetReps.length + 1}: Target {config.miniSetReps} reps
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              className="w-20 bg-gray-900/50 border-gray-700"
              placeholder="Reps"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value) || 0
                  if (value > 0) {
                    confirmMiniSet(value)
                  }
                }
              }}
            />
            <Button
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement)
                const value = parseInt(input?.value) || 0
                if (value > 0) {
                  confirmMiniSet(value)
                }
              }}
              className="bg-pink-500 hover:bg-pink-600"
              size="sm"
            >
              Log Reps
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Stop when reps drop below {config.miniSetReps}
          </div>
        </div>
      )}

      {/* Completed state - option to add more */}
      {activationReps > 0 && miniSetReps.length > 0 && currentPhase === 'activation' && (
        <div className="flex items-center gap-2">
          <Button
            onClick={addMiniSet}
            variant="outline"
            size="sm"
            className="text-pink-400 border-pink-500/30"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Mini-Set
          </Button>
          <span className="text-sm text-gray-400">
            Last set: {miniSetReps[miniSetReps.length - 1]} reps
          </span>
        </div>
      )}

      {/* Total summary */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
        <span className="text-gray-400">Total reps:</span>
        <span className="font-bold text-white text-lg">{totalReps}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
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
          disabled={!hasStarted}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete Myo-Reps
        </Button>
      </div>
    </div>
  )
}
