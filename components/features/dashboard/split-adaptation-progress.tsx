'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface SplitAdaptationProgressProps {
  onComplete: () => void
  onError: (error: string) => void
}

export function SplitAdaptationProgress({ onComplete, onError }: SplitAdaptationProgressProps) {
  const t = useTranslations('dashboard.adaptation')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [phase, setPhase] = useState('starting')

  useEffect(() => {
    let isMounted = true

    const startAdaptation = async () => {
      try {
        // Call the adaptation API
        const response = await fetch('/api/splits/adapt/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to start adaptation')
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (isMounted) {
          const { value, done } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.phase === 'complete') {
                  if (isMounted) {
                    setProgress(100)
                    setMessage(data.message || t('complete'))
                    setTimeout(() => {
                      onComplete()
                    }, 1000)
                  }
                  return
                } else if (data.phase === 'error') {
                  if (isMounted) {
                    onError(data.error || t('errors.failed'))
                  }
                  return
                } else {
                  if (isMounted) {
                    setPhase(data.phase)
                    setProgress(data.progress || 0)
                    setMessage(data.message || '')
                  }
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Adaptation error:', error)
        if (isMounted) {
          onError(error instanceof Error ? error.message : t('errors.failed'))
        }
      }
    }

    startAdaptation()

    return () => {
      isMounted = false
    }
  }, [onComplete, onError, t])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {message || t('starting')}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('info')}
          </p>
        </div>
      </div>
    </div>
  )
}
