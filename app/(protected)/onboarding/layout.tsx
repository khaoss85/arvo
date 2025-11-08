'use client'

import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const steps = [
  { id: 1, name: 'Approach', path: '/onboarding/approach' },
  { id: 2, name: 'Weak Points', path: '/onboarding/weak-points' },
  { id: 3, name: 'Equipment', path: '/onboarding/equipment' },
  { id: 4, name: 'Strength', path: '/onboarding/strength' },
  { id: 5, name: 'Review', path: '/onboarding/review' }
]

export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { currentStep, completedSteps } = useOnboardingStore()
  const router = useRouter()

  const canGoBack = currentStep > 1
  const canGoNext = completedSteps.includes(currentStep) && currentStep < steps.length

  const goBack = () => {
    const prevStep = steps[currentStep - 2]
    if (prevStep) {
      router.push(prevStep.path)
    }
  }

  const goNext = () => {
    const nextStep = steps[currentStep]
    if (nextStep) {
      router.push(nextStep.path)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress indicator */}
      <div className="p-4 border-b bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center text-xs font-medium ${
                  step.id <= currentStep
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {step.name}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={!canGoBack}
          >
            Back
          </Button>
          {currentStep < steps.length && (
            <Button
              onClick={goNext}
              disabled={!canGoNext}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
