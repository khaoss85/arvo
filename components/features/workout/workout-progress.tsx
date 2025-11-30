'use client'

import { Dumbbell, List } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { cn } from '@/lib/utils/cn'

interface WorkoutProgressProps {
  currentIndex: number
  exercises: ExerciseExecution[]
  onReorder?: () => void
  onExerciseClick?: (index: number) => void
}

export function WorkoutProgress({ currentIndex, exercises, onReorder, onExerciseClick }: WorkoutProgressProps) {
  const t = useTranslations('workout.execution.progress')
  const progress = ((currentIndex) / exercises.length) * 100

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('title')}</span>
        </div>
        <div className="flex items-center gap-2">
          {onReorder && (
            <button
              onClick={onReorder}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
              aria-label="Reorder exercises"
            >
              <List className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
            {t('exercisesCount', { current: Math.min(currentIndex + 1, exercises.length), total: exercises.length })}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* Exercise List */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
        {exercises.map((ex, idx) => {
          // Calculate stats
          const warmupSetsCount = ex.warmupSets?.length || 0
          const warmupSetsSkipped = ex.warmupSetsSkipped || 0
          const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
          const totalSets = remainingWarmupSets + ex.targetSets
          const completedSetsCount = ex.completedSets.length

          // Target sets × reps
          const targetSetsReps = `${totalSets}×${ex.targetReps[0]}-${ex.targetReps[1]}`

          const isCompleted = completedSetsCount >= totalSets
          const isCurrent = idx === currentIndex

          return (
            <div
              key={idx}
              onClick={() => onExerciseClick?.(idx)}
              className={cn(
                "py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-between gap-2",
                onExerciseClick && "cursor-pointer",
                isCurrent
                  ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                  : isCompleted
                    ? "opacity-60 hover:opacity-100"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
              )}
            >
              {/* Exercise Name */}
              <span className={cn(
                "text-sm truncate flex-1 min-w-0",
                isCurrent ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-400",
                isCompleted && "text-gray-500 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600"
              )}>
                {ex.exerciseName}
              </span>

              {/* Target Sets×Reps + Technique + Current Badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Target: Sets × Reps */}
                <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
                  {targetSetsReps}
                </span>

                {/* Tecnica avanzata (se presente) */}
                {ex.advancedTechnique && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    {ex.advancedTechnique.technique.replace('_', ' ')}
                  </span>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                    {t('current')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
