'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getSplitTimelineDataAction } from '@/app/actions/split-actions'
import type { SplitTimelineData } from '@/lib/services/split-timeline.types'
import { TimelineDayCard } from './timeline-day-card'

interface SplitCycleTimelineProps {
  userId: string
}

export function SplitCycleTimeline({ userId }: SplitCycleTimelineProps) {
  const [data, setData] = useState<SplitTimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    loadTimelineData()
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
      const cardWidth = 280 // Fixed card width
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
          <span>Loading split timeline...</span>
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
            <h2 className="text-2xl font-bold mb-1">Split Programming</h2>
            <p className="text-purple-100 dark:text-purple-200 text-sm">
              {splitPlan.split_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-100 dark:text-purple-200">
              Cycle Progress
            </span>
            <span className="text-sm font-bold">
              Day {currentCycleDay} of {splitPlan.cycle_days}
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
          Scroll to see your complete training cycle. Generate today&apos;s workout below to start your session.
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
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600"></span>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  )
}
