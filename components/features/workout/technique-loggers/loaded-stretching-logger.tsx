'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Flower2, Play, Pause, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { LoadedStretchingConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface LoadedStretchingLoggerProps {
  config: LoadedStretchingConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

type Phase = 'ready' | 'holding' | 'completed'

export function LoadedStretchingLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: LoadedStretchingLoggerProps) {
  const t = useTranslations('workout.techniques')

  const [phase, setPhase] = useState<Phase>('ready')
  const [timeLeft, setTimeLeft] = useState(config.holdSeconds)
  const [weight, setWeight] = useState(initialWeight)
  const [actualRpe, setActualRpe] = useState(config.targetRpe)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer logic
  useEffect(() => {
    if (phase === 'holding' && !isPaused && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (phase === 'holding' && timeLeft === 0) {
      setPhase('completed')
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [phase, isPaused, timeLeft])

  // Start the hold
  const startHold = () => {
    setPhase('holding')
    setTimeLeft(config.holdSeconds)
    setIsPaused(false)
  }

  // Toggle pause
  const togglePause = () => {
    setIsPaused(prev => !prev)
  }

  // Reset timer
  const resetTimer = () => {
    setTimeLeft(config.holdSeconds)
    setIsPaused(false)
    setPhase('ready')
  }

  // Complete the loaded stretch
  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'loaded_stretching',
      config,
      completedFully: phase === 'completed',
      notes: `Hold: ${config.holdSeconds - timeLeft}s, RPE: ${actualRpe}`,
    }

    onComplete(result)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const progress = ((config.holdSeconds - timeLeft) / config.holdSeconds) * 100

  return (
    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-teal-400">
        <Flower2 className="h-5 w-5" />
        <span className="font-semibold">Loaded Stretching</span>
        <span className="text-sm text-gray-400">
          ({config.holdSeconds}s hold, RPE {config.targetRpe})
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        {phase === 'ready' && (
          <>Get into the stretched position with weight. When ready, start the timer and hold for {config.holdSeconds} seconds.</>
        )}
        {phase === 'holding' && (
          <>Hold the stretch! Focus on deep breathing and maintaining position.</>
        )}
        {phase === 'completed' && (
          <>Great work! Log your actual RPE for this stretch.</>
        )}
      </div>

      {/* Weight input */}
      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="text-xs text-gray-400 mb-1 block">Weight Used (kg)</label>
        <Input
          type="number"
          value={weight || ''}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className="bg-gray-900/50 border-gray-700"
          step={0.5}
          disabled={phase === 'holding'}
        />
      </div>

      {/* Main timer display */}
      <div className={cn(
        'rounded-lg p-6 text-center transition-all',
        phase === 'ready' && 'bg-gray-800/50',
        phase === 'holding' && 'bg-teal-500/20',
        phase === 'completed' && 'bg-green-500/20'
      )}>
        {/* Hold indicator */}
        {phase === 'holding' && (
          <div className={cn(
            'text-2xl font-bold mb-2 animate-pulse',
            isPaused ? 'text-yellow-400' : 'text-teal-400'
          )}>
            {isPaused ? 'PAUSED' : 'HOLD'}
          </div>
        )}

        {phase === 'completed' && (
          <div className="text-2xl font-bold mb-2 text-green-400">
            COMPLETE
          </div>
        )}

        {/* Timer */}
        <div className={cn(
          'text-6xl font-mono font-bold',
          phase === 'ready' && 'text-gray-400',
          phase === 'holding' && !isPaused && 'text-teal-400',
          phase === 'holding' && isPaused && 'text-yellow-400',
          phase === 'completed' && 'text-green-400'
        )}>
          {formatTime(timeLeft)}
        </div>

        {/* Progress bar */}
        {phase === 'holding' && (
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Breathing cue */}
        {phase === 'holding' && !isPaused && config.breathingPattern && (
          <div className="mt-3 text-sm text-teal-300">
            {config.breathingPattern}
          </div>
        )}
        {phase === 'holding' && !isPaused && !config.breathingPattern && (
          <div className="mt-3 text-sm text-teal-300">
            Deep belly breaths... relax into the stretch
          </div>
        )}
      </div>

      {/* Control buttons */}
      {phase === 'ready' && (
        <Button
          onClick={startHold}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
          size="lg"
          disabled={weight <= 0}
        >
          <Play className="h-5 w-5 mr-2" />
          Start Hold
        </Button>
      )}

      {phase === 'holding' && (
        <div className="flex gap-2">
          <Button
            onClick={togglePause}
            variant="outline"
            className="flex-1 border-teal-500/50"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            className="border-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* RPE input after completion */}
      {phase === 'completed' && (
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
          <label className="text-xs text-gray-400 block">Actual RPE (1-10)</label>
          <div className="flex gap-1">
            {[5, 6, 7, 8, 9, 10].map((rpe) => (
              <Button
                key={rpe}
                variant={actualRpe === rpe ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex-1',
                  actualRpe === rpe && 'bg-teal-500 hover:bg-teal-600'
                )}
                onClick={() => setActualRpe(rpe)}
              >
                {rpe}
              </Button>
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
          disabled={phase !== 'completed' || isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete Stretch
        </Button>
      </div>
    </div>
  )
}
