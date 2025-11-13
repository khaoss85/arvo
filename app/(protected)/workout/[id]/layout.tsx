'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ExitWorkoutModal } from '@/components/features/workout/exit-workout-modal'

export default function WorkoutLayout({
  children
}: {
  children: React.ReactNode
}) {
  const t = useTranslations('workout.pages.layout')
  const router = useRouter()
  const pathname = usePathname()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  // Navigation guard - prevent accidental leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Wake Lock - keep screen on during workout
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err)
      }
    }

    requestWakeLock()

    // Re-acquire wake lock on visibility change
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock !== null) {
        wakeLock.release()
      }
    }
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }

  // Skip workout layout for review pages
  if (pathname?.includes('/review')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar with controls */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowExitModal(true)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">{t('exitWorkout')}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="pb-safe">
        {children}
      </div>

      {/* Exit Workout Confirmation Modal */}
      <ExitWorkoutModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => router.push('/dashboard')}
      />
    </div>
  )
}
