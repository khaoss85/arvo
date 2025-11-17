'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { validateSplitChangeAction, changeSessionVariationAction } from '@/app/actions/split-customization-actions'
import type { SplitChangeValidationInput, SplitChangeValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { ValidationConfirmDialog } from './validation-confirm-dialog'
import { useUIStore } from '@/lib/stores/ui.store'

interface ChangeVariationFormProps {
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

export function ChangeVariationForm({ userId, splitPlanData, completedDays = [], onSuccess }: ChangeVariationFormProps) {
  const t = useTranslations('dashboard.splitCustomization.variation')
  const { addToast } = useUIStore()

  // Filter out completed days - can't modify workouts that have already been done
  const availableSessions = splitPlanData.sessions.filter(s => !completedDays.includes(s.day))

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [validating, setValidating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [validation, setValidation] = useState<SplitChangeValidationOutput | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const selectedSession = selectedDay ? splitPlanData.sessions.find(s => s.day === selectedDay) : null
  const newVariation: 'A' | 'B' = selectedSession?.variation === 'A' ? 'B' : 'A'

  const canChange = selectedDay && selectedSession

  const handleValidate = async () => {
    if (!canChange || !selectedSession) return

    setValidating(true)
    try {
      // Build validation input
      const validationInput: SplitChangeValidationInput = {
        modificationType: 'change_variation',
        details: {
          cycleDay: selectedDay,
          sessionName: selectedSession.name,
          workoutType: selectedSession.workoutType,
          currentVariation: selectedSession.variation,
          newVariation
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
      addToast('Failed to validate variation change', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleApply = async (userOverride?: boolean, userReason?: string) => {
    if (!canChange || !validation) return

    setApplying(true)
    try {
      const result = await changeSessionVariationAction(
        userId,
        selectedDay!,
        newVariation,
        validation,
        userOverride,
        userReason
      )

      if (result.success) {
        addToast(result.data?.message || t('success'), 'success')
        onSuccess()
      } else {
        addToast(result.error || 'Failed to change variation', 'error')
      }
    } catch (error) {
      console.error('Change variation error:', error)
      addToast('Failed to change variation', 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('description')}
      </p>

      {/* Warning if no days available */}
      {availableSessions.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            {t('warnings.noDaysAvailable')}
          </p>
        </div>
      )}

      {/* Day Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('selectDay')}
        </label>
        <select
          value={selectedDay || ''}
          onChange={(e) => setSelectedDay(Number(e.target.value) || null)}
          disabled={availableSessions.length === 0}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{t('chooseDay')}</option>
          {availableSessions.map((session) => (
            <option key={session.day} value={session.day}>
              {t('dayNumber', { day: session.day })} - {session.name} (Variation {session.variation})
            </option>
          ))}
        </select>
      </div>

      {/* Session Info & Variation Change Preview */}
      {selectedSession && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium mb-3 text-purple-900 dark:text-purple-100">
            {t('changePreview')}
          </p>

          {/* Current Session */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold mb-1">{selectedSession.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {selectedSession.workoutType}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                {t('currentVariation')}: {selectedSession.variation}
              </span>
              <span className="text-gray-400">→</span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                {t('newVariation')}: {newVariation}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedSession.focus.map((muscle, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded text-xs"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('variationInfo')}
          </p>
        </div>
      )}

      {/* Change Button */}
      <Button
        onClick={handleValidate}
        disabled={!canChange || validating}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {validating ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {t('validating')}
          </>
        ) : (
          <>{t('changeVariation')}</>
        )}
      </Button>

      {/* Validation Confirm Dialog */}
      {validation && (
        <ValidationConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          validation={validation}
          modificationType="change_variation"
          onConfirm={handleApply}
          applying={applying}
        />
      )}
    </div>
  )
}
