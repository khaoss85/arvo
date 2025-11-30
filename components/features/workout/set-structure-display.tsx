'use client'

import { useTranslations } from 'next-intl'
import { Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ExerciseExecution } from '@/lib/stores/workout-execution.store'

interface SetStructureDisplayProps {
  exercise: ExerciseExecution
  compact?: boolean // If true, shows compact version for WorkoutProgress
  className?: string
}

export function SetStructureDisplay({ exercise, compact = false, className }: SetStructureDisplayProps) {
  const t = useTranslations('workout.execution')

  const warmupSetsCount = exercise.warmupSets?.length || 0
  const warmupSetsSkipped = exercise.warmupSetsSkipped || 0
  const remainingWarmupSets = warmupSetsCount - warmupSetsSkipped
  const totalSets = remainingWarmupSets + exercise.targetSets

  // Calculate effective target weight from actual logged working sets or fall back to targetWeight
  const getEffectiveTargetWeight = (): number => {
    const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)
    const workingSets = exercise.completedSets.slice(completedWarmupCount)

    if (workingSets.length > 0) {
      // Use the heaviest weight from completed working sets
      return Math.max(...workingSets.map(s => s.weight))
    }

    // Fall back to target weight if no working sets logged yet
    return exercise.targetWeight
  }

  const effectiveTargetWeight = getEffectiveTargetWeight()

  // If compact mode (for WorkoutProgress)
  if (compact) {
    return (
      <div className={cn("text-[10px] text-gray-500 dark:text-gray-400", className)}>
        {remainingWarmupSets > 0 ? (
          <span>
            {t('setStructure.totalSets', { count: totalSets })} • {remainingWarmupSets} {t('setStructure.warmupShort')} + {exercise.targetSets} {t('setStructure.workingShort')}
          </span>
        ) : (
          <span>
            {t('setStructure.totalSets', { count: totalSets })}
          </span>
        )}
      </div>
    )
  }

  // Full detailed view (for ExerciseCard)
  if (remainingWarmupSets === 0) {
    // No warmup sets, just show working sets structure
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
            const setNumber = i + 1
            const guidance = exercise.setGuidance?.find(g => g.setNumber === setNumber)
            const completedSet = exercise.completedSets[i]

            // Use AI suggestion if available, otherwise use logged weight or target weight
            const displayWeight = completedSet?.weight ||
              exercise.currentAISuggestion?.suggestion.weight ||
              effectiveTargetWeight

            const displayReps = completedSet?.reps
              ? `${completedSet.reps}`
              : `${exercise.targetReps[0]}-${exercise.targetReps[1]}`

            return (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[3.5rem]">
                  {t('setStructure.set')} {setNumber}
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
      {/* Header */}
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
            const globalSetIndex = i // Index in remaining warmup sets
            const actualSetIndex = warmupSetsSkipped + i // Actual index in all warmup sets
            const completedSet = exercise.completedSets[actualSetIndex]

            // If this warmup set is already completed, show actual logged weight
            // Otherwise, calculate from effective target weight
            const actualWeight = completedSet?.weight ||
              Math.round((effectiveTargetWeight * warmup.weightPercentage) / 100 * 2) / 2

            // Calculate actual percentage if set is completed
            const actualPercentage = completedSet?.weight
              ? Math.round((completedSet.weight / effectiveTargetWeight) * 100)
              : warmup.weightPercentage

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
            const setNumber = i + 1
            const guidance = exercise.setGuidance?.find(g => g.setNumber === setNumber)

            // Find the corresponding completed working set (skip warmup sets)
            const completedWarmupCount = Math.min(exercise.completedSets.length, remainingWarmupSets)
            const workingSetIndex = completedWarmupCount + i
            const completedSet = exercise.completedSets[workingSetIndex]

            // Use AI suggestion if available, otherwise use logged weight or target weight
            const displayWeight = completedSet?.weight ||
              exercise.currentAISuggestion?.suggestion.weight ||
              effectiveTargetWeight

            const displayReps = completedSet?.reps
              ? `${completedSet.reps}`
              : `${exercise.targetReps[0]}-${exercise.targetReps[1]}`

            return (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[3.5rem]">
                  {t('setStructure.set')} {setNumber}
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
