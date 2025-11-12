'use client'

import { useEffect } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { ExerciseAdditionOutput } from '@/lib/agents/exercise-addition-validator.agent'

interface ExerciseValidationModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  validation: ExerciseAdditionOutput
  exerciseName: string
}

/**
 * Modal component for displaying AI validation results
 * when user adds an extra exercise to their workout
 *
 * Color-coded by validation level:
 * - approved: green (encouraging, auto-proceeds without showing modal)
 * - caution: yellow (warnings with trade-offs, user can proceed)
 * - rejected: red (strong warnings, cannot proceed)
 */
export function ExerciseValidationModal({
  isOpen,
  onClose,
  onProceed,
  validation,
  exerciseName,
}: ExerciseValidationModalProps) {
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && validation.validation !== 'rejected') {
        // Only allow Enter to proceed if not rejected
        onProceed()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onProceed, validation.validation])

  if (!isOpen) return null

  // Color scheme based on validation level
  const colorScheme = {
    approved: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: CheckCircle2,
      title: 'Esercizio Approvato',
    },
    caution: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: AlertTriangle,
      title: 'Attenzione: Considera i Trade-Off',
    },
    rejected: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: XCircle,
      title: 'Esercizio Non Raccomandato',
    },
  }

  const scheme = colorScheme[validation.validation]
  const Icon = scheme.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-4 border-b border-gray-800 ${scheme.bg} ${scheme.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`w-6 h-6 ${scheme.text}`} />
              <div>
                <h2 className={`text-lg font-semibold ${scheme.text}`}>
                  {scheme.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {exerciseName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Reasoning */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Valutazione AI
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed">
              {validation.reasoning}
            </p>
          </div>

          {/* Warnings */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Avvertenze
              </h3>
              <div className="space-y-2">
                {validation.warnings.map((warning, index) => {
                  const severityColors = {
                    low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                    high: 'bg-red-500/10 border-red-500/30 text-red-400',
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded border ${severityColors[warning.severity]}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                          {warning.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">
                          {warning.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{warning.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {(validation.suggestions.alternative ||
            validation.suggestions.placement ||
            validation.suggestions.educationalNote) && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Suggerimenti
              </h3>
              <div className="space-y-2">
                {validation.suggestions.alternative && (
                  <div className="p-3 bg-gray-800 rounded border border-gray-700">
                    <p className="text-sm text-gray-200">
                      💡 {validation.suggestions.alternative}
                    </p>
                  </div>
                )}
                {validation.suggestions.placement && (
                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/30">
                    <p className="text-sm text-purple-300">
                      📍 {validation.suggestions.placement}
                    </p>
                  </div>
                )}
                {validation.suggestions.educationalNote && (
                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
                    <p className="text-sm text-blue-300">
                      📚 {validation.suggestions.educationalNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workout Balance Context */}
          {validation.workoutBalance && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Contesto Workout
              </h3>
              <div className="space-y-2 text-sm text-gray-400">
                {validation.workoutBalance.muscleOverlap && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{validation.workoutBalance.muscleOverlap}</span>
                  </div>
                )}
                {validation.workoutBalance.fatigueEstimate && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{validation.workoutBalance.fatigueEstimate}</span>
                  </div>
                )}
                {validation.workoutBalance.phaseAlignment && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{validation.workoutBalance.phaseAlignment}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors"
          >
            {validation.validation === 'rejected' ? 'Chiudi' : 'Annulla'}
            <span className="text-xs text-gray-500 ml-2">(ESC)</span>
          </button>

          {/* Only show Proceed button for approved/caution, not for rejected */}
          {validation.validation !== 'rejected' && (
            <button
              onClick={onProceed}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                validation.validation === 'approved'
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              {validation.validation === 'approved'
                ? 'Aggiungi Esercizio'
                : 'Aggiungi Comunque'}
              <span className="text-xs opacity-70 ml-2">(ENTER)</span>
            </button>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 text-center">
            {validation.validation === 'rejected'
              ? 'ESC per chiudere'
              : 'ESC per annullare • ENTER per procedere'}
          </p>
        </div>
      </div>
    </div>
  )
}
