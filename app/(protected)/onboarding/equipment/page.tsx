'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { EquipmentSelector } from '@/components/equipment/equipment-selector'

export default function EquipmentPreferencesPage() {
  const t = useTranslations('onboarding.equipment')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  useEffect(() => {
    setStep(5)
  }, [setStep])

  const handleSelectionChange = (equipment: string[]) => {
    setStepData('availableEquipment', equipment)
  }

  const handleComplete = () => {
    completeStep(5)
    router.push('/onboarding/strength')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {/* Back Button */}
        <button
          onClick={() => router.push('/onboarding/weak-points')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('backToWeakPoints')}</span>
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
