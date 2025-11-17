'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { validateSplitChangeAction, swapCycleDaysAction } from '@/app/actions/split-customization-actions'
import type { SplitChangeValidationInput, SplitChangeValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { ValidationConfirmDialog } from './validation-confirm-dialog'
import { useUIStore } from '@/lib/stores/ui.store'

interface SwapDaysFormProps {
  userId: string
  splitPlanData: {
    cycleDays: number
    sessions: Array<{
      day: number
      name: string
      workoutType: string
      focus: string[]
      variation: 'A' | 'B'
    }>
  }
  completedDays?: number[]
  onSuccess: () => void
}

export function SwapDaysForm({ userId, splitPlanData, completedDays = [], onSuccess }: SwapDaysFormProps) {
  const t = useTranslations('dashboard.splitCustomization.swap')
  const { addToast } = useUIStore()

  // Filter out completed days - can't modify workouts that have already been done
  const availableSessions = splitPlanData.sessions.filter(s => !completedDays.includes(s.day))

  const [day1, setDay1] = useState<number | null>(null)
  const [day2, setDay2] = useState<number | null>(null)
  const [validating, setValidating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [validation, setValidation] = useState<SplitChangeValidationOutput | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const session1 = day1 ? splitPlanData.sessions.find(s => s.day === day1) : null
  const session2 = day2 ? splitPlanData.sessions.find(s => s.day === day2) : null

  const canSwap = day1 && day2 && day1 !== day2

  const handleValidate = async () => {
    if (!canSwap || !session1 || !session2) return

    setValidating(true)
    try {
      // Build validation input
      const validationInput: SplitChangeValidationInput = {
        modificationType: 'swap_days',
        details: {
          fromDay: day1,
          toDay: day2,
          fromSession: {
            name: session1.name,
            workoutType: session1.workoutType,
            focus: session1.focus,
            variation: session1.variation
          },
          toSession: {
            name: session2.name,
            workoutType: session2.workoutType,
            focus: session2.focus,
            variation: session2.variation
          }
        },
        splitContext: {
          cycleDays: splitPlanData.cycleDays
        },
        userContext: {
          userId,
          approachId: '' // Will be fetched server-side
        }
      }

      const result = await validateSplitChangeAction(validationInput)

      if (result.success && result.data) {
        setValidation(result.data)
        setShowConfirmDialog(true)
      } else {
        addToast(result.error || 'Validation failed', 'error')
      }
    } catch (error) {
      console.error('Validation error:', error)
      addToast('Failed to validate swap', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleApply = async (userOverride?: boolean, userReason?: string) => {
    if (!canSwap || !validation) return

    setApplying(true)
    try {
      const result = await swapCycleDaysAction(
        userId,
        day1!,
        day2!,
        validation,
        userOverride,
        userReason
      )

      if (result.success) {
        addToast(result.data?.message || t('success'), 'success')
        onSuccess()
      } else {
        addToast(result.error || 'Failed to swap days', 'error')
      }
    } catch (error) {
      console.error('Swap error:', error)
      addToast('Failed to swap days', 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('description')}
      </p>

      {/* Warning if not enough days available */}
      {availableSessions.length < 2 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            {t('warnings.notEnoughDays')} {availableSessions.length === 0
              ? t('warnings.allDaysCompleted')
              : t('warnings.needOneMoreDay')}
          </p>
        </div>
      )}

      {/* Day Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {/* Day 1 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('fromDay')}
          </label>
          <select
            value={day1 || ''}
            onChange={(e) => setDay1(Number(e.target.value) || null)}
            disabled={availableSessions.length < 2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{t('selectDay')}</option>
            {availableSessions.map((session) => (
              <option key={session.day} value={session.day}>
                {t('dayNumber', { day: session.day })} - {session.name}
              </option>
            ))}
          </select>
        </div>

        {/* Day 2 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('toDay')}
          </label>
          <select
            value={day2 || ''}
            onChange={(e) => setDay2(Number(e.target.value) || null)}
            disabled={availableSessions.length < 2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{t('selectDay')}</option>
            {availableSessions.map((session) => (
              <option key={session.day} value={session.day}>
                {t('dayNumber', { day: session.day })} - {session.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      {session1 && session2 && day1 !== day2 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium mb-3 text-purple-900 dark:text-purple-100">
            {t('preview')}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 rounded p-3">
              <p className="font-semibold mb-1">{session1.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {session1.workoutType} • {t('variation', { variation: session1.variation })}
              </p>
              <div className="flex flex-wrap gap-1">
                {session1.focus.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded text-xs"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded p-3">
              <p className="font-semibold mb-1">{session2.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {session2.workoutType} • {t('variation', { variation: session2.variation })}
              </p>
              <div className="flex flex-wrap gap-1">
                {session2.focus.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded text-xs"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleValidate}
        disabled={!canSwap || validating}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {validating ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {t('validating')}
          </>
        ) : (
          <>{t('swapDays')}</>
        )}
      </Button>

      {/* Validation Confirm Dialog */}
      {validation && (
        <ValidationConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          validation={validation}
          modificationType="swap_days"
          onConfirm={handleApply}
          applying={applying}
        />
      )}
    </div>
  )
}
