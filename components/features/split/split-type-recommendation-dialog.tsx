'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SplitTypeChangeOutput } from '@/lib/agents/split-type-change-validator.agent'
import type { SplitType } from '@/lib/types/split.types'
import { generateNewSplitTypeAction } from '@/app/actions/split-customization-actions'
import { useUIStore } from '@/lib/stores/ui.store'

interface SplitTypeRecommendationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: SplitTypeChangeOutput
  targetSplitType: SplitType
  weakPointMuscle?: string
  userId: string
  onSuccess: () => void
}

export function SplitTypeRecommendationDialog({
  open,
  onOpenChange,
  analysis,
  targetSplitType,
  weakPointMuscle,
  userId,
  onSuccess,
}: SplitTypeRecommendationDialogProps) {
  const t = useTranslations('dashboard.splitCustomization.recommendation')
  const { addToast } = useUIStore()

  const [applying, setApplying] = useState(false)

  const isProceed = analysis.recommendation === 'proceed'
  const isWait = analysis.recommendation === 'wait'
  const isNotRecommended = analysis.recommendation === 'not_recommended'

  const getRecommendationIcon = () => {
    if (isProceed) return '✅'
    if (isWait) return '⏳'
    return '❌'
  }

  const getRecommendationColor = () => {
    if (isProceed) return 'green'
    if (isWait) return 'yellow'
    return 'red'
  }

  const getRecommendationBgColor = () => {
    if (isProceed) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (isWait) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const getRecommendationTextColor = () => {
    if (isProceed) return 'text-green-900 dark:text-green-100'
    if (isWait) return 'text-yellow-900 dark:text-yellow-100'
    return 'text-red-900 dark:text-red-100'
  }

  const handleProceed = async () => {
    setApplying(true)
    try {
      // Generate new split with target split type
      const result = await generateNewSplitTypeAction(
        userId,
        targetSplitType,
        weakPointMuscle
      )

      if (result.success) {
        addToast(
          t('successMessage', {
            splitType: targetSplitType,
          }),
          'success'
        )
        onSuccess()
        onOpenChange(false)
      } else {
        addToast(result.error || t('errorMessage'), 'error')
      }
    } catch (error) {
      console.error('Error changing split type:', error)
      addToast(t('errorMessage'), 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">{getRecommendationIcon()}</span>
            {t(`recommendation.${analysis.recommendation}`)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reasoning */}
          <div className={`border rounded-lg p-4 ${getRecommendationBgColor()}`}>
            <p className={`text-sm font-medium ${getRecommendationTextColor()}`}>
              {analysis.reasoning}
            </p>
          </div>

          {/* Pros */}
          {analysis.pros && analysis.pros.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg">👍</span>
                {t('pros')}
              </h4>
              <ul className="space-y-2">
                {analysis.pros.map((pro, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start"
                  >
                    <span className="mr-2">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {analysis.cons && analysis.cons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg">👎</span>
                {t('cons')}
              </h4>
              <ul className="space-y-2">
                {analysis.cons.map((con, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start"
                  >
                    <span className="mr-2">✗</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Impact Analysis */}
          {analysis.impact && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg">📊</span>
                {t('impactAnalysis')}
              </h4>

              <div className="space-y-3">
                {/* Volume Changes */}
                {analysis.impact.volumeChanges && analysis.impact.volumeChanges.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      {t('volumeChanges')}
                    </p>
                    <div className="space-y-1">
                      {analysis.impact.volumeChanges.slice(0, 5).map((change, idx) => (
                        <div
                          key={idx}
                          className="text-xs flex items-center justify-between py-1 px-2 bg-white dark:bg-gray-900 rounded"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {change.muscle}:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {change.currentSets} → {change.estimatedNewSets} sets{' '}
                            <span
                              className={
                                change.assessment === 'increase'
                                  ? 'text-green-600'
                                  : change.assessment === 'decrease'
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }
                            >
                              {change.assessment === 'increase'
                                ? '↗'
                                : change.assessment === 'decrease'
                                  ? '↘'
                                  : '→'}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recovery & Fatigue Impact */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-gray-600 dark:text-gray-400 mb-1">{t('recoveryImpact')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {analysis.impact.recoveryImpact === 'improved' && '✅ '}
                      {analysis.impact.recoveryImpact === 'worse' && '⚠️ '}
                      {t(`recovery.${analysis.impact.recoveryImpact}`)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-gray-600 dark:text-gray-400 mb-1">{t('fatigueImpact')}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {analysis.impact.fatigueImpact === 'reduced' && '✅ '}
                      {analysis.impact.fatigueImpact === 'increased' && '⚠️ '}
                      {t(`fatigue.${analysis.impact.fatigueImpact}`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {t('warnings')}
              </h4>
              <ul className="space-y-1">
                {analysis.warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className={`text-sm p-2 rounded-lg flex items-start ${
                      warning.severity === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                        : warning.severity === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100'
                          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="mr-2">
                      {warning.severity === 'high'
                        ? '🚫'
                        : warning.severity === 'medium'
                          ? '⚠️'
                          : 'ℹ️'}
                    </span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {analysis.alternatives && analysis.alternatives.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="text-lg">💡</span>
                {t('alternatives')}
              </h4>
              <div className="space-y-2">
                {analysis.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                  >
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {alt.suggestion}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">{alt.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational Note */}
          {analysis.educationalNote && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <p className="text-xs text-purple-900 dark:text-purple-100 flex items-start">
                <span className="mr-2">📚</span>
                <span>{analysis.educationalNote}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={applying}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleProceed}
              disabled={applying}
              className={`flex-1 ${
                isProceed
                  ? 'bg-green-600 hover:bg-green-700'
                  : isWait
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {applying ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  {t('generating')}
                </>
              ) : (
                <>{isProceed ? t('proceedButton') : t('proceedAnywayButton')}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
