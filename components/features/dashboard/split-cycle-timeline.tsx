'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getSplitTimelineDataAction, advanceSplitCycleAction } from '@/app/actions/split-actions'
import type { SplitTimelineData } from '@/lib/services/split-timeline.types'
import type { MuscleVolumeProgress } from '@/lib/actions/volume-progress-actions'
import { TimelineDayCard } from './timeline-day-card'
import { VolumeSummaryTimelineCard } from './volume-summary-timeline-card'
import { MuscleDistributionCard } from './muscle-distribution-card'
import { useUIStore } from '@/lib/stores/ui.store'
import { CustomizeSplitDialog } from '@/components/features/split/customize-split-dialog'
import { undoLastModificationAction, getRecentModificationsAction } from '@/app/actions/split-customization-actions'
import { getCurrentCycleStatsAction } from '@/app/actions/cycle-stats-actions'
import type { CycleStatsForTimeline } from '@/app/actions/cycle-stats-actions'
import { Button } from '@/components/ui/button'

interface SplitCycleTimelineProps {
  userId: string
  onGenerateWorkout?: () => void
  volumeProgress?: MuscleVolumeProgress[]
}

export function SplitCycleTimeline({ userId, onGenerateWorkout, volumeProgress }: SplitCycleTimelineProps) {
  const t = useTranslations('dashboard.timeline')
  const tSplit = useTranslations('dashboard.splitCycle')
  const tLegend = useTranslations('dashboard.timeline.legend')
  const [data, setData] = useState<SplitTimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useUIStore()
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false)
  const [hasModifications, setHasModifications] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [cycleStats, setCycleStats] = useState<CycleStatsForTimeline | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
            ? t('actions.advancedToDay', { nextDay })
            : t('actions.advancedToNext'),
          'success'
        )
        // Reload timeline data to reflect the new current day
        await loadTimelineData()
      } else {
        // Show error toast with specific message
        console.error('[SplitCycleTimeline] handleSkipRestDay - Operation failed:', result.error)
        addToast(
          t('errors.cannotSkipRest', { error: result.error || t('errors.unknownError') }),
          'error'
        )
      }
    } catch (err) {
      console.error('[SplitCycleTimeline] handleSkipRestDay - Exception:', err)
      addToast(
        t('errors.unexpectedError', { message: err instanceof Error ? err.message : t('errors.unknownError') }),
        'error'
      )
    }
  }, [userId, loadTimelineData, addToast])

  const checkForModifications = useCallback(async () => {
    try {
      const result = await getRecentModificationsAction(userId, 1)
      if (result.success && result.data && result.data.length > 0) {
        setHasModifications(true)
      } else {
        setHasModifications(false)
      }
    } catch (error) {
      console.error('Failed to check modifications:', error)
      setHasModifications(false)
    }
  }, [userId])

  const loadCycleStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const result = await getCurrentCycleStatsAction(userId)
      if (result.success && result.data) {
        setCycleStats(result.data)
      } else {
        setCycleStats(null)
      }
    } catch (err) {
      console.error('Failed to load cycle stats:', err)
      setCycleStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [userId])

  const handleUndo = useCallback(async () => {
    if (!window.confirm(tSplit('confirmUndo') || 'Are you sure you want to undo the last modification?')) {
      return
    }

    setUndoing(true)
    try {
      const result = await undoLastModificationAction(userId)
      if (result.success) {
        addToast(result.data?.message || tSplit('undoSuccess'), 'success')
        await loadTimelineData()
        await checkForModifications()
      } else {
        addToast(result.error || 'Failed to undo modification', 'error')
      }
    } catch (error) {
      console.error('Failed to undo:', error)
      addToast('Failed to undo modification', 'error')
    } finally {
      setUndoing(false)
    }
  }, [userId, loadTimelineData, checkForModifications, addToast, tSplit])

  const handleCustomizationComplete = useCallback(async () => {
    await loadTimelineData()
    await checkForModifications()
  }, [loadTimelineData, checkForModifications])

  useEffect(() => {
    loadTimelineData()
    checkForModifications()
    loadCycleStats()
  }, [loadTimelineData, checkForModifications, loadCycleStats])

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

      // Calculate actual card width based on viewport
      const isMobile = container.clientWidth < 640 // sm breakpoint
      const cardWidth = isMobile
        ? container.clientWidth * 0.65  // 65vw on mobile
        : 320 // 320px on desktop for current day
      const gap = 16 // Gap between cards (gap-4)
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
          {hasModifications && (
            <Button
              onClick={handleUndo}
              disabled={undoing}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
            >
              {undoing ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {tSplit('undoing')}
                </>
              ) : (
                <>↩️ {tSplit('undo')}</>
              )}
            </Button>
          )}
        </div>

        {/* Cycle Progress Bar */}
        <div className="mb-3">
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

        {/* Customize Button - Prominent Position */}
        <div className="mb-4">
          <Button
            onClick={() => setCustomizeDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60 shadow-sm transition-all"
          >
            <span className="mr-2">⚙️</span>
            {tSplit('customize')}
          </Button>
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
          <div className="flex gap-4 min-w-max px-4">
            {days.map((dayData) => (
              <div
                key={dayData.day}
                style={{ scrollSnapAlign: isMobile ? 'start' : 'center' }}
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

            {/* Volume Progress Summary Card */}
            {volumeProgress && volumeProgress.length > 0 && (
              <div style={{ scrollSnapAlign: isMobile ? 'start' : 'center' }}>
                <VolumeSummaryTimelineCard progressData={volumeProgress} />
              </div>
            )}

            {/* Muscle Distribution Card */}
            {cycleStats && !statsLoading && (
              <div style={{ scrollSnapAlign: isMobile ? 'start' : 'center' }}>
                <MuscleDistributionCard
                  targetData={cycleStats.targetVolumeDistribution}
                  actualData={cycleStats.currentStats.setsByMuscleGroup || cycleStats.currentStats.volumeByMuscleGroup}
                  stats={cycleStats.currentStats}
                  comparison={cycleStats.comparison}
                  previousCycleData={cycleStats.previousVolumeByMuscleGroup || undefined}
                  comparisonMode="target"
                  variant="timeline"
                  loading={statsLoading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Scroll fade indicators - hidden on mobile, visible on desktop after padding */}
        <div className="absolute left-4 top-0 bottom-4 hidden md:block md:w-16 bg-gradient-to-r from-gray-50 via-gray-50/80 dark:from-gray-950 dark:via-gray-950/80 to-transparent pointer-events-none" />
        <div className="absolute right-4 top-0 bottom-4 hidden md:block md:w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 dark:from-gray-950 dark:via-gray-950/80 to-transparent pointer-events-none" />
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

      {/* Customize Split Dialog */}
      <CustomizeSplitDialog
        open={customizeDialogOpen}
        onOpenChange={setCustomizeDialogOpen}
        userId={userId}
        currentSplitType={splitPlan.split_type}
        splitPlanData={{
          cycleDays: splitPlan.cycle_days,
          sessions: splitPlan.sessions as any[]
        }}
        completedDays={days.filter(d => d.status === 'completed').map(d => d.day)}
        onModificationComplete={handleCustomizationComplete}
      />
    </div>
  )
}
