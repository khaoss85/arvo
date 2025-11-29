'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User, Calendar, Scale, Ruler, HelpCircle, ArrowLeft, Target } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AISuggestionCard } from '@/components/onboarding/AISuggestionCard'
import { useAIOnboardingSuggestion } from '@/lib/hooks/useAIOnboardingSuggestion'
import type { TrainingFocus } from '@/lib/types/onboarding'
import { getBodyTypesForGender, BODY_TYPE_CONFIGS, type BodyType } from '@/lib/constants/body-type-config'

export default function ProfilePage() {
  const t = useTranslations('onboarding.steps.profile')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  const [firstName, setFirstName] = useState<string>(data.firstName || '')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(data.gender || null)
  const [bodyType, setBodyType] = useState<BodyType | null>(data.bodyType || null)
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus | null>(data.trainingFocus || null)
  const [age, setAge] = useState<number | null>(data.age || null)
  const [weight, setWeight] = useState<number | null>(data.weight || null)
  const [height, setHeight] = useState<number | null>(data.height || null)

  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // Error states for validation feedback
  const [genderError, setGenderError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [heightError, setHeightError] = useState<string | null>(null)

  const experienceLevel = data.experienceLevel

  // Calculate correct step number based on experience level
  const currentStepNumber = 2 // Step 2 for all levels (approach moved after equipment)

  useEffect(() => {
    setStep(currentStepNumber)
  }, [setStep, currentStepNumber])

  // AI suggestion
  const { suggestion, isLoading } = useAIOnboardingSuggestion({
    step: 'profile',
    userData: {
      experienceLevel
    }
  })

  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    setStepData('firstName', value || null)
  }

  const handleGenderChange = (value: 'male' | 'female' | 'other') => {
    setGender(value)
    setStepData('gender', value)
    setGenderError(null)

    // Reset body type when gender changes (different options per gender)
    if (value === 'other') {
      setBodyType(null)
      setStepData('bodyType', null)
    } else if (bodyType) {
      // Check if current body type is valid for new gender
      const validBodyTypes = getBodyTypesForGender(value)
      if (!validBodyTypes.includes(bodyType)) {
        setBodyType(null)
        setStepData('bodyType', null)
      }
    }

    // Set intelligent default for training_focus if not already set
    if (!trainingFocus) {
      const defaultFocus: TrainingFocus = value === 'male' ? 'upper_body' : value === 'female' ? 'lower_body' : 'balanced'
      setTrainingFocus(defaultFocus)
      setStepData('trainingFocus', defaultFocus)
    }
  }

  const handleBodyTypeChange = (value: BodyType | null) => {
    setBodyType(value)
    setStepData('bodyType', value)
  }

  const handleTrainingFocusChange = (value: TrainingFocus) => {
    setTrainingFocus(value)
    setStepData('trainingFocus', value)
  }

  const handleAgeChange = (value: string) => {
    // Allow empty input
    if (value === '') {
      setAge(null)
      setStepData('age', null)
      setAgeError(null)
      return
    }

    // Only allow numeric input
    if (!/^\d+$/.test(value)) return

    const num = parseInt(value, 10)
    setAge(num)
    setStepData('age', num)

    // Clear error while typing
    setAgeError(null)
  }

  const handleAgeBlur = () => {
    // Validate only when user finishes typing
    if (age !== null && (age < 13 || age > 120)) {
      setAgeError(t('fields.age.error'))
    } else {
      setAgeError(null)
    }
  }

  const handleWeightChange = (value: string) => {
    // Allow empty input
    if (value === '') {
      setWeight(null)
      setStepData('weight', null)
      setWeightError(null)
      return
    }

    // Only allow numeric input with optional decimal
    if (!/^\d*\.?\d*$/.test(value)) return

    const num = value === '' ? null : parseFloat(value)
    setWeight(num)
    setStepData('weight', num)

    // Clear error while typing
    setWeightError(null)
  }

  const handleWeightBlur = () => {
    // Validate only when user finishes typing
    if (weight !== null && weight <= 0) {
      setWeightError(t('fields.weight.error'))
    } else {
      setWeightError(null)
    }
  }

  const handleHeightChange = (value: string) => {
    // Allow empty input
    if (value === '') {
      setHeight(null)
      setStepData('height', null)
      setHeightError(null)
      return
    }

    // Only allow numeric input with optional decimal
    if (!/^\d*\.?\d*$/.test(value)) return

    const num = value === '' ? null : parseFloat(value)
    setHeight(num)
    setStepData('height', num)

    // Clear error while typing
    setHeightError(null)
  }

  const handleHeightBlur = () => {
    // Validate only when user finishes typing
    if (height !== null && height <= 0) {
      setHeightError(t('fields.height.error'))
    } else {
      setHeightError(null)
    }
  }

  const handleSkip = () => {
    // Gender is required, cannot skip without it
    if (!gender) {
      setGenderError(t('fields.gender.required'))
      return
    }

    setStepData('firstName', null)
    setStepData('gender', gender)
    setStepData('bodyType', bodyType || null)
    setStepData('trainingFocus', trainingFocus || 'balanced')
    setStepData('age', null)
    setStepData('weight', null)
    setStepData('height', null)
    completeStep(currentStepNumber)

    // Navigate based on experience level
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/split')
    } else {
      router.push('/onboarding/goals')
    }
  }

  const handleContinue = () => {
    // Validate that gender is selected
    if (!gender) {
      setGenderError(t('fields.gender.required'))
      return
    }

    setStepData('gender', gender)
    setStepData('bodyType', bodyType || null)
    setStepData('trainingFocus', trainingFocus || 'balanced')
    completeStep(currentStepNumber)

    // Navigate based on experience level
    if (experienceLevel === 'beginner') {
      router.push('/onboarding/split')
    } else {
      router.push('/onboarding/goals')
    }
  }

  const handleBack = () => {
    // All levels go back to level selection (approach moved after equipment)
    router.push('/onboarding/level')
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{tCommon('buttons.back')}</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('description')}
          <span className="block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            {t('allOptional')}
          </span>
        </p>
      </div>

      {/* AI Suggestion */}
      <AISuggestionCard
        suggestion={suggestion}
        isLoading={isLoading}
        className="mb-6"
      />

      <Card className="p-6 space-y-6">
        {/* First Name */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.firstName.label')}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('firstName')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'firstName' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.firstName.tooltip')}
            </div>
          )}
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleFirstNameChange(e.target.value)}
            placeholder={t('fields.firstName.placeholder')}
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.gender.label')}
              <span className="ml-2 text-sm text-red-500">*</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('gender')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'gender' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.gender.tooltip')}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {(['male', 'female', 'other'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleGenderChange(option)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gender === option
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${genderError ? 'border-red-500' : ''}`}
              >
                <div className="text-2xl mb-1">
                  {option === 'male' ? '♂' : option === 'female' ? '♀' : '⚧'}
                </div>
                <div className="text-sm font-medium">{t(`fields.gender.options.${option}`)}</div>
              </button>
            ))}
          </div>
          {genderError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {genderError}
            </p>
          )}
        </div>

        {/* Body Type - Only shown when gender is male or female */}
        {gender && gender !== 'other' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-500" />
              <label className="font-medium text-gray-900 dark:text-white">
                {t('fields.bodyType.label')}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
              </label>
              <button
                className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                onMouseEnter={() => setShowTooltip('bodyType')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {showTooltip === 'bodyType' && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
                {t('fields.bodyType.tooltip')}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {getBodyTypesForGender(gender).map((type) => {
                const config = BODY_TYPE_CONFIGS[type]
                return (
                  <button
                    key={type}
                    onClick={() => handleBodyTypeChange(bodyType === type ? null : type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bodyType === type
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.emoji}</div>
                    <div className="text-sm font-medium">{t(`fields.bodyType.options.${type}`)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Training Focus */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.trainingFocus.label')}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('trainingFocus')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'trainingFocus' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.trainingFocus.tooltip')}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {(['upper_body', 'lower_body', 'balanced'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleTrainingFocusChange(option)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  trainingFocus === option
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">
                  {option === 'upper_body' ? '💪' : option === 'lower_body' ? '🦵' : '⚖️'}
                </div>
                <div className="text-sm font-medium">{t(`fields.trainingFocus.options.${option}`)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.age.label')}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('age')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'age' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.age.tooltip')}
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={age || ''}
            onChange={(e) => handleAgeChange(e.target.value)}
            onBlur={handleAgeBlur}
            placeholder={t('fields.age.placeholder')}
            className={`w-full p-3 border-2 rounded-lg bg-white dark:bg-gray-900 focus:outline-none ${
              ageError
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
            }`}
          />
          {ageError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {ageError}
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.weight.label')}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('weight')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'weight' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.weight.tooltip')}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={weight || ''}
              onChange={(e) => handleWeightChange(e.target.value)}
              onBlur={handleWeightBlur}
              placeholder={t('fields.weight.placeholder')}
              className={`w-full p-3 pr-12 border-2 rounded-lg bg-white dark:bg-gray-900 focus:outline-none ${
                weightError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {t('fields.weight.unit')}
            </span>
          </div>
          {weightError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {weightError}
            </p>
          )}
        </div>

        {/* Height */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              {t('fields.height.label')}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({tCommon('labels.optional')})</span>
            </label>
            <button
              className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onMouseEnter={() => setShowTooltip('height')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {showTooltip === 'height' && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-300">
              {t('fields.height.tooltip')}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={height || ''}
              onChange={(e) => handleHeightChange(e.target.value)}
              onBlur={handleHeightBlur}
              placeholder={t('fields.height.placeholder')}
              className={`w-full p-3 pr-12 border-2 rounded-lg bg-white dark:bg-gray-900 focus:outline-none ${
                heightError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {t('fields.height.unit')}
            </span>
          </div>
          {heightError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {heightError}
            </p>
          )}
        </div>
      </Card>

      <div className="sticky bottom-0 mt-8 bg-gray-50 dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
          className="font-medium"
        >
          {t('skipProfile')}
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {tCommon('buttons.continue')}
        </Button>
      </div>
    </div>
  )
}
