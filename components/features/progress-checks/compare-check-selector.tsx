'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X, Calendar, Scale, Camera } from 'lucide-react'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import type { ProgressCheckWithPhotos } from '@/lib/types/progress-check.types'
import { cn } from '@/lib/utils/cn'

interface CompareCheckSelectorProps {
  userId: string
  currentCheckId: string
  onClose: () => void
}

export function CompareCheckSelector({
  userId,
  currentCheckId,
  onClose,
}: CompareCheckSelectorProps) {
  const t = useTranslations('dashboard.compareCheckSelector')
  const router = useRouter()
  const [checks, setChecks] = useState<ProgressCheckWithPhotos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChecks()
  }, [userId])

  async function loadChecks() {
    setLoading(true)
    try {
      const data = await ProgressCheckService.getChecks(userId)
      // Filter out the current check
      const filtered = data.filter((c) => c.id !== currentCheckId)
      setChecks(filtered)
    } catch (error) {
      console.error('Failed to load checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getDaysSince = (dateString: string) => {
    return Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const getFrontPhoto = (check: ProgressCheckWithPhotos) => {
    return check.photos?.find((p) => p.photo_type === 'front')
  }

  const handleSelectCheck = (selectedCheckId: string) => {
    // Determine which is before and which is after based on dates
    const selectedCheck = checks.find((c) => c.id === selectedCheckId)
    if (!selectedCheck) return

    // We need to fetch the current check date to compare
    // For now, we'll assume user wants to compare current (as after) with selected (as before)
    // The compare page will handle sorting them correctly
    router.push(`/progress-checks/compare/${selectedCheckId}/${currentCheckId}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse"
                >
                  <div className="w-20 h-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : checks.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('noChecks')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {checks.map((check) => {
                const frontPhoto = getFrontPhoto(check)
                const daysSince = getDaysSince(check.taken_at)

                return (
                  <button
                    key={check.id}
                    onClick={() => handleSelectCheck(check.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                  >
                    {/* Photo Thumbnail */}
                    <div className="w-20 h-24 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                      {frontPhoto ? (
                        <img
                          src={frontPhoto.photo_url}
                          alt={t('checkPreviewAlt')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(check.taken_at)}
                        </p>
                        {check.is_milestone && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                            🎯
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {daysSince === 0
                              ? t('today')
                              : t('daysAgo', { days: daysSince })}
                          </span>
                        </div>
                        {check.weight && (
                          <div className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            <span>{check.weight} kg</span>
                          </div>
                        )}
                      </div>
                      {check.cycle_number && check.cycle_day && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {t('cycleInfo', {
                            cycle: check.cycle_number,
                            day: check.cycle_day,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <div className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
