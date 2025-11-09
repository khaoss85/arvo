'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const keyLifts = [
  { id: 'bench_press', label: 'Bench Press', placeholder: 'e.g., 80kg' },
  { id: 'squat', label: 'Squat', placeholder: 'e.g., 100kg' },
  { id: 'deadlift', label: 'Deadlift', placeholder: 'e.g., 120kg' },
  { id: 'overhead_press', label: 'Overhead Press', placeholder: 'e.g., 50kg' }
]

export default function StrengthBaselinePage() {
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [baseline, setBaseline] = useState<Record<string, { weight: number; reps: number; rir: number }>>(
    data.strengthBaseline || {}
  )

  useEffect(() => {
    setStep(6)
  }, [setStep])

  const handleUpdate = (liftId: string, field: 'weight' | 'reps' | 'rir', value: string) => {
    const numValue = parseFloat(value) || 0
    const updated = {
      ...baseline,
      [liftId]: {
        ...(baseline[liftId] || { weight: 0, reps: 0, rir: 0 }),
        [field]: numValue
      }
    }
    setBaseline(updated)
    setStepData('strengthBaseline', updated)
  }

  const handleRemove = (liftId: string) => {
    const updated = { ...baseline }
    delete updated[liftId]
    setBaseline(updated)
    setStepData('strengthBaseline', updated)
  }

  const handleSkip = () => {
    setStepData('strengthBaseline', {})
    completeStep(6)
    router.push('/onboarding/review')
  }

  const handleContinue = () => {
    completeStep(6)
    router.push('/onboarding/review')
  }

  const isValidEntry = (entry: any) => {
    return entry && entry.weight > 0 && entry.reps > 0 && entry.rir >= 0
  }

  const hasValidEntries = Object.values(baseline).some(isValidEntry)

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/onboarding/equipment')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Equipment</span>
      </button>

      <h1 className="text-3xl font-bold mb-2">Strength Baseline</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Record your current strength levels for key lifts. This helps the AI set appropriate starting weights for your workouts.
        <span className="block mt-2 text-sm italic">
          This is optional - the AI can estimate starting weights if you skip this step.
        </span>
      </p>

      <div className="space-y-6">
        {keyLifts.map((lift) => {
          const entry = baseline[lift.id]
          const isValid = isValidEntry(entry)

          return (
            <div
              key={lift.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{lift.label}</h3>
                {entry && (
                  <button
                    onClick={() => handleRemove(lift.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={entry?.weight || ''}
                    onChange={(e) => handleUpdate(lift.id, 'weight', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Reps
                  </label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={entry?.reps || ''}
                    onChange={(e) => handleUpdate(lift.id, 'reps', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    RIR
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    min="0"
                    max="5"
                    value={entry?.rir ?? ''}
                    onChange={(e) => handleUpdate(lift.id, 'rir', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {entry && !isValid && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please fill in all fields for this lift
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Tip:</strong> RIR (Reps in Reserve) indicates how many more reps you could have done.
          For example, RIR 1 means you stopped with 1 rep left in the tank.
        </p>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          Skip (AI will estimate)
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!hasValidEntries && Object.keys(baseline).length > 0}
        >
          {hasValidEntries
            ? `Continue with ${Object.values(baseline).filter(isValidEntry).length} ${Object.values(baseline).filter(isValidEntry).length === 1 ? 'lift' : 'lifts'}`
            : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
