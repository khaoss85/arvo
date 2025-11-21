'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Calendar,
  Scale,
  Ruler,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GitCompare,
} from 'lucide-react'
import type { ProgressCheckWithDetails } from '@/lib/types/progress-check.types'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import { CompareCheckSelector } from './compare-check-selector'
import { cn } from '@/lib/utils/cn'

interface ProgressCheckDetailProps {
  check: ProgressCheckWithDetails
  userId: string
}

export function ProgressCheckDetail({
  check,
  userId,
}: ProgressCheckDetailProps) {
  const t = useTranslations('dashboard.progressCheckDetail')
  const router = useRouter()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCompareSelector, setShowCompareSelector] = useState(false)

  const photos = check.photos || []
  const measurements = check.measurements || []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const success = await ProgressCheckService.deleteCheck(check.id, userId)
      if (success) {
        router.push('/progress-checks')
      } else {
        alert(t('deleteError'))
      }
    } catch (error) {
      console.error('Failed to delete check:', error)
      alert(t('deleteError'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompareSelector(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <GitCompare className="h-4 w-4" />
            {t('compare')}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t('delete')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photos Section */}
        <div className="space-y-4">
          {/* Main Photo */}
          {photos.length > 0 ? (
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={photos[selectedPhotoIndex].photo_url}
                alt={getPhotoTypeLabel(photos[selectedPhotoIndex].photo_type)}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 backdrop-blur-sm bg-black/50 rounded-lg px-3 py-1">
                <span className="text-xs font-medium text-white">
                  {getPhotoTypeLabel(photos[selectedPhotoIndex].photo_type)}
                </span>
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('noPhotos')}
              </p>
            </div>
          )}

          {/* Photo Thumbnails */}
          {photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={cn(
                    'aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                    selectedPhotoIndex === index
                      ? 'border-blue-600 dark:border-blue-400'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                  )}
                >
                  <img
                    src={photo.photo_url}
                    alt={getPhotoTypeLabel(photo.photo_type)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Date and Basic Info */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('title')}
            </h1>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('date')}
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(check.taken_at)}
                  </p>
                </div>
              </div>

              {check.weight && (
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('weight')}
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {check.weight} kg
                    </p>
                  </div>
                </div>
              )}

              {check.cycle_number && check.cycle_day && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('cycleInfo', {
                      cycle: check.cycle_number,
                      day: check.cycle_day,
                    })}
                  </p>
                </div>
              )}

              {check.is_milestone && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                    🎯 {t('milestone')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {check.notes && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('notes')}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {check.notes}
              </p>
            </div>
          )}

          {/* Body Measurements */}
          {measurements.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('measurements.title')}
                </h2>
              </div>
              <div className="space-y-2">
                {measurements.map((measurement) => (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getMeasurementLabel(measurement.measurement_type)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {measurement.value} cm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Check Selector Modal */}
      {showCompareSelector && (
        <CompareCheckSelector
          userId={userId}
          currentCheckId={check.id}
          onClose={() => setShowCompareSelector(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('deleteConfirm.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('deleteConfirm.message')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('deleteConfirm.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? t('deleteConfirm.deleting') : t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
