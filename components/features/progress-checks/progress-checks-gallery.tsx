'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Camera, Plus, Calendar, Scale, TrendingUp, Filter, ArrowLeft } from 'lucide-react'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import type { ProgressCheckWithPhotos } from '@/lib/types/progress-check.types'
import { cn } from '@/lib/utils/cn'

interface ProgressChecksGalleryProps {
  userId: string
}

type FilterType = 'all' | 'milestones' | 'current_cycle'

export function ProgressChecksGallery({ userId }: ProgressChecksGalleryProps) {
  const t = useTranslations('dashboard.progressChecks')
  const tNav = useTranslations('navigation')
  const [checks, setChecks] = useState<ProgressCheckWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    loadChecks()
  }, [userId, filter])

  async function loadChecks() {
    setLoading(true)
    try {
      const options = {
        includeMilestoneOnly: filter === 'milestones',
      }
      const data = await ProgressCheckService.getChecks(userId, options)
      setChecks(data)
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
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const getFrontPhoto = (check: ProgressCheckWithPhotos) => {
    return check.photos?.find((p) => p.photo_type === 'front')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse"
            >
              <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {tNav('backToDashboard')}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle', { count: checks.length })}
          </p>
        </div>
        <Link
          href="/dashboard/new-check"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('newCheck')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            filter === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          {t('filters.all')}
        </button>
        <button
          onClick={() => setFilter('milestones')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            filter === 'milestones'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          {t('filters.milestones')}
        </button>
      </div>

      {/* Gallery Grid */}
      {checks.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('empty.description')}
          </p>
          <Link
            href="/dashboard/new-check"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            {t('empty.cta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checks.map((check) => {
            const frontPhoto = getFrontPhoto(check)
            const daysSince = Math.floor(
              (Date.now() - new Date(check.taken_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )

            return (
              <Link
                key={check.id}
                href={`/progress-checks/${check.id}`}
                className="group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
              >
                {/* Photo Preview */}
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {frontPhoto ? (
                    <img
                      src={frontPhoto.photo_url}
                      alt={t('photoAlt')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  {check.is_milestone && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                      🎯 {t('milestone')}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                    <div className="flex-1 backdrop-blur-sm bg-black/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {daysSince === 0
                            ? t('today')
                            : t('daysAgo', { days: daysSince })}
                        </span>
                      </div>
                    </div>
                    {check.weight && (
                      <div className="backdrop-blur-sm bg-black/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-white">
                          <Scale className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {check.weight} kg
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {formatDate(check.taken_at)}
                  </p>
                  {check.cycle_number && check.cycle_day && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t('cycleInfo', {
                        cycle: check.cycle_number,
                        day: check.cycle_day,
                      })}
                    </p>
                  )}
                  {check.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {check.notes}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
