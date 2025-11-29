'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User, Scale, Ruler } from 'lucide-react'
import { updatePersonalInfo } from '@/app/actions/user-actions'
import { getBodyTypesForGender, BODY_TYPE_CONFIGS, type BodyType } from '@/lib/constants/body-type-config'

interface PersonalInfoEditorProps {
  userId: string
  initialData: {
    first_name: string | null
    gender: 'male' | 'female' | 'other' | null
    body_type: BodyType | null
    age: number | null
    weight: number | null // kg
    height: number | null // cm
  }
}

export function PersonalInfoEditor({ userId, initialData }: PersonalInfoEditorProps) {
  const t = useTranslations('settings.personalInfo')

  const [firstName, setFirstName] = useState(initialData.first_name || '')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(initialData.gender)
  const [bodyType, setBodyType] = useState<BodyType | null>(initialData.body_type)
  const [age, setAge] = useState(initialData.age?.toString() || '')
  const [weight, setWeight] = useState(initialData.weight?.toString() || '')
  const [height, setHeight] = useState(initialData.height?.toString() || '')

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    // Validate
    const ageNum = age ? parseInt(age, 10) : null
    const weightNum = weight ? parseFloat(weight) : null
    const heightNum = height ? parseFloat(height) : null

    if (ageNum !== null && (isNaN(ageNum) || ageNum < 13 || ageNum > 120)) {
      setMessage({
        type: 'error',
        text: t('errors.invalidAge'),
      })
      setIsSaving(false)
      return
    }

    if (weightNum !== null && (isNaN(weightNum) || weightNum <= 0 || weightNum > 500)) {
      setMessage({
        type: 'error',
        text: t('errors.invalidWeight'),
      })
      setIsSaving(false)
      return
    }

    if (heightNum !== null && (isNaN(heightNum) || heightNum <= 0 || heightNum > 300)) {
      setMessage({
        type: 'error',
        text: t('errors.invalidHeight'),
      })
      setIsSaving(false)
      return
    }

    const result = await updatePersonalInfo(userId, {
      first_name: firstName.trim() || null,
      gender,
      body_type: bodyType,
      training_focus: null,
      age: ageNum,
      weight: weightNum,
      height: heightNum,
    })

    setIsSaving(false)

    if (result.success) {
      setMessage({
        type: 'success',
        text: t('messages.updateSuccess'),
      })
      setTimeout(() => setMessage(null), 5000)
    } else {
      setMessage({
        type: 'error',
        text: result.error || t('messages.updateFailed'),
      })
    }
  }

  const handleGenderChange = (newGender: 'male' | 'female' | 'other') => {
    setGender(newGender)
    // Reset body type when gender changes (different options per gender)
    if (newGender === 'other') {
      setBodyType(null)
    } else if (bodyType) {
      // Check if current body type is valid for new gender
      const validBodyTypes = getBodyTypesForGender(newGender)
      if (!validBodyTypes.includes(bodyType)) {
        setBodyType(null)
      }
    }
  }

  const genderOptions = [
    { value: 'male' as const, label: t('gender.male'), emoji: '🚹' },
    { value: 'female' as const, label: t('gender.female'), emoji: '🚺' },
    { value: 'other' as const, label: t('gender.other'), emoji: '⚧' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('description')}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* First Name */}
        <div>
          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('fields.firstName')}
            </div>
          </label>
          <input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('placeholders.firstName')}
            maxLength={50}
            disabled={isSaving}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.gender')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleGenderChange(option.value)}
                disabled={isSaving}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  gender === option.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Body Type - Only shown when gender is male or female */}
        {gender && gender !== 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('fields.bodyType')}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({t('optional')})</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {getBodyTypesForGender(gender).map((type) => {
                const config = BODY_TYPE_CONFIGS[type]
                return (
                  <button
                    key={type}
                    onClick={() => setBodyType(bodyType === type ? null : type)}
                    disabled={isSaving}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      bodyType === type
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t(`bodyType.${type}`)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Age, Weight, Height in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('fields.age')}
            </label>
            <div className="relative">
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                min={13}
                max={120}
                disabled={isSaving}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                {t('units.years')}
              </span>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                {t('fields.weight')}
              </div>
            </label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                min={0}
                max={500}
                step={0.1}
                disabled={isSaving}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                {t('units.kg')}
              </span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                {t('fields.height')}
              </div>
            </label>
            <div className="relative">
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                min={0}
                max={300}
                step={0.1}
                disabled={isSaving}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                {t('units.cm')}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('buttons.saving') : t('buttons.save')}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        {t('note')}
      </div>
    </div>
  )
}
