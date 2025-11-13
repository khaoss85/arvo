'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { updateCaloricPhaseAction } from '@/app/actions/ai-actions'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface CaloricPhaseSelectorProps {
  userId: string
  currentPhase: 'bulk' | 'cut' | 'maintenance' | null
  currentCaloricIntake?: number | null
}

export function CaloricPhaseSelector({ userId, currentPhase, currentCaloricIntake }: CaloricPhaseSelectorProps) {
  const t = useTranslations('settings.caloricPhase')
  const [phase, setPhase] = useState<'bulk' | 'cut' | 'maintenance' | null>(currentPhase)
  const [caloricIntakeKcal, setCaloricIntakeKcal] = useState<number | null>(currentCaloricIntake || null)
  const [inputValue, setInputValue] = useState<string>(currentCaloricIntake?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const phases = [
    {
      value: 'bulk' as const,
      label: t('phases.bulk.name'),
      icon: TrendingUp,
      description: t('phases.bulk.description'),
      color: 'bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-400',
      colorActive: 'bg-green-100 dark:bg-green-900 border-green-600',
      iconColor: 'text-green-600 dark:text-green-400',
      details: t('phases.bulk.details'),
    },
    {
      value: 'cut' as const,
      label: t('phases.cut.name'),
      icon: TrendingDown,
      description: t('phases.cut.description'),
      color: 'bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-400',
      colorActive: 'bg-red-100 dark:bg-red-900 border-red-600',
      iconColor: 'text-red-600 dark:text-red-400',
      details: t('phases.cut.details'),
    },
    {
      value: 'maintenance' as const,
      label: t('phases.maintenance.name'),
      icon: Activity,
      description: t('phases.maintenance.description'),
      color: 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-400',
      colorActive: 'bg-blue-100 dark:bg-blue-900 border-blue-600',
      iconColor: 'text-blue-600 dark:text-blue-400',
      details: t('phases.maintenance.details'),
    },
  ]

  const handleSelect = async (newPhase: 'bulk' | 'cut' | 'maintenance') => {
    if (newPhase === phase) return // Already selected

    setIsSaving(true)
    setMessage(null)

    // Reset caloric intake if switching to maintenance
    const intakeToSave = newPhase === 'maintenance' ? 0 : caloricIntakeKcal

    const result = await updateCaloricPhaseAction(userId, newPhase, intakeToSave)
    setIsSaving(false)

    if (result.success) {
      setPhase(newPhase)
      if (newPhase === 'maintenance') {
        setCaloricIntakeKcal(null)
        setInputValue('')
      }
      setMessage({
        type: 'success',
        text: t('messages.phaseUpdated', { phase: t(`phases.${newPhase}.name`) }),
      })
      setTimeout(() => setMessage(null), 5000)
    } else {
      setMessage({
        type: 'error',
        text: result.error || t('messages.updateFailed'),
      })
    }
  }

  const handleCaloricIntakeChange = async (value: string) => {
    setInputValue(value)

    // Validate and parse
    if (value === '' || value === '-' || value === '+') {
      return // Allow intermediate input
    }

    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      setMessage({
        type: 'error',
        text: t('messages.invalidNumber'),
      })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (numValue < -1500 || numValue > 1500) {
      setMessage({
        type: 'error',
        text: t('messages.rangeError'),
      })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setCaloricIntakeKcal(numValue)

    // Auto-save with debounce
    if (phase && phase !== 'maintenance') {
      setIsSaving(true)
      const result = await updateCaloricPhaseAction(userId, phase, numValue)
      setIsSaving(false)

      if (result.success) {
        setMessage({
          type: 'success',
          text: t('messages.intakeUpdated', { value: `${numValue > 0 ? '+' : ''}${numValue}` }),
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || t('messages.intakeUpdateFailed'),
        })
      }
    }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.map(({ value, label, icon: Icon, description, color, colorActive, iconColor, details }) => {
          const isSelected = phase === value
          const isDisabled = isSaving

          return (
            <Card
              key={value}
              className={`
                p-6 cursor-pointer transition-all duration-200
                ${isSelected
                  ? `border-2 ${colorActive} shadow-md`
                  : 'border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isDisabled && handleSelect(value)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Icon */}
                <div className={`p-3 rounded-full ${isSelected ? color : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Icon
                    className={`w-8 h-8 ${isSelected ? iconColor : 'text-gray-400 dark:text-gray-500'}`}
                  />
                </div>

                {/* Label and Description */}
                <div className="space-y-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    {label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {description}
                  </div>
                </div>

                {/* Details (shown when selected) */}
                {isSelected && (
                  <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 p-3 bg-white/60 dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    {details}
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">
                    {t('active')}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Conditional Caloric Intake Input */}
      {phase && (phase === 'bulk' || phase === 'cut') && (
        <div className="mt-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <label htmlFor="caloric-intake" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('input.label', { type: phase === 'bulk' ? t('input.surplus') : t('input.deficit') })}
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                id="caloric-intake"
                type="number"
                value={inputValue}
                onChange={(e) => handleCaloricIntakeChange(e.target.value)}
                onBlur={(e) => {
                  // Clean up input on blur
                  if (e.target.value && !isNaN(parseInt(e.target.value, 10))) {
                    setInputValue(caloricIntakeKcal?.toString() || '')
                  }
                }}
                placeholder={t(`input.placeholder.${phase}`)}
                disabled={isSaving}
                className={`
                  w-full px-4 py-2 border rounded-lg
                  bg-white dark:bg-gray-800
                  text-gray-900 dark:text-white
                  border-gray-300 dark:border-gray-600
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400 dark:placeholder-gray-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                min={-1500}
                max={1500}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                {t('input.unit')}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {t(`input.help.${phase}`)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('input.range')}
          </p>
        </div>
      )}

      {phase && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('tip')}
        </div>
      )}
    </div>
  )
}
