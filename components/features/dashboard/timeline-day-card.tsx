'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { TimelineDayData, VolumeComparison } from '@/lib/services/split-timeline.types'
import { getWorkoutTypeIcon } from '@/lib/services/muscle-groups.service'
import { useMuscleGroupLabel } from '@/lib/hooks/use-muscle-group-label'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Sparkles, Play, Eye, Moon, ArrowRight, Loader2 } from 'lucide-react'
import { generateDraftWorkoutAction } from '@/app/actions/ai-actions'
import { ProgressFeedback } from '@/components/ui/progress-feedback'
import { InsightChangesModal, type InsightInfluencedChange } from '@/components/features/workout/insight-changes-modal'
import { useUIStore } from '@/lib/stores/ui.store'
import { ShareButton } from '@/components/features/sharing/share-button'

interface TimelineDayCardProps {
  dayData: TimelineDayData
  isCurrentDay: boolean
  userId: string
  onGenerateWorkout?: () => void
  onRefreshTimeline?: () => void
  onSkipRestDay?: () => Promise<void>
}

// Status styling configuration
const STATUS_STYLES = {
  completed: {
    border: 'border-green-300 dark:border-green-700',
    bg: 'bg-green-50 dark:bg-green-950/50',
    badgeBg: 'bg-green-500',
    badgeText: 'text-white',
    icon: '✓'
  },
  current: {
    border: 'border-purple-400 dark:border-purple-600',
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
    badgeBg: 'bg-purple-600 animate-pulse',
    badgeText: 'text-white',
    icon: '▶'
  },
  in_progress: {
    border: 'border-orange-400 dark:border-orange-600',
    bg: 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/50 dark:to-yellow-950/50',
    badgeBg: 'bg-orange-600 animate-pulse',
    badgeText: 'text-white',
    icon: '⏵'
  },
  upcoming: {
    border: 'border-gray-200 dark:border-gray-700',
    bg: 'bg-white dark:bg-gray-900/50',
    badgeBg: 'bg-gray-400',
    badgeText: 'text-white',
    icon: '○'
  },
  pre_generated: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    icon: '✨'
  },
  rest: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    icon: '☾'
  }
} as const

// Variance indicator component
function VarianceIndicator({ variance }: { variance: VolumeComparison }) {
  const { diff, percentage } = variance

  if (diff === 0) {
    return (
      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
        ±0 ✓
      </span>
    )
  }

  const isPositive = diff > 0
  const color = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
  const icon = isPositive ? '↑' : '↓'
  const sign = isPositive ? '+' : ''

  return (
    <span className={cn('text-xs font-semibold', color)}>
      {sign}{diff} {icon}
      {Math.abs(percentage) >= 25 && (
        <span className="ml-1">({sign}{percentage}%)</span>
      )}
    </span>
  )
}

