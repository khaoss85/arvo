'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'
import { cn } from '@/lib/utils/cn'

interface ModificationWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  validation: ModificationValidationOutput
  exerciseName: string
  addedSets: number
}

/**
 * Modal component for displaying AI validation results
 * when user adds extra sets to an exercise
 *
 * Redesigned for premium feel with glassmorphism and responsive theme.
 */
export function ModificationWarningModal({
  isOpen,
  onClose,
  onProceed,
  validation,
  exerciseName,
  addedSets,
}: ModificationWarningModalProps) {
  const t = useTranslations('workout.execution.modificationWarning')

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        onProceed()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onProceed])

  if (!isOpen) return null

  // Color scheme based on validation level
  const colorScheme = {
    approved: {
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: CheckCircle2,
      titleColor: 'text-green-700 dark:text-green-400',
      title: t('approved'),
      buttonGradient: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    },
    caution: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: AlertTriangle,
      titleColor: 'text-yellow-700 dark:text-yellow-400',
      title: t('caution'),
      buttonGradient: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
    },
    not_recommended: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: XCircle,
      titleColor: 'text-red-700 dark:text-red-400',
      title: t('notRecommended'),
      buttonGradient: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
    },
  }

  const scheme = colorScheme[validation.validation]
  const Icon = scheme.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label={t('close')}
        >
          <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>

        <div className="p-6 pt-8 text-center">
          {/* Status Icon */}
          <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4", scheme.iconBg)}>
            <Icon className={cn("w-8 h-8", scheme.iconColor)} />
          </div>

          {/* Title & Context */}
          <h2 className={cn("text-xl font-bold mb-1", scheme.titleColor)}>
            {scheme.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {exerciseName} • <span className="font-medium text-gray-700 dark:text-gray-300">+{addedSets} {t('sets', { count: addedSets })}</span>
          </p>

          {/* AI Reasoning */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-left mb-6 border border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              {t('aiEvaluation')}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {validation.reasoning}
            </p>
          </div>

          {/* Warnings (if any) */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div className="space-y-3 mb-6 text-left">
              {validation.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    {warning.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions (if any) */}
          {(validation.suggestions.alternative || validation.suggestions.educationalNote) && (
            <div className="space-y-3 mb-6 text-left">
              {validation.suggestions.alternative && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                  <span className="text-lg leading-none">💡</span>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {validation.suggestions.alternative}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onProceed}
              className={cn("w-full h-12 text-base font-semibold shadow-lg text-white border-0", scheme.buttonGradient)}
            >
              {validation.validation === 'approved' ? t('addSets') : t('addAnyway')}
              <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
