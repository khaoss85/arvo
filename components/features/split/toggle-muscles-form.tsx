'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { validateSplitChangeAction, toggleMuscleInSessionAction } from '@/app/actions/split-customization-actions'
import type { SplitChangeValidationInput, SplitChangeValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { ValidationConfirmDialog } from './validation-confirm-dialog'
import { MUSCLE_GROUPS } from '@/lib/services/muscle-groups.service'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'
import { useUIStore } from '@/lib/stores/ui.store'

interface ToggleMusclesFormProps {
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

export function ToggleMusclesForm({ userId, splitPlanData, completedDays = [], onSuccess }: ToggleMusclesFormProps) {
  const t = useTranslations('dashboard.splitCustomization.toggle')
  const getMuscleGroupLabel = useMuscleGroupLabel()
  const { addToast } = useUIStore()

  // Filter out completed days - can't modify workouts that have already been done
  const availableSessions = splitPlanData.sessions.filter(s => !completedDays.includes(s.day))

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string>('')
  const [action, setAction] = useState<'add' | 'remove'>('add')
  const [validating, setValidating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [validation, setValidation] = useState<SplitChangeValidationOutput | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const selectedSession = selectedDay ? splitPlanData.sessions.find(s => s.day === selectedDay) : null

  // Get available muscles (English keys from MUSCLE_GROUPS)
  const availableMuscles = Object.keys(MUSCLE_GROUPS)

  // Check if muscle is in current focus
  const muscleInFocus = selectedSession?.focus.includes(selectedMuscle)

  // Auto-detect action based on muscle presence
  const autoAction: 'add' | 'remove' = muscleInFocus ? 'remove' : 'add'

  const canToggle = selectedDay && selectedMuscle

  const handleValidate = async () => {
    if (!canToggle || !selectedSession) return

    setValidating(true)
    try {
      const currentFocus = selectedSession.focus
      const newFocus = autoAction === 'add'
        ? [...currentFocus, selectedMuscle]
        : currentFocus.filter(m => m !== selectedMuscle)

      // Build validation input
      const validationInput: SplitChangeValidationInput = {
        modificationType: 'toggle_muscle',
        details: {
          cycleDay: selectedDay,
          sessionName: selectedSession.name,
          workoutType: selectedSession.workoutType,
          muscleGroup: selectedMuscle,
          action: autoAction,
          currentFocus,
          newFocus
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
      addToast('Failed to validate toggle', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleApply = async (userOverride?: boolean, userReason?: string) => {
    if (!canToggle || !validation) return

    setApplying(true)
    try {
      const result = await toggleMuscleInSessionAction(
        userId,
        selectedDay!,
        selectedMuscle,
        autoAction === 'add',
        validation,
        userOverride,
        userReason
      )

      if (result.success) {
        addToast(result.data?.message || 'Muscolo modificato con successo', 'success')
        onSuccess()
      } else {
        addToast(result.error || 'Failed to toggle muscle', 'error')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      addToast('Failed to toggle muscle', 'error')
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
            ⚠️ Non ci sono giorni disponibili. Tutti i giorni sono già stati completati.
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
              {t('dayNumber', { day: session.day })} - {session.name}
            </option>
          ))}
        </select>
      </div>

      {/* Current Focus (if day selected) */}
      {selectedSession && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-medium mb-2 text-purple-900 dark:text-purple-100">
            {t('currentFocus')}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSession.focus.length > 0 ? (
              selectedSession.focus.map((muscle, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium"
                >
                  {getMuscleGroupLabel(muscle)}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('noMuscles')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Muscle Selector */}
      {selectedSession && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('selectMuscle')}
          </label>
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">{t('chooseMuscle')}</option>
            {availableMuscles.map((muscleKey) => (
              <option key={muscleKey} value={muscleKey}>
                {getMuscleGroupLabel(muscleKey)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Preview */}
      {selectedMuscle && selectedSession && (
        <div className={`border rounded-lg p-3 ${
          autoAction === 'add'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-sm font-medium ${
            autoAction === 'add'
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {autoAction === 'add' ? (
              <>➕ {t('willAdd', { muscle: getMuscleGroupLabel(selectedMuscle) })}</>
            ) : (
              <>➖ {t('willRemove', { muscle: getMuscleGroupLabel(selectedMuscle) })}</>
            )}
          </p>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={handleValidate}
        disabled={!canToggle || validating}
        className={`w-full text-white ${
          autoAction === 'add'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {validating ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {t('validating')}
          </>
        ) : (
          <>{autoAction === 'add' ? t('addMuscle') : t('removeMuscle')}</>
        )}
      </Button>

      {/* Validation Confirm Dialog */}
      {validation && (
        <ValidationConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          validation={validation}
          modificationType="toggle_muscle"
          onConfirm={handleApply}
          applying={applying}
        />
      )}
    </div>
  )
}
