'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { OnboardingService } from '@/lib/services/onboarding.service'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { Button } from '@/components/ui/button'
import type { TrainingApproach } from '@/lib/types/schemas'
import { useAuthStore } from '@/lib/stores/auth.store'

export default function ReviewPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data, setStep, reset } = useOnboardingStore()
  const [approach, setApproach] = useState<TrainingApproach | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStep(5)
    if (data.approachId) {
      loadApproach()
    }
  }, [data.approachId, setStep])

  const loadApproach = async () => {
    if (!data.approachId) return
    try {
      const approachData = await TrainingApproachService.getById(data.approachId)
      setApproach(approachData)
    } catch (error) {
      console.error('Failed to load approach:', error)
    }
  }

  const handleComplete = async () => {
    if (!user) {
      setError('User not found. Please log in again.')
      return
    }

    if (!data.approachId || !data.equipmentPreferences) {
      setError('Please complete all required steps.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Complete onboarding - this creates profile and generates first AI workout
      await OnboardingService.completeOnboarding(user.id, {
        approachId: data.approachId,
        weakPoints: data.weakPoints || [],
        equipmentPreferences: data.equipmentPreferences,
        strengthBaseline: data.strengthBaseline || {}
      })

      // Clear onboarding state
      reset()

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding completion error:', error)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (step: number, path: string) => {
    router.push(path)
  }

  if (!data.approachId) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please complete the previous steps first.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Review Your Profile</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review your selections below. The AI will use this information to generate your personalized workouts.
      </p>

      <div className="space-y-4">
        {/* Training Approach */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Training Approach</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(1, '/onboarding/approach')}
            >
              Edit
            </Button>
          </div>
          {approach && (
            <div>
              <p className="font-medium">{approach.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{approach.philosophy}</p>
            </div>
          )}
        </div>

        {/* Weak Points */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Weak Points</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(2, '/onboarding/weak-points')}
            >
              Edit
            </Button>
          </div>
          {data.weakPoints && data.weakPoints.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.weakPoints.map((point) => (
                <span
                  key={point}
                  className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-sm"
                >
                  {point.replace('_', ' ')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No weak points selected</p>
          )}
        </div>

        {/* Equipment Preferences */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Equipment Preferences</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(3, '/onboarding/equipment')}
            >
              Edit
            </Button>
          </div>
          {data.equipmentPreferences && Object.keys(data.equipmentPreferences).length > 0 ? (
            <div className="space-y-1 text-sm">
              {Object.entries(data.equipmentPreferences).map(([pattern, equipment]) => (
                <div key={pattern} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {pattern.replace('_', ' ')}:
                  </span>
                  <span className="font-medium">{equipment}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No equipment preferences set</p>
          )}
        </div>

        {/* Strength Baseline */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Strength Baseline</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(4, '/onboarding/strength')}
            >
              Edit
            </Button>
          </div>
          {data.strengthBaseline && Object.keys(data.strengthBaseline).length > 0 ? (
            <div className="space-y-2 text-sm">
              {Object.entries(data.strengthBaseline).map(([lift, values]) => (
                <div key={lift}>
                  <span className="font-medium capitalize">{lift.replace('_', ' ')}: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {values.weight}kg × {values.reps} reps @ RIR {values.rir}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No strength baseline recorded (AI will estimate)
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>What happens next:</strong> The AI will create your user profile and generate your first personalized workout
          based on the {approach?.name || 'selected approach'} and your preferences. This may take a few moments.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="px-8 py-3 text-lg"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Generating your first workout...
            </>
          ) : (
            'Complete Onboarding'
          )}
        </Button>
      </div>
    </div>
  )
}
