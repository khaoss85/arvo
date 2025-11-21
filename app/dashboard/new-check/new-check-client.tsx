'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, Camera, Plus, Loader2, X } from 'lucide-react'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import type { PhotoType, MeasurementType } from '@/lib/types/progress-check.types'
import { PHOTO_TYPES, MEASUREMENT_TYPES } from '@/lib/types/progress-check.types'
import { cn } from '@/lib/utils/cn'

interface PhotoUpload {
  type: PhotoType
  file: File | null
  preview: string | null
}

interface MeasurementInput {
  type: MeasurementType
  value: string
}

interface NewCheckClientProps {
  userId: string
}

export default function NewCheckClient({ userId }: NewCheckClientProps) {
  const router = useRouter()
  const t = useTranslations('dashboard.checkRoom')
  const tCommon = useTranslations('common')

  const [photos, setPhotos] = useState<PhotoUpload[]>(
    PHOTO_TYPES.map((type) => ({ type, file: null, preview: null }))
  )
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [measurements, setMeasurements] = useState<MeasurementInput[]>([])
  const [isMilestone, setIsMilestone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoSelect = (type: PhotoType, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotos((prev) =>
        prev.map((p) =>
          p.type === type ? { type, file, preview: e.target?.result as string } : p
        )
      )
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoRemove = (type: PhotoType) => {
    setPhotos((prev) =>
      prev.map((p) => (p.type === type ? { type, file: null, preview: null } : p))
    )
  }

  const handleAddMeasurement = () => {
    if (measurements.length < MEASUREMENT_TYPES.length) {
      setMeasurements((prev) => [...prev, { type: MEASUREMENT_TYPES[0], value: '' }])
    }
  }

  const handleRemoveMeasurement = (index: number) => {
    setMeasurements((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const uploadedPhotos = photos.filter((p) => p.file !== null)
    if (uploadedPhotos.length === 0) {
      setError(t('errors.noPhotos'))
      return
    }

    const weightNum = weight ? parseFloat(weight) : undefined
    if (weight && (isNaN(weightNum!) || weightNum! <= 0 || weightNum! > 500)) {
      setError(t('errors.invalidWeight'))
      return
    }

    const validMeasurements = measurements
      .filter((m) => m.value.trim() !== '')
      .map((m) => ({ type: m.type, value: parseFloat(m.value) }))
      .filter((m) => !isNaN(m.value) && m.value > 0)

    try {
      setIsSubmitting(true)

      const photosToUpload = uploadedPhotos.map((p) => ({ type: p.type, file: p.file! }))

      const check = await ProgressCheckService.createCheck(
        userId,
        {
          weight: weightNum,
          notes: notes.trim() || undefined,
          measurements: validMeasurements.length > 0 ? validMeasurements : undefined,
          isMilestone,
        },
        photosToUpload
      )

      if (!check) throw new Error('Failed to create check')

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Error creating check:', err)
      setError(t('errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('form.title')}
          </h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
        {/* Photos */}
        <section>
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('form.uploadPhotos')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {t('form.uploadInstructions')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <PhotoUploadSlot
                key={photo.type}
                type={photo.type}
                preview={photo.preview}
                onSelect={(file) => handlePhotoSelect(photo.type, file)}
                onRemove={() => handlePhotoRemove(photo.type)}
                label={t(`photoTypes.${photo.type}`)}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </section>

        {/* Weight */}
        <section>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('form.weight')} <span className="text-gray-400 text-xs">({t('form.weightOptional')})</span>
          </label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75.5"
            step="0.1"
            min="0"
            max="500"
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </section>

        {/* Notes */}
        <section>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('form.notes')} <span className="text-gray-400 text-xs">({t('form.weightOptional')})</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('form.notesPlaceholder')}
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          />
        </section>

        {/* Measurements */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('form.measurements')} <span className="text-gray-400 text-xs">({t('form.measurementsOptional')})</span>
            </label>
            {measurements.length < MEASUREMENT_TYPES.length && (
              <button
                type="button"
                onClick={handleAddMeasurement}
                disabled={isSubmitting}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                {t('form.addMeasurement')}
              </button>
            )}
          </div>
          {measurements.map((m, i) => (
            <div key={i} className="flex gap-2 mb-3">
              <select
                value={m.type}
                onChange={(e) =>
                  setMeasurements((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, type: e.target.value as MeasurementType } : item
                    )
                  )
                }
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {MEASUREMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`form.measurementTypes.${type}`)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={m.value}
                onChange={(e) =>
                  setMeasurements((prev) =>
                    prev.map((item, idx) => (idx === i ? { ...item, value: e.target.value } : item))
                  )
                }
                placeholder="85.5"
                step="0.1"
                min="0"
                disabled={isSubmitting}
                className="w-28 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => handleRemoveMeasurement(i)}
                disabled={isSubmitting}
                className="p-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </section>

        {/* Milestone */}
        <section className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <input
            type="checkbox"
            id="milestone"
            checked={isMilestone}
            onChange={(e) => setIsMilestone(e.target.checked)}
            disabled={isSubmitting}
            className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-700 text-blue-600"
          />
          <label htmlFor="milestone" className="flex-1">
            <span className="block font-medium text-gray-900 dark:text-gray-100 text-sm">
              {t('form.markAsMilestone')}
            </span>
            <span className="block text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {t('form.milestoneDescription')}
            </span>
          </label>
        </section>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sm:relative sm:bg-transparent sm:border-0 sm:p-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium text-white flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('form.creating')}
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                {t('form.create')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Photo Upload Component
interface PhotoUploadSlotProps {
  type: PhotoType
  preview: string | null
  onSelect: (file: File) => void
  onRemove: () => void
  label: string
  disabled?: boolean
}

function PhotoUploadSlot({ type, preview, onSelect, onRemove, label, disabled }: PhotoUploadSlotProps) {
  const t = useTranslations('dashboard.checkRoom.form')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (preview) {
    return (
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group">
        <img src={preview} alt={label} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-2 right-2 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-xs font-medium text-white">{label}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={disabled}
      className="relative aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
    >
      <Camera className="h-8 w-8 text-gray-400 dark:text-gray-600" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('uploadPhoto')}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
        }}
        disabled={disabled}
        className="hidden"
      />
    </button>
  )
}
