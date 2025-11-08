'use client'

import type { TrainingApproach } from '@/lib/types/schemas'
import { Card } from '@/components/ui/card'

interface ApproachCardProps {
  approach: TrainingApproach
  selected: boolean
  onSelect: () => void
}

export function ApproachCard({ approach, selected, onSelect }: ApproachCardProps) {
  const variables = approach.variables as any
  const progression = approach.progression_rules as any

  return (
    <Card
      className={`p-6 cursor-pointer transition-all ${
        selected
          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{approach.name}</h3>
          {approach.creator && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              by {approach.creator}
            </p>
          )}
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selected
              ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {approach.philosophy && (
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {approach.philosophy}
        </p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Working Sets:</span>
          <span className="font-medium">{variables?.setsPerExercise?.working || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Rep Ranges (Compound):</span>
          <span className="font-medium">
            {variables?.repRanges?.compound?.join('-') || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">RIR Target:</span>
          <span className="font-medium">{variables?.rirTarget?.normal || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Progression:</span>
          <span className="font-medium capitalize">
            {progression?.priority?.replace('_', ' ') || 'N/A'}
          </span>
        </div>
      </div>
    </Card>
  )
}
