'use client'

import { useTranslations } from 'next-intl'
import { TrendingUp, TrendingDown, Minus, Dumbbell, Calendar, Timer, Activity } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MetricCardData {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  delta?: {
    value: number
    type: 'percentage' | 'absolute' | 'time'
    comparison?: string // "vs last cycle", "vs target", etc.
  }
  trend?: 'up' | 'down' | 'neutral'
}

interface MetricCardsGridProps {
  workouts?: MetricCardData
  duration?: MetricCardData
  volume?: MetricCardData
  sets?: MetricCardData
  customMetrics?: MetricCardData[]
  compact?: boolean
}

export function MetricCardsGrid({
  workouts,
  duration,
  volume,
  sets,
  customMetrics,
  compact = false,
}: MetricCardsGridProps) {
  const t = useTranslations('Analytics.Metrics')

  // Combine default metrics with custom ones
  const metrics = [
    workouts,
    duration,
    volume,
    sets,
    ...(customMetrics || []),
  ].filter(Boolean) as MetricCardData[]

  const renderTrendIcon = (trend?: 'up' | 'down' | 'neutral', delta?: number) => {
    if (!trend || !delta) return null

    if (trend === 'up' || delta > 0) {
      return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
    }
    if (trend === 'down' || delta < 0) {
      return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
    }
    return <Minus className="h-3.5 w-3.5 text-gray-400" />
  }

  const formatDelta = (delta: MetricCardData['delta']) => {
    if (!delta) return null

    const sign = delta.value > 0 ? '+' : ''
    let displayValue = ''

    switch (delta.type) {
      case 'percentage':
        displayValue = `${sign}${delta.value.toFixed(1)}%`
        break
      case 'time':
        // Format time delta (assuming value is in minutes)
        const hours = Math.floor(Math.abs(delta.value) / 60)
        const minutes = Math.abs(delta.value) % 60
        displayValue = hours > 0
          ? `${sign}${hours}h ${minutes}m`
          : `${sign}${Math.abs(delta.value)}m`
        break
      case 'absolute':
      default:
        displayValue = `${sign}${delta.value}`
        break
    }

    const colorClass =
      delta.value > 0
        ? 'text-green-600 dark:text-green-400'
        : delta.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400'

    return (
      <div className="flex items-center gap-1">
        {renderTrendIcon(undefined, delta.value)}
        <span className={`text-xs font-medium ${colorClass}`}>{displayValue}</span>
      </div>
    )
  }

  if (metrics.length === 0) {
    return null
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${compact ? '' : 'sm:gap-4'}`}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon

        return (
          <div
            key={index}
            className={`rounded-lg border bg-card ${
              compact ? 'p-3' : 'p-4'
            } hover:border-purple-500/50 transition-colors`}
          >
            {/* Header with icon and label */}
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-muted-foreground`} />
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                {metric.label}
              </span>
            </div>

            {/* Value */}
            <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold flex items-baseline gap-1`}>
              <span>{metric.value}</span>
              {metric.unit && (
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-normal text-muted-foreground`}>
                  {metric.unit}
                </span>
              )}
            </div>

            {/* Delta indicator */}
            {metric.delta && (
              <div className="mt-1">
                {formatDelta(metric.delta)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Helper function to create metric data from cycle stats
export function createMetricsFromCycleStats(
  stats: {
    totalVolume: number
    totalWorkouts: number
    totalSets: number
    totalDurationSeconds?: number
  },
  t: (key: string) => string,
  comparison?: {
    volumeDelta: number
    workoutsDelta: number
    setsDelta: number
    durationDelta?: number
  } | null
): {
  workouts: MetricCardData
  duration?: MetricCardData
  volume: MetricCardData
  sets: MetricCardData
} {
  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 0,
    }).format(volume)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  return {
    workouts: {
      icon: Calendar,
      label: t('workouts'),
      value: stats.totalWorkouts,
      delta: comparison?.workoutsDelta
        ? {
            value: comparison.workoutsDelta,
            type: 'absolute',
          }
        : undefined,
    },
    duration: stats.totalDurationSeconds
      ? {
          icon: Timer,
          label: t('duration'),
          value: formatDuration(stats.totalDurationSeconds),
          delta: comparison?.durationDelta
            ? {
                value: comparison.durationDelta / 60, // Convert to minutes
                type: 'time',
              }
            : undefined,
        }
      : undefined,
    volume: {
      icon: Dumbbell,
      label: t('volume'),
      value: formatVolume(stats.totalVolume),
      unit: 'kg',
      delta: comparison?.volumeDelta
        ? {
            value: comparison.volumeDelta,
            type: 'percentage',
          }
        : undefined,
    },
    sets: {
      icon: Activity,
      label: t('sets'),
      value: stats.totalSets,
      delta: comparison?.setsDelta
        ? {
            value: comparison.setsDelta,
            type: 'absolute',
          }
        : undefined,
    },
  }
}
