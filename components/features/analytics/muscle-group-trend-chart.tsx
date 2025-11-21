'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { HistoricalCycleStats } from '@/app/actions/cycle-stats-actions'
import { TrendingUp } from 'lucide-react'

interface MuscleGroupTrendChartProps {
  cycles: HistoricalCycleStats['cycles']
  currentCycle?: {
    cycleNumber: number
    volumeByMuscleGroup: Record<string, number>
  }
  locale?: string
}

// Muscle group colors (consistent with app design)
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f59e0b',
  shoulders_front: '#fbbf24',
  shoulders_side: '#f97316',
  biceps: '#8b5cf6',
  triceps: '#ec4899',
  quads: '#10b981',
  hamstrings: '#14b8a6',
  glutes: '#06b6d4',
  calves: '#6366f1',
  abs: '#f43f5e',
}

const DEFAULT_COLORS = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981',
  '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'
]

/**
 * Temporal Trend Chart Component
 * Shows volume progression across cycles for selected muscle groups
 */
export function MuscleGroupTrendChart({
  cycles,
  currentCycle,
  locale = 'en',
}: MuscleGroupTrendChartProps) {
  const tProgress = useTranslations('progress')

  // Get all unique muscle groups across all cycles
  const allMuscleGroups = useMemo(() => {
    const musclesSet = new Set<string>()

    cycles.forEach(cycle => {
      Object.keys(cycle.volumeByMuscleGroup).forEach(muscle => musclesSet.add(muscle))
    })

    if (currentCycle) {
      Object.keys(currentCycle.volumeByMuscleGroup).forEach(muscle => musclesSet.add(muscle))
    }

    return Array.from(musclesSet).sort()
  }, [cycles, currentCycle])

  // Get top 3 muscle groups by average volume
  const topMuscles = useMemo(() => {
    const muscleAverages: Record<string, number> = {}

    allMuscleGroups.forEach(muscle => {
      const volumes: number[] = []
      cycles.forEach(cycle => {
        if (cycle.volumeByMuscleGroup[muscle]) {
          volumes.push(cycle.volumeByMuscleGroup[muscle])
        }
      })
      if (currentCycle?.volumeByMuscleGroup[muscle]) {
        volumes.push(currentCycle.volumeByMuscleGroup[muscle])
      }

      if (volumes.length > 0) {
        muscleAverages[muscle] = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
      }
    })

    return Object.entries(muscleAverages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([muscle]) => muscle)
  }, [allMuscleGroups, cycles, currentCycle])

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(topMuscles)

  // Prepare chart data
  const chartData = useMemo(() => {
    const allCycles = [...cycles]
    if (currentCycle) {
      allCycles.push({
        id: 'current',
        cycleNumber: currentCycle.cycleNumber,
        completedAt: new Date().toISOString(),
        totalVolume: Object.values(currentCycle.volumeByMuscleGroup).reduce((sum, v) => sum + v, 0),
        totalWorkouts: 0,
        totalSets: 0,
        totalDurationSeconds: 0,
        volumeByMuscleGroup: currentCycle.volumeByMuscleGroup,
        splitType: 'current',
      })
    }

    return allCycles.map(cycle => {
      const dataPoint: any = {
        cycleNumber: cycle.cycleNumber,
        isCurrent: cycle.splitType === 'current',
      }

      selectedMuscles.forEach(muscle => {
        dataPoint[muscle] = cycle.volumeByMuscleGroup[muscle] || 0
      })

      return dataPoint
    }).sort((a, b) => a.cycleNumber - b.cycleNumber)
  }, [cycles, currentCycle, selectedMuscles])

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    )
  }

  if (cycles.length < 2 && !currentCycle) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tProgress('noTrendData')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {tProgress('volumeTrendTitle')}
          </h3>
        </div>
      </div>

      {/* Muscle Selector */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          {tProgress('selectMuscles')}
        </p>
        <div className="flex flex-wrap gap-2">
          {allMuscleGroups.map((muscle, index) => {
            const isSelected = selectedMuscles.includes(muscle)
            const color = MUSCLE_COLORS[muscle] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]

            return (
              <button
                key={muscle}
                onClick={() => toggleMuscle(muscle)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${isSelected
                    ? 'shadow-md scale-105'
                    : 'opacity-50 hover:opacity-75'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? color : 'transparent',
                  color: isSelected ? 'white' : color,
                  border: `2px solid ${color}`,
                }}
              >
                {muscle.replace('_', ' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis
            dataKey="cycleNumber"
            label={{ value: 'Cycle #', position: 'insideBottom', offset: -5 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
            }}
            labelFormatter={(value) => `Cycle #${value}`}
            formatter={(value: any, name: string) => [
              `${Math.round(value)}kg`,
              name.replace('_', ' ')
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => value.replace('_', ' ')}
          />
          {selectedMuscles.map((muscle, index) => {
            const color = MUSCLE_COLORS[muscle] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            return (
              <Line
                key={muscle}
                type="monotone"
                dataKey={muscle}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name={muscle.replace('_', ' ')}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Current Cycle Indicator */}
      {currentCycle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          * Cycle #{currentCycle.cycleNumber} {tProgress('isCurrentCycle')}
        </p>
      )}
    </div>
  )
}
