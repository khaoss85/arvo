'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { BodyMap } from '@/components/features/onboarding/body-map'
import { Button } from '@/components/ui/button'

export default function WeakPointsPage() {
  const t = useTranslations('onboarding.steps.weakPoints')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [selectedParts, setSelectedParts] = useState<string[]>(data.weakPoints || [])

  const experienceLevel = data.experienceLevel
  const currentStepNumber = 6 // Step 6 for intermediate/advanced

  useEffect(() => {
    // Redirect beginners - they should skip this step
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/equipment')
      return
    }

    setStep(currentStepNumber)
  }, [setStep, experienceLevel, router, currentStepNumber])

  const handleToggle = (part: string) => {
    if (selectedParts.includes(part)) {
      // Remove part
      const updated = selectedParts.filter(p => p !== part)
      setSelectedParts(updated)
      setStepData('weakPoints', updated)
    } else {
      // Add part (max 3)
      if (selectedParts.length < 3) {
        const updated = [...selectedParts, part]
        setSelectedParts(updated)
        setStepData('weakPoints', updated)
      }
    }
  }

  const handleSkip = () => {
    setStepData('weakPoints', [])
    completeStep(currentStepNumber)
    router.push('/onboarding/equipment')
  }

  const handleContinue = () => {
    completeStep(currentStepNumber)
    router.push('/onboarding/equipment')
  }

  const handleBack = () => {
    router.push('/onboarding/split')
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
        <span className="block mt-2 text-sm italic">
          {t('optionalNote')}
        </span>
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
        <BodyMap
          selectedParts={selectedParts}
          onToggle={handleToggle}
        />
      </div>

      <div className="sticky bottom-0 mt-8 bg-gray-50 dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          {t('skipButton')}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedParts.length === 0}
        >
          {t('continueButton', { count: selectedParts.length })}
        </Button>
      </div>
    </div>
  )
}