export function TimelineDayCard({ dayData, isCurrentDay, userId, onGenerateWorkout, onRefreshTimeline, onSkipRestDay }: TimelineDayCardProps) {
  const t = useTranslations('dashboard.dayCard')
  const getMuscleGroupLabel = useMuscleGroupLabel()
  const { day, status, session, completedWorkout, preGeneratedWorkout } = dayData
  const styles = STATUS_STYLES[status]
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [insightChanges, setInsightChanges] = useState<InsightInfluencedChange[]>([])
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [targetDayForGeneration, setTargetDayForGeneration] = useState<number | null>(null)
  const [skipping, setSkipping] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [activeGenerationProgress, setActiveGenerationProgress] = useState<number>(0)
  const { addToast } = useUIStore()

  // Check on mount if there's an active generation for this day
  useEffect(() => {
    const checkActiveGeneration = async () => {
      try {
        const { GenerationQueueService } = await import('@/lib/services/generation-queue.service')

        const activeGeneration = await GenerationQueueService.getActiveGeneration(userId)

        if (!activeGeneration) return

        // Check if the active generation matches this card's day
        // 1. If target_cycle_day is set, it must match this card's day
        // 2. If target_cycle_day is null, it defaults to the user's current day (so match if isCurrentDay is true)
        const isMatchingDay = activeGeneration.target_cycle_day
          ? activeGeneration.target_cycle_day == day
          : isCurrentDay

        // Only resume if it's for THIS specific day and status is pending/in_progress
        if (isMatchingDay &&
          (activeGeneration.status === 'pending' || activeGeneration.status === 'in_progress')) {

          console.log('[TimelineDayCard] Found active generation to resume for day', day, 'at', activeGeneration.progress_percent + '%')

          // Store the request ID and initial progress to pass to ProgressFeedback
          setActiveRequestId(activeGeneration.request_id)
          setActiveGenerationProgress(activeGeneration.progress_percent || 0)

          // Show the progress bar - ProgressFeedback will handle the rest
          setShowProgress(true)
          setIsGenerating(true)
          setTargetDayForGeneration(day)
        }
      } catch (error) {
        console.error('[TimelineDayCard] Failed to check for active generation:', error)
      }
    }

    // Only check for current day or upcoming days (not completed days)
    if (isCurrentDay || status === 'upcoming') {
      checkActiveGeneration()
    }
  }, [userId, day, isCurrentDay, status])

  // Handle generation for both current day and pre-generation
  const handleGenerate = (targetDay?: number) => {
    setIsGenerating(true)
    setShowProgress(true)
    setTargetDayForGeneration(targetDay || null)
  }

  // For backwards compatibility with onGenerateWorkout prop
  const handleCurrentDayGenerate = () => {
    if (onGenerateWorkout) {
      // Use old flow if prop is provided (wrapper component)
      onGenerateWorkout()
    } else {
      // Use new unified flow with progress modal
      handleGenerate()
    }
  }

  const handlePreGenerate = () => {
    handleGenerate(day)
  }

  const handleGenerationComplete = async (workout: any, changes?: InsightInfluencedChange[]) => {
    // Always reset loading state first
    setIsGenerating(false)
    setShowProgress(false)

    // Small delay to ensure DB consistency after Inngest worker completion
    // This prevents race conditions where the queue is marked complete
    // but the workout hasn't fully propagated to the timeline query
    await new Promise(resolve => setTimeout(resolve, 300))

    // Always refresh timeline to show the newly generated workout
    onRefreshTimeline?.()

    // Show toast and modal if there are insight-influenced changes
    if (changes && changes.length > 0) {
      setInsightChanges(changes)
      addToast(
        '🔔 Ho adattato il workout in base a ciò che ho imparato su di te',
        'info',
        {
          actionLabel: 'Vedi dettagli',
          onAction: () => setShowChangesModal(true)
        }
      )
    }
  }

  const handleGenerationError = (error: string) => {
    setIsGenerating(false)
    setShowProgress(false)
    alert(`Failed to generate workout: ${error}`)
  }

  const handleGenerationCancel = () => {
    setIsGenerating(false)
    setShowProgress(false)
  }

  const handleViewWorkout = () => {
    if (!preGeneratedWorkout) return
    router.push(`/workout/${preGeneratedWorkout.id}/review`)
  }

  const handleStartWorkout = () => {
    if (preGeneratedWorkout) {
      router.push(`/workout/${preGeneratedWorkout.id}`)
    }
  }

  const handleSkipRestDay = async () => {
    if (!onSkipRestDay) {
      console.warn('[TimelineDayCard] handleSkipRestDay - onSkipRestDay callback is missing')
      return
    }
    console.log('[TimelineDayCard] handleSkipRestDay - Starting...')
    setSkipping(true)
    try {
      await onSkipRestDay()
      console.log('[TimelineDayCard] handleSkipRestDay - Completed successfully')
    } catch (error) {
      console.error('[TimelineDayCard] handleSkipRestDay - Error:', error)
    } finally {
      setSkipping(false)
    }
  }

  // Rest day layout
  if (!session || session.name === 'Rest') {
    return (
      <div
        className={cn(
          'flex-shrink-0 w-[65vw] sm:w-[280px] rounded-lg border-2 p-4 transition-all',
          styles.border,
          styles.bg
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('day', { day })}
          </span>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-bold',
            styles.badgeBg,
            styles.badgeText
          )}>
            {t('rest')} {styles.icon}
          </span>
        </div>

        {/* Rest day content */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 mb-3">
            <Moon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            {t('restDay')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('recoveryEssential')}
          </p>

          {/* Skip Rest Day Button (only when current day) */}
          {isCurrentDay && onSkipRestDay && (
            <Button
              onClick={handleSkipRestDay}
              disabled={skipping}
              variant="outline"
              className="mt-2 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50 font-semibold"
            >
              {skipping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('skippingRestDay')}
                </>
              ) : (
                <>
                  {t('skipRestDay')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const workoutTypeIcon = getWorkoutTypeIcon(session.workoutType)

  return (
    <div
      data-tour={isCurrentDay ? "timeline-current" : undefined}
      className={cn(
        'flex-shrink-0 rounded-lg border-2 p-4 transition-all duration-300',
        // Mobile: 65vw width, Desktop (sm+): Fixed 280px/320px
        'w-[65vw] sm:w-[280px]',
        isCurrentDay && 'sm:w-[320px] sm:shadow-2xl sm:scale-105',
        // Mobile current day styling (less aggressive than desktop)
        isCurrentDay && 'border-purple-400 dark:border-purple-600 shadow-lg',
        styles.border,
        styles.bg
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          'text-sm font-medium',
          isCurrentDay ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-500 dark:text-gray-400'
        )}>
          {t('day', { day })}
        </span>
        <div className="flex items-center gap-2">
          {session.variation && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
              {t('variation', { variation: session.variation })}
            </span>
          )}
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-bold',
            styles.badgeBg,
            styles.badgeText,
            isCurrentDay && 'px-3 py-1.5 text-sm'
          )}>
            {status === 'current'
              ? t('today')
              : status === 'in_progress'
                ? t('inProgress')
                : status === 'completed'
                  ? t('done')
                  : status === 'pre_generated'
                    ? (preGeneratedWorkout?.status === 'ready' ? t('ready') : t('draft'))
                    : t('upcoming')
            } {styles.icon}
          </span>
        </div>
      </div>

      {/* Session name and type */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{workoutTypeIcon}</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {session.name}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {session.workoutType.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Target Volume */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          {t('targetVolume')}
        </p>
        <div className="space-y-1.5">
          {Object.entries(session.targetVolume).slice(0, 4).map(([muscle, sets]) => (
            <div
              key={muscle}
              className="flex items-center justify-between text-sm bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {getMuscleGroupLabel(muscle)}
              </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {sets} sets
              </span>
            </div>
          ))}
          {Object.keys(session.targetVolume).length > 4 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-2">
              {t('moreMuscles', { count: Object.keys(session.targetVolume).length - 4 })}
            </p>
          )}
        </div>
      </div>

      {/* ============================================
          CTA LOGIC - Based on isCurrentDay first
          ============================================ */}

      {/* CURRENT DAY ACTIONS */}
      {isCurrentDay && status !== 'completed' && (
        <>
          {/* In Progress - Continue Workout */}
          {status === 'in_progress' && preGeneratedWorkout && (
            <div className="mb-3 pt-3 border-t border-orange-200 dark:border-orange-800">
              <Button
                onClick={handleStartWorkout}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Play className="w-4 h-4 mr-2" />
                {t('continueWorkout')}
              </Button>
            </div>
          )}

          {/* Has Workout (not in progress) - Review + Start */}
          {preGeneratedWorkout && status !== 'in_progress' && (
            <div className="mb-3 pt-3 border-t border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  {t('exercisesReady', { count: preGeneratedWorkout.exercises.length })}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-bold',
                  preGeneratedWorkout.status === 'ready'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                )}>
                  {preGeneratedWorkout.status === 'ready' ? t('reviewed') : t('readyStatus')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleViewWorkout}
                  variant="outline"
                  className="flex-1 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('review')}
                </Button>
                <Button
                  onClick={handleStartWorkout}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-md"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t('startWorkout')}
                </Button>
              </div>
            </div>
          )}

          {/* No Workout Yet - Generate Today */}
          {!preGeneratedWorkout && status !== 'in_progress' && (
            <div className="mb-3 pt-3 border-t border-purple-200 dark:border-purple-800">
              <Button
                onClick={handleCurrentDayGenerate}
                disabled={isGenerating || showProgress}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? t('generating') : t('generateTodaysWorkout')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* OTHER DAYS ACTIONS (not current day) */}
      {!isCurrentDay && status !== 'completed' && status !== 'rest' && (
        <>
          {/* Has Pre-Generated Workout - Review Only */}
          {preGeneratedWorkout && (
            <div className="mb-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  {t('exercisesPreGenerated', { count: preGeneratedWorkout.exercises.length })}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-bold',
                  preGeneratedWorkout.status === 'ready'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                )}>
                  {preGeneratedWorkout.status === 'ready' ? t('reviewed') : t('draftStatus')}
                </span>
              </div>
              <Button
                onClick={handleViewWorkout}
                variant="outline"
                className="w-full border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('review')}
              </Button>
            </div>
          )}

          {/* No Workout - Pre-Generate */}
          {!preGeneratedWorkout && session && session.name !== 'Rest' && (
            <div className="mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handlePreGenerate}
                disabled={isGenerating || showProgress}
                variant="outline"
                className="w-full border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? t('generating') : t('preGenerateWorkout')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Actual Performance (only for completed workouts) */}
      {completedWorkout && completedWorkout.variance && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {t('actualPerformance')}
          </p>
          <div className="space-y-1.5">
            {Object.entries(completedWorkout.variance).slice(0, 4).map(([muscle, variance]) => (
              <div
                key={muscle}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {getMuscleGroupLabel(muscle)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {t('actualSets', { count: variance.actual })}
                  </span>
                  <VarianceIndicator variance={variance} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Button (only for completed workouts) */}
      {status === 'completed' && completedWorkout && (
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <ShareButton
            shareType="workout"
            entityId={completedWorkout.id}
            variant="ghost"
            size="sm"
          />
        </div>
      )}

      {/* Workout Generation Progress */}
      {showProgress && (
        <div className={cn(
          "mb-3 pt-3 border-t",
          isCurrentDay
            ? "border-purple-200 dark:border-purple-800"
            : "border-gray-200 dark:border-gray-700"
        )}>
          <ProgressFeedback
            variant="inline"
            endpoint="/api/workouts/generate/stream"
            requestBody={{ targetCycleDay: targetDayForGeneration || day }}
            cancellable={true}
            existingRequestId={activeRequestId || undefined}
            initialProgress={activeGenerationProgress}
            onComplete={(data) => handleGenerationComplete(data.workout, data.insightInfluencedChanges)}
            onError={handleGenerationError}
            onCancel={handleGenerationCancel}
          />
        </div>
      )}

      {/* Insight Changes Modal */}
      <InsightChangesModal
        isOpen={showChangesModal}
        onClose={() => setShowChangesModal(false)}
        changes={insightChanges}
      />
    </div>
  )
}
