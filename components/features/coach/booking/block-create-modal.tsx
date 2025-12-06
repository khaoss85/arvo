'use client'

/**
 * Block Create Modal
 * Modal for creating personal coach blocks (unavailability periods)
 */

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format, parseISO } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Trophy,
  Plane,
  BookOpen,
  User,
  FileText,
  Loader2,
} from 'lucide-react'
import { findBlockConflictsAction, createBlockAction } from '@/app/actions/block-actions'
import type { BlockConflict, CoachBlockType, InsertCoachBlock } from '@/lib/types/schemas'

interface BlockCreateModalProps {
  coachId: string
  initialDate?: string
  onClose: () => void
  onCreated: () => void
  locale?: typeof it | typeof enUS
}

const BLOCK_TYPES: { value: CoachBlockType; icon: typeof Trophy }[] = [
  { value: 'competition', icon: Trophy },
  { value: 'travel', icon: Plane },
  { value: 'study', icon: BookOpen },
  { value: 'personal', icon: User },
  { value: 'custom', icon: FileText },
]

export function BlockCreateModal({
  coachId,
  initialDate,
  onClose,
  onCreated,
  locale = it,
}: BlockCreateModalProps) {
  const t = useTranslations('coach.calendar')

  // Form state
  const [blockType, setBlockType] = useState<CoachBlockType>('personal')
  const [customReason, setCustomReason] = useState('')
  const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [notes, setNotes] = useState('')

  // Status state
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [conflicts, setConflicts] = useState<BlockConflict[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check for conflicts when dates/times change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!startDate || !endDate) return

      setIsCheckingConflicts(true)
      const result = await findBlockConflictsAction(
        coachId,
        startDate,
        endDate,
        isFullDay ? null : `${startTime}:00`,
        isFullDay ? null : `${endTime}:00`
      )
      setConflicts(result.conflicts)
      setIsCheckingConflicts(false)
    }

    checkConflicts()
  }, [coachId, startDate, endDate, startTime, endTime, isFullDay])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const block: InsertCoachBlock = {
        coach_id: coachId,
        block_type: blockType,
        custom_reason: blockType === 'custom' ? customReason : null,
        start_date: startDate,
        end_date: endDate,
        start_time: isFullDay ? null : `${startTime}:00`,
        end_time: isFullDay ? null : `${endTime}:00`,
        notes: notes || null,
      }

      const result = await createBlockAction(block)

      if (result.error) {
        setError(result.error)
        return
      }

      onCreated()
    } catch (err) {
      setError('Failed to create block')
    } finally {
      setIsLoading(false)
    }
  }

  const getBlockTypeLabel = (type: CoachBlockType): string => {
    const labels: Record<CoachBlockType, string> = {
      competition: t('blocks.types.competition'),
      travel: t('blocks.types.travel'),
      study: t('blocks.types.study'),
      personal: t('blocks.types.personal'),
      custom: t('blocks.types.custom'),
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('blocks.createBlock')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Block Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('blocks.blockType')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BLOCK_TYPES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBlockType(value)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                    blockType === value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${
                    blockType === value ? 'text-orange-500' : 'text-gray-500'
                  }`} />
                  <span className={`text-xs ${
                    blockType === value ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {getBlockTypeLabel(value)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason (if custom type selected) */}
          {blockType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('blocks.customReason')}
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t('blocks.customReasonPlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t('blocks.startDate')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value)
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t('blocks.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Full Day Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFullDay(!isFullDay)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isFullDay ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isFullDay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('blocks.fullDay')}
            </span>
          </div>

          {/* Time Range (if not full day) */}
          {!isFullDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t('blocks.startTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t('blocks.endTime')}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('blocks.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('blocks.notesPlaceholder')}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Conflicts Warning */}
          {isCheckingConflicts ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500">{t('blocks.checkingConflicts')}</span>
            </div>
          ) : conflicts.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {t('blocks.conflictsFound', { count: conflicts.length })}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    {t('blocks.conflictsDescription')}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {conflicts.slice(0, 3).map((conflict) => (
                      <li key={conflict.booking_id} className="text-xs text-amber-600 dark:text-amber-500">
                        {format(parseISO(conflict.scheduled_date), 'd MMM', { locale })} - {conflict.start_time.slice(0, 5)} ({conflict.client_name})
                      </li>
                    ))}
                    {conflicts.length > 3 && (
                      <li className="text-xs text-amber-600 dark:text-amber-500">
                        +{conflicts.length - 3} {t('blocks.moreConflicts')}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('blocks.createBlock')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
