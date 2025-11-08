'use client'

import { Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PRCardsProps {
  records: Array<{
    exerciseId: string
    exerciseName: string
    weight: number
    reps: number
    e1rm: number
    date: string
  }>
  loading?: boolean
}

export function PRCards({ records, loading = false }: PRCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">No personal records yet</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Complete workouts to establish your PRs
        </p>
      </div>
    )
  }

  // Take top 9 records by e1RM
  const topRecords = records.slice(0, 9)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {topRecords.map((pr, index) => (
        <div
          key={pr.exerciseId}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                {pr.exerciseName}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pr.weight}kg × {pr.reps}
              </p>
            </div>
            {index < 3 && (
              <Trophy
                className={`w-5 h-5 flex-shrink-0 ml-2 ${
                  index === 0
                    ? 'text-yellow-500'
                    : index === 1
                    ? 'text-gray-400'
                    : 'text-orange-600'
                }`}
              />
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Est. 1RM</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {Math.round(pr.e1rm)}kg
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(pr.date), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
