'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface VolumeChartProps {
  data: Array<{
    weekStart: string
    totalVolume: number
    totalSets: number
    workoutCount: number
  }>
  loading?: boolean
}

export function VolumeChart({ data, loading = false }: VolumeChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded animate-pulse">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No volume data available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Complete workouts to track volume</p>
        </div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(d => ({
    week: format(new Date(d.weekStart), 'MMM d'),
    volume: Math.round(d.totalVolume),
    sets: d.totalSets,
    workouts: d.workoutCount
  }))

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          label={{
            value: 'Volume (kg)',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 12 }
          }}
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(17 24 39)',
            border: '1px solid rgb(55 65 81)',
            borderRadius: '0.5rem',
            color: 'rgb(243 244 246)'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'volume') return [`${value}kg`, 'Total Volume']
            if (name === 'sets') return [value, 'Total Sets']
            if (name === 'workouts') return [value, 'Workouts']
            return [value, name]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar
          dataKey="volume"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          name="Volume"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
