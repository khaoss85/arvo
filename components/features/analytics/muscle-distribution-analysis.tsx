'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Activity, TrendingUp, ChevronDown, GitCompare, Calendar, Timer, Dumbbell, Activity as ActivityIcon } from 'lucide-react'
import { MuscleRadarChart } from './muscle-radar-chart'
import { MetricCardsGrid, createMetricsFromCycleStats } from './metric-cards-grid'
import { MuscleGroupTrendChart } from './muscle-group-trend-chart'
import { Button } from '@/components/ui/button'
import type { HistoricalCycleStats } from '@/app/actions/cycle-stats-actions'
import { format } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { useCycleCompletionById } from '@/lib/hooks/useCycleStats'

interface MuscleDistributionAnalysisProps {
  historicalData: HistoricalCycleStats
  loading?: boolean
  locale?: string
}

type ComparisonMode = 'target' | 'previous' | 'dual-historical'

/**
 * Enhanced muscle distribution analysis for progress page
 * Shows current cycle progress + historical trend comparison
 * Supports: vs Target, vs Previous, and Dual-Cycle comparison
 */
export function MuscleDistributionAnalysis({
  historicalData,
  loading = false,
  locale = 'en',
}: MuscleDistributionAnalysisProps) {
  const t = useTranslations('Analytics.Metrics')
  const tProgress = useTranslations('progress')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('target')
  const [showAllCycles, setShowAllCycles] = useState(false)
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [cycleAId, setCycleAId] = useState<string | null>(null)
  const [cycleBId, setCycleBId] = useState<string | null>(null)

  // Fetch selected cycle for advanced comparison
  const { data: selectedCycle } = useCycleCompletionById(
    comparisonMode === 'previous' ? selectedCycleId : null
  )

  // Fetch dual cycles for dual-historical mode
  const { data: cycleA } = useCycleCompletionById(cycleAId)
  const { data: cycleB } = useCycleCompletionById(cycleBId)

  const { currentCycleStats, cycles } = historicalData

  if (loading || !currentCycleStats) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    )
  }

  // Get comparison data
  const previousCycle = cycles.length > 0 ? cycles[0] : null
  const comparison = previousCycle
    ? {
        volumeDelta: previousCycle.totalVolume > 0
          ? ((currentCycleStats.totalVolume - previousCycle.totalVolume) / previousCycle.totalVolume) * 100
          : 0,
        workoutsDelta: currentCycleStats.totalWorkouts - previousCycle.totalWorkouts,
        setsDelta: currentCycleStats.totalSets - previousCycle.totalSets,
        durationDelta: currentCycleStats.totalDurationSeconds - previousCycle.totalDurationSeconds,
      }
    : null

  // Create metrics
  const metrics = createMetricsFromCycleStats(
    {
      totalVolume: currentCycleStats.totalVolume,
      totalWorkouts: currentCycleStats.totalWorkouts,
      totalSets: currentCycleStats.totalSets,
      totalDurationSeconds: currentCycleStats.totalDurationSeconds,
    },
    t,
    comparison
  )

  const dateLocale = locale === 'it' ? it : enUS

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {tProgress('muscleDistributionTitle')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tProgress('cycleNumber', { number: currentCycleStats.cycleNumber })}
            </p>
          </div>
        </div>

        {/* Comparison Mode Toggle */}
        {previousCycle && (
          <div className="flex gap-2">
            <Button
              variant={comparisonMode === 'target' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('target')}
            >
              {tProgress('comparisonModeTarget')}
            </Button>
            <Button
              variant={comparisonMode === 'previous' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('previous')}
            >
              {tProgress('comparisonModePrevious')}
            </Button>
            {cycles.length >= 2 && (
              <Button
                variant={comparisonMode === 'dual-historical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonMode('dual-historical')}
              >
                <GitCompare className="w-4 h-4 mr-1" />
                {tProgress('compareTwoCycles')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cycle Selector for Previous Mode */}
      {comparisonMode === 'previous' && cycles.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {tProgress('compareWith')}
          </label>
          <select
            value={selectedCycleId || (cycles[0]?.id || '')}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                Cycle #{cycle.cycleNumber} • {format(new Date(cycle.completedAt), 'PP', { locale: dateLocale })} • {new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(cycle.totalVolume)}kg
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dual-Cycle Selectors */}
      {comparisonMode === 'dual-historical' && cycles.length >= 2 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-3">
            <GitCompare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {tProgress('compareTwoCycles')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tProgress('cycleA')}
              </label>
              <select
                value={cycleAId || (cycles[1]?.id || '')}
                onChange={(e) => setCycleAId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    Cycle #{cycle.cycleNumber} • {format(new Date(cycle.completedAt), 'MMM yyyy', { locale: dateLocale })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tProgress('cycleB')}
              </label>
              <select
                value={cycleBId || (cycles[0]?.id || '')}
                onChange={(e) => setCycleBId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    Cycle #{cycle.cycleNumber} • {format(new Date(cycle.completedAt), 'MMM yyyy', { locale: dateLocale })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {cycleA && cycleB && cycleA.id === cycleB.id && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              ⚠️ {tProgress('sameCycleWarning')}
            </p>
          )}
        </div>
      )}

      {/* Current Cycle Metrics (hidden in dual mode) */}
      {comparisonMode !== 'dual-historical' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {tProgress('currentCycleProgress')}
          </h3>
          <MetricCardsGrid
            workouts={metrics.workouts}
            duration={metrics.duration}
            volume={metrics.volume}
            sets={metrics.sets}
            compact={false}
          />
        </div>
      )}

      {/* Dual-Cycle Metrics */}
      {comparisonMode === 'dual-historical' && cycleA && cycleB && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">
            {tProgress('comparingCycles', { a: cycleA.cycleNumber, b: cycleB.cycleNumber })}
          </h3>
          <MetricCardsGrid
            workouts={{
              icon: Calendar,
              label: t('totalWorkouts'),
              value: cycleA.totalWorkouts,
              delta: {
                value: cycleA.totalWorkouts - cycleB.totalWorkouts,
                type: 'absolute',
              },
            }}
            duration={{
              icon: Timer,
              label: t('totalDuration'),
              value: `${Math.round(cycleA.totalDurationSeconds / 60)}m`,
              delta: {
                value: (cycleA.totalDurationSeconds - cycleB.totalDurationSeconds) / 60,
                type: 'time',
              },
            }}
            volume={{
              icon: Dumbbell,
              label: t('totalVolume'),
              value: new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(cycleA.totalVolume),
              unit: 'kg',
              delta: {
                value: cycleB.totalVolume > 0
                  ? ((cycleA.totalVolume - cycleB.totalVolume) / cycleB.totalVolume) * 100
                  : 0,
                type: 'percentage',
              },
            }}
            sets={{
              icon: ActivityIcon,
              label: t('totalSets'),
              value: cycleA.totalSets,
              delta: {
                value: cycleA.totalSets - cycleB.totalSets,
                type: 'absolute',
              },
            }}
            compact={false}
          />
        </div>
      )}

      {/* Radar Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {tProgress('muscleGroupDistribution')}
        </h3>
        <MuscleRadarChart
          targetData={comparisonMode === 'dual-historical' ? {} : currentCycleStats.targetVolumeDistribution}
          actualData={comparisonMode === 'dual-historical' && cycleA ? (cycleA.setsByMuscleGroup || cycleA.volumeByMuscleGroup) : (currentCycleStats.setsByMuscleGroup || currentCycleStats.volumeByMuscleGroup)}
          previousData={
            comparisonMode === 'dual-historical' && cycleB
              ? (cycleB.setsByMuscleGroup || cycleB.volumeByMuscleGroup)
              : comparisonMode === 'previous' && selectedCycle
              ? (selectedCycle.setsByMuscleGroup || selectedCycle.volumeByMuscleGroup)
              : (previousCycle?.setsByMuscleGroup || previousCycle?.volumeByMuscleGroup)
          }
          comparisonMode={comparisonMode === 'dual-historical' ? 'previous' : comparisonMode}
          loading={loading}
          maxMuscles={8}
        />
      </div>

      {/* Historical Trend */}
      {cycles.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tProgress('historicalCycles')}
            </h3>
            {cycles.length > 3 && (
              <button
                onClick={() => setShowAllCycles(!showAllCycles)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {showAllCycles ? tProgress('showLess') : tProgress('viewAll', { count: cycles.length })}
                <ChevronDown className={`h-3 w-3 transition-transform ${showAllCycles ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(showAllCycles ? cycles : cycles.slice(0, 3)).map((cycle, index) => {
              // Calculate delta from this cycle to current
              const volumeChange = currentCycleStats.totalVolume - cycle.totalVolume
              const volumeChangePercent = cycle.totalVolume > 0
                ? (volumeChange / cycle.totalVolume) * 100
                : 0

              return (
                <div
                  key={cycle.cycleNumber}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {tProgress('cycleHash', { number: cycle.cycleNumber })}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {tProgress('last')}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(cycle.totalVolume)}kg
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {cycle.totalWorkouts} {tProgress('workouts')} • {cycle.totalSets} {tProgress('sets')}
                  </div>
                  {index > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp
                        className={`h-3 w-3 ${
                          volumeChange > 0
                            ? 'text-green-500'
                            : volumeChange < 0
                            ? 'text-red-500 rotate-180'
                            : 'text-gray-400'
                        }`}
                      />
                      <span className={`text-xs font-medium ${
                        volumeChange > 0
                          ? 'text-green-600 dark:text-green-400'
                          : volumeChange < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500'
                      }`}>
                        {volumeChange > 0 ? '+' : ''}{volumeChangePercent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                    {format(new Date(cycle.completedAt), 'PP', { locale: dateLocale })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Temporal Trend Chart */}
      {(cycles.length >= 2 || (cycles.length >= 1 && currentCycleStats)) && comparisonMode !== 'dual-historical' && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <MuscleGroupTrendChart
            cycles={cycles}
            currentCycle={currentCycleStats ? {
              cycleNumber: currentCycleStats.cycleNumber,
              volumeByMuscleGroup: currentCycleStats.volumeByMuscleGroup,
            } : undefined}
            locale={locale}
          />
        </div>
      )}
    </div>
  )
}
