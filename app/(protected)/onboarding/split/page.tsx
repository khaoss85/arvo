'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'

type SplitType = 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom'

interface SplitOption {
  type: SplitType
  name: string
  description: string
  frequency: string
  icon: string
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    type: 'push_pull_legs',
    name: 'Push / Pull / Legs',
    description: 'Separate pushing, pulling, and leg movements across different days. Ideal for balanced development and high frequency.',
    frequency: '3-6 days/week',
    icon: '💪'
  },
  {
    type: 'upper_lower',
    name: 'Upper / Lower',
    description: 'Alternate between upper body and lower body workouts. Great for strength and balanced recovery.',
    frequency: '4-6 days/week',
    icon: '⚖️'
  },
  {
    type: 'full_body',
    name: 'Full Body',
    description: 'Train all major muscle groups each session. Perfect for beginners or those with limited training days.',
    frequency: '2-4 days/week',
    icon: '🔥'
  },
  {
    type: 'custom',
    name: 'Custom Split',
    description: 'Let the AI create a customized split based on your preferences and training approach.',
    frequency: 'Variable',
    icon: '🎯'
  }
]

export default function SplitSelectionPage() {
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [selectedSplit, setSelectedSplit] = useState<SplitType | null>(data.splitType || null)
  const [weeklyFrequency, setWeeklyFrequency] = useState<number>(data.weeklyFrequency || 4)

  useEffect(() => {
    setStep(2) // Assuming this is step 2 after approach selection
  }, [setStep])

  const handleSelectSplit = (splitType: SplitType) => {
    setSelectedSplit(splitType)
  }

  const handleContinue = () => {
    if (!selectedSplit) return

    setStepData('splitType', selectedSplit)
    setStepData('weeklyFrequency', weeklyFrequency)
    completeStep(2)
    router.push('/onboarding/profile')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/onboarding/approach')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Training Approach</span>
      </button>

      <h1 className="text-3xl font-bold mb-2">Choose Your Training Split</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Select how you want to organize your training week. This determines how muscle groups are distributed across workouts.
      </p>

      {/* Split Type Selection */}
      <div className="space-y-4 mb-8">
        {SPLIT_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => handleSelectSplit(option.type)}
            className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
              selectedSplit === option.type
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{option.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{option.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {option.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Typical frequency: {option.frequency}
                </p>
              </div>
              {selectedSplit === option.type && (
                <div className="text-blue-600 dark:text-blue-500">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
        ))}
      </div>

      {/* Weekly Frequency Input */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
        <label className="block mb-4">
          <span className="text-lg font-semibold mb-2 block">
            How many days per week can you train?
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This helps us optimize your split and volume distribution.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="7"
              value={weeklyFrequency}
              onChange={(e) => setWeeklyFrequency(parseInt(e.target.value) || 1)}
              className="w-24 px-4 py-2 text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-600 dark:text-gray-400">days per week</span>
          </div>
        </label>

        {/* Frequency Recommendations */}
        {weeklyFrequency > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {weeklyFrequency <= 2 && (
                <>
                  <strong>Recommendation:</strong> Full Body split is ideal for 2 or fewer training days per week.
                </>
              )}
              {weeklyFrequency === 3 && (
                <>
                  <strong>Recommendation:</strong> Push/Pull/Legs or Full Body work well with 3 days per week.
                </>
              )}
              {weeklyFrequency >= 4 && weeklyFrequency <= 5 && (
                <>
                  <strong>Recommendation:</strong> Upper/Lower or Push/Pull/Legs provide optimal frequency and recovery.
                </>
              )}
              {weeklyFrequency >= 6 && (
                <>
                  <strong>Recommendation:</strong> Push/Pull/Legs allows high frequency training with adequate recovery.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedSplit}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            selectedSplit
              ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
