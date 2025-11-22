'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, X, Search } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STANDARD_LIFTS = [
  { id: 'bench_press' },
  { id: 'squat' },
  { id: 'deadlift' },
  { id: 'overhead_press' },
  { id: 'hip_thrust' },
  { id: 'barbell_row' },
  { id: 'pull_ups' },
  { id: 'front_squat' }
] as const

export default function StrengthBaselinePage() {
  const t = useTranslations('onboarding.steps.strength')
  const tCommon = useTranslations('common.buttons')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()
  const [baseline, setBaseline] = useState<Record<string, { weight: number; reps: number; rir: number }>>(
    data.strengthBaseline || {}
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const experienceLevel = data.experienceLevel
  const currentStepNumber = 8 // Step 8 for intermediate/advanced

  useEffect(() => {
    // Redirect beginners - they should skip this step
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/review')
      return
    }

    setStep(currentStepNumber)
  }, [setStep, experienceLevel, router, currentStepNumber])

  // Get suggestions - standard lifts not yet added
  const suggestions = STANDARD_LIFTS.filter(
    lift => !baseline[lift.id] && t(`exercises.${lift.id}`).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddExercise = (id: string) => {
    // Check if already exists
    if (baseline[id]) {
      setSearchQuery('')
      setShowSuggestions(false)
      return
    }

    const updated = {
      ...baseline,
      [id]: { weight: 0, reps: 0, rir: 0 }
    }
    setBaseline(updated)
    setStepData('strengthBaseline', updated)
    setSearchQuery('')
    setShowSuggestions(false)
  }

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
    completeStep(currentStepNumber)
    router.push('/onboarding/review')
  }

  const handleContinue = () => {
    completeStep(currentStepNumber)
    router.push('/onboarding/review')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // If there's a matching suggestion, use it
      if (suggestions.length > 0) {
        handleAddExercise(suggestions[0].id)
      }
      // Note: Custom exercises removed - only standard exercises allowed
    }
  }

  const isValidEntry = (entry: any) => {
    return entry && entry.weight > 0 && entry.reps > 0 && entry.rir >= 0
  }

  const hasValidEntries = Object.values(baseline).some(isValidEntry)

  // Get display name for exercise
  const getExerciseName = (exerciseId: string): string => {
    const standardLift = STANDARD_LIFTS.find(l => l.id === exerciseId)
    if (standardLift) return t(`exercises.${exerciseId}`)

    // For non-standard (should not happen now, but keep as fallback)
    return exerciseId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Check if exercise is standard
  const isStandardExercise = (exerciseId: string): boolean => {
    return STANDARD_LIFTS.some(l => l.id === exerciseId)
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back Button */}
      <button
        onClick={() => router.push('/onboarding/equipment')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('backToEquipment')}</span>
      </button>

      <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t('description')}
        <span className="block mt-2 text-sm italic">
          {t('optional')}
        </span>
      </p>

      {/* Add Exercise Search */}
      <div className="mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t('addExercise.placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 w-full"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* Standard Lifts Suggestions */}
            {suggestions.length > 0 ? (
              <div className="p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-medium">
                  {t('addExercise.suggestedExercises')}
                </div>
                {suggestions.map(lift => (
                  <button
                    key={lift.id}
                    onClick={() => handleAddExercise(lift.id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center justify-between group"
                  >
                    <span>{t(`exercises.${lift.id}`)}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      {t('exerciseCard.standard')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('addExercise.typeToSearch')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
        {Object.keys(baseline).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">{t('emptyState.title')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t('emptyState.description')}
            </p>
          </div>
        ) : (
          Object.entries(baseline).map(([exerciseId, entry]) => {
            const isValid = isValidEntry(entry)
            const exerciseName = getExerciseName(exerciseId)
            const isStandard = isStandardExercise(exerciseId)

            return (
              <div
                key={exerciseId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{exerciseName}</h3>
                    {isStandard ? (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        {t('exerciseCard.standard')}
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                        {t('exerciseCard.custom')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(exerciseId)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title={t('exerciseCard.remove')}
                  >
                    <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('exerciseCard.weightLabel')}
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={t('exerciseCard.weightPlaceholder')}
                      value={entry?.weight || ''}
                      onChange={(e) => handleUpdate(exerciseId, 'weight', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('exerciseCard.repsLabel')}
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t('exerciseCard.repsPlaceholder')}
                      value={entry?.reps || ''}
                      onChange={(e) => handleUpdate(exerciseId, 'reps', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('exerciseCard.rirLabel')}
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t('exerciseCard.rirPlaceholder')}
                      value={entry?.rir ?? ''}
                      onChange={(e) => handleUpdate(exerciseId, 'rir', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {entry && !isValid && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    {t('exerciseCard.validationError')}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{t('tip.label')}</strong> {t('tip.description')}
        </p>
      </div>

      <div className="sticky bottom-0 mt-8 bg-gray-50 dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          {t('skipButton')}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!hasValidEntries && Object.keys(baseline).length > 0}
        >
          {hasValidEntries
            ? t('continueButton', { count: Object.values(baseline).filter(isValidEntry).length })
            : tCommon('continue')}
        </Button>
      </div>
    </div>
  )
}
