'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'

const movementPatterns = [
  {
    id: 'chest',
    label: 'Chest (Horizontal Push)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables', 'Bodyweight']
  },
  {
    id: 'back_horizontal',
    label: 'Back (Horizontal Pull)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  },
  {
    id: 'back_vertical',
    label: 'Back (Vertical Pull)',
    options: ['Pull-up Bar', 'Lat Machine', 'Cables']
  },
  {
    id: 'shoulders',
    label: 'Shoulders (Vertical Push)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  },
  {
    id: 'legs_quad',
    label: 'Legs (Quad Dominant)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Bodyweight']
  },
  {
    id: 'legs_hip',
    label: 'Legs (Hip Dominant)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  }
]

export default function EquipmentPreferencesPage() {
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [preferences, setPreferences] = useState<Record<string, string>>(
    data.equipmentPreferences || {}
  )

  useEffect(() => {
    setStep(5)
  }, [setStep])

  const handleSelect = (pattern: string, equipment: string) => {
    const updated = { ...preferences, [pattern]: equipment }
    setPreferences(updated)
    setStepData('equipmentPreferences', updated)

    // Auto-complete if all patterns selected
    if (Object.keys(updated).length === movementPatterns.length) {
      completeStep(5)
      router.push('/onboarding/strength')
    }
  }

  const handleQuickPreset = (preset: string) => {
    let presetPreferences: Record<string, string> = {}

    switch (preset) {
      case 'full_gym':
        presetPreferences = {
          chest: 'Barbell',
          back_horizontal: 'Machine',
          back_vertical: 'Lat Machine',
          shoulders: 'Dumbbells',
          legs_quad: 'Barbell',
          legs_hip: 'Barbell'
        }
        break
      case 'home_gym':
        presetPreferences = {
          chest: 'Dumbbells',
          back_horizontal: 'Dumbbells',
          back_vertical: 'Pull-up Bar',
          shoulders: 'Dumbbells',
          legs_quad: 'Dumbbells',
          legs_hip: 'Dumbbells'
        }
        break
      case 'machines_only':
        presetPreferences = {
          chest: 'Machine',
          back_horizontal: 'Machine',
          back_vertical: 'Lat Machine',
          shoulders: 'Machine',
          legs_quad: 'Machine',
          legs_hip: 'Machine'
        }
        break
    }

    setPreferences(presetPreferences)
    setStepData('equipmentPreferences', presetPreferences)
    completeStep(5)
    router.push('/onboarding/strength')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Equipment Preferences</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        How do you prefer to train each movement pattern? This helps the AI select exercises you'll actually be able to perform.
      </p>

      {/* Quick presets */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-3">Quick Presets:</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset('full_gym')}
          >
            Full Gym
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset('home_gym')}
          >
            Home Gym
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset('machines_only')}
          >
            Machines Only
          </Button>
        </div>
      </div>

      {/* Pattern preferences */}
      <div className="space-y-4">
        {movementPatterns.map((pattern) => (
          <div
            key={pattern.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
          >
            <h3 className="font-medium mb-3">{pattern.label}</h3>
            <div className="flex flex-wrap gap-2">
              {pattern.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(pattern.id, option)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
                    preferences[pattern.id] === option
                      ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {Object.keys(preferences).length} of {movementPatterns.length} patterns configured
        </p>
      </div>
    </div>
  )
}
