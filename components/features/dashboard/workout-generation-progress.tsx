'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PHASES = [
  { id: 'profile', label: 'Loading profile', emoji: '👤' },
  { id: 'split', label: 'Planning workout', emoji: '📋' },
  { id: 'ai', label: 'AI selecting exercises', emoji: '🤖' },
  { id: 'history', label: 'Analyzing history', emoji: '📊' },
  { id: 'finalize', label: 'Finalizing', emoji: '✨' }
]

interface Props {
  userId: string
  targetCycleDay: number
  onComplete: (workout: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

export function WorkoutGenerationProgress({
  userId,
  targetCycleDay,
  onComplete,
  onError,
  onCancel
}: Props) {
  const [phase, setPhase] = useState('profile')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Starting...')
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Initiate SSE connection
    const connectSSE = async () => {
      try {
        // First, make POST request to start generation
        const response = await fetch('/api/workouts/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, targetCycleDay })
        })

        if (!response.ok) {
          throw new Error('Failed to start workout generation')
        }

        // Read stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.phase === 'complete') {
                onComplete(data.workout)
                break
              } else if (data.phase === 'error') {
                onError(data.error)
                break
              } else {
                setPhase(data.phase)
                setProgress(data.progress)
                setMessage(data.message)
              }
            }
          }
        }
      } catch (error) {
        console.error('SSE error:', error)
        onError(error instanceof Error ? error.message : 'Connection error')
      }
    }

    connectSSE()

    return () => {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [userId, targetCycleDay])

  const currentPhaseData = PHASES.find(p => p.id === phase) || PHASES[0]
  const currentPhaseIndex = PHASES.findIndex(p => p.id === phase)

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
                    bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200
                    dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{currentPhaseData.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Generating Workout</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Progress value={progress} className="mb-3 h-2" />

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-600 dark:text-gray-400">
          Phase {currentPhaseIndex + 1} of {PHASES.length}
        </span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          {progress}%
        </span>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-1">
        {PHASES.map((p, idx) => (
          <div
            key={p.id}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              idx <= currentPhaseIndex
                ? 'bg-purple-600 dark:bg-purple-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
