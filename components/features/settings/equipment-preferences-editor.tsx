'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { updateEquipmentPreferencesAction } from '@/app/actions/ai-actions'
import { Pencil, X, Check } from 'lucide-react'

interface EquipmentPreferencesEditorProps {
  userId: string
  initialPreferences: Record<string, string>
}

const movementPatterns = [
  {
    id: 'chest',
    label: 'Chest (Horizontal Push)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables', 'Bodyweight']
  },
  {
    id: 'back_horizontal',
    label: 'Back (Horizontal Pull)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  },
  {
    id: 'back_vertical',
    label: 'Back (Vertical Pull)',
    options: ['Pull-up Bar', 'Lat Machine', 'Cables']
  },
  {
    id: 'shoulders',
    label: 'Shoulders (Vertical Push)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  },
  {
    id: 'legs_quad',
    label: 'Legs (Quad Dominant)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Bodyweight']
  },
  {
    id: 'legs_hip',
    label: 'Legs (Hip Dominant)',
    options: ['Barbell', 'Dumbbells', 'Machine', 'Cables']
  }
]

const PRESETS = {
  full_gym: {
    name: 'Full Gym',
    preferences: {
      chest: 'Barbell',
      back_horizontal: 'Machine',
      back_vertical: 'Lat Machine',
      shoulders: 'Dumbbells',
      legs_quad: 'Barbell',
      legs_hip: 'Barbell'
    }
  },
  home_gym: {
    name: 'Home Gym',
    preferences: {
      chest: 'Dumbbells',
      back_horizontal: 'Dumbbells',
      back_vertical: 'Pull-up Bar',
      shoulders: 'Dumbbells',
      legs_quad: 'Dumbbells',
      legs_hip: 'Dumbbells'
    }
  },
  machines_only: {
    name: 'Machines Only',
    preferences: {
      chest: 'Machine',
      back_horizontal: 'Machine',
      back_vertical: 'Lat Machine',
      shoulders: 'Machine',
      legs_quad: 'Machine',
      legs_hip: 'Machine'
    }
  }
}

export function EquipmentPreferencesEditor({ userId, initialPreferences }: EquipmentPreferencesEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [preferences, setPreferences] = useState<Record<string, string>>(initialPreferences || {})
  const [tempPreferences, setTempPreferences] = useState<Record<string, string>>(initialPreferences || {})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const handleSelect = (pattern: string, equipment: string) => {
    setTempPreferences({ ...tempPreferences, [pattern]: equipment })
  }

  const handleQuickPreset = (presetKey: keyof typeof PRESETS) => {
    setTempPreferences(PRESETS[presetKey].preferences)
  }

  const handleSave = async () => {
    // Validate all patterns are selected
    const missingPatterns = movementPatterns.filter(p => !tempPreferences[p.id])
    if (missingPatterns.length > 0) {
      setMessage({
        type: 'error',
        text: `Please select preferences for all movement patterns (${missingPatterns.length} missing)`
      })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsLoading(true)
    setMessage(null)

    const result = await updateEquipmentPreferencesAction(userId, tempPreferences)
    setIsLoading(false)

    if (result.success) {
      setPreferences(tempPreferences)
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Equipment preferences updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update equipment preferences' })
    }
  }

  const handleCancel = () => {
    setTempPreferences(preferences)
    setIsEditing(false)
    setMessage(null)
  }

  // Get pattern label by ID
  const getPatternLabel = (id: string): string => {
    const pattern = movementPatterns.find(p => p.id === id)
    return pattern?.label || id
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Preferences</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select your preferred equipment for each movement pattern
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
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

      {isEditing ? (
        <div className="space-y-4">
          {/* Quick presets */}
          <div>
            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Quick Presets:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPreset(key as keyof typeof PRESETS)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Pattern preferences */}
          <div className="space-y-4">
            {movementPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">{pattern.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {pattern.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(pattern.id, option)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
                        tempPreferences[pattern.id] === option
                          ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(tempPreferences).length} of {movementPatterns.length} patterns configured
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {movementPatterns.map(pattern => (
            <div key={pattern.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{pattern.label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {preferences[pattern.id] || '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
