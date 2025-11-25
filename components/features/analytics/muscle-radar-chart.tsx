'use client'

import { useMemo, useCallback } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useTranslations } from 'next-intl'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'

interface MuscleRadarChartProps {
  targetData: Record<string, number> // Target volume from split plan
  actualData: Record<string, number> // Actual volume from completed workouts
  loading?: boolean
  comparisonMode?: 'target' | 'previous' // Compare with target split or previous cycle
  previousData?: Record<string, number> // For previous cycle comparison
  maxMuscles?: number // Limit to top N muscle groups (default: 6)
}

interface RadarDataPoint {
  muscle: string
  target: number
  actual: number
  previous?: number
  percentage: number
}

export function MuscleRadarChart({
  targetData,
  actualData,
  loading = false,
  comparisonMode = 'target',
  previousData,
  maxMuscles = 6,
}: MuscleRadarChartProps) {
  const t = useTranslations('radarChart.labels')
  const getMuscleLabel = useMuscleGroupLabel()

  // Prepare data for radar chart - memoized to prevent infinite re-renders
  // Must be called before any early returns (React Hooks rules)
  const chartData = useMemo((): RadarDataPoint[] => {
    // Get all unique muscle groups
    const allMuscles = new Set([
      ...Object.keys(targetData),
      ...Object.keys(actualData),
      ...(previousData ? Object.keys(previousData) : []),
    ])

    // Convert to array and calculate percentages
    const muscleData = Array.from(allMuscles)
      .map(muscle => {
        const target = targetData[muscle] || 0
        const actual = actualData[muscle] || 0
        const previous = previousData?.[muscle] || 0
        const percentage = target > 0 ? Math.round((actual / target) * 100) : 0

        return {
          muscle: getMuscleLabel(muscle),
          muscleTechnical: muscle,
          target,
          actual,
          previous,
          percentage,
        }
      })
      // Filter out muscles with no data
      .filter(m => m.target > 0 || m.actual > 0 || m.previous > 0)
      // Sort by target volume (descending)
      .sort((a, b) => b.target - a.target)
      // Take top N muscles
      .slice(0, maxMuscles)

    return muscleData
  }, [targetData, actualData, previousData, maxMuscles, getMuscleLabel])

  // Custom tooltip - memoized to prevent recreation on every render
  // Must be called before any early returns (React Hooks rules)
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium mb-2">{data.muscle}</p>
        <div className="space-y-1 text-sm">
          {comparisonMode === 'target' ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-400">{t('target')}:</span>
                <span className="text-white font-medium">{data.target} {t('sets')}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-green-400">{t('actual')}:</span>
                <span className="text-white font-medium">{data.actual} {t('sets')}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                <span className="text-gray-400">{t('progress')}:</span>
                <span className={`font-medium ${
                  data.percentage >= 80 ? 'text-green-400' :
                  data.percentage >= 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {data.percentage}%
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-green-400">{t('current')}:</span>
                <span className="text-white font-medium">{data.actual} {t('sets')}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-purple-400">{t('previous')}:</span>
                <span className="text-white font-medium">{data.previous || 0} {t('sets')}</span>
              </div>
              {data.previous > 0 && (
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                  <span className="text-gray-400">{t('change')}:</span>
                  <span className={`font-medium ${
                    data.actual > data.previous ? 'text-green-400' :
                    data.actual < data.previous ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {data.actual > data.previous ? '+' : ''}{data.actual - data.previous} {t('sets')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }, [comparisonMode, t])

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded animate-pulse">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('noData')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{t('noDataHint')}</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid className="stroke-gray-300 dark:stroke-gray-600" />
        <PolarAngleAxis
          dataKey="muscle"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-gray-700 dark:text-gray-300"
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 'auto']}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
        />

        {comparisonMode === 'target' ? (
          <>
            {/* Target volume radar */}
            <Radar
              name={t('target')}
              dataKey="target"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            {/* Actual volume radar */}
            <Radar
              name={t('actual')}
              dataKey="actual"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.5}
              strokeWidth={2}
            />
          </>
        ) : (
          <>
            {/* Current cycle radar */}
            <Radar
              name={t('current')}
              dataKey="actual"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            {/* Previous cycle radar */}
            {previousData && (
              <Radar
                name={t('previous')}
                dataKey="previous"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            )}
          </>
        )}
      </RadarChart>
    </ResponsiveContainer>
  )
}
