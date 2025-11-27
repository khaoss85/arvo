'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SportGoalSelector } from './sport-goal-selector'
import { useApproachRecommendation } from '@/lib/hooks/useApproachRecommendation'
import { useAppModeStore } from '@/lib/stores/app-mode.store'
import type { SportGoal } from '@/lib/types/schemas'
import type { ApproachRecommendationOutput } from '@/lib/agents/approach-recommender.agent'

interface ApproachRecommendationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectApproach: (approachId: string) => void
  // User input for recommendation
  availableEquipment: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingObjective: 'bulk' | 'cut' | 'maintain' | 'recomp' | null
  weeklyFrequency: number
  age?: number | null
  gender?: 'male' | 'female' | 'other' | null
  // Map approach IDs to names for display
  approachNames: Record<string, string>
  // Current sport goal (from onboarding store)
  initialSportGoal?: SportGoal
  onSportGoalChange?: (goal: SportGoal) => void
}

export function ApproachRecommendationDialog({
  open,
  onOpenChange,
  onSelectApproach,
  availableEquipment,
  experienceLevel,
  trainingObjective,
  weeklyFrequency,
  age,
  gender,
  approachNames,
  initialSportGoal,
  onSportGoalChange
}: ApproachRecommendationDialogProps) {
  const t = useTranslations('onboarding.steps.approach.recommendation')
  const { mode: appMode } = useAppModeStore()
  const [sportGoal, setSportGoal] = useState<SportGoal>(initialSportGoal || 'none')
  const [recommendation, setRecommendation] = useState<ApproachRecommendationOutput | null>(null)

  const { mutate: getRecommendation, isPending, isError, error } = useApproachRecommendation()

  const handleSportGoalChange = (goal: SportGoal) => {
    setSportGoal(goal)
    onSportGoalChange?.(goal)
  }

  const handleGetRecommendation = () => {
    getRecommendation(
      {
        availableEquipment,
        experienceLevel,
        trainingObjective,
        sportGoal,
        weeklyFrequency,
        age,
        gender
      },
      {
        onSuccess: (result) => {
          if (result) {
            setRecommendation(result)
          }
        }
      }
    )
  }

  const handleAccept = () => {
    if (recommendation) {
      onSelectApproach(recommendation.recommendedApproachId)
      onOpenChange(false)
    }
  }

  const handleSelectAlternative = (approachId: string) => {
    onSelectApproach(approachId)
    onOpenChange(false)
  }

  const resetAndClose = () => {
    setRecommendation(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sport Goal Selector */}
          {!recommendation && (
            <SportGoalSelector
              value={sportGoal}
              onChange={handleSportGoalChange}
            />
          )}

          {/* Loading State */}
          {isPending && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('analyzing')}
              </p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-500 text-center">
                {error?.message || t('error')}
              </p>
              <Button variant="outline" size="sm" onClick={handleGetRecommendation}>
                {t('retry')}
              </Button>
            </div>
          )}

          {/* Recommendation Result */}
          {recommendation && !isPending && (
            <div className="space-y-4">
              {/* Main Recommendation */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {approachNames[recommendation.recommendedApproachId] || 'Unknown Approach'}
                  </span>
                </div>

                {/* Show rationale for advanced users */}
                {appMode === 'advanced' && (
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    {recommendation.rationale}
                  </p>
                )}

                {/* Confidence badge */}
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <span>
                    {t('confidence')}: {Math.round(recommendation.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Alternatives (for advanced users) */}
              {appMode === 'advanced' && recommendation.alternatives && recommendation.alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('alternatives')}
                  </p>
                  {recommendation.alternatives.map((alt) => (
                    <button
                      key={alt.approachId}
                      onClick={() => handleSelectAlternative(alt.approachId)}
                      className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {approachNames[alt.approachId] || 'Unknown Approach'}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {alt.reason}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetAndClose} className="flex-1">
                  {t('chooseManually')}
                </Button>
                <Button onClick={handleAccept} className="flex-1">
                  {t('useRecommendation')}
                </Button>
              </div>
            </div>
          )}

          {/* Initial State - Get Recommendation Button */}
          {!recommendation && !isPending && !isError && (
            <Button
              onClick={handleGetRecommendation}
              className="w-full"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('getRecommendation')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
