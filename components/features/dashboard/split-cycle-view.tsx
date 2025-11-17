'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { getNextWorkoutPreviewAction, advanceSplitCycleAction } from '@/app/actions/split-actions'
import {
  getWorkoutTypeColor,
  getWorkoutTypeIcon,
  type WorkoutType
} from '@/lib/services/muscle-groups.service'
import { CustomizeSplitDialog } from '@/components/features/split/customize-split-dialog'
import { undoLastModificationAction, getRecentModificationsAction } from '@/app/actions/split-customization-actions'
import { useUIStore } from '@/lib/stores/ui.store'

interface SplitCycleViewProps {
  userId: string
}

interface NextWorkoutData {
  sessionName: string
  workoutType: WorkoutType
  variation: 'A' | 'B' | null
  focus: string[]
  targetVolume: Record<string, number>
  principles: string[]
  cycleDay: number
  totalCycleDays: number
  splitType: string
  sessions?: Array<{
    day: number
    name: string
    workoutType: string
    focus: string[]
    variation: 'A' | 'B'
  }>
}

export function SplitCycleView({ userId }: SplitCycleViewProps) {
  const t = useTranslations('dashboard.splitCycle')
  const { addToast } = useUIStore()
  const [data, setData] = useState<NextWorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false)
  const [hasModifications, setHasModifications] = useState(false)
  const [undoing, setUndoing] = useState(false)

  const loadNextWorkout = async () => {
    setLoading(true)
    try {
      const result = await getNextWorkoutPreviewAction(userId)
      if (result.success && result.data) {
        setData(result.data as NextWorkoutData)
      } else {
        setData(null)
      }
    } catch (error) {
      console.error('Failed to load next workout:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const checkForModifications = async () => {
    try {
      const result = await getRecentModificationsAction(userId, 1)
      if (result.success && result.data && result.data.length > 0) {
        setHasModifications(true)
      } else {
        setHasModifications(false)
      }
    } catch (error) {
      console.error('Failed to check modifications:', error)
      setHasModifications(false)
    }
  }

  useEffect(() => {
    loadNextWorkout()
    checkForModifications()
  }, [userId])

  const handleAdvanceCycle = async () => {
    setAdvancing(true)
    try {
      const result = await advanceSplitCycleAction(userId)
      if (result.success) {
        // Reload next workout data
        await loadNextWorkout()
      }
    } catch (error) {
      console.error('Failed to advance cycle:', error)
    } finally {
      setAdvancing(false)
    }
  }

  const handleUndo = async () => {
    if (!window.confirm(t('confirmUndo') || 'Are you sure you want to undo the last modification?')) {
      return
    }

    setUndoing(true)
    try {
      const result = await undoLastModificationAction(userId)
      if (result.success) {
        addToast(result.data?.message || 'Modifica annullata con successo', 'success')
        // Reload data
        await loadNextWorkout()
        await checkForModifications()
      } else {
        addToast(result.error || 'Failed to undo modification', 'error')
      }
    } catch (error) {
      console.error('Failed to undo:', error)
      addToast('Failed to undo modification', 'error')
    } finally {
      setUndoing(false)
    }
  }

  const handleCustomizationComplete = async () => {
    // Reload data after customization
    await loadNextWorkout()
    await checkForModifications()
  }

  // Don't show anything if no split plan
  if (!loading && !data) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>{t('loadingSplitPlan')}</span>
        </div>
      </div>
    )
  }

  // Calculate progress percentage
  const progressPercentage = data ? (data.cycleDay / data.totalCycleDays) * 100 : 0

  // Get workout type styling
  const workoutTypeColor = data ? getWorkoutTypeColor(data.workoutType) : 'gray'
  const workoutTypeIcon = data ? getWorkoutTypeIcon(data.workoutType) : '💪'

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t('activeSplitPlan')}</h2>
          <p className="text-purple-100 dark:text-purple-200 text-sm">
            {data?.splitType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>
        <div className="flex gap-2">
          {hasModifications && (
            <Button
              onClick={handleUndo}
              disabled={undoing}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
            >
              {undoing ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {t('undoing')}
                </>
              ) : (
                <>↩️ {t('undo')}</>
              )}
            </Button>
          )}
          <Button
            onClick={handleAdvanceCycle}
            disabled={advancing}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
          >
            {advancing ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {t('advancing')}
              </>
            ) : (
              <>{t('skipToNextDay')}</>
            )}
          </Button>
        </div>
      </div>

      {/* Cycle Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-100 dark:text-purple-200">
            {t('cycleProgress')}
          </span>
          <span className="text-sm font-bold">
            {t('dayOf', { current: data?.cycleDay || 0, total: data?.totalCycleDays || 0 })}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Customize Button - Prominent Position */}
      <div className="mb-6">
        <Button
          onClick={() => setCustomizeDialogOpen(true)}
          variant="outline"
          className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60 shadow-sm transition-all"
        >
          <span className="mr-2">⚙️</span>
          {t('customize')}
        </Button>
      </div>

      {/* Next Workout Preview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('nextWorkout')}</h3>
          {data?.variation && (
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full">
              {t('variation', { variation: data.variation })}
            </span>
          )}
        </div>

        {/* Session Name and Type */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{workoutTypeIcon}</span>
            <span className="text-xl font-bold">{data?.sessionName}</span>
          </div>
          <span className="text-sm text-purple-100 dark:text-purple-200">
            {data?.workoutType.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Focus Areas */}
        {data && data.focus.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-purple-100 dark:text-purple-200 mb-2">
              {t('focusAreas')}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.focus.map((muscle, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white/20 rounded text-sm font-medium"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Target Volume Preview */}
        {data && Object.keys(data.targetVolume).length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-purple-100 dark:text-purple-200 mb-2">
              {t('targetVolume')}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(data.targetVolume).slice(0, 4).map(([muscle, sets]) => (
                <div key={muscle} className="flex items-center justify-between bg-white/10 rounded px-2 py-1">
                  <span className="truncate">{muscle}</span>
                  <span className="font-bold ml-2">{sets} sets</span>
                </div>
              ))}
            </div>
            {Object.keys(data.targetVolume).length > 4 && (
              <p className="text-xs text-purple-200 dark:text-purple-300 mt-1">
                {t('moreMuscleGroups', { count: Object.keys(data.targetVolume).length - 4 })}
              </p>
            )}
          </div>
        )}

        {/* Session Principles */}
        {data && data.principles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-purple-100 dark:text-purple-200 mb-2">
              {t('keyPrinciples')}
            </p>
            <ul className="space-y-1">
              {data.principles.slice(0, 3).map((principle, idx) => (
                <li key={idx} className="text-sm text-purple-50 dark:text-purple-100 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="mt-4 text-sm text-purple-100 dark:text-purple-200">
        {t('helperText')}
      </p>

      {/* Customize Split Dialog */}
      {data && data.sessions && (
        <CustomizeSplitDialog
          open={customizeDialogOpen}
          onOpenChange={setCustomizeDialogOpen}
          userId={userId}
          currentSplitType={data.splitType as any}
          splitPlanData={{
            cycleDays: data.totalCycleDays,
            sessions: data.sessions
          }}
          onModificationComplete={handleCustomizationComplete}
        />
      )}
    </div>
  )
}
