'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ProgressPhases, useWorkoutPhases, type Phase } from './progress-phases'

/**
 * Derive phase from progress percentage (single source of truth)
 * This ensures phase indicators always match the percentage shown
 * Exported for use in polling estimation
 */
export function getPhaseFromProgress(progress: number): string {
  if (progress < 20) return 'profile'
  if (progress < 45) return 'split'
  if (progress < 70) return 'ai'
  if (progress < 90) return 'optimization'
  return 'finalize'
}

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
  phases,
  cancellable = true,
  onComplete,
  onError,
  onCancel
}: ProgressFeedbackProps) {
  // Use i18n phases if not provided
  const defaultPhases = useWorkoutPhases()
  const activePhases = phases || defaultPhases

  const [phase, setPhase] = useState(activePhases[0]?.id || 'profile')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Starting...')
  const [eta, setEta] = useState<number | null>(null) // ETA in seconds
  const [detail, setDetail] = useState<string | null>(null) // Additional details

  // Polling fallback for mobile disconnections
  const [generationRequestId] = useState(() => {
    // Generate UUID only once per component mount
    return crypto.randomUUID()
  })
  const [pollingMode, setPollingMode] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Polling logic (activated on SSE failure)
  useEffect(() => {
    if (!pollingMode || !generationRequestId) return

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/workouts/generation-status/${generationRequestId}`)

        if (!res.ok) {
          throw new Error(`Polling failed: ${res.status}`)
        }

        const data = await res.json()

        if (cancelled) return

        if (data.status === 'complete') {
          // Generation completed!
          onComplete(data)
        } else if (data.status === 'error') {
          onError(data.error || 'Generation failed')
        } else if (data.status === 'in_progress') {
          // Update progress from server estimate
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          // Use phase from server if provided, otherwise derive from progress
          if (data.phase) {
            setPhase(data.phase)
          } else if (data.progress !== undefined) {
            setPhase(getPhaseFromProgress(data.progress))
          }
          if (data.message) setMessage(data.message)
          if (data.eta !== undefined) setEta(data.eta)
          if (data.detail) setDetail(data.detail)

          // Continue polling (2s interval)
          pollingIntervalRef.current = setTimeout(poll, 2000)
        } else {
          // not_found - expired or invalid
          onError('Generation request expired. Please try again.')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[ProgressFeedback] Polling error:', error)
          // Keep trying with longer interval (network issue)
          pollingIntervalRef.current = setTimeout(poll, 3000)
        }
      }
    }

    poll() // Start immediately

    return () => {
      cancelled = true
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [pollingMode, generationRequestId, onComplete, onError])

  useEffect(() => {
    // AbortController for cleanup and extended timeout
    const abortController = new AbortController()

    // Set a generous timeout (240s = 4 minutes) - longer than AI timeout (180s)
    // This prevents premature browser timeouts while allowing server to complete
    const timeoutId = setTimeout(() => {
      console.log('[ProgressFeedback] Request taking longer than expected, switching to polling...')
      abortController.abort()
    }, 240000) // 240 seconds

    const connectSSE = async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestBody,
            generationRequestId // Add for idempotency + polling fallback
          }),
          signal: abortController.signal
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
                  // Update progress and phase from server
                  if (data.progress !== undefined) {
                    setProgress(data.progress)
                  }
                  // Use phase from server if provided, otherwise derive from progress
                  if (data.phase) {
                    setPhase(data.phase)
                  } else if (data.progress !== undefined) {
                    setPhase(getPhaseFromProgress(data.progress))
                  }
                  if (data.message) setMessage(data.message)
                  if (data.eta !== undefined) setEta(data.eta)
                  if (data.detail) setDetail(data.detail)
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      } catch (error) {
        // Clear the timeout since we're handling the error
        clearTimeout(timeoutId)

        // Check if this is an intentional abort (cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          // Normal cleanup - component unmounted or timeout reached
          // Don't log as error or switch to polling
          console.log('[ProgressFeedback] SSE connection aborted (cleanup)')
          return
        }

        // Real error - log details for debugging
        console.error('🔴 [PROGRESS_FEEDBACK_ERROR] SSE connection error:', {
          errorName: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          endpoint,
          timestamp: new Date().toISOString()
        })

        // Switch to polling fallback (for mobile disconnections or network errors)
        // DO NOT call onError() here - let polling handle success/failure
        console.log('[ProgressFeedback] SSE failed, switching to polling mode')
        setPollingMode(true)
        setMessage('Reconnecting...')
      }
    }

    connectSSE()

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      abortController.abort()
    }
    // Only depend on endpoint to avoid re-fetching when requestBody reference changes
    // requestBody values are already captured in the fetch call above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  const currentPhaseData = activePhases.find(p => p.id === phase) || activePhases[0]
  const currentPhaseIndex = activePhases.findIndex(p => p.id === phase)

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
              Phase {currentPhaseIndex + 1} of {activePhases.length}
            </p>
          </div>
        </div>

        {/* Duration notice or ETA - keep users informed */}
        {eta !== null && eta > 0 ? (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 opacity-70">
            About {eta < 60 ? `${eta} second${eta !== 1 ? 's' : ''}` : `${Math.ceil(eta / 10) * 10} seconds`} remaining...
          </p>
        ) : progress < 90 && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 opacity-70">
            This may take a few minutes...
          </p>
        )}

        {/* Additional details if provided */}
        {detail && (
          <p className="text-xs text-center text-purple-600 dark:text-purple-400 font-medium">
            {detail}
          </p>
        )}

        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            {currentPhaseData.label}
          </span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {progress}%
          </span>
        </div>

        {/* Continuous progress bar showing exact percentage */}
        <Progress value={progress} className="mb-3" />

        {/* Phase indicators */}
        <ProgressPhases
          phases={activePhases}
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

      {/* Duration notice or ETA - keep users informed */}
      {eta !== null && eta > 0 ? (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 opacity-70 mb-2">
          About {eta < 60 ? `${eta} second${eta !== 1 ? 's' : ''}` : `${Math.ceil(eta / 10) * 10} seconds`} remaining...
        </p>
      ) : progress < 90 && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 opacity-70 mb-2">
          This may take a few minutes...
        </p>
      )}

      {/* Additional details if provided */}
      {detail && (
        <p className="text-xs text-center text-purple-600 dark:text-purple-400 font-medium mb-2">
          {detail}
        </p>
      )}

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-600 dark:text-gray-400">
          Phase {currentPhaseIndex + 1} of {activePhases.length}
        </span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          {progress}%
        </span>
      </div>

      {/* Continuous progress bar showing exact percentage */}
      <Progress value={progress} className="mb-3" />

      {/* Phase indicators */}
      <ProgressPhases
        phases={activePhases}
        currentPhase={phase}
        variant="bars"
      />
    </div>
  )
}
