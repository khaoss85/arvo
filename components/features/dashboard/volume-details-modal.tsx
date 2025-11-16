'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'
import type { MuscleVolumeProgress } from '@/lib/actions/volume-progress-actions'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import { BarChart3 } from 'lucide-react'

interface VolumeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  progressData: MuscleVolumeProgress[]
  overallPercentage: number
}

/**
 * Modal showing complete volume progress for all muscle groups
 */
export function VolumeDetailsModal({
  isOpen,
  onClose,
  progressData,
  overallPercentage
}: VolumeDetailsModalProps) {
  const t = useTranslations('dashboard.volumeProgress')
  const getMuscleGroupLabel = useMuscleGroupLabel()

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

  const getBadgeColor = (pct: number) => {
    if (pct < 50) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    if (pct < 80) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {t('detailsTitle')}
            <span className={cn(
              'ml-auto px-3 py-1 rounded-full text-sm font-bold',
              getBadgeColor(overallPercentage)
            )}>
              {overallPercentage}%
            </span>
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('detailsDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* All muscle groups with progress bars */}
        <div className="space-y-4 py-4">
          {progressData.map(({ muscle, current, target, percentage }) => (
            <div key={muscle} className="bg-white dark:bg-gray-900/50 rounded-lg p-4 space-y-3 border border-purple-200 dark:border-purple-800">
              {/* Muscle name and stats */}
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {getMuscleGroupLabel(muscle)}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {current} / {target} sets
                  </span>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-bold',
                    getBadgeColor(percentage)
                  )}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-500', getBarColor(percentage))}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Status text */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {percentage >= 100 ? t('completed') : percentage >= 80 ? t('nearCompletion') : percentage >= 50 ? t('onTrack') : t('needsWork')}
                </span>
                <span className={cn('font-semibold', getTextColor(percentage))}>
                  {target - current > 0 ? `${target - current} sets ${t('remaining')}` : t('targetReached')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-purple-200 dark:border-purple-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {t('footer')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
