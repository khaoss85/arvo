'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'

export default function OnboardingEntryPage() {
  const router = useRouter()
  const { data } = useOnboardingStore()

  useEffect(() => {
    // Always start from level selection for new users
    // This ensures a consistent and predictable onboarding flow
    if (!data.experienceLevel) {
      router.push('/onboarding/level')
      return
    }

    // If user has already selected a level, resume from where they left off
    const experienceLevel = data.experienceLevel

    if (experienceLevel === 'beginner') {
      // Beginner flow: level → profile → split → equipment → review
      if (!data.firstName && !data.age && !data.gender) {
        router.push('/onboarding/profile')
      } else if (!data.splitType) {
        router.push('/onboarding/split')
      } else if (!data.availableEquipment || data.availableEquipment.length === 0) {
        router.push('/onboarding/equipment')
      } else {
        router.push('/onboarding/review')
      }
    } else {
      // Intermediate/Advanced flow: level → profile → goals → split → weak-points → equipment → approach → strength → review
      // (approach moved after equipment so AI has full context for recommendations)
      if (!data.firstName && !data.age && !data.gender) {
        router.push('/onboarding/profile')
      } else if (!data.trainingObjective) {
        router.push('/onboarding/goals')
      } else if (!data.splitType) {
        router.push('/onboarding/split')
      } else if (!data.weakPoints || data.weakPoints.length === 0) {
        router.push('/onboarding/weak-points')
      } else if (!data.availableEquipment || data.availableEquipment.length === 0) {
        router.push('/onboarding/equipment')
      } else if (!data.approachId) {
        router.push('/onboarding/approach')
      } else if (!data.strengthBaseline || Object.keys(data.strengthBaseline).length === 0) {
        router.push('/onboarding/strength')
      } else {
        router.push('/onboarding/review')
      }
    }
  }, [router, data])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Caricamento...</p>
      </div>
    </div>
  )
}
