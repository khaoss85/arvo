'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { useTranslations } from 'next-intl'
import { Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { MuscleRadarChart } from '@/components/features/analytics/muscle-radar-chart'
import { MetricCardsGrid, createMetricsFromCycleStats } from '@/components/features/analytics/metric-cards-grid'

interface MuscleDistributionCardProps {
  targetData: Record<string, number> // From split plan volume_distribution
  actualData: Record<string, number> // From current cycle's completed workouts
  stats: {
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds?: number
  }
  comparison?: {
    volumeDelta: number
    workoutsDelta: number
    setsDelta: number
    durationDelta?: number
  } | null
  comparisonMode?: 'target' | 'previous'
  previousCycleData?: Record<string, number> // For previous cycle comparison
  loading?: boolean
  variant?: 'timeline' | 'full' // timeline = compact for dashboard, full = detailed for progress page
}

/**
 * Muscle Distribution Card with Radar Chart and Metrics
 * Combines visual muscle group distribution with key training stats
 * Can be used in timeline (compact) or full page view
 */
export function MuscleDistributionCard({
  targetData,
  actualData,
  stats,
  comparison,
  comparisonMode: initialComparisonMode = 'target',
  previousCycleData,
  loading = false,
  variant = 'timeline',
}: MuscleDistributionCardProps) {
  const t = useTranslations('Analytics.Metrics')
  const tDash = useTranslations('dashboard')
  // In timeline: metrics start collapsed, radar always visible
  // In full: everything always visible
  const [isExpanded, setIsExpanded] = useState(variant === 'full')
  const [comparisonMode, setComparisonMode] = useState(initialComparisonMode)

  // Create metric cards data
  const metrics = createMetricsFromCycleStats(stats, t, comparison)

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border-2 animate-pulse',
          variant === 'timeline'
            ? 'flex-shrink-0 w-[65vw] sm:w-[280px] p-4 h-[400px]'
            : 'w-full p-6 h-[500px]',
          'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
          'border-blue-300 dark:border-blue-700'
        )}
      >
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const isTimeline = variant === 'timeline'

  return (
    <div
      className={cn(
        'rounded-lg border-2',
        isTimeline
          ? 'flex-shrink-0 w-[65vw] sm:w-[280px] p-4'
          : 'w-full p-6',
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
        'border-blue-300 dark:border-blue-700',
        'shadow-lg'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`${isTimeline ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
          <span className={`${isTimeline ? 'text-sm' : 'text-base'} font-medium text-blue-700 dark:text-blue-300`}>
            {tDash('muscleDistribution')}
          </span>
        </div>
        {isTimeline && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        )}
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3 className={`${isTimeline ? 'text-base' : 'text-xl'} font-bold text-gray-900 dark:text-gray-100`}>
          {comparisonMode === 'target' ? tDash('cycleProgressTitle') : tDash('cycleComparison')}
        </h3>
        <p className={`${isTimeline ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mt-1`}>
          {comparisonMode === 'target'
            ? tDash('actualVsTarget')
            : tDash('currentVsPrevious')}
        </p>
      </div>

      {/* Comparison Mode Toggle - only in timeline if previous data available */}
      {isTimeline && previousCycleData && Object.keys(previousCycleData).length > 0 && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setComparisonMode('target')}
            className={cn(
              'flex-1 px-2 py-1 text-xs font-medium rounded transition-colors',
              comparisonMode === 'target'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40'
            )}
          >
            Target
          </button>
          <button
            onClick={() => setComparisonMode('previous')}
            className={cn(
              'flex-1 px-2 py-1 text-xs font-medium rounded transition-colors',
              comparisonMode === 'previous'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40'
            )}
          >
            Previous
          </button>
        </div>
      )}

      {/* Radar Chart - Always visible (inverted design) */}
      <div className="mb-4">
        <MuscleRadarChart
          targetData={targetData}
          actualData={actualData}
          previousData={previousCycleData}
          comparisonMode={comparisonMode}
          loading={loading}
          maxMuscles={isTimeline ? 6 : 8}
        />
      </div>

      {/* Metric Cards - Collapsible on timeline, always visible on full */}
      {(isExpanded || !isTimeline) && (
        <div className={cn(
          'mt-4',
          isTimeline && 'pt-4 border-t border-blue-200 dark:border-blue-800'
        )}>
          <MetricCardsGrid
            workouts={metrics.workouts}
            duration={metrics.duration}
            volume={metrics.volume}
            sets={metrics.sets}
            compact={isTimeline}
          />
        </div>
      )}

      {/* Footer hint for timeline variant - now for metrics */}
      {isTimeline && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
          >
            {tDash('viewMetrics')}
          </button>
        </div>
      )}
    </div>
  )
}
