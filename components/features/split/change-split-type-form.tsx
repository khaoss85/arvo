'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { analyzeSplitTypeChangeAction } from '@/app/actions/split-customization-actions'
import type { SplitType } from '@/lib/types/split.types'
import type { SplitTypeChangeOutput } from '@/lib/agents/split-type-change-validator.agent'
import { SPECIALIZABLE_MUSCLES, MUSCLE_GROUP_CATEGORIES } from '@/lib/types/split.types'
import { SplitTypeRecommendationDialog } from './split-type-recommendation-dialog'
import { useUIStore } from '@/lib/stores/ui.store'

interface ChangeSplitTypeFormProps {
  userId: string
  currentSplitType: SplitType
  onSuccess: () => void
}

const SPLIT_TYPE_OPTIONS: Array<{
  type: SplitType
  icon: string
  requiresMuscle?: boolean
}> = [
  { type: 'push_pull_legs', icon: '💪' },
  { type: 'upper_lower', icon: '⚖️' },
  { type: 'full_body', icon: '🔥' },
  { type: 'bro_split', icon: '🦾' },
  { type: 'weak_point_focus', icon: '🎯', requiresMuscle: true },
]

export function ChangeSplitTypeForm({
  userId,
  currentSplitType,
  onSuccess,
}: ChangeSplitTypeFormProps) {
  const t = useTranslations('dashboard.splitCustomization.changeSplitType')
  const { addToast } = useUIStore()

  const [selectedSplitType, setSelectedSplitType] = useState<SplitType | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SplitTypeChangeOutput | null>(null)
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false)

  const requiresMuscleSelection =
    selectedSplitType === 'weak_point_focus' && currentSplitType !== 'weak_point_focus'

  const canAnalyze =
    selectedSplitType &&
    selectedSplitType !== currentSplitType &&
    (!requiresMuscleSelection || selectedMuscle)

  const handleAnalyze = async () => {
    if (!canAnalyze) return

    setAnalyzing(true)
    try {
      const result = await analyzeSplitTypeChangeAction(
        userId,
        selectedSplitType!,
        selectedMuscle || undefined
      )

      if (result.success && result.data) {
        setAnalysis(result.data)
        setShowRecommendationDialog(true)
      } else {
        addToast(result.error || 'Failed to analyze split type change', 'error')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      addToast('Failed to analyze split type change', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>{t('currentSplit')}:</strong>{' '}
            {t(`splitTypes.${currentSplitType}.name`, {
              defaultValue: currentSplitType,
            })}
          </p>
        </div>
      </div>

      {/* Split Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('selectNewSplit')}
        </label>

        <div className="grid grid-cols-1 gap-3">
          {SPLIT_TYPE_OPTIONS.map((option) => {
            const isCurrentSplit = option.type === currentSplitType
            const isSelected = option.type === selectedSplitType

            return (
              <button
                key={option.type}
                onClick={() => {
                  if (!isCurrentSplit) {
                    setSelectedSplitType(option.type)
                    if (!option.requiresMuscle) {
                      setSelectedMuscle(null)
                    }
                  }
                }}
                disabled={isCurrentSplit}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isCurrentSplit
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{option.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold mb-1">
                      {t(`splitTypes.${option.type}.name`, {
                        defaultValue: option.type,
                      })}
                      {isCurrentSplit && (
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                          ({t('currentSplitBadge')})
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(`splitTypes.${option.type}.description`, {
                        defaultValue: `${option.type} split`,
                      })}
                    </p>
                    {option.requiresMuscle && !isCurrentSplit && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        {t('requiresMuscleSelection')}
                      </p>
                    )}
                  </div>
                  {isSelected && !isCurrentSplit && (
                    <div className="text-purple-600 dark:text-purple-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Muscle Selection for Weak Point Focus */}
      {requiresMuscleSelection && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('selectWeakPointMuscle')}
          </label>

          <div className="space-y-4">
            {MUSCLE_GROUP_CATEGORIES.map((category) => (
              <div key={category.category} className="space-y-2">
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {category.category}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {category.muscles.map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => setSelectedMuscle(muscle)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMuscle === muscle
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {muscle.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      {selectedSplitType && selectedSplitType !== currentSplitType && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm text-purple-900 dark:text-purple-100">
            <strong>ℹ️ {t('aiAnalysisNote.title')}:</strong>{' '}
            {t('aiAnalysisNote.description')}
          </p>
        </div>
      )}

      {/* Analyze Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
        >
          {analyzing ? (
            <>
              <span className="inline-block animate-spin mr-2">⚙️</span>
              {t('analyzingButton')}
            </>
          ) : (
            <>🤖 {t('analyzeButton')}</>
          )}
        </Button>
      </div>

      {/* Recommendation Dialog */}
      {analysis && (
        <SplitTypeRecommendationDialog
          open={showRecommendationDialog}
          onOpenChange={setShowRecommendationDialog}
          analysis={analysis}
          targetSplitType={selectedSplitType!}
          weakPointMuscle={selectedMuscle || undefined}
          userId={userId}
          onSuccess={onSuccess}
        />
      )}
    </div>
  )
}
