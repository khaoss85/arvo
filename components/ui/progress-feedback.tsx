'use client'

import React, { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ProgressPhases, WORKOUT_PHASES, type Phase } from './progress-phases'

interface ProgressFeedbackProps {
  variant: 'inline' | 'modal'
  endpoint: string
  requestBody: Record<string, any>
  phases?: Phase[]
  cancellable?: boolean
  onComplete: (data: any) => void
  onError: (error: string) => void
  onCancel?: () => void
}

export function ProgressFeedback({
  variant,
  endpoint,
  requestBody,
  phases = WORKOUT_PHASES,
  cancellable = true,
  onComplete,
  onError,
  onCancel
}: ProgressFeedbackProps) {
  const [phase, setPhase] = useState(phases[0]?.id || 'profile')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Starting...')

  useEffect(() => {
    const connectSSE = async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error('Failed to start operation')
        }

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
              const jsonStr = line.slice(6)
              try {
                const data = JSON.parse(jsonStr)

                if (data.phase === 'complete') {
                  onComplete(data)
                  break
                } else if (data.phase === 'error') {
                  onError(data.error || 'Operation failed')
                  break
                } else {
                  // Update progress
                  if (data.phase) setPhase(data.phase)
                  if (data.progress !== undefined) setProgress(data.progress)
                  if (data.message) setMessage(data.message)
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError)
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
  }, [endpoint, requestBody, onComplete, onError])

  const currentPhaseData = phases.find(p => p.id === phase) || phases[0]
  const currentPhaseIndex = phases.findIndex(p => p.id === phase)

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="w-full max-w-md mx-auto space-y-3 py-4">
        <div className="flex items-center gap-3 justify-center">
          <span className="text-2xl">{currentPhaseData.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Phase {currentPhaseIndex + 1} of {phases.length}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {currentPhaseData.label}
          </span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {progress}%
          </span>
        </div>

        <ProgressPhases
          phases={phases}
          currentPhase={phase}
          variant="bars"
        />

        {cancellable && onCancel && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Modal variant
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
                    bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200
                    dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{currentPhaseData.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Processing</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {message}
            </p>
          </div>
        </div>
        {cancellable && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Progress value={progress} className="mb-3 h-2" />

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-600 dark:text-gray-400">
          Phase {currentPhaseIndex + 1} of {phases.length}
        </span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          {progress}%
        </span>
      </div>

      <ProgressPhases
        phases={phases}
        currentPhase={phase}
        variant="bars"
      />
    </div>
  )
}
