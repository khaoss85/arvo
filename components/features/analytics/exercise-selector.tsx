'use client'

import { usePersonalRecords } from '@/lib/hooks/useAnalytics'

interface ExerciseSelectorProps {
  value: string
  onChange: (exerciseId: string) => void
  userId: string | undefined
}

export function ExerciseSelector({ value, onChange, userId }: ExerciseSelectorProps) {
  const { data: prs, isLoading } = usePersonalRecords(userId)

  if (isLoading) {
    return (
      <div className="w-full sm:w-64 h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
    )
  }

  // Add "All Exercises" option
  const options = [
    { id: 'all', name: 'All Exercises' },
    ...(prs || []).map(pr => ({ id: pr.exerciseId, name: pr.exerciseName }))
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    >
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  )
}
