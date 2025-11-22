'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, AlertCircle } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { AISuggestionCard } from '@/components/onboarding/AISuggestionCard'
import { useAIOnboardingSuggestion } from '@/lib/hooks/useAIOnboardingSuggestion'
import type { TrainingObjective } from '@/lib/types/onboarding'

interface ObjectiveOption {
  objective: TrainingObjective
  icon: typeof TrendingUp
  iconColor: string
}

const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    objective: 'bulk',
    icon: TrendingUp,
    iconColor: 'text-green-600 dark:text-green-500'
  },
  {
    objective: 'cut',
    icon: TrendingDown,
    iconColor: 'text-orange-600 dark:text-orange-500'
  },
  {
    objective: 'maintain',
    icon: Minus,
    iconColor: 'text-blue-600 dark:text-blue-500'
  },
  {
    objective: 'recomp',
    icon: Target,
    iconColor: 'text-purple-600 dark:text-purple-500'
  }
]

export default function GoalsPage() {
  const t = useTranslations('onboarding.steps.goals')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  const [selectedObjective, setSelectedObjective] = useState<TrainingObjective | null>(
    data.trainingObjective || null
  )
  const [injuries, setInjuries] = useState<string>(data.injuries || '')

  const experienceLevel = data.experienceLevel

  useEffect(() => {
    // Redirect beginners - they should skip this step
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/split')
      return
    }

    setStep(4) // Goals is step 4 for intermediate/advanced
  }, [setStep, experienceLevel, router])

  // AI suggestion
  const { suggestion, isLoading } = useAIOnboardingSuggestion({
    step: 'goals',
    userData: {
      experienceLevel: data.experienceLevel,
      age: data.age || undefined
    }
  })

  const handleSelectObjective = (objective: TrainingObjective) => {
    setSelectedObjective(objective)
  }

  const handleContinue = () => {
    if (!selectedObjective) return

    setStepData('trainingObjective', selectedObjective)
    setStepData('injuries', injuries || null)
    completeStep(4)
    router.push('/onboarding/split')
  }

  const handleBack = () => {
    router.push('/onboarding/profile')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{tCommon('back')}</span>
      </button>

      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t('description')}
      </p>

      {/* AI Suggestion */}
      <AISuggestionCard
        suggestion={suggestion}
        isLoading={isLoading}
        className="mb-6"
      />

      {/* Training Objective */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('objectiveQuestion')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OBJECTIVE_OPTIONS.map((option) => {
            const IconComponent = option.icon
            const isSelected = selectedObjective === option.objective

            return (
              <button
                key={option.objective}
                onClick={() => handleSelectObjective(option.objective)}
                className={`text-left p-5 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'
                    } flex items-center justify-center`}
                  >
                    <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : option.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{t(`objectives.${option.objective}.title`)}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(`objectives.${option.objective}.description`)}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0 text-blue-600 dark:text-blue-500">
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

      {/* Injuries/Limitations */}
      <div className="mb-8">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold">{t('injuriesSection.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('injuriesSection.subtitle')}
            </p>
          </div>
        </div>

        <textarea
          value={injuries}
          onChange={(e) => setInjuries(e.target.value)}
          placeholder={t('injuriesSection.placeholder')}
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          rows={4}
        />

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {t('injuriesSection.helperText')}
        </p>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedObjective}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            selectedObjective
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {t('continueButton')}
        </button>
      </div>
    </div>
  )
}
