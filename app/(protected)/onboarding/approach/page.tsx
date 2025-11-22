'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { ApproachCard } from '@/components/features/onboarding/approach-card'
import type { TrainingApproach } from '@/lib/types/schemas'

export default function ApproachSelectionPage() {
  const t = useTranslations('onboarding.steps.approach')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const [approaches, setApproaches] = useState<TrainingApproach[]>([])
  const [loading, setLoading] = useState(true)
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  const experienceLevel = data.experienceLevel
  const currentStepNumber = 2 // Step 2 for intermediate/advanced

  useEffect(() => {
    // Redirect beginners - they should skip this step
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/profile')
      return
    }

    setStep(currentStepNumber)
    loadApproaches()
  }, [setStep, experienceLevel, router, currentStepNumber])

  const loadApproaches = async () => {
    try {
      const data = await TrainingApproachService.getAll()
      setApproaches(data)
    } catch (error) {
      console.error('Failed to load approaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectApproach = (approachId: string) => {
    setStepData('approachId', approachId)
    completeStep(currentStepNumber)
    router.push('/onboarding/profile')
  }

  const handleBack = () => {
    router.push('/onboarding/level')
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

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      ) : approaches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {t('noApproachesFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approaches.map((approach) => (
            <ApproachCard
              key={approach.id}
              approach={approach}
              selected={data.approachId === approach.id}
              onSelect={() => selectApproach(approach.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
