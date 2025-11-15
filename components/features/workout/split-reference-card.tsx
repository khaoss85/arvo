'use client'

import { useTranslations } from 'next-intl'
import type { SessionDefinition } from '@/lib/services/split-plan.service'
import type { SplitPlan } from '@/lib/types/schemas'
import type { MuscleVolumeBreakdown } from '@/lib/utils/workout-helpers'
import { getWorkoutTypeIcon, getMuscleGroupLabel } from '@/lib/services/muscle-groups.service'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(sessionDefinition.targetVolume).map(([muscle, targetSets]) => {
            const volumeBreakdown = actualVolumes[muscle] || { total: 0, direct: 0, indirect: 0 }
            const actualSets = volumeBreakdown.total
            const status = getVolumeStatus(targetSets, actualSets)

            return (
              <div
                key={muscle}
                className={cn(
                  'flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-md px-3 py-2.5 border',
                  status.status === 'perfect' && 'border-green-300 dark:border-green-700',
                  status.status === 'good' && 'border-blue-300 dark:border-blue-700',
                  status.status === 'under' && 'border-orange-300 dark:border-orange-700',
                  status.status === 'over' && 'border-yellow-300 dark:border-yellow-700'
                )}
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {getMuscleGroupLabel(muscle)}
                </span>

                <div className="flex items-center gap-2">
                  {/* Actual Volume with Direct/Indirect Breakdown */}
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300 leading-tight">
                      {actualSets}
                    </span>
                    {volumeBreakdown.indirect > 0 && (
                      <span
                        className="text-[10px] text-gray-500 dark:text-gray-500 leading-none"
                        title={`${volumeBreakdown.direct} direct + ${volumeBreakdown.indirect} indirect sets`}
                      >
                        {volumeBreakdown.direct}+{volumeBreakdown.indirect}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400">→</span>

                  {/* Target */}
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {targetSets}
                  </span>

                  {/* Status Indicator */}
                  {status.status === 'perfect' && (
                    <Minus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  {status.status === 'good' && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {status.diff > 0 ? `+${status.diff}` : status.diff}
                    </span>
                  )}
                  {status.status === 'under' && (
                    <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  )}
                  {status.status === 'over' && (
                    <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
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
