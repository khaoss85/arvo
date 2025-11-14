'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getSplitTimelineDataAction, advanceSplitCycleAction } from '@/app/actions/split-actions'
import type { SplitTimelineData } from '@/lib/services/split-timeline.types'
import { TimelineDayCard } from './timeline-day-card'
import { useUIStore } from '@/lib/stores/ui.store'

interface SplitCycleTimelineProps {
  userId: string
  onGenerateWorkout?: () => void
}

export function SplitCycleTimeline({ userId, onGenerateWorkout }: SplitCycleTimelineProps) {
  const t = useTranslations('dashboard.timeline')
  const tLegend = useTranslations('dashboard.timeline.legend')
  const [data, setData] = useState<SplitTimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useUIStore()

  const loadTimelineData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getSplitTimelineDataAction(userId)
      if (result.success && result.data) {
        setData(result.data)
      } else {
        setData(null)
        setError(result.error || 'Failed to load timeline')
      }
    } catch (err) {
      console.error('Failed to load timeline:', err)
      setData(null)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleSkipRestDay = useCallback(async () => {
    console.log('[SplitCycleTimeline] handleSkipRestDay - Starting...')
    try {
      const result = await advanceSplitCycleAction(userId)
      console.log('[SplitCycleTimeline] handleSkipRestDay - Result:', result)

      if (result.success) {
        const nextDay = result.data?.nextDay
        // Show success toast
        addToast(
          nextDay
            ? `✓ Passato al Giorno ${nextDay}`
            : '✓ Avanzato al prossimo giorno',
          'success'
        )
        // Reload timeline data to reflect the new current day
        await loadTimelineData()
      } else {
        // Show error toast with specific message
        console.error('[SplitCycleTimeline] handleSkipRestDay - Operation failed:', result.error)
        addToast(
          `✗ Impossibile saltare il giorno di riposo: ${result.error || 'Errore sconosciuto'}`,
          'error'
        )
      }
    } catch (err) {
      console.error('[SplitCycleTimeline] handleSkipRestDay - Exception:', err)
      addToast(
        `✗ Errore inaspettato: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`,
        'error'
      )
    }
  }, [userId, loadTimelineData, addToast])

  useEffect(() => {
    loadTimelineData()
  }, [loadTimelineData])

  // Refresh timeline when page becomes visible (user returns from workout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTimelineData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadTimelineData])

  // Auto-scroll to current day
  useEffect(() => {
    if (!data || !scrollContainerRef.current) return

    // Wait for render, then scroll
    const timeout = setTimeout(() => {
      const container = scrollContainerRef.current
      if (!container) return

      // Find current day card
      const currentDayIndex = data.currentCycleDay - 1 // 0-indexed
      const cardWidth = 320 // Current day card width (320px when expanded)
      const gap = 12 // Gap between cards
      const padding = 16 // Container padding

      // Calculate scroll position to center current day
      const scrollPosition = currentDayIndex * (cardWidth + gap) - (container.clientWidth / 2) + (cardWidth / 2) + padding

      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }, 100)

    return () => clearTimeout(timeout)
  }, [data])

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>{t('loadingSplitTimeline')}</span>
        </div>
      </div>
    )
  }

  // Error or no split plan
  if (error || !data) {
    return null // Don't show anything if no split plan (user might not have one yet)
  }

  const { splitPlan, currentCycleDay, days } = data

  // Calculate progress percentage
  const progressPercentage = (currentCycleDay / splitPlan.cycle_days) * 100

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('splitProgramming')}</h2>
            <p className="text-purple-100 dark:text-purple-200 text-sm">
              {splitPlan.split_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-100 dark:text-purple-200">
              {t('cycleProgress')}
            </span>
            <span className="text-sm font-bold">
              {t('dayOf', { current: currentCycleDay, total: splitPlan.cycle_days })}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Helper text */}
        <p className="text-sm text-purple-100 dark:text-purple-200">
          {t('helperText')}
        </p>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          style={{
            scrollbarWidth: 'thin',
            scrollSnapType: 'x proximity'
          }}
        >
          <div className="flex gap-3 min-w-max px-4">
            {days.map((dayData) => (
              <div
                key={dayData.day}
                style={{ scrollSnapAlign: 'center' }}
              >
                <TimelineDayCard
                  dayData={dayData}
                  isCurrentDay={dayData.day === currentCycleDay}
                  userId={userId}
                  onGenerateWorkout={onGenerateWorkout}
                  onRefreshTimeline={loadTimelineData}
                  onSkipRestDay={handleSkipRestDay}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scroll fade indicators */}
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent pointer-events-none" />
      </div>

      {/* Legend (optional - simple visual guide) */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>{tLegend('completed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600"></span>
          <span>{tLegend('current')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>{tLegend('preGenerated')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span>{tLegend('upcoming')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
          <span>{tLegend('rest')}</span>
        </div>
      </div>
    </div>
  )
}
