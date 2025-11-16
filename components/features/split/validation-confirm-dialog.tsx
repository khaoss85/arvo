'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SplitChangeValidationOutput } from '@/lib/agents/workout-modification-validator.agent'

interface ValidationConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validation: SplitChangeValidationOutput
  modificationType: 'swap_days' | 'toggle_muscle' | 'change_variation'
  onConfirm: (userOverride?: boolean, userReason?: string) => Promise<void>
  applying: boolean
}

export function ValidationConfirmDialog({
  open,
  onOpenChange,
  validation,
  modificationType,
  onConfirm,
  applying
}: ValidationConfirmDialogProps) {
  const t = useTranslations('dashboard.splitCustomization.validation')
  const [userReason, setUserReason] = useState('')

  const isApproved = validation.validation === 'approved'
  const isCaution = validation.validation === 'caution'
  const isNotRecommended = validation.validation === 'not_recommended'

  const getValidationColor = () => {
    if (isApproved) return 'green'
    if (isCaution) return 'yellow'
    return 'red'
  }

  const getValidationIcon = () => {
    if (isApproved) return '✅'
    if (isCaution) return '⚠️'
    return '❌'
  }

  const getValidationBgColor = () => {
    if (isApproved) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (isCaution) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const getValidationTextColor = () => {
    if (isApproved) return 'text-green-900 dark:text-green-100'
    if (isCaution) return 'text-yellow-900 dark:text-yellow-100'
    return 'text-red-900 dark:text-red-100'
  }

  const handleConfirm = async () => {
    const needsOverride = !isApproved
    await onConfirm(needsOverride, userReason || undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">{getValidationIcon()}</span>
            {t(`level.${validation.validation}`)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rationale */}
          <div className={`border rounded-lg p-4 ${getValidationBgColor()}`}>
            <p className={`text-sm font-medium ${getValidationTextColor()}`}>
              {validation.rationale}
            </p>
          </div>

          {/* Warnings */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {t('warnings')}
              </p>
              <ul className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {t('suggestions')}
              </p>
              <ul className="space-y-1">
                {validation.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="mr-2">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Volume Impact */}
          {validation.volumeImpact && validation.volumeImpact.muscleGroup && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {t('volumeImpact')}
              </p>
              <div className="text-sm space-y-1">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{validation.volumeImpact.muscleGroup}:</span>{' '}
                  {validation.volumeImpact.before} → {validation.volumeImpact.after} {t('sets')}
                </p>
                {validation.volumeImpact.status && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {validation.volumeImpact.status}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* User Reason (if not approved) */}
          {!isApproved && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                {t('reasonLabel')} <span className="text-gray-500 text-xs">({t('optional')})</span>
              </label>
              <textarea
                value={userReason}
                onChange={(e) => setUserReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('reasonHelper')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={applying}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={applying}
              className={`flex-1 ${
                isApproved
                  ? 'bg-green-600 hover:bg-green-700'
                  : isCaution
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {applying ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {t('applying')}
                </>
              ) : (
                <>{t('confirm')}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
