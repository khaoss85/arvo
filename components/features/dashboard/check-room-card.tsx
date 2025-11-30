'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Camera, Plus, TrendingUp, Calendar, Scale } from 'lucide-react'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import type { ProgressCheckWithPhotos } from '@/lib/types/progress-check.types'
import { cn } from '@/lib/utils/cn'

interface CheckRoomCardProps {
  userId: string
  className?: string
}

export function CheckRoomCard({ userId, className }: CheckRoomCardProps) {
  const t = useTranslations('dashboard.checkRoom')
  const [latestCheck, setLatestCheck] = useState<ProgressCheckWithPhotos | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [check, count] = await Promise.all([
          ProgressCheckService.getLatestCheck(userId),
          ProgressCheckService.getCheckCount(userId)
        ])
        setLatestCheck(check)
        setTotalCount(count)
      } catch (error) {
        console.error('Failed to fetch check data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const daysSinceLastCheck = latestCheck
    ? Math.floor((Date.now() - new Date(latestCheck.taken_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      data-tour="check-room"
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h2>
        </div>
        <Link
          href="/dashboard/new-check"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('newCheck')}
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <TrendingUp className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('noChecks')}
          </p>
          <Link
            href="/dashboard/new-check"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            {t('takeFirstCheck')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Checks */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalCount}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('stats.totalChecks')}
                </p>
              </div>
            </div>

            {/* Days Since Last */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {daysSinceLastCheck === 0 ? t('stats.today') : daysSinceLastCheck}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {daysSinceLastCheck === 0 ? '' : t('stats.daysSince')}
                </p>
              </div>
            </div>
          </div>

          {/* Latest Check Info */}
          {latestCheck && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Link
                href={`/progress-checks/${latestCheck.id}`}
                className="flex items-center gap-3 flex-1 hover:opacity-70 transition-opacity"
              >
                {latestCheck.weight && (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {latestCheck.weight} kg
                    </span>
                  </div>
                )}
                {latestCheck.is_milestone && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                    🎯 {t('stats.milestone')}
                  </span>
                )}
              </Link>
              <Link
                href="/progress-checks"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 shrink-0"
              >
                {t('viewAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
