'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Check, Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ClusterSetConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface ClusterSetLoggerProps {
  config: ClusterSetConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

type Phase = 'cluster' | 'rest'

export function ClusterSetLogger({
  config,
  initialWeight,
  onComplete,
  onCancel,
}: ClusterSetLoggerProps) {
  const t = useTranslations('workout.techniques')

  // State
  const [weight, setWeight] = useState(initialWeight)
  const [clusterReps, setClusterReps] = useState<number[]>([])
  const [currentCluster, setCurrentCluster] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<Phase>('cluster')

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(config.intraRestSeconds)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && isTimerActive) {
      setIsTimerActive(false)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 50, 150])
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerActive, timeRemaining])

  // Confirm cluster and start rest
  const confirmCluster = (reps: number) => {
    setClusterReps(prev => [...prev, reps])

    if (currentCluster < config.clusters - 1) {
      setCurrentPhase('rest')
      setTimeRemaining(config.intraRestSeconds)
      setIsTimerActive(true)
      setCurrentCluster(prev => prev + 1)
    } else {
      // All clusters complete
      setCurrentPhase('cluster')
    }
  }

  // Start next cluster
  const startNextCluster = () => {
    setCurrentPhase('cluster')
    setIsTimerActive(false)
  }

  // Complete the cluster set
  const handleComplete = () => {
    const result: TechniqueExecutionResult = {
      technique: 'cluster_set',
      config,
      clusterReps,
      completedFully: clusterReps.length === config.clusters,
    }

    onComplete(result)
  }

  // Calculate totals
  const totalReps = clusterReps.reduce((a, b) => a + b, 0)
  const isComplete = clusterReps.length === config.clusters
  const targetTotalReps = config.clusters * config.repsPerCluster

  return (
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-cyan-400">
        <Target className="h-5 w-5" />
        <span className="font-semibold">Cluster Set</span>
        <span className="text-sm text-gray-400">
          ({config.clusters}×{config.repsPerCluster}, {config.intraRestSeconds}s intra-rest)
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
          step={2.5}
        />
        <span className="text-sm text-gray-400">kg (heavy load)</span>
      </div>

      {/* Clusters progress */}
      <div className="flex gap-2 items-center flex-wrap">
        {Array.from({ length: config.clusters }).map((_, idx) => {
          const isLogged = idx < clusterReps.length
          const isCurrent = idx === clusterReps.length && currentPhase === 'cluster'
          const isFuture = idx > clusterReps.length

          return (
            <div
              key={idx}
              className={cn(
                'px-3 py-2 rounded-lg border text-center min-w-[50px] transition-all',
                isCurrent && 'bg-cyan-500/20 border-cyan-500/50 scale-110',
                isLogged && 'bg-green-500/10 border-green-500/30',
                isFuture && 'bg-gray-800/50 border-gray-700/50 opacity-50'
              )}
            >
              <div className="text-xs text-gray-400">C{idx + 1}</div>
              <div className="font-bold">
                {isLogged ? clusterReps[idx] : config.repsPerCluster}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current cluster input */}
      {currentPhase === 'cluster' && clusterReps.length < config.clusters && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-cyan-300 mb-2">
            Cluster {clusterReps.length + 1}: Target {config.repsPerCluster} reps
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              defaultValue={config.repsPerCluster}
              className="w-20 bg-gray-900/50 border-gray-700"
              placeholder="Reps"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value) || config.repsPerCluster
                  confirmCluster(value)
                }
              }}
            />
            <Button
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement)
                const value = parseInt(input?.value) || config.repsPerCluster
                confirmCluster(value)
              }}
              className="bg-cyan-500 hover:bg-cyan-600"
              size="sm"
            >
              {clusterReps.length < config.clusters - 1 ? 'Rest' : 'Finish'}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Stay in position during rest. Keep the bar.
          </div>
        </div>
      )}

      {/* Intra-set rest timer */}
      {currentPhase === 'rest' && (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">
            Intra-set rest - Stay in position!
          </div>
          <div className={cn(
            'text-5xl font-mono font-bold mb-3',
            timeRemaining <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
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
              onClick={() => {
                setTimeRemaining(config.intraRestSeconds)
                setIsTimerActive(true)
              }}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={startNextCluster}
              className="bg-cyan-500 hover:bg-cyan-600"
              size="sm"
            >
              Next Cluster
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Clusters:</span>
          <span className="font-bold text-white">{clusterReps.length}/{config.clusters}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Total reps:</span>
          <span className={cn(
            'font-bold text-lg',
            totalReps >= targetTotalReps ? 'text-green-400' : 'text-white'
          )}>
            {totalReps}/{targetTotalReps}
          </span>
        </div>
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center text-green-400">
          <Check className="h-5 w-5 inline mr-2" />
          All {config.clusters} clusters completed! Rack the weight.
        </div>
      )}

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
          disabled={clusterReps.length === 0}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete Cluster Set
        </Button>
      </div>
    </div>
  )
}
