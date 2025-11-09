'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { EquipmentSelector } from '@/components/equipment/equipment-selector'

export default function EquipmentPreferencesPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Equipment Preferences
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Select all the equipment you have access to. The AI will use this to generate personalized workouts.
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
