'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'
import type { MuscleVolumeProgress } from '@/lib/actions/volume-progress-actions'
import { useTranslations } from 'next-intl'
import { TrendingUp, BarChart3, ChevronRight } from 'lucide-react'
import { VolumeDetailsModal } from './volume-details-modal'

interface VolumeSummaryTimelineCardProps {
  progressData: MuscleVolumeProgress[]
}

/**
 * Compact volume progress card for timeline
 * Matches TimelineDayCard dimensions (280px width)
 */
export function VolumeSummaryTimelineCard({ progressData }: VolumeSummaryTimelineCardProps) {
  const t = useTranslations('dashboard.volumeProgress')
  const getMuscleGroupLabel = useMuscleGroupLabel()
  const [modalOpen, setModalOpen] = useState(false)

  // Show top 4 muscle groups by target volume (most important ones)
  const topMuscles = progressData.slice(0, 4)

  // Calculate overall progress percentage
  const totalTarget = progressData.reduce((sum, m) => sum + m.target, 0)
  const totalCurrent = progressData.reduce((sum, m) => sum + m.current, 0)
  const overallPercentage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

  return (
    <div
      className={cn(
        'flex-shrink-0 w-[280px] rounded-lg border-2 p-4',
        'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
        'border-purple-300 dark:border-purple-700',
        'shadow-lg'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            {t('summary')}
          </span>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100">
          {overallPercentage}%
        </span>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          {t('title')}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {t('cycleProgress')}
        </p>
      </div>

      {/* Compact Progress Bars */}
      <div className="space-y-3">
        {topMuscles.map(({ muscle, current, target, percentage }) => {
          const getBarColor = (pct: number) => {
            if (pct < 50) return 'bg-red-500 dark:bg-red-600'
            if (pct < 80) return 'bg-yellow-500 dark:bg-yellow-600'
            return 'bg-green-500 dark:bg-green-600'
          }

          const getTextColor = (pct: number) => {
            if (pct < 50) return 'text-red-600 dark:text-red-500'
            if (pct < 80) return 'text-yellow-600 dark:text-yellow-500'
            return 'text-green-600 dark:text-green-500'
          }

          return (
            <div key={muscle} className="space-y-1">
              {/* Muscle name and numbers */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getMuscleGroupLabel(muscle)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {current}/{target}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold',
                    getTextColor(percentage)
                  )}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', getBarColor(percentage))}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer info - Clickable to open modal */}
      {progressData.length > 4 && (
        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center justify-center gap-1 transition-colors py-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
          >
            +{progressData.length - 4} {t('moreGroups')}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Volume Details Modal */}
      <VolumeDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        progressData={progressData}
        overallPercentage={overallPercentage}
      />
    </div>
  )
}
