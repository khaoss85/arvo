'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { TrainingApproachService } from '@/lib/services/training-approach.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressFeedback } from '@/components/ui/progress-feedback'
import { useOnboardingPhases } from '@/components/ui/progress-phases'
import type { TrainingApproach } from '@/lib/types/schemas'
import { useAuthStore } from '@/lib/stores/auth.store'
import { estimateExperience, getExperienceLevelDescription, identifyLiftType, type ExperienceEstimate } from '@/lib/utils/experience-calculator'
import { getEquipmentLabel } from '@/lib/constants/equipment-taxonomy'
import { MedicalDisclaimerModal } from '@/components/features/legal/medical-disclaimer-modal'
import { getActiveSplitPlanAction } from '@/app/actions/split-actions'

// Standard lifts for badge identification
const STANDARD_LIFTS = ['bench_press', 'squat', 'deadlift', 'overhead_press']

export default function ReviewPage() {
  const t = useTranslations('onboarding.steps.review')
  const tReview = useTranslations('onboarding.reviewPage')
  const router = useRouter()
  const { user } = useAuthStore()
  const { data, setStep, setStepData, reset } = useOnboardingStore()
  const onboardingPhases = useOnboardingPhases()
  const [approach, setApproach] = useState<TrainingApproach | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [experienceEstimate, setExperienceEstimate] = useState<ExperienceEstimate | null>(null)
  const [customExperience, setCustomExperience] = useState<number | null>(null)
  const [isEditingExperience, setIsEditingExperience] = useState(false)
  const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false)
  const [checkingForCompletedSetup, setCheckingForCompletedSetup] = useState(true)

  // State for resuming in-progress generation
  const [resumingGeneration, setResumingGeneration] = useState(false)
  const [existingRequestId, setExistingRequestId] = useState<string | null>(null)
  const [existingProgress, setExistingProgress] = useState<number>(0)

  // Use ref for requestId to avoid React batching issues - ref is synchronous and immediately available
  const generationRequestIdRef = useRef<string | null>(null)

  const experienceLevel = data.experienceLevel
  const isBeginner = experienceLevel === 'beginner'

  // Calculate correct step number based on experience level
  const currentStepNumber = isBeginner ? 5 : 9

  useEffect(() => {
    setStep(currentStepNumber)
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
  }, [data.approachId, data.strengthBaseline, data.gender, data.weight, setStep, currentStepNumber])

  // Check on mount if onboarding was already completed or in progress (resume check)
  useEffect(() => {
    const checkForCompletedSetup = async () => {
      if (!user?.id) {
        setCheckingForCompletedSetup(false)
        return
      }

      try {
        const { GenerationQueueService } = await import('@/lib/services/generation-queue.service')

        // Check if there's an active generation for this user
        const activeGeneration = await GenerationQueueService.getActiveGeneration(user.id)

        if (!activeGeneration) {
          setCheckingForCompletedSetup(false)
          return
        }

        // Check if it's an onboarding generation (not workout generation)
        const context = activeGeneration.context as any
        const isOnboarding = context?.type === 'split' || context?.type === 'onboarding'

        if (!isOnboarding) {
          // This is a workout generation, not onboarding - ignore
          setCheckingForCompletedSetup(false)
          return
        }

        // Check if generation is stale (>10 minutes old)
        const ageMs = Date.now() - new Date(activeGeneration.created_at).getTime()
        if (ageMs > 10 * 60 * 1000) {
          console.log('[ReviewPage] Generation is stale (>10 minutes), allowing fresh start')
          setCheckingForCompletedSetup(false)
          return
        }

        // Handle different generation statuses
        switch (activeGeneration.status) {
          case 'completed':
            if (activeGeneration.split_plan_id) {
              console.log('[ReviewPage] Found completed onboarding setup, redirecting to dashboard...')
              reset()
              router.push('/dashboard')
            }
            break

          case 'in_progress':
          case 'pending':
            console.log('[ReviewPage] Resuming in-progress generation:', activeGeneration.request_id, 'at', activeGeneration.progress_percent + '%')
            setExistingRequestId(activeGeneration.request_id)
            generationRequestIdRef.current = activeGeneration.request_id // Set ref for resuming
            setExistingProgress(activeGeneration.progress_percent || 0)
            setResumingGeneration(true)
            setLoading(true) // Show progress bar immediately
            break

          case 'failed':
            console.log('[ReviewPage] Previous generation failed:', activeGeneration.error_message)
            setError(activeGeneration.error_message || 'Previous generation failed. Please try again.')
            break
        }
      } catch (error) {
        console.error('[ReviewPage] Failed to check for completed setup:', error)
        // Don't block the UI - just log error
      } finally {
        setCheckingForCompletedSetup(false)
      }
    }

    checkForCompletedSetup()
  }, [user?.id, router, reset])

  const loadApproach = async () => {
    if (!data.approachId) return
    try {
      const approachData = await TrainingApproachService.getById(data.approachId)
      setApproach(approachData)
    } catch (error) {
      console.error('Failed to load approach:', error)
    }
  }

  const handleCompleteClick = () => {
    // Validate first
    if (!user) {
      setError(t('errors.userNotFound'))
      return
    }

    if (!data.approachId) {
      setError(t('errors.completeSteps'))
      return
    }

    // Generate requestId BEFORE opening modal (if not resuming)
    // Use ref instead of state to avoid React batching issues
    if (!resumingGeneration && !generationRequestIdRef.current) {
      generationRequestIdRef.current = crypto.randomUUID()
    }

    // Open medical disclaimer modal
    setShowMedicalDisclaimer(true)
  }

  const handleMedicalDisclaimerAccept = () => {
    // User accepted disclaimer, proceed with onboarding
    setShowMedicalDisclaimer(false)

    // RequestId was already generated in handleCompleteClick
    // Just start loading the ProgressFeedback component
    setLoading(true)
    setError(null)
  }

  const handleMedicalDisclaimerCancel = () => {
    setShowMedicalDisclaimer(false)
  }

  const handleGenerationComplete = async (data: any) => {
    if (!user?.id) {
      setError('User not found')
      return
    }

    const splitPlanId = data?.splitPlanId
    if (!splitPlanId) {
      console.warn('[ReviewPage] Split plan ID missing in completion event, redirecting anyway')
      reset()
      router.push('/dashboard')
      return
    }

    console.log(`[ReviewPage] Generation complete, verifying split ${splitPlanId} is visible in DB...`)

    // Polling to verify split is visible in DB before redirect
    // This prevents race condition where dashboard loads before split is committed
    const maxRetries = 10
    const retryDelay = 500 // ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await getActiveSplitPlanAction(user.id)

        if (result.success && result.data?.id === splitPlanId) {
          console.log(`[ReviewPage] Split verified in DB after ${attempt} attempt(s), redirecting...`)
          reset()
          router.push('/dashboard')
          return
        }

        console.log(`[ReviewPage] Attempt ${attempt}/${maxRetries}: Split not yet visible, retrying...`)
      } catch (error) {
        console.error(`[ReviewPage] Error verifying split (attempt ${attempt}):`, error)
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    // Timeout - redirect anyway to avoid blocking user
    console.warn(`[ReviewPage] Timeout waiting for split to be visible (${maxRetries * retryDelay}ms), redirecting anyway`)
    reset()
    router.push('/dashboard')
  }

  const handleGenerationError = (errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
  }

  const handleGenerationCancel = async () => {
    // Mark the generation as cancelled in the database
    const requestIdToCancel = generationRequestIdRef.current || existingRequestId

    if (requestIdToCancel) {
      try {
        const { GenerationQueueService } = await import('@/lib/services/generation-queue.service')

        // Mark as failed with "User cancelled" message
        await GenerationQueueService.markAsFailed({
          requestId: requestIdToCancel,
          errorMessage: 'User cancelled generation'
        })

        console.log('[ReviewPage] Cancelled generation:', requestIdToCancel)
      } catch (error) {
        console.error('[ReviewPage] Failed to cancel generation:', error)
        // Continue with state reset even if DB update fails
      }
    }

    // Reset all state
    setLoading(false)
    setResumingGeneration(false)
    setExistingRequestId(null)
    setExistingProgress(0)
    generationRequestIdRef.current = null // Reset ref
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

  // Show loading while checking for completed setup
  if (checkingForCompletedSetup) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          {t('loading')}
        </p>
      </div>
    )
  }

  if (!data.approachId) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          {t('completeSteps')}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t('description')}
      </p>

      <div className="space-y-4">
        {/* Experience Level */}
        {data.experienceLevel && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('sections.experienceLevel')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(1, '/onboarding/level')}
              >
                {tReview('edit')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium capitalize">
                {t(`experienceLevel.${data.experienceLevel}`)}
              </span>
            </div>
          </div>
        )}

        {/* Training Approach - Only for intermediate/advanced */}
        {!isBeginner && approach && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('sections.approach')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(2, '/onboarding/approach')}
              >
                {tReview('edit')}
              </Button>
            </div>
            <div>
              <p className="font-medium">{approach.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{approach.short_philosophy || approach.philosophy}</p>
            </div>
          </div>
        )}

        {/* Split Selection */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t('sections.split')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(isBeginner ? 3 : 5, '/onboarding/split')}
            >
              {tReview('edit')}
            </Button>
          </div>
          {data.splitType && data.weeklyFrequency ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tReview('splitType')}</span>
                <span className="font-medium capitalize">{data.splitType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tReview('trainingFrequency')}</span>
                <span className="font-medium">{data.weeklyFrequency} {tReview('daysPerWeek')}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{tReview('noSplitSelected')}</p>
          )}
        </div>

        {/* Profile */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{tReview('profile')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(isBeginner ? 2 : 3, '/onboarding/profile')}
            >
              {tReview('edit')}
            </Button>
          </div>
          {data.firstName || data.gender || data.age || data.weight || data.height ? (
            <div className="space-y-1 text-sm">
              {data.firstName && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tReview('profileLabels.name')}</span>
                  <span className="font-medium">{data.firstName}</span>
                </div>
              )}
              {data.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tReview('profileLabels.gender')}</span>
                  <span className="font-medium capitalize">{data.gender}</span>
                </div>
              )}
              {data.age && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tReview('profileLabels.age')}</span>
                  <span className="font-medium">{data.age} {tReview('profileLabels.years')}</span>
                </div>
              )}
              {data.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tReview('profileLabels.weight')}</span>
                  <span className="font-medium">{data.weight} kg</span>
                </div>
              )}
              {data.height && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tReview('profileLabels.height')}</span>
                  <span className="font-medium">{data.height} cm</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{tReview('noProfileData')}</p>
          )}
        </div>

        {/* Goals - Only for intermediate/advanced */}
        {!isBeginner && (data.trainingObjective || data.injuries) && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('sections.goals')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(4, '/onboarding/goals')}
              >
                {tReview('edit')}
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              {data.trainingObjective && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('goals.objective')}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs font-medium capitalize">
                    {data.trainingObjective}
                  </span>
                </div>
              )}
              {data.injuries && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">{t('goals.injuries')}</span>
                  <p className="text-gray-900 dark:text-gray-100 text-xs bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                    {data.injuries}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weak Points - Only for intermediate/advanced */}
        {!isBeginner && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('sections.weakPoints')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(6, '/onboarding/weak-points')}
              >
                {tReview('edit')}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">{tReview('noWeakPoints')}</p>
            )}
          </div>
        )}

        {/* Available Equipment */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t('sections.equipment')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(isBeginner ? 4 : 7, '/onboarding/equipment')}
            >
              {tReview('edit')}
            </Button>
          </div>
          {data.availableEquipment && data.availableEquipment.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.availableEquipment.map((equipment) => (
                <span
                  key={equipment}
                  className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm"
                >
                  {getEquipmentLabel(equipment)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">{tReview('noEquipment')}</p>
          )}
        </div>

        {/* Strength Baseline - Only for intermediate/advanced */}
        {!isBeginner && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t('sections.strength')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(8, '/onboarding/strength')}
              >
                {tReview('edit')}
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
                          {tReview('strengthBaseline.standard')}
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          {tReview('strengthBaseline.custom')} {liftType ? `(→ ${liftType})` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {values.weight}kg × {values.reps} {tReview('strengthBaseline.at')} RIR {values.rir}
                    </span>
                  </div>
                )
              })}
            </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tReview('strengthBaseline.noBaseline')}
              </p>
            )}
          </div>
        )}

        {/* Experience Estimate (only if strength baseline provided and intermediate/advanced) */}
        {!isBeginner && experienceEstimate && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{tReview('strengthBaseline.experienceTitle')}</h3>
              {!isEditingExperience ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditExperience}
                >
                  {tReview('edit')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfirmExperience}
                >
                  {t('labels.confirm')}
                </Button>
              )}
            </div>

            {/* AI Estimate Summary */}
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">
                    {tReview('strengthBaseline.basedOnStrength')} <strong className="capitalize">{experienceEstimate.level}</strong>
                    {' '}{tReview('strengthBaseline.withApproximately')} <strong>{experienceEstimate.years} {tReview('profileLabels.years')}</strong> {tReview('strengthBaseline.ofExperience')}.
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    {tReview('strengthBaseline.confidence')} {experienceEstimate.confidence}%
                    {experienceEstimate.confidence < 70 && ' ' + tReview('strengthBaseline.considerProviding')}
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
                  {tReview('strengthBaseline.viewBreakdown')}
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
                              {tReview('strengthBaseline.custom')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {tReview('strengthBaseline.e1rm')} {lift.e1RM}kg
                            {lift.relativeStrength && ` ${tReview('strengthBaseline.relativeStrength')}`}
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
                  {tReview('strengthBaseline.adjustExperience')}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={customExperience || ''}
                  onChange={(e) => handleExperienceChange(e.target.value)}
                  className="w-full"
                  placeholder={tReview('strengthBaseline.experiencePlaceholder')}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {tReview('strengthBaseline.disagreeNote')}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {data.confirmedExperience !== null && data.confirmedExperience !== undefined
                    ? `${tReview('strengthBaseline.confirmed')} ${data.confirmedExperience} ${tReview('profileLabels.years')}`
                    : `${tReview('strengthBaseline.usingEstimate')} ${experienceEstimate.years} ${tReview('profileLabels.years')}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300 mb-3">{error}</p>
          <Button
            onClick={() => {
              setError(null)
              setLoading(false)
            }}
            variant="outline"
            className="bg-white dark:bg-gray-900"
          >
            Try Again / Riprova
          </Button>
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{tReview('whatHappensNext.title')}</strong> {tReview('whatHappensNext.description')} {approach?.name || 'selected approach'} {tReview('whatHappensNext.andPreferences')}
        </p>
      </div>

      <div className="sticky bottom-0 mt-8 bg-gray-50 dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center gap-4">
        {loading ? (
          <ProgressFeedback
            variant="inline"
            endpoint="/api/onboarding/complete/stream"
            requestBody={{
              userId: user?.id,
              approachId: data.approachId,
              weakPoints: data.weakPoints || [],
              availableEquipment: data.availableEquipment || [],
              strengthBaseline: data.strengthBaseline || {},
              firstName: data.firstName || null,
              gender: data.gender || null,
              age: data.age || null,
              weight: data.weight || null,
              height: data.height || null,
              confirmedExperience: data.confirmedExperience || null,
              splitType: data.splitType,
              weeklyFrequency: data.weeklyFrequency,
              generationRequestId: generationRequestIdRef.current // Pass pre-generated requestId
            }}
            phases={onboardingPhases}
            cancellable={true}
            existingRequestId={resumingGeneration ? (generationRequestIdRef.current ?? undefined) : undefined}
            initialProgress={resumingGeneration ? existingProgress : undefined}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
            onCancel={handleGenerationCancel}
          />
        ) : (
          <Button
            onClick={handleCompleteClick}
            disabled={loading}
            className="px-8 py-3 text-lg"
          >
            { t('completeButton')}
          </Button>
        )}
      </div>

      {/* Medical Disclaimer Modal */}
      <MedicalDisclaimerModal
        open={showMedicalDisclaimer}
        onAccept={handleMedicalDisclaimerAccept}
        onCancel={handleMedicalDisclaimerCancel}
        context="onboarding"
        title={tReview('medicalDisclaimer')}
      />
    </div>
  )
}
