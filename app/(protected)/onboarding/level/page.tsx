'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { GraduationCap, Dumbbell, Trophy } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import type { ExperienceLevel } from '@/lib/types/onboarding'

interface LevelOption {
  level: ExperienceLevel
  icon: typeof GraduationCap
  iconColor: string
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 'beginner',
    icon: GraduationCap,
    iconColor: 'text-green-600 dark:text-green-500'
  },
  {
    level: 'intermediate',
    icon: Dumbbell,
    iconColor: 'text-blue-600 dark:text-blue-500'
  },
  {
    level: 'advanced',
    icon: Trophy,
    iconColor: 'text-purple-600 dark:text-purple-500'
  }
]

export default function ExperienceLevelPage() {
  const t = useTranslations('onboarding.steps.level')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(
    data.experienceLevel || null
  )

  useEffect(() => {
    setStep(1) // This is the first step
  }, [setStep])

  const handleSelectLevel = (level: ExperienceLevel) => {
    setSelectedLevel(level)
  }

  const handleContinue = () => {
    if (!selectedLevel) return

    setStepData('experienceLevel', selectedLevel)
    completeStep(1)

    // Route based on experience level
    // All levels now go to profile first
    // Approach selection moved later in the flow (after equipment) for better AI recommendations
    router.push('/onboarding/profile')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-6">{t('title')}</h2>

      {/* Level Options */}
      <div className="space-y-4 mb-8">
        {LEVEL_OPTIONS.map((option) => {
          const IconComponent = option.icon
          const isSelected = selectedLevel === option.level

          return (
            <button
              key={option.level}
              onClick={() => handleSelectLevel(option.level)}
              className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full ${
                    isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'
                  } flex items-center justify-center`}
                >
                  <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600 dark:text-blue-400' : option.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-1">{t(`options.${option.level}.title`)}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {t(`options.${option.level}.description`)}
                  </p>

                  {/* Examples */}
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {t(`options.${option.level}.examples`)}
                  </p>
                </div>

                {/* Checkmark */}
                {isSelected && (
                  <div className="flex-shrink-0 text-blue-600 dark:text-blue-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedLevel}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            selectedLevel
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
