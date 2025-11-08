'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { ApproachCard } from '@/components/features/onboarding/approach-card'
import type { TrainingApproach } from '@/lib/types/schemas'

export default function ApproachSelectionPage() {
  const router = useRouter()
  const [approaches, setApproaches] = useState<TrainingApproach[]>([])
  const [loading, setLoading] = useState(true)
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  useEffect(() => {
    setStep(1)
    loadApproaches()
  }, [setStep])

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
    completeStep(1)
    router.push('/onboarding/profile')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Choose Your Training Philosophy</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Select the approach that best aligns with your training style. This will guide how the AI generates your workouts.
      </p>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading training approaches...</p>
        </div>
      ) : approaches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No training approaches found. Please run the seed script to populate the Kuba Method.
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
