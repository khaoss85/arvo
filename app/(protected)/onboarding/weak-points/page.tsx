'use client'

import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { BodyMap } from '@/components/features/onboarding/body-map'
import { Button } from '@/components/ui/button'

export default function WeakPointsPage() {
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [selectedParts, setSelectedParts] = useState<string[]>(data.weakPoints || [])

  useEffect(() => {
    setStep(4)
  }, [setStep])

  const handleToggle = (part: string) => {
    if (selectedParts.includes(part)) {
      // Remove part
      const updated = selectedParts.filter(p => p !== part)
      setSelectedParts(updated)
      setStepData('weakPoints', updated)
    } else {
      // Add part (max 5)
      if (selectedParts.length < 5) {
        const updated = [...selectedParts, part]
        setSelectedParts(updated)
        setStepData('weakPoints', updated)
      }
    }
  }

  const handleSkip = () => {
    setStepData('weakPoints', [])
    completeStep(4)
  }

  const handleContinue = () => {
    completeStep(4)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Identify Your Weak Points</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Select up to 5 muscle groups that you want to prioritize. The AI will adjust workout volume and exercise selection accordingly.
        <span className="block mt-2 text-sm italic">
          This is optional - you can skip if you don't have specific weak points.
        </span>
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
        <BodyMap
          selectedParts={selectedParts}
          onToggle={handleToggle}
        />
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          Skip (No weak points)
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedParts.length === 0}
        >
          Continue with {selectedParts.length} {selectedParts.length === 1 ? 'selection' : 'selections'}
        </Button>
      </div>
    </div>
  )
}
