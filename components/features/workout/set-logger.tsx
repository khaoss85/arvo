'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rirToIntensityPercent } from '@/lib/utils/workout-helpers'
import { Target, Sparkles, Minus, Plus, Headphones, Brain, ChevronDown } from 'lucide-react'
import { audioCoachingService } from '@/lib/services/audio-coaching.service'
import type { PreSetCoachingScript } from '@/lib/types/pre-set-coaching'
import { cn } from '@/lib/utils/cn'

interface SetLoggerProps {
  exercise: ExerciseExecution
  setNumber: number
  suggestion?: {
    weight: number
    reps: number
    rirTarget: number
  }
  technicalCues?: string[]
}

export function SetLogger({ exercise, setNumber, suggestion, technicalCues }: SetLoggerProps) {
  const t = useTranslations('workout.execution')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { logSet } = useWorkoutExecutionStore()

  // Determine if current set is warmup
  const warmupSetsCount = exercise.warmupSets?.length || 0
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
  const isWarmup = setNumber <= remainingWarmupSets
  const currentWarmup = isWarmup ? exercise.warmupSets?.[setNumber - 1 + warmupSetsSkipped] : undefined
  const workingSetNumber = isWarmup ? 0 : setNumber - remainingWarmupSets

  // Get guidance for current working set
  const currentGuidance = !isWarmup ? exercise.setGuidance?.find(g => g.setNumber === workingSetNumber) : undefined

  // Get effective target weight from actual performance or target
  const getEffectiveTargetWeight = useCallback(() => {
    // Calculate how many warmup sets have been completed
    const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)

    // Working sets are everything after warmup sets
    const workingSets = exercise.completedSets.slice(completedWarmupCount)

    // If we have working sets logged, use the max weight from those
    if (workingSets.length > 0) {
      return Math.max(...workingSets.map(s => s.weight))
    }

    // If we're still in warmup and have completed some warmup sets,
    // check if actual performance significantly differs from the target
    const completedWarmupSets = exercise.completedSets.slice(0, completedWarmupCount)
    if (completedWarmupSets.length > 0) {
      const maxWarmupWeight = Math.max(...completedWarmupSets.map(s => s.weight))
      const targetWeight = exercise.targetWeight || 0

      // If warmup performance exceeds target by 10%+, use actual performance
      // This ensures subsequent warmup sets adapt to demonstrated strength
      if (maxWarmupWeight > targetWeight * 1.1) {
        return maxWarmupWeight
      }

      // BIDIRECTIONAL ADAPTATION: If warmup performance is significantly below target,
      // calculate progressive next step based on actual warmup trajectory
      // This prevents jarring jumps like 5kg → 32.5kg
      if (completedWarmupSets.length > 0 && maxWarmupWeight < targetWeight * 0.5) {
        // Calculate progressive next step from actual warmup trajectory
        if (completedWarmupSets.length === 1) {
          // Only one warmup completed - suggest conservative 1.5x - 2x increase
          const firstWeight = completedWarmupSets[0].weight
          // Use 1.75x multiplier for smooth progression (e.g., 5kg → 8.75kg ≈ 10kg)
          // Cap at 75% of target to leave room for final warmup step
          const nextStep = Math.min(firstWeight * 1.75, targetWeight * 0.75)
          return nextStep
        } else {
          // Multiple warmups completed - extrapolate from actual progression rate
          const weights = completedWarmupSets.map(s => s.weight)
          // Calculate average increment per warmup (e.g., 5kg → 10kg = +5kg/step)
          const avgIncrement = (weights[weights.length - 1] - weights[0]) / (weights.length - 1)
          // Project next step: last weight + average increment
          const nextStep = weights[weights.length - 1] + avgIncrement

          // Cap at target weight and ensure meaningful progression (at least 20% increase)
          const progressiveStep = Math.max(nextStep, maxWarmupWeight * 1.2)
          return Math.min(progressiveStep, targetWeight)
        }
      }
    }

    // Otherwise use the target weight
    return exercise.targetWeight || 0
  }, [exercise.completedSets, exercise.targetWeight, remainingWarmupSets])

  // Initialize state based on warmup vs working set
  const getInitialWeight = useCallback(() => {
    if (currentWarmup) {
      // Check if we should use adaptive calculation instead of pre-calculated weight
      // This happens when actual warmup performance deviates significantly from plan
      const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)
      const completedWarmupSets = exercise.completedSets.slice(0, completedWarmupCount)
      const maxWarmupWeight = completedWarmupSets.length > 0
        ? Math.max(...completedWarmupSets.map(s => s.weight))
        : 0
      const targetWeight = exercise.targetWeight || 0
      const shouldAdapt = completedWarmupSets.length > 0 && maxWarmupWeight < targetWeight * 0.5

      // If adaptation needed, calculate progressive next step directly
      if (shouldAdapt) {
        if (completedWarmupSets.length === 1) {
          // After first warmup: suggest 1.5x - 2x increase for smooth progression
          const firstWeight = completedWarmupSets[0].weight
          // Use 2x multiplier (e.g., 5kg → 10kg, 10kg → 20kg)
          // Cap at 50% of target to stay conservative
          const nextStep = Math.min(firstWeight * 2, targetWeight * 0.5)
          return Math.round(nextStep * 2) / 2 // Round to nearest 0.5kg
        } else {
          // Multiple warmups: extrapolate from actual progression
          const weights = completedWarmupSets.map(s => s.weight)
          const avgIncrement = (weights[weights.length - 1] - weights[0]) / (weights.length - 1)
          const nextStep = weights[weights.length - 1] + avgIncrement
          // Ensure at least 20% increase, cap at target
          const progressiveStep = Math.max(nextStep, maxWarmupWeight * 1.2)
          return Math.round(Math.min(progressiveStep, targetWeight) * 2) / 2
        }
      }

      // Use pre-calculated weight if available, valid, and no adaptation needed
      if (currentWarmup.weight !== undefined && currentWarmup.weight > 0) {
        return currentWarmup.weight
      }

      // Calculate from percentage using effective target (for upward adaptation)
      if (currentWarmup.weightPercentage !== undefined) {
        const effectiveTarget = getEffectiveTargetWeight()
        // Round to nearest 0.5kg (standard barbell increment)
        return Math.round((effectiveTarget * currentWarmup.weightPercentage / 100) * 2) / 2
      }
    }
    if (suggestion) return suggestion.weight
    return exercise.targetWeight || 0
  }, [currentWarmup, suggestion, exercise.targetWeight, getEffectiveTargetWeight, exercise.completedSets, remainingWarmupSets])

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
  const [isLogging, setIsLogging] = useState(false)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [cachedScripts, setCachedScripts] = useState<Map<string, PreSetCoachingScript>>(new Map())
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // Update values when warmup/suggestion changes or exercise data loads
  useEffect(() => {
    setWeight(getInitialWeight())
    setReps(getInitialReps())
    setRir(getInitialRir())
  }, [getInitialWeight, getInitialReps, getInitialRir])

  const handleLogSet = async () => {
    setIsLogging(true)
    try {
      await logSet({ weight, reps, rir })
    } catch (error) {
      console.error('Failed to log set:', error)
      alert(tCommon('errors.failedToLogSet'))
    } finally {
      setIsLogging(false)
    }
  }

  const handleStartAudioCoaching = async () => {
    setIsGeneratingScript(true)

    try {
      // Build cache key based on context
      const intensity = rir <= 1 ? 'heavy' : rir <= 3 ? 'moderate' : 'light'
      const position =
        setNumber === 1
          ? 'first'
          : setNumber === (isWarmup ? remainingWarmupSets : exercise.targetSets)
            ? 'last'
            : 'middle'
      const cacheKey = `${exercise.exerciseName}-${isWarmup ? 'warmup' : 'working'}-${position}-${intensity}-${locale}`

      // Check cache first
      let script = cachedScripts.get(cacheKey)

      if (!script) {
        // Generate new script via API
        const response = await fetch('/api/audio/pre-set-coaching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseName: exercise.exerciseName,
            setNumber: workingSetNumber || setNumber,
            totalSets: isWarmup ? remainingWarmupSets : exercise.targetSets,
            isWarmup,
            weight,
            reps,
            rir,
            tempo: exercise.tempo,
            technicalFocus: isWarmup ? currentWarmup?.technicalFocus : currentGuidance?.technicalFocus,
            mentalFocus: currentGuidance?.mentalFocus,
            previousSets: exercise.completedSets.slice(-2).map((s) => ({
              weight: s.weight,
              reps: s.reps,
              rir: s.rir,
              mentalReadiness: s.mentalReadiness,
            })),
            mentalReadiness: undefined,
            language: locale,
          }),
        })

        if (!response.ok) throw new Error('Failed to generate script')

        script = await response.json()

        // Cache for session
        setCachedScripts((prev) => new Map(prev).set(cacheKey, script!))
      }

      // Enqueue script for playback
      audioCoachingService.enqueue({
        id: `pre-set-${setNumber}-${Date.now()}`,
        type: 'pre_set',
        segments: script!.segments,
        priority: 9, // High priority for immediate playback
      })
    } catch (error) {
      console.error('Failed to generate pre-set coaching:', error)

      // Fallback to simple script
      audioCoachingService.enqueue({
        id: `set-${setNumber}-fallback`,
        type: 'set_execution',
        text: `Set ${setNumber}. ${exercise.exerciseName}. ${reps} reps at ${weight} kilograms. Let's go!`,
        priority: 8,
      })
    } finally {
      setIsGeneratingScript(false)
    }
  }

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      {/* Unified Guidance Card */}
      <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 p-4">
        {/* Header Row: Set Info & Intensity */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
              isWarmup
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            )}>
              {isWarmup ? <Sparkles className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isWarmup ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                )}>
                  {isWarmup ? '🔶 ' : '🔷 '}
                  {isWarmup ? t('setLogger.warmupLabel') : t('setLogger.workingSetLabel')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {isWarmup
                    ? `${setNumber}/${remainingWarmupSets}`
                    : `${workingSetNumber}/${exercise.targetSets}`
                  }
                </span>
                {/* Show total progress */}
                {warmupSetsCount > 0 && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      {t('setLogger.totalProgress')}: {setNumber}/{remainingWarmupSets + exercise.targetSets}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {isWarmup
                  ? `${currentWarmup?.weightPercentage || 60}%`
                  : `${rirToIntensityPercent(rir)}%`
                }
              </span>
            </div>

            {/* Audio Coaching Icon - Only for working sets */}
            {!isWarmup && (
              <button
                onClick={handleStartAudioCoaching}
                disabled={isGeneratingScript}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isGeneratingScript
                    ? "bg-blue-100 dark:bg-blue-900/40 cursor-wait"
                    : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95"
                )}
                title={t('setLogger.startSetWithCoaching', { defaultValue: 'Execute Set with Coaching' })}
              >
                <Headphones className={cn(
                  "w-4 h-4",
                  isGeneratingScript
                    ? "text-blue-400 animate-pulse"
                    : "text-blue-600 dark:text-blue-400"
                )} />
              </button>
            )}
          </div>
        </div>

        {/* Guidance Cues */}
        <div className="space-y-2">
          {/* Technical Focus with Expandable Details */}
          {(isWarmup ? currentWarmup?.technicalFocus : currentGuidance?.technicalFocus) && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200 p-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed flex-1 text-left">
                  {isWarmup ? currentWarmup?.technicalFocus : currentGuidance?.technicalFocus}
                </span>
                {technicalCues && technicalCues.length > 0 && (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 transition-transform duration-200",
                      showTechnicalDetails && "rotate-180"
                    )}
                  />
                )}
              </button>

              {showTechnicalDetails && technicalCues && technicalCues.length > 0 && (
                <div className="px-2.5 pb-2.5 pt-0 animate-in slide-in-from-top-2">
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-700 mb-2" />
                  <ul className="space-y-1.5 pl-6">
                    {technicalCues.map((cue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Mental Focus (Working Sets only) */}
          {!isWarmup && currentGuidance?.mentalFocus && (
            <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2.5">
              <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">
                {currentGuidance.mentalFocus}
              </span>
            </div>
          )}

          {/* Tempo Display - Integrated (Working Sets only) */}
          {!isWarmup && exercise.tempo && (() => {
            const tempoParts = exercise.tempo.split('-')
            const down = tempoParts[0] || '0'
            const pause = tempoParts[1] || '0'
            const up = tempoParts[2] || '0'
            const squeeze = tempoParts[3] || '0'

            return (
              <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('setLogger.tempo')}</span>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <div className="text-2xl font-black text-gray-800 dark:text-white font-mono tracking-widest">{exercise.tempo}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-500">{down}s</span>
                    <span className="text-[9px] text-gray-400 uppercase">{t('setLogger.tempoDown')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-purple-500">{pause}s</span>
                    <span className="text-[9px] text-gray-400 uppercase">{t('setLogger.tempoPause')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-green-500">{up}s</span>
                    <span className="text-[9px] text-gray-400 uppercase">{t('setLogger.tempoUp')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-500">{squeeze}s</span>
                    <span className="text-[9px] text-gray-400 uppercase">{t('setLogger.tempoSqueeze')}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="space-y-6 mb-6">
        {/* Weight Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">{t('setLogger.weightLabel')}</label>
          <div className="relative flex items-center">
            <Button
              onClick={() => setWeight(Math.max(0, weight - 2.5))}
              className="absolute left-0 w-10 h-10 rounded-full p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
              variant="ghost"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full text-center text-2xl font-bold h-14 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-none px-10"
              step="0.5"
            />
            <Button
              onClick={() => setWeight(weight + 2.5)}
              className="absolute right-0 w-10 h-10 rounded-full p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
              variant="ghost"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">{t('setLogger.repsLabel')}</label>
          <div className="relative flex items-center">
            <Button
              onClick={() => setReps(Math.max(1, reps - 1))}
              className="absolute left-0 w-10 h-10 rounded-full p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
              variant="ghost"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value) || 0)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full text-center text-2xl font-bold h-14 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-none px-10"
            />
            <Button
              onClick={() => setReps(reps + 1)}
              className="absolute right-0 w-10 h-10 rounded-full p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
              variant="ghost"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* RIR Selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center mb-3">{t('setLogger.rirLabel')}</label>
        <div className="flex justify-between bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1">
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRir(value)}
              className={cn(
                "flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-200",
                rir === value
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Primary CTA: Log Set Button */}
        <Button
          onClick={handleLogSet}
          disabled={isLogging}
          className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/20 rounded-xl transition-all active:scale-[0.98]"
        >
          {isLogging ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('setLogger.logging')}</span>
            </div>
          ) : (
            t('setLogger.logSetButton')
          )}
        </Button>
      </div>
    </div>
  )
}
