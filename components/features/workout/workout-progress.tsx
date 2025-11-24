'use client'

import { useState } from 'react'
import { PlayCircle, CheckCircle2, Circle, Dumbbell, List } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { ExerciseAnimationModal } from './exercise-animation-modal'
import { cn } from '@/lib/utils/cn'

interface WorkoutProgressProps {
  currentIndex: number
  exercises: ExerciseExecution[]
  onReorder?: () => void
  onExerciseClick?: (index: number) => void
}

export function WorkoutProgress({ currentIndex, exercises, onReorder, onExerciseClick }: WorkoutProgressProps) {
  const t = useTranslations('workout.execution.progress')
  const [animationModalOpen, setAnimationModalOpen] = useState<number | null>(null)
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
      <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
        {exercises.map((ex, idx) => {
          const isCompleted = ex.completedSets.length >= ex.targetSets
          const isCurrent = idx === currentIndex
          const isFuture = idx > currentIndex

          return (
            <div
              key={idx}
              onClick={() => onExerciseClick?.(idx)}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 border",
                onExerciseClick && "cursor-pointer",
                isCurrent
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm scale-[1.01]"
                  : isCompleted
                    ? "bg-gray-50/50 dark:bg-gray-800/30 border-transparent opacity-70 hover:opacity-100"
                    : "bg-white/40 dark:bg-gray-800/20 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-20 animate-ping"></span>
                      <Circle className="relative w-4 h-4 text-purple-600 dark:text-purple-400 fill-purple-100 dark:fill-purple-900/50" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Exercise Name */}
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    "text-sm truncate transition-colors",
                    isCurrent ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-400",
                    isCompleted && "text-gray-500 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600"
                  )}>
                    {ex.exerciseName}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
              </div>

              {/* Actions & Stats */}
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* Play icon - show if animation is available */}
                {ex.hasAnimation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAnimationModalOpen(idx)
                    }}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors group"
                    aria-label={`View ${ex.exerciseName} animation`}
                    title={t('viewExercise')}
                  >
                    <PlayCircle className="w-4 h-4 text-blue-500/70 dark:text-blue-400/70 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors" />
                  </button>
                )}

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-center min-w-[3rem]">
                  {ex.completedSets.length}/{ex.targetSets}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Animation Modal */}
      {animationModalOpen !== null && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAnimationModalOpen(null)}
          exerciseName={exercises[animationModalOpen].exerciseName}
          animationUrl={exercises[animationModalOpen].animationUrl || null}
        />
      )}
    </div>
  )
}
