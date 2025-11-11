'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressFeedback } from '@/components/ui/progress-feedback'
import type { TrainingApproach } from '@/lib/types/schemas'
import { useAuthStore } from '@/lib/stores/auth.store'
import { estimateExperience, getExperienceLevelDescription, identifyLiftType, type ExperienceEstimate } from '@/lib/utils/experience-calculator'

// Standard lifts for badge identification
const STANDARD_LIFTS = ['bench_press', 'squat', 'deadlift', 'overhead_press']

export default function ReviewPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data, setStep, setStepData, reset } = useOnboardingStore()
  const [approach, setApproach] = useState<TrainingApproach | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [experienceEstimate, setExperienceEstimate] = useState<ExperienceEstimate | null>(null)
  const [customExperience, setCustomExperience] = useState<number | null>(null)
  const [isEditingExperience, setIsEditingExperience] = useState(false)

  useEffect(() => {
    setStep(7)
    if (data.approachId) {
      loadApproach()
    }
    // Calculate experience estimate from strength baseline if available
    if (data.strengthBaseline && Object.keys(data.strengthBaseline).length > 0) {
      const estimate = estimateExperience(
        data.strengthBaseline,
        data.gender || 'other',
        data.weight || undefined
      )
      setExperienceEstimate(estimate)
      // Pre-populate with estimated years if user hasn't confirmed yet
      if (!data.confirmedExperience) {
        setCustomExperience(estimate.years)
      }
    }
  }, [data.approachId, data.strengthBaseline, data.gender, data.weight, setStep])

  const loadApproach = async () => {
    if (!data.approachId) return
    try {
      const approachData = await TrainingApproachService.getById(data.approachId)
      setApproach(approachData)
    } catch (error) {
      console.error('Failed to load approach:', error)
    }
  }

  const handleComplete = () => {
    if (!user) {
      setError('User not found. Please log in again.')
      return
    }

    if (!data.approachId) {
      setError('Please complete all required steps.')
      return
    }

    setLoading(true)
    setError(null)
  }

  const handleGenerationComplete = () => {
    // Clear onboarding state and redirect
    reset()
    router.push('/dashboard')
  }

  const handleGenerationError = (errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
  }

  const handleGenerationCancel = () => {
    setLoading(false)
  }

  const handleEdit = (step: number, path: string) => {
    router.push(path)
  }

  const handleConfirmExperience = () => {
    if (customExperience !== null) {
      setStepData('confirmedExperience', customExperience)
    }
    setIsEditingExperience(false)
  }

  const handleEditExperience = () => {
    setIsEditingExperience(true)
  }

  const handleExperienceChange = (value: string) => {
    const num = value === '' ? null : parseFloat(value)
    if (num !== null && num < 0) return // Validation
    setCustomExperience(num)
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

        {/* Split Selection */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Training Split</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(2, '/onboarding/split')}
            >
              Edit
            </Button>
          </div>
          {data.splitType && data.weeklyFrequency ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Split Type:</span>
                <span className="font-medium capitalize">{data.splitType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Training Frequency:</span>
                <span className="font-medium">{data.weeklyFrequency} days/week</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No split selected</p>
          )}
        </div>

        {/* Profile */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Profile</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(3, '/onboarding/profile')}
            >
              Edit
            </Button>
          </div>
          {data.firstName || data.gender || data.age || data.weight || data.height ? (
            <div className="space-y-1 text-sm">
              {data.firstName && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium">{data.firstName}</span>
                </div>
              )}
              {data.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                  <span className="font-medium capitalize">{data.gender}</span>
                </div>
              )}
              {data.age && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Age:</span>
                  <span className="font-medium">{data.age} years</span>
                </div>
              )}
              {data.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                  <span className="font-medium">{data.weight} kg</span>
                </div>
              )}
              {data.height && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Height:</span>
                  <span className="font-medium">{data.height} cm</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No profile data provided</p>
          )}
        </div>

        {/* Weak Points */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Weak Points</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(4, '/onboarding/weak-points')}
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

        {/* Available Equipment */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Available Equipment</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(5, '/onboarding/equipment')}
            >
              Edit
            </Button>
          </div>
          {data.availableEquipment && data.availableEquipment.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.availableEquipment.map((equipment) => (
                <span
                  key={equipment}
                  className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm"
                >
                  {equipment}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No equipment selected</p>
          )}
        </div>

        {/* Strength Baseline */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Strength Baseline</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(6, '/onboarding/strength')}
            >
              Edit
            </Button>
          </div>
          {data.strengthBaseline && Object.keys(data.strengthBaseline).length > 0 ? (
            <div className="space-y-2 text-sm">
              {Object.entries(data.strengthBaseline).map(([lift, values]) => {
                const isStandard = STANDARD_LIFTS.includes(lift)
                const liftType = identifyLiftType(lift)
                const displayName = lift.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')

                return (
                  <div key={lift} className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{displayName}:</span>
                      {isStandard ? (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          Standard
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          Custom {liftType ? `(→ ${liftType})` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {values.weight}kg × {values.reps} @ RIR {values.rir}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No strength baseline recorded (AI will estimate)
            </p>
          )}
        </div>

        {/* Experience Estimate (only if strength baseline provided) */}
        {experienceEstimate && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Training Experience Estimate</h3>
              {!isEditingExperience ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditExperience}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfirmExperience}
                >
                  Confirm
                </Button>
              )}
            </div>

            {/* AI Estimate Summary */}
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">
                    Based on your strength baseline, you appear to be <strong className="capitalize">{experienceEstimate.level}</strong>
                    {' '}with approximately <strong>{experienceEstimate.years} years</strong> of training experience.
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    Confidence: {experienceEstimate.confidence}%
                    {experienceEstimate.confidence < 70 && ' (Consider providing bodyweight and more lifts for better accuracy)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Experience Level Description */}
            {(() => {
              const desc = getExperienceLevelDescription(experienceEstimate.level)
              return (
                <div className="mb-3 text-sm">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    <strong>{desc.title} ({desc.timeRange}):</strong> {desc.description}
                  </p>
                </div>
              )
            })()}

            {/* Lift Breakdown */}
            {experienceEstimate.breakdown.length > 0 && (
              <details className="mb-3 text-sm">
                <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400">
                  View lift-by-lift breakdown
                </summary>
                <div className="mt-2 space-y-2 pl-2">
                  {experienceEstimate.breakdown.map((lift, idx) => {
                    // Check if this lift is from the original baseline
                    const liftId = lift.liftName.toLowerCase().replace(/\s+/g, '_')
                    const isStandard = STANDARD_LIFTS.includes(liftId)
                    const liftType = identifyLiftType(lift.liftName)

                    return (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300">{lift.liftName}</span>
                          {!isStandard && liftType && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            e1RM: {lift.e1RM}kg
                            {lift.relativeStrength && ` (${lift.relativeStrength}x BW)`}
                          </span>
                          <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            {lift.suggestedLevel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )}

            {/* Edit Experience */}
            {isEditingExperience ? (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Adjust your training experience (years):
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={customExperience || ''}
                  onChange={(e) => handleExperienceChange(e.target.value)}
                  className="w-full"
                  placeholder="e.g., 2.5"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Disagree with the AI estimate? Feel free to adjust it based on your actual training history.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {data.confirmedExperience !== null && data.confirmedExperience !== undefined
                    ? `Confirmed: ${data.confirmedExperience} years`
                    : `Using AI estimate: ${experienceEstimate.years} years`}
                </span>
              </div>
            )}
          </div>
        )}
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

      <div className="mt-8 flex flex-col items-center gap-4">
        {loading ? (
          <ProgressFeedback
            variant="inline"
            endpoint="/api/onboarding/complete/stream"
            requestBody={{
              userId: user?.id,
              approachId: data.approachId,
              weakPoints: data.weakPoints || [],
              availableEquipment: data.availableEquipment || [],
              equipmentPreferences: data.equipmentPreferences || {},
              strengthBaseline: data.strengthBaseline || {},
              firstName: data.firstName || null,
              gender: data.gender || null,
              age: data.age || null,
              weight: data.weight || null,
              height: data.height || null,
              confirmedExperience: data.confirmedExperience || null,
              splitType: data.splitType,
              weeklyFrequency: data.weeklyFrequency
            }}
            cancellable={false}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
            onCancel={handleGenerationCancel}
          />
        ) : (
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="px-8 py-3 text-lg"
          >
            Complete Onboarding
          </Button>
        )}
      </div>
    </div>
  )
}
