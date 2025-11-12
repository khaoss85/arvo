'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { updateCaloricPhaseAction } from '@/app/actions/ai-actions'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface CaloricPhaseSelectorProps {
  userId: string
  currentPhase: 'bulk' | 'cut' | 'maintenance' | null
  currentCaloricIntake?: number | null
}

export function CaloricPhaseSelector({ userId, currentPhase, currentCaloricIntake }: CaloricPhaseSelectorProps) {
  const [phase, setPhase] = useState<'bulk' | 'cut' | 'maintenance' | null>(currentPhase)
  const [caloricIntakeKcal, setCaloricIntakeKcal] = useState<number | null>(currentCaloricIntake || null)
  const [inputValue, setInputValue] = useState<string>(currentCaloricIntake?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const phases = [
    {
      value: 'bulk' as const,
      label: 'Bulk',
      icon: TrendingUp,
      description: 'Caloric surplus for muscle gain',
      color: 'bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-400',
      colorActive: 'bg-green-100 dark:bg-green-900 border-green-600',
      iconColor: 'text-green-600 dark:text-green-400',
      details: 'Optimizes for maximum muscle building with higher volume tolerance (+15-20% sets)',
    },
    {
      value: 'cut' as const,
      label: 'Cut',
      icon: TrendingDown,
      description: 'Caloric deficit for fat loss',
      color: 'bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-400',
      colorActive: 'bg-red-100 dark:bg-red-900 border-red-600',
      iconColor: 'text-red-600 dark:text-red-400',
      details: 'Prioritizes muscle preservation with strategic volume reduction (-15-20% sets) and high S:F exercises',
    },
    {
      value: 'maintenance' as const,
      label: 'Maintenance',
      icon: Activity,
      description: 'Balanced caloric intake',
      color: 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-400',
      colorActive: 'bg-blue-100 dark:bg-blue-900 border-blue-600',
      iconColor: 'text-blue-600 dark:text-blue-400',
      details: 'Maintains muscle and strength with standard training approach',
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
        text: `Caloric phase updated to ${newPhase.toUpperCase()}. Your next workout will reflect these changes.`,
      })
      setTimeout(() => setMessage(null), 5000)
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to update caloric phase. Please try again.',
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
        text: 'Please enter a valid number',
      })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (numValue < -1500 || numValue > 1500) {
      setMessage({
        type: 'error',
        text: 'Caloric intake must be between -1500 and +1500 kcal',
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
          text: `Caloric intake updated to ${numValue > 0 ? '+' : ''}${numValue} kcal`,
        })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to update caloric intake',
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Caloric Phase</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your current nutritional phase influences workout volume, exercise selection, and rep ranges
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
                    ✓ Active
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
            Specify your daily caloric {phase === 'bulk' ? 'surplus' : 'deficit'} (optional)
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
                placeholder={phase === 'bulk' ? 'Es. +500' : 'Es. -300'}
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
                kcal
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {phase === 'bulk'
              ? 'Positive value for caloric surplus (e.g., +500 means eating 500 kcal above maintenance)'
              : 'Negative value for caloric deficit (e.g., -300 means eating 300 kcal below maintenance)'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Leave empty if you prefer not to specify. Range: -1500 to +1500 kcal.
          </p>
        </div>
      )}

      {phase && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Tip: Switch phases when your nutrition goals change (e.g., starting a cut after a bulk season)
        </div>
      )}
    </div>
  )
}
