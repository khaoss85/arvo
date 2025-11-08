'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface ProgressChartProps {
  data: Array<{
    date: string
    weight: number
    reps: number
    e1rm: number
    volume: number
  }>
  loading?: boolean
}

export function ProgressChart({ data, loading = false }: ProgressChartProps) {
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No data available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Complete workouts to see progress</p>
        </div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    e1rm: Math.round(d.e1rm),
    weight: d.weight,
    reps: d.reps,
    volume: Math.round(d.volume)
  }))

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          label={{
            value: 'Est. 1RM (kg)',
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
            if (name === 'e1rm') return [`${value}kg`, 'Est. 1RM']
            if (name === 'weight') return [`${value}kg`, 'Weight']
            if (name === 'volume') return [`${value}kg`, 'Volume']
            return [value, name]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
          name="Est. 1RM"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
