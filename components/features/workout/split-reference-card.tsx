'use client'

import { useTranslations } from 'next-intl'
import type { SessionDefinition } from '@/lib/services/split-plan.service'
import type { SplitPlan } from '@/lib/types/schemas'
import type { MuscleVolumeBreakdown } from '@/lib/utils/workout-helpers'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'
import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SplitReferenceCardProps {
  sessionDefinition: SessionDefinition
  splitPlan: SplitPlan
  cycleDay: number
  actualVolumes: Record<string, MuscleVolumeBreakdown>
}

/**
 * Display split session reference with target vs actual volume comparison
 * Mobile-first, compact design for workout review page
 */
export function SplitReferenceCard({
  sessionDefinition,
  splitPlan,
  cycleDay,
  actualVolumes
}: SplitReferenceCardProps) {
  const t = useTranslations('workout.splitReference')
  const getMuscleGroupLabel = useMuscleGroupLabel()

  const workoutTypeIcon = getWorkoutTypeIcon(sessionDefinition.workoutType)

  // Get volume comparison status for a muscle
  const getVolumeStatus = (targetSets: number, actualSets: number) => {
    const diff = actualSets - targetSets
    const percentage = (diff / targetSets) * 100

    if (diff === 0) return { status: 'perfect', diff: 0, percentage: 0 }
    if (percentage >= -10 && percentage <= 10) return { status: 'good', diff, percentage }
    if (percentage < -10) return { status: 'under', diff, percentage }
    return { status: 'over', diff, percentage }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
      {/* Header: Session Name + Variation + Cycle Position */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{workoutTypeIcon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {sessionDefinition.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('dayOfCycle', { current: cycleDay, total: splitPlan.cycle_days })}
            </p>
          </div>
        </div>
        {sessionDefinition.variation && (
          <span className="px-3 py-1.5 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-md shadow-sm">
            {sessionDefinition.variation}
          </span>
        )}
      </div>

      {/* Target vs Actual Volume Comparison */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t('volumeComparison')}
          </p>
          <div className="flex gap-2 text-xs">
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {t('actual')}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {t('target')}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-2 italic">
          {t('volumeExplanation')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(sessionDefinition.targetVolume).map(([muscle, targetSets]) => {
            const volumeBreakdown = actualVolumes[muscle] || { total: 0, direct: 0, indirect: 0 }
            const actualSets = volumeBreakdown.total
            const status = getVolumeStatus(targetSets, actualSets)

            // Calculate progress percentage for the bar (capped at 100% for visual cleanliness, unless over)
            const progressPercent = Math.min(100, Math.max(0, (actualSets / targetSets) * 100))

            return (
              <div
                key={muscle}
                className="bg-white/60 dark:bg-gray-800/60 rounded-md px-3 py-2 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {getMuscleGroupLabel(muscle)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={cn(
                      "font-bold",
                      status.status === 'perfect' && "text-green-600 dark:text-green-400",
                      status.status === 'good' && "text-blue-600 dark:text-blue-400",
                      status.status === 'under' && "text-amber-600 dark:text-amber-400",
                      status.status === 'over' && "text-purple-600 dark:text-purple-400"
                    )}>
                      {actualSets}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-500">{targetSets}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      status.status === 'perfect' && "bg-green-500",
                      status.status === 'good' && "bg-blue-500",
                      status.status === 'under' && "bg-amber-400",
                      status.status === 'over' && "bg-purple-500"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Status Text (Optional, for extra clarity) */}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    {volumeBreakdown.indirect > 0 ? `${volumeBreakdown.direct} direct + ${volumeBreakdown.indirect} indirect` : ''}
                  </span>
                  {status.status === 'over' && (
                    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                      +{actualSets - targetSets} extra
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
