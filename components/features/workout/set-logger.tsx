'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from './confirm-dialog'
import { rirToIntensityPercent } from '@/lib/utils/workout-helpers'

interface SetLoggerProps {
  exercise: ExerciseExecution
  setNumber: number
  suggestion?: {
    weight: number
    reps: number
    rirTarget: number
  }
}

export function SetLogger({ exercise, setNumber, suggestion }: SetLoggerProps) {
  const t = useTranslations('workout.execution')
  const tCommon = useTranslations('common')
  const { logSet, skipWarmupSets } = useWorkoutExecutionStore()

  // Mental readiness emoji mapping with translations
  const getMentalReadinessEmoji = (value: number): { emoji: string; label: string } => {
    const emojis: Record<number, string> = {
      1: '😫',
      2: '😕',
      3: '😐',
      4: '🙂',
      5: '🔥',
    }
    const labels: Record<number, string> = {
      1: t('mentalReadiness.drained'),
      2: t('mentalReadiness.struggling'),
      3: t('mentalReadiness.neutral'),
      4: t('mentalReadiness.engaged'),
      5: t('mentalReadiness.lockedIn'),
    }
    return { emoji: emojis[value], label: labels[value] }
  }

  // Determine if current set is warmup
  const warmupSetsCount = exercise.warmupSets?.length || 0
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
  const isWarmup = setNumber <= remainingWarmupSets
  const currentWarmup = isWarmup ? exercise.warmupSets?.[setNumber - 1 + warmupSetsSkipped] : undefined
  const workingSetNumber = isWarmup ? 0 : setNumber - remainingWarmupSets

  // Get guidance for current working set
  const currentGuidance = !isWarmup && exercise.setGuidance?.find(g => g.setNumber === workingSetNumber)

  // Get effective target weight from actual performance or target
  const getEffectiveTargetWeight = useCallback(() => {
    // Filter to get only working sets (exclude warmups)
    const workingSets = exercise.completedSets.filter((_, idx) => {
      return idx >= remainingWarmupSets
    })

    // If we have working sets logged, use the max weight from those
    if (workingSets.length > 0) {
      return Math.max(...workingSets.map(s => s.weight))
    }

    // Otherwise use the target weight
    return exercise.targetWeight || 0
  }, [exercise.completedSets, exercise.targetWeight, remainingWarmupSets])

  // Initialize state based on warmup vs working set
  const getInitialWeight = useCallback(() => {
    if (currentWarmup) {
      // Use pre-calculated weight if available
      if (currentWarmup.weight !== undefined) {
        return currentWarmup.weight
      }
      // Calculate from percentage using effective target (adapts to actual performance)
      if (currentWarmup.weightPercentage !== undefined) {
        const effectiveTarget = getEffectiveTargetWeight()
        // Round to nearest 0.5kg (standard barbell increment)
        return Math.round((effectiveTarget * currentWarmup.weightPercentage / 100) * 2) / 2
      }
    }
    if (suggestion) return suggestion.weight
    return exercise.targetWeight || 0
  }, [currentWarmup, suggestion, exercise.targetWeight, getEffectiveTargetWeight])

  const getInitialReps = useCallback(() => {
    if (currentWarmup) return currentWarmup.reps ?? 8
    if (suggestion) return suggestion.reps
    return exercise.targetReps?.[0] ?? 8
  }, [currentWarmup, suggestion, exercise.targetReps])

  const getInitialRir = useCallback(() => {
    if (currentWarmup) return currentWarmup.rir ?? 3
    if (suggestion) return suggestion.rirTarget
    return 1
  }, [currentWarmup, suggestion])

  const [weight, setWeight] = useState(getInitialWeight())
  const [reps, setReps] = useState(getInitialReps())
  const [rir, setRir] = useState(getInitialRir())
  const [mentalReadiness, setMentalReadiness] = useState<number | undefined>(undefined)
  const [showMentalSelector, setShowMentalSelector] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [showSkipWarmupDialog, setShowSkipWarmupDialog] = useState(false)

  // Update values when warmup/suggestion changes or exercise data loads
  useEffect(() => {
    setWeight(getInitialWeight())
    setReps(getInitialReps())
    setRir(getInitialRir())
  }, [getInitialWeight, getInitialReps, getInitialRir])

  const handleLogSet = async () => {
    setIsLogging(true)
    try {
      await logSet({ weight, reps, rir, mentalReadiness })
    } catch (error) {
      console.error('Failed to log set:', error)
      alert(tCommon('errors.failedToLogSet'))
    } finally {
      setIsLogging(false)
    }
  }

  const handleSkipWarmup = () => {
    if (!isWarmup) return
    setShowSkipWarmupDialog(true)
  }

  const confirmSkipWarmup = async () => {
    setShowSkipWarmupDialog(false)
    setIsSkipping(true)
    try {
      await skipWarmupSets('user_manual')
    } catch (error) {
      console.error('Failed to skip warmup:', error)
      alert(tCommon('errors.failedToSkipWarmup'))
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Set Type Badge */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isWarmup
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}
          >
            {isWarmup
              ? `${t('setLogger.warmup', { current: setNumber, total: remainingWarmupSets })} • ${currentWarmup?.weightPercentage || 60}%`
              : `${t('setLogger.workingSet', { current: workingSetNumber, total: exercise.targetSets })} • ${rirToIntensityPercent(rir)}%`
            }
          </span>
        </div>

        {/* Manual Skip Link - Only show on first warmup set */}
        {isWarmup && setNumber === 1 && warmupSetsCount > 0 && (
          <button
            onClick={handleSkipWarmup}
            disabled={isSkipping || isLogging}
            className="text-xs text-gray-400 hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSkipping ? t('setLogger.skipping') : t('setLogger.skipWarmup')}
          </button>
        )}

        {/* Technical Focus for Warmup Set */}
        {currentWarmup?.technicalFocus && (
          <div className="mt-2 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-200">
              🎯 {currentWarmup.technicalFocus}
            </p>
          </div>
        )}

        {/* Technical & Mental Focus for Working Sets */}
        {currentGuidance && (currentGuidance.technicalFocus || currentGuidance.mentalFocus) && (
          <div className="mt-2 space-y-2">
            {currentGuidance.technicalFocus && (
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2">
                <p className="text-base text-blue-200 font-medium">
                  🎯 {currentGuidance.technicalFocus}
                </p>
              </div>
            )}
            {currentGuidance.mentalFocus && (
              <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg px-3 py-2">
                <p className="text-base text-purple-200 font-medium">
                  🧠 {currentGuidance.mentalFocus}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weight Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('setLogger.weightLabel')}</label>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setWeight(Math.max(0, weight - 2.5))}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            -2.5
          </Button>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
            step="0.5"
          />
          <Button
            onClick={() => setWeight(weight + 2.5)}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            +2.5
          </Button>
        </div>
      </div>

      {/* Reps Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('setLogger.repsLabel')}</label>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setReps(Math.max(1, reps - 1))}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            -1
          </Button>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
          />
          <Button
            onClick={() => setReps(reps + 1)}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            +1
          </Button>
        </div>
      </div>

      {/* RIR Selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('setLogger.rirLabel')}</label>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRir(value)}
              className={`h-12 rounded font-medium transition-colors ${
                rir === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Tempo Display - Only show for working sets */}
      {!isWarmup && exercise.tempo && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/40 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-blue-300">{t('setLogger.tempoRequirement')}</label>
            <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">{t('setLogger.fromYourApproach')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-white font-mono tracking-wider">{exercise.tempo}</div>
              <div className="text-xs text-gray-400 mt-1 grid grid-cols-4 gap-1 max-w-[240px] mx-auto mt-2">
                <div className="flex flex-col">
                  <span className="font-semibold text-blue-300">{exercise.tempo.split('-')[0]}s</span>
                  <span className="text-[10px]">{t('setLogger.tempoDown')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-purple-300">{exercise.tempo.split('-')[1]}s</span>
                  <span className="text-[10px]">{t('setLogger.tempoPause')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-green-300">{exercise.tempo.split('-')[2]}s</span>
                  <span className="text-[10px]">{t('setLogger.tempoUp')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-amber-300">{exercise.tempo.split('-')[3]}s</span>
                  <span className="text-[10px]">{t('setLogger.tempoSqueeze')}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center italic">
            {t('setLogger.tempoDescription')}
          </p>
        </div>
      )}

      {/* Optional Mental State Selector */}
      <div>
        <button
          onClick={() => setShowMentalSelector(!showMentalSelector)}
          className="text-sm text-gray-400 hover:text-gray-300 mb-2 transition-colors"
        >
          {showMentalSelector ? '▼' : '▶'} {t('setLogger.mentalDrainedOptional')}
        </button>

        {showMentalSelector && (
          <div className="grid grid-cols-5 gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const readiness = getMentalReadinessEmoji(value)
              return (
                <button
                  key={value}
                  onClick={() => setMentalReadiness(mentalReadiness === value ? undefined : value)}
                  className={`h-16 rounded font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                    mentalReadiness === value
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  title={readiness.label}
                >
                  <span className="text-2xl">{readiness.emoji}</span>
                  <span className="text-xs">{value}</span>
                </button>
              )
            })}
          </div>
        )}

        {mentalReadiness && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            {t('setLogger.mentalState', { state: getMentalReadinessEmoji(mentalReadiness).label })}
          </p>
        )}
      </div>

      {/* Log Button */}
      <Button
        onClick={handleLogSet}
        disabled={isLogging}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        {isLogging ? t('setLogger.logging') : t('setLogger.logSetButton')}
      </Button>

      {/* Skip Warmup Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSkipWarmupDialog}
        onClose={() => setShowSkipWarmupDialog(false)}
        onConfirm={confirmSkipWarmup}
        title={t('setLogger.skipWarmupTitle')}
        message={t('setLogger.skipWarmupConfirm', { count: warmupSetsCount })}
        confirmText={t('setLogger.confirmSkip')}
        cancelText={tCommon('buttons.cancel')}
        type="warning"
      />
    </div>
  )
}
