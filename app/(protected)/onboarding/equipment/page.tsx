'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { EquipmentSelector } from '@/components/equipment/equipment-selector'

export default function EquipmentPreferencesPage() {
  const t = useTranslations('onboarding.steps.equipment')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  const experienceLevel = data.experienceLevel
  // Calculate step number dynamically: 4 for beginner, 6 for intermediate/advanced
  const currentStepNumber = experienceLevel === 'beginner' ? 4 : 6

  useEffect(() => {
    setStep(currentStepNumber)
  }, [setStep, currentStepNumber])

  const handleSelectionChange = (equipment: string[]) => {
    setStepData('availableEquipment', equipment)
  }

  const handleComplete = () => {
    completeStep(currentStepNumber)

    // Navigate based on experience level
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/review')
    } else {
      // Approach selection moved here so AI has full context (equipment, goals, etc.)
      router.push('/onboarding/approach')
    }
  }

  const handleBack = () => {
    // Navigate back based on experience level
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/split')
    } else {
      router.push('/onboarding/weak-points')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tCommon('back')}</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('description')}
        </p>
      </div>

      {/* Equipment selector */}
      <EquipmentSelector
        initialSelection={data.availableEquipment || []}
        onSelectionChange={handleSelectionChange}
        onComplete={handleComplete}
      />
    </div>
  )
}
