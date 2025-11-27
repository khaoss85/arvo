'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dumbbell, Calculator, Info } from 'lucide-react'
import { updateTrainingMaxes, TrainingMaxes } from '@/app/actions/user-actions'
import { calculateTrainingMax } from '@/lib/utils/powerlifting-calculator'
import { calculateE1RM } from '@/lib/utils/experience-calculator'

interface TrainingMaxEditorProps {
  userId: string
  initialData: TrainingMaxes | null
  approachCategory?: 'bodybuilding' | 'powerlifting'
  approachName?: string
}

// Specific lift keys (not the index signature)
type LiftKey = 'squat' | 'bench_press' | 'deadlift' | 'overhead_press'

interface LiftInput {
  key: LiftKey
  label: string
  placeholder: string
  e1rmInput: { weight: string; reps: string } | null
}

export function TrainingMaxEditor({
  userId,
  initialData,
  approachCategory,
  approachName
}: TrainingMaxEditorProps) {
  const t = useTranslations('settings.trainingMax')

  // All hooks must be called before any conditional returns
  const [trainingMaxes, setTrainingMaxes] = useState<TrainingMaxes>(
    initialData || {}
  )
  const [e1rmInputs, setE1rmInputs] = useState<Record<string, { weight: string; reps: string }>>({})
  const [showCalculator, setShowCalculator] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Only show for powerlifting users
  if (approachCategory !== 'powerlifting') {
    return null
  }

  const lifts: LiftInput[] = [
    { key: 'squat', label: t('lifts.squat'), placeholder: '140', e1rmInput: null },
    { key: 'bench_press', label: t('lifts.benchPress'), placeholder: '100', e1rmInput: null },
    { key: 'deadlift', label: t('lifts.deadlift'), placeholder: '180', e1rmInput: null },
    { key: 'overhead_press', label: t('lifts.overheadPress'), placeholder: '60', e1rmInput: null }
  ]

  const handleTmChange = (key: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    setTrainingMaxes(prev => ({
      ...prev,
      [key]: numValue
    }))
  }

  const handleE1rmInputChange = (key: string, field: 'weight' | 'reps', value: string) => {
    setE1rmInputs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  const calculateFromE1rm = (key: string) => {
    const input = e1rmInputs[key]
    if (!input?.weight || !input?.reps) return

    const weight = parseFloat(input.weight)
    const reps = parseInt(input.reps, 10)

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return

    const e1rm = calculateE1RM(weight, reps)
    // Training Max = 90% of E1RM (Wendler standard)
    const tm = calculateTrainingMax(e1rm, 90)

    setTrainingMaxes(prev => ({
      ...prev,
      [key]: tm
    }))

    setShowCalculator(null)
    setE1rmInputs(prev => ({ ...prev, [key]: { weight: '', reps: '' } }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    const result = await updateTrainingMaxes(userId, trainingMaxes)

    setIsSaving(false)

    if (result.success) {
      setMessage({
        type: 'success',
        text: t('messages.saveSuccess')
      })
      setTimeout(() => setMessage(null), 5000)
    } else {
      setMessage({
        type: 'error',
        text: result.error || t('messages.saveFailed')
      })
    }
  }

  // Check if using Wendler approach for specific tips
  const isWendler = approachName?.toLowerCase().includes('wendler') || approachName?.toLowerCase().includes('5/3/1')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-blue-600" />
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('description')}
        </p>
      </div>

      {isWendler && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('wendlerTip')}
            </p>
          </div>
        </div>
      )}

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
        {lifts.map((lift) => (
          <div key={lift.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`tm-${lift.key}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {lift.label}
              </label>
              <button
                type="button"
                onClick={() => setShowCalculator(showCalculator === lift.key ? null : lift.key)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <Calculator className="w-3 h-3" />
                {t('calculateFromE1rm')}
              </button>
            </div>

            <div className="relative">
              <input
                id={`tm-${lift.key}`}
                type="number"
                value={trainingMaxes[lift.key] ?? ''}
                onChange={(e) => handleTmChange(lift.key, e.target.value)}
                placeholder={lift.placeholder}
                min={0}
                max={1000}
                step={2.5}
                disabled={isSaving}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                kg
              </span>
            </div>

            {/* E1RM Calculator Expandable */}
            {showCalculator === lift.key && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('e1rmCalculatorHelp')}
                </p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {t('weight')}
                    </label>
                    <input
                      type="number"
                      value={e1rmInputs[lift.key]?.weight ?? ''}
                      onChange={(e) => handleE1rmInputChange(lift.key, 'weight', e.target.value)}
                      placeholder="100"
                      min={0}
                      step={2.5}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-500 pb-2">x</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {t('reps')}
                    </label>
                    <input
                      type="number"
                      value={e1rmInputs[lift.key]?.reps ?? ''}
                      onChange={(e) => handleE1rmInputChange(lift.key, 'reps', e.target.value)}
                      placeholder="5"
                      min={1}
                      max={20}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => calculateFromE1rm(lift.key)}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {t('calculate')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
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

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        {t('note')}
      </div>
    </div>
  )
}
