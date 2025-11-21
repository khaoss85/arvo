'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Calendar,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react'
import type { CheckComparison } from '@/lib/types/progress-check.types'
import { cn } from '@/lib/utils/cn'

interface ProgressCheckCompareProps {
  comparison: CheckComparison
  userId: string
}

export function ProgressCheckCompare({
  comparison,
}: ProgressCheckCompareProps) {
  const t = useTranslations('dashboard.progressCheckCompare')
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>('front')

  const { before, after, weightDiff, measurementDiffs, daysBetween } =
    comparison

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getPhotoByType = (
    check: typeof before | typeof after,
    type: string
  ) => {
    return check.photos?.find((p) => p.photo_type === type)
  }

  const photoTypes = ['front', 'side_left', 'side_right', 'back']
  const availablePhotoTypes = photoTypes.filter(
    (type) => getPhotoByType(before, type) || getPhotoByType(after, type)
  )

  const getPhotoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      front: t('photoTypes.front'),
      side_left: t('photoTypes.sideLeft'),
      side_right: t('photoTypes.sideRight'),
      back: t('photoTypes.back'),
    }
    return labels[type] || type
  }

  const getMeasurementLabel = (type: string) => {
    const labels: Record<string, string> = {
      chest: t('measurements.chest'),
      waist: t('measurements.waist'),
      hips: t('measurements.hips'),
      bicep_left: t('measurements.bicepLeft'),
      bicep_right: t('measurements.bicepRight'),
      thigh_left: t('measurements.thighLeft'),
      thigh_right: t('measurements.thighRight'),
      calf_left: t('measurements.calfLeft'),
      calf_right: t('measurements.calfRight'),
    }
    return labels[type] || type
  }

  const formatDiff = (diff: number | undefined, unit: string = 'kg') => {
    if (diff === undefined || diff === 0) {
      return { text: '-', color: 'text-gray-500', icon: Minus }
    }
    const sign = diff > 0 ? '+' : ''
    const color = diff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    const icon = diff > 0 ? TrendingUp : TrendingDown
    return {
      text: `${sign}${diff.toFixed(1)} ${unit}`,
      color,
      icon,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/progress-checks"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToGallery')}
        </Link>
      </div>

      {/* Title and Timeline */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('title')}
        </h1>
        <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>{formatDate(before.taken_at)}</span>
          <ArrowRight className="h-4 w-4" />
          <span>{formatDate(after.taken_at)}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {t('daysBetween', { days: daysBetween })}
          </span>
        </div>
      </div>

      {/* Photo Type Selector */}
      {availablePhotoTypes.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          {availablePhotoTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedPhotoType(type)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedPhotoType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {getPhotoTypeLabel(type)}
            </button>
          ))}
        </div>
      )}

      {/* Side-by-side Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('before')}
            </span>
          </div>
          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {getPhotoByType(before, selectedPhotoType) ? (
              <img
                src={getPhotoByType(before, selectedPhotoType)!.photo_url}
                alt={`${t('before')} - ${getPhotoTypeLabel(selectedPhotoType)}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                {t('noPhoto')}
              </div>
            )}
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {formatDate(before.taken_at)}
          </div>
        </div>

        {/* After Photo */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-medium text-blue-600 dark:text-blue-400">
              {t('after')}
            </span>
          </div>
          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {getPhotoByType(after, selectedPhotoType) ? (
              <img
                src={getPhotoByType(after, selectedPhotoType)!.photo_url}
                alt={`${t('after')} - ${getPhotoTypeLabel(selectedPhotoType)}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                {t('noPhoto')}
              </div>
            )}
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {formatDate(after.taken_at)}
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weight Comparison */}
        {(before.weight || after.weight) && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('weight')}
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('before')}:
                </span>
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {before.weight ? `${before.weight} kg` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('after')}:
                </span>
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {after.weight ? `${after.weight} kg` : '-'}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('difference')}:
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const diff = formatDiff(weightDiff, 'kg')
                      const Icon = diff.icon
                      return (
                        <>
                          <Icon className={cn('h-4 w-4', diff.color)} />
                          <span className={cn('text-lg font-bold', diff.color)}>
                            {diff.text}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Badges */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('info')}
          </h3>
          <div className="space-y-3">
            {before.is_milestone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('before')}:
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                  🎯 {t('milestone')}
                </span>
              </div>
            )}
            {after.is_milestone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('after')}:
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                  🎯 {t('milestone')}
                </span>
              </div>
            )}
            {before.cycle_number && before.cycle_day && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t('before')}:</span> {t('cycleInfo', { cycle: before.cycle_number, day: before.cycle_day })}
              </div>
            )}
            {after.cycle_number && after.cycle_day && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t('after')}:</span> {t('cycleInfo', { cycle: after.cycle_number, day: after.cycle_day })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Measurements Comparison */}
      {measurementDiffs && measurementDiffs.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('measurements.title')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('measurements.bodyPart')}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('before')}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('after')}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('difference')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {measurementDiffs.map((measurement) => {
                  const diff = formatDiff(measurement.diff, 'cm')
                  const Icon = diff.icon
                  return (
                    <tr
                      key={measurement.type}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {getMeasurementLabel(measurement.type)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {measurement.beforeValue
                          ? `${measurement.beforeValue} cm`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {measurement.afterValue
                          ? `${measurement.afterValue} cm`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Icon className={cn('h-4 w-4', diff.color)} />
                          <span className={cn('font-medium', diff.color)}>
                            {diff.text}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
