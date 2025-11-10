'use client'

import { RefreshCw } from 'lucide-react'
import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'

interface WorkoutProgressProps {
  currentIndex: number
  exercises: ExerciseExecution[]
  onSwapExercise?: (index: number) => void
}

export function WorkoutProgress({ currentIndex, exercises, onSwapExercise }: WorkoutProgressProps) {
  const progress = ((currentIndex + 1) / exercises.length) * 100

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Workout Progress</span>
        <span className="text-sm font-medium text-white">
          {currentIndex + 1} of {exercises.length} exercises
        </span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Exercise List */}
      <div className="mt-4 space-y-2">
        {exercises.map((ex, idx) => {
          const isCompleted = ex.completedSets.length >= ex.targetSets
          const isCurrent = idx === currentIndex

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded ${
                isCurrent
                  ? 'bg-blue-900/30 border border-blue-700'
                  : isCompleted
                  ? 'bg-green-900/20'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className={`text-sm ${isCurrent ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {ex.exerciseName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {ex.completedSets.length}/{ex.targetSets} sets
                </span>
                {/* Swap button - only show if not completed and callback provided */}
                {!isCompleted && onSwapExercise && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSwapExercise(idx)
                    }}
                    className="p-1 hover:bg-purple-600/20 rounded transition-colors group"
                    aria-label={`Change ${ex.exerciseName}`}
                    title="Change exercise"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
