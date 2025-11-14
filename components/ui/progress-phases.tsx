'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

export interface Phase {
  id: string
  label: string
  emoji: string
}

/**
 * Get default workout phases with translations
 * This is a hook and must be called inside a component
 */
export function useWorkoutPhases(): Phase[] {
  const t = useTranslations('components.ui.progressPhases')

  return [
    { id: 'profile', label: t('profile'), emoji: '👤' },
    { id: 'split', label: t('split'), emoji: '📋' },
    { id: 'ai', label: t('ai'), emoji: '🤖' },
    { id: 'optimization', label: t('optimization'), emoji: '🎯' },
    { id: 'finalize', label: t('finalize'), emoji: '✨' }
  ]
}

/**
 * Get onboarding phases with translations (3 phases only)
 * This is a hook and must be called inside a component
 */
export function useOnboardingPhases(): Phase[] {
  const t = useTranslations('components.ui.progressPhases')

  return [
    { id: 'profile', label: t('profile'), emoji: '👤' },
    { id: 'split', label: t('split'), emoji: '📋' },
    { id: 'finalize', label: t('finalize'), emoji: '✨' }
  ]
}

// Fallback constant for backward compatibility (English only)
// Prefer using useWorkoutPhases() hook for i18n support
export const WORKOUT_PHASES: Phase[] = [
  { id: 'profile', label: 'Loading profile', emoji: '👤' },
  { id: 'split', label: 'Planning workout', emoji: '📋' },
  { id: 'ai', label: 'AI selecting exercises', emoji: '🤖' },
  { id: 'optimization', label: 'Optimizing workout', emoji: '🎯' },
  { id: 'finalize', label: 'Finalizing', emoji: '✨' }
]

// Onboarding phases fallback (English only)
// Prefer using useOnboardingPhases() hook for i18n support
export const ONBOARDING_PHASES: Phase[] = [
  { id: 'profile', label: 'Creating profile', emoji: '👤' },
  { id: 'split', label: 'Generating split', emoji: '📋' },
  { id: 'finalize', label: 'Finalizing', emoji: '✨' }
]

interface ProgressPhasesProps {
  phases: Phase[]
  currentPhase: string
  variant?: 'dots' | 'bars'
}

export function ProgressPhases({
  phases,
  currentPhase,
  variant = 'bars'
}: ProgressPhasesProps) {
  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase)

  if (variant === 'dots') {
    return (
      <div className="flex gap-2 justify-center">
        {phases.map((phase, idx) => (
          <div
            key={phase.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx <= currentPhaseIndex
                ? 'bg-purple-600 dark:bg-purple-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={phase.label}
          />
        ))}
      </div>
    )
  }

  // bars variant
  return (
    <div className="flex gap-1">
      {phases.map((phase, idx) => (
        <div
          key={phase.id}
          className={`flex-1 h-1 rounded-full transition-all duration-300 ${
            idx <= currentPhaseIndex
              ? 'bg-purple-600 dark:bg-purple-500'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          title={phase.label}
        />
      ))}
    </div>
  )
}
