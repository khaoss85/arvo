import React from 'react'

export interface Phase {
  id: string
  label: string
  emoji: string
}

export const WORKOUT_PHASES: Phase[] = [
  { id: 'profile', label: 'Loading profile', emoji: '👤' },
  { id: 'split', label: 'Planning workout', emoji: '📋' },
  { id: 'ai', label: 'AI selecting exercises', emoji: '🤖' },
  { id: 'optimization', label: 'Optimizing workout', emoji: '🎯' },
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
