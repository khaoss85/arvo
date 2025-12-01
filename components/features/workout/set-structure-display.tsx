'use client'

import { useTranslations } from 'next-intl'
import { Target, Sparkles, Zap, Timer, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'
import {
  isDropSetConfig,
  isRestPauseConfig,
  isTopSetBackoffConfig,
} from '@/lib/types/advanced-techniques'

interface SetStructureDisplayProps {
  exercise: ExerciseExecution
  compact?: boolean
  className?: string
}

// Reusable warmup phase component
interface WarmupPhaseProps {
  exercise: ExerciseExecution
  effectiveTargetWeight: number
  warmupSetsSkipped: number
  remainingWarmupSets: number
  t: ReturnType<typeof useTranslations>
}

function WarmupPhaseDisplay({ exercise, effectiveTargetWeight, warmupSetsSkipped, remainingWarmupSets, t }: WarmupPhaseProps) {
  if (remainingWarmupSets === 0) return null

  return (
    <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
          {t('setStructure.warmupPhase')} ({remainingWarmupSets} {t('setStructure.sets', { count: remainingWarmupSets })})
        </span>
      </div>
      <div className="space-y-2">
        {exercise.warmupSets?.slice(warmupSetsSkipped).map((warmup, i) => {
          const completedSet = exercise.completedSets[warmupSetsSkipped + i]
          const actualWeight = completedSet?.weight ||
            Math.round((effectiveTargetWeight * warmup.weightPercentage) / 100 * 2) / 2
          return (
            <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <span className="font-medium text-amber-600 dark:text-amber-400 min-w-[3.5rem]">
                {t('setStructure.set')} {i + 1}
              </span>
              <div className="flex-1">
                <div className="font-medium">
                  {warmup.weightPercentage}% ({actualWeight}kg) × {completedSet?.reps || warmup.reps} {t('setStructure.reps')}
                  {completedSet && <span className="text-green-500 ml-1">✓</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SetStructureDisplay({ exercise, compact = false, className }: SetStructureDisplayProps) {
  const t = useTranslations('workout.execution')

  const warmupSetsCount = exercise.warmupSets?.length || 0
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
  const totalSets = remainingWarmupSets + exercise.targetSets

  const getEffectiveTargetWeight = (): number => {
    const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)
    const workingSets = exercise.completedSets.slice(completedWarmupCount)
    if (workingSets.length > 0) {
      return Math.max(...workingSets.map(s => s.weight))
    }
    return exercise.targetWeight
  }

  const effectiveTargetWeight = getEffectiveTargetWeight()

  // Advanced technique structure
  if (exercise.advancedTechnique && !compact) {
    const { technique, config } = exercise.advancedTechnique

    if (isTopSetBackoffConfig(config)) {
      const backoffWeight = Math.round(effectiveTargetWeight * (1 - config.backoffPercentage / 100) * 2) / 2
      return (
        <div className={cn("space-y-3", className)}>
          <div className="text-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('setStructure.title')} - {t('setStructure.topSetBackoff')}
            </span>
          </div>

          <WarmupPhaseDisplay
            exercise={exercise}
            effectiveTargetWeight={effectiveTargetWeight}
            warmupSetsSkipped={warmupSetsSkipped}
            remainingWarmupSets={remainingWarmupSets}
            t={t}
          />

          <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                {t('setStructure.workingPhase')} (1 {t('setStructure.topSet')} + {config.backoffSets} {t('setStructure.backoff')})
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-red-600 dark:text-red-400 min-w-[4rem]">
                  {t('setStructure.topSet')}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {effectiveTargetWeight}kg × {config.topSetReps} {t('setStructure.reps')}
                  </div>
                </div>
              </div>
              {Array.from({ length: config.backoffSets }, (_, i) => (
                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="font-medium text-amber-600 dark:text-amber-400 min-w-[4rem]">
                    {t('setStructure.backoff')} {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {backoffWeight}kg × {config.backoffReps} {t('setStructure.reps')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (isDropSetConfig(config)) {
      const dropWeights: number[] = [effectiveTargetWeight]
      for (let i = 1; i <= config.drops; i++) {
        const prevWeight = dropWeights[dropWeights.length - 1]
        dropWeights.push(Math.round(prevWeight * (1 - config.dropPercentage / 100) * 2) / 2)
      }
      return (
        <div className={cn("space-y-3", className)}>
          <div className="text-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('setStructure.title')} - {t('setStructure.dropSet')}
            </span>
          </div>

          <WarmupPhaseDisplay
            exercise={exercise}
            effectiveTargetWeight={effectiveTargetWeight}
            warmupSetsSkipped={warmupSetsSkipped}
            remainingWarmupSets={remainingWarmupSets}
            t={t}
          />

          <div className="bg-orange-900/10 border border-orange-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                {t('setStructure.workingPhase')} ({config.drops + 1} drops, -{config.dropPercentage}%)
              </span>
            </div>
            <div className="space-y-2">
              {dropWeights.map((weight, i) => (
                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="font-medium text-orange-600 dark:text-orange-400 min-w-[4rem]">
                    {i === 0 ? t('setStructure.topSet') : `${t('setStructure.drop')} ${i}`}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {weight}kg × {t('setStructure.toFailure')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (isRestPauseConfig(config)) {
      return (
        <div className={cn("space-y-3", className)}>
          <div className="text-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('setStructure.title')} - {t('setStructure.restPause')}
            </span>
          </div>

          <WarmupPhaseDisplay
            exercise={exercise}
            effectiveTargetWeight={effectiveTargetWeight}
            warmupSetsSkipped={warmupSetsSkipped}
            remainingWarmupSets={remainingWarmupSets}
            t={t}
          />

          <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {t('setStructure.workingPhase')} ({config.miniSets + 1} {t('setStructure.miniSet')}, {config.restSeconds}s)
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[4rem]">
                  {t('setStructure.initial')}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {effectiveTargetWeight}kg × {t('setStructure.toFailure')}
                  </div>
                </div>
              </div>
              {Array.from({ length: config.miniSets }, (_, i) => (
                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="font-medium text-cyan-600 dark:text-cyan-400 min-w-[4rem]">
                    +{config.restSeconds}s →
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {t('setStructure.miniSet')} {i + 1} × {t('setStructure.toFailure')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Fallback for other techniques
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-center py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {t('setStructure.title')} - {technique.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              {exercise.targetSets} {t('setStructure.sets', { count: exercise.targetSets })} × {exercise.targetReps[0]}-{exercise.targetReps[1]} {t('setStructure.reps')}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {effectiveTargetWeight}kg target
          </p>
        </div>
      </div>
    )
  }

  // Compact mode
  if (compact) {
    return (
      <div className={cn("text-[10px] text-gray-500 dark:text-gray-400", className)}>
        {remainingWarmupSets > 0 ? (
          <span>
            {t('setStructure.totalSets', { count: totalSets })} • {remainingWarmupSets} {t('setStructure.warmupShort')} + {exercise.targetSets} {t('setStructure.workingShort')}
          </span>
        ) : (
          <span>{t('setStructure.totalSets', { count: totalSets })}</span>
        )}
      </div>
    )
  }

  // No warmup sets
  if (remainingWarmupSets === 0) {
    return (
      <div className={cn("bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 space-y-3", className)}>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            {t('setStructure.workingPhase')} ({exercise.targetSets} {t('setStructure.sets', { count: exercise.targetSets })})
          </span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: exercise.targetSets }, (_, i) => {
            const completedSet = exercise.completedSets[i]
            const displayWeight = completedSet?.weight || exercise.currentAISuggestion?.suggestion.weight || effectiveTargetWeight
            const displayReps = completedSet?.reps ? `${completedSet.reps}` : `${exercise.targetReps[0]}-${exercise.targetReps[1]}`
            return (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[3.5rem]">
                  {t('setStructure.set')} {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {displayWeight}kg × {displayReps} {t('setStructure.reps')}
                    {completedSet && <span className="text-green-500 ml-1">✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Full view with warmup + working sets
  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-center py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {t('setStructure.title')} - {t('setStructure.totalSets', { count: totalSets })}
        </span>
      </div>

      {/* Warmup Phase */}
      <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            {t('setStructure.warmupPhase')} ({remainingWarmupSets} {t('setStructure.sets', { count: remainingWarmupSets })})
          </span>
        </div>
        <div className="space-y-2">
          {exercise.warmupSets?.slice(warmupSetsSkipped).map((warmup, i) => {
            const completedSet = exercise.completedSets[warmupSetsSkipped + i]
            const actualWeight = completedSet?.weight || Math.round((effectiveTargetWeight * warmup.weightPercentage) / 100 * 2) / 2
            const actualPercentage = completedSet?.weight ? Math.round((completedSet.weight / effectiveTargetWeight) * 100) : warmup.weightPercentage
            return (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-amber-600 dark:text-amber-400 min-w-[3.5rem]">
                  {t('setStructure.set')} {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {actualPercentage}% ({actualWeight}kg) × {completedSet?.reps || warmup.reps} {t('setStructure.reps')}
                    {completedSet && <span className="text-green-500 ml-1">✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Working Phase */}
      <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            {t('setStructure.workingPhase')} ({exercise.targetSets} {t('setStructure.sets', { count: exercise.targetSets })})
          </span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: exercise.targetSets }, (_, i) => {
            const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)
            const completedSet = exercise.completedSets[completedWarmupCount + i]
            const displayWeight = completedSet?.weight || exercise.currentAISuggestion?.suggestion.weight || effectiveTargetWeight
            const displayReps = completedSet?.reps ? `${completedSet.reps}` : `${exercise.targetReps[0]}-${exercise.targetReps[1]}`
            return (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[3.5rem]">
                  {t('setStructure.set')} {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {displayWeight}kg × {displayReps} {t('setStructure.reps')}
                    {completedSet && <span className="text-green-500 ml-1">✓</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
