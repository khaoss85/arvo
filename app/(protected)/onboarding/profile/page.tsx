'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Calendar, Scale, Ruler, HelpCircle, ArrowLeft } from 'lucide-react'
import { useOnboardingStore } from '@/lib/stores/onboarding.store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ProfilePage() {
  const router = useRouter()
  const { data, setStepData, completeStep, setStep } = useOnboardingStore()

  const [firstName, setFirstName] = useState<string>(data.firstName || '')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(data.gender || null)
  const [age, setAge] = useState<number | null>(data.age || null)
  const [weight, setWeight] = useState<number | null>(data.weight || null)
  const [height, setHeight] = useState<number | null>(data.height || null)

  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // Error states for validation feedback
  const [ageError, setAgeError] = useState<string | null>(null)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [heightError, setHeightError] = useState<string | null>(null)

  useEffect(() => {
    setStep(3)
  }, [setStep])

  const handleFirstNameChange = (value: string) => {
    setFirstName(value)
    setStepData('firstName', value || null)
  }

  const handleGenderChange = (value: 'male' | 'female' | 'other') => {
    setGender(value)
    setStepData('gender', value)
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
      setAgeError('Age must be between 13 and 120')
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
      setWeightError('Weight must be greater than 0')
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
      setHeightError('Height must be greater than 0')
    } else {
      setHeightError(null)
    }
  }

  const handleSkip = () => {
    setStepData('firstName', null)
    setStepData('gender', null)
    setStepData('age', null)
    setStepData('weight', null)
    setStepData('height', null)
    completeStep(3)
    router.push('/onboarding/weak-points')
  }

  const handleContinue = () => {
    completeStep(3)
    router.push('/onboarding/weak-points')
  }

  const tooltips = {
    firstName: 'Your name helps us personalize your experience with greetings and feedback',
    gender: 'Used for more accurate strength standards and initial weight estimations',
    age: 'Helps the AI adjust recovery recommendations and progression rates',
    weight: 'Essential for calculating relative strength (e.g., 1.5x bodyweight squat) and Wilks score',
    height: 'Optional - used for body composition tracking and BMI calculations',
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back Button */}
      <button
        onClick={() => router.push('/onboarding/split')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Training Split</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile (Optional)</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Help the AI personalize your training with better recommendations, strength standards, and insights.
          <span className="block mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            All fields are optional - you can skip this entirely and the app will work great.
          </span>
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* First Name */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              First Name
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
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
              {tooltips.firstName}
            </div>
          )}
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleFirstNameChange(e.target.value)}
            placeholder="e.g., Mario"
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              Gender
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
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
              {tooltips.gender}
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
                }`}
              >
                <div className="text-2xl mb-1">
                  {option === 'male' ? '♂' : option === 'female' ? '♀' : '⚧'}
                </div>
                <div className="text-sm font-medium capitalize">{option}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-900 dark:text-white">
              Age
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
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
              {tooltips.age}
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={age || ''}
            onChange={(e) => handleAgeChange(e.target.value)}
            onBlur={handleAgeBlur}
            placeholder="e.g., 28"
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
              Bodyweight (kg)
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
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
              {tooltips.weight}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={weight || ''}
              onChange={(e) => handleWeightChange(e.target.value)}
              onBlur={handleWeightBlur}
              placeholder="e.g., 75"
              className={`w-full p-3 pr-12 border-2 rounded-lg bg-white dark:bg-gray-900 focus:outline-none ${
                weightError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              kg
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
              Height (cm)
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
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
              {tooltips.height}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={height || ''}
              onChange={(e) => handleHeightChange(e.target.value)}
              onBlur={handleHeightBlur}
              placeholder="e.g., 180"
              className={`w-full p-3 pr-12 border-2 rounded-lg bg-white dark:bg-gray-900 focus:outline-none ${
                heightError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              cm
            </span>
          </div>
          {heightError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {heightError}
            </p>
          )}
        </div>
      </Card>

      <div className="mt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSkip}
          className="font-medium"
        >
          Skip Profile
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
