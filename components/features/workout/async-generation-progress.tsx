'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AsyncGenerationProgressProps {
  requestId: string
  onComplete?: (workoutId: string) => void
  onError?: (error: string) => void
  onClose?: () => void
  autoRedirect?: boolean
}

/**
 * AsyncGenerationProgress Component
 *
 * Shows real-time progress for asynchronous workout generation
 *
 * Features:
 * - Polls generation status every 2 seconds
 * - Displays animated progress bar (0-100%)
 * - Shows current phase message
 * - Allows user to close and check back later
 * - Auto-redirects to workout when ready (optional)
 * - Handles errors with retry option
 */
export function AsyncGenerationProgress({
  requestId,
  onComplete,
  onError,
  onClose,
  autoRedirect = true,
}: AsyncGenerationProgressProps) {
  const t = useTranslations('workout.generation')
  const router = useRouter()

  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('Starting generation...')
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed'>('pending')
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  // Poll generation status
  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts/generation-status/${requestId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch generation status')
      }

      const data = await response.json()

      setProgress(data.progress_percent || 0)
      setPhase(data.current_phase || 'Processing...')
      setStatus(data.status)

      if (data.status === 'completed' && data.workout_id) {
        setWorkoutId(data.workout_id)
        onComplete?.(data.workout_id)

        // Auto-redirect to workout if enabled
        if (autoRedirect) {
          setTimeout(() => {
            router.push(`/workout/${data.workout_id}`)
          }, 1500) // Small delay to show 100% completion
        }
      }

      if (data.status === 'failed') {
        setErrorMessage(data.error_message || 'Unknown error occurred')
        onError?.(data.error_message || 'Generation failed')
      }
    } catch (error) {
      console.error('[AsyncGenProgress] Polling error:', error)
      // Don't set error state on network issues, just retry
    }
  }, [requestId, onComplete, onError, autoRedirect, router])

  // Start polling on mount
  useEffect(() => {
    // Initial poll
    pollStatus()

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [pollStatus])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleRetry = () => {
    // Redirect to generation page to retry
    router.push('/dashboard')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'completed' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t('complete')}
              </>
            ) : status === 'failed' ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                {t('failed')}
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('inProgress')}
              </>
            )}
          </DialogTitle>

          <DialogDescription>
            {status === 'completed' && autoRedirect && (
              <span>{t('redirecting')}</span>
            )}
            {status === 'completed' && !autoRedirect && workoutId && (
              <span>{t('ready')}</span>
            )}
            {status === 'failed' && (
              <span className="text-red-600">{errorMessage}</span>
            )}
            {(status === 'pending' || status === 'in_progress') && (
              <span>{t('canCloseMessage')}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          {status !== 'failed' && (
            <>
              <Progress value={progress} className="h-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{phase}</span>
                <span className="font-medium">{progress}%</span>
              </div>
            </>
          )}

          {/* Error state */}
          {status === 'failed' && (
            <div className="text-sm text-center space-y-2">
              <p className="text-muted-foreground">
                {t('errorDetails')}
              </p>
              <Button onClick={handleRetry} variant="outline">
                {t('tryAgain')}
              </Button>
            </div>
          )}

          {/* Success state */}
          {status === 'completed' && workoutId && !autoRedirect && (
            <Button
              onClick={() => router.push(`/workout/${workoutId}`)}
              className="w-full"
            >
              {t('viewWorkout')}
            </Button>
          )}

          {/* In progress state */}
          {(status === 'pending' || status === 'in_progress') && (
            <div className="text-center">
              <Button onClick={handleClose} variant="ghost" className="w-full">
                {t('closeAndCheckLater')}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {t('continuesInBackground')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
