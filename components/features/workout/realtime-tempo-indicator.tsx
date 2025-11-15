'use client'

/**
 * RealtimeTempoIndicator
 *
 * Visual feedback component showing current rep, phase, and progress
 * during tempo-based set execution.
 */

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { tempoParserService } from '@/lib/services/tempo-parser.service'

interface RealtimeTempoIndicatorProps {
  currentRep: number
  totalReps: number
  currentPhase: 'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top' | 'idle'
  phaseProgress: number  // 0-100 percentage
  tempo: string          // Display tempo breakdown
  isPaused: boolean
  language?: 'en' | 'it'
}

// Phase colors for visual distinction
const PHASE_COLORS = {
  eccentric: {
    bg: 'bg-blue-500',
    text: 'text-blue-100',
    progress: 'bg-blue-600',
    light: 'bg-blue-100 dark:bg-blue-900',
  },
  pause_bottom: {
    bg: 'bg-purple-500',
    text: 'text-purple-100',
    progress: 'bg-purple-600',
    light: 'bg-purple-100 dark:bg-purple-900',
  },
  concentric: {
    bg: 'bg-green-500',
    text: 'text-green-100',
    progress: 'bg-green-600',
    light: 'bg-green-100 dark:bg-green-900',
  },
  pause_top: {
    bg: 'bg-amber-500',
    text: 'text-amber-100',
    progress: 'bg-amber-600',
    light: 'bg-amber-100 dark:bg-amber-900',
  },
  idle: {
    bg: 'bg-gray-500',
    text: 'text-gray-100',
    progress: 'bg-gray-600',
    light: 'bg-gray-100 dark:bg-gray-900',
  },
}

export function RealtimeTempoIndicator({
  currentRep,
  totalReps,
  currentPhase,
  phaseProgress,
  tempo,
  isPaused,
  language = 'en',
}: RealtimeTempoIndicatorProps) {
  const [pulseKey, setPulseKey] = useState(0)

  // Trigger pulse animation on phase change
  useEffect(() => {
    setPulseKey((prev) => prev + 1)
  }, [currentPhase])

  const phaseColors = PHASE_COLORS[currentPhase] || PHASE_COLORS.idle
  const phaseDisplayName = tempoParserService.getPhaseDisplayName(currentPhase, language)
  const tempoBreakdown = tempoParserService.getTempoBreakdown(tempo, language)
  const tempoData = tempoParserService.parseTempo(tempo)

  if (!tempoData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Rep Progress */}
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
          Rep {currentRep}/{totalReps}
        </div>
        {isPaused && (
          <div className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            {language === 'it' ? 'In Pausa' : 'Paused'}
          </div>
        )}
      </div>

      {/* Current Phase Indicator */}
      <Card className={`p-6 ${phaseColors.light} border-2 ${phaseColors.bg.replace('bg-', 'border-')}`}>
        <div className="space-y-4">
          {/* Phase Name */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div
                key={pulseKey}
                className={`text-2xl font-bold ${phaseColors.bg.replace('bg-', 'text-')} animate-pulse`}
              >
                {phaseDisplayName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentPhase === 'eccentric' && `${tempoData.phases.eccentric}s`}
                {currentPhase === 'pause_bottom' && `${tempoData.phases.pauseBottom}s`}
                {currentPhase === 'concentric' && `${tempoData.phases.concentric}s`}
                {currentPhase === 'pause_top' && `${tempoData.phases.pauseTop}s`}
              </div>
            </div>

            {/* Phase Progress Percentage */}
            <div className={`text-3xl font-bold ${phaseColors.bg.replace('bg-', 'text-')}`}>
              {Math.round(phaseProgress)}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${phaseColors.progress} transition-all duration-100 ease-linear`}
              style={{ width: `${Math.min(100, phaseProgress)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Tempo Breakdown */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {language === 'it' ? 'Tempo' : 'Tempo'}: {tempo}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {tempoBreakdown.map((breakdown, idx) => {
              const phaseNames: Array<'eccentric' | 'pause_bottom' | 'concentric' | 'pause_top'> = [
                'eccentric',
                'pause_bottom',
                'concentric',
                'pause_top',
              ]
              const phaseName = phaseNames[idx]
              const isCurrentPhase = phaseName === currentPhase
              const phaseColor = PHASE_COLORS[phaseName]

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded ${
                    isCurrentPhase
                      ? `${phaseColor.light} border-2 ${phaseColor.bg.replace('bg-', 'border-')}`
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${phaseColor.bg} ${
                      isCurrentPhase ? 'animate-pulse' : ''
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isCurrentPhase
                        ? `font-semibold ${phaseColor.bg.replace('bg-', 'text-')}`
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {breakdown}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Set Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{language === 'it' ? 'Progresso Serie' : 'Set Progress'}</span>
          <span>
            {Math.round((currentRep / totalReps) * 100)}%
          </span>
        </div>
        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, (currentRep / totalReps) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
