'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MuscleDropdownProps {
  selected: string[]
  onChange: (muscles: string[]) => void
  maxSelections?: number
}

const MUSCLE_GROUPS = {
  'Upper Body': ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Forearms'],
  'Lower Body': ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  'Core': ['Abs', 'Lower Back', 'Obliques']
}

const ALL_MUSCLES = Object.values(MUSCLE_GROUPS).flat()

export function MuscleDropdown({ selected, onChange, maxSelections = 3 }: MuscleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMuscle = (muscle: string) => {
    if (selected.includes(muscle)) {
      // Remove muscle
      onChange(selected.filter(m => m !== muscle))
    } else {
      // Add muscle (if not at max)
      if (selected.length < maxSelections) {
        onChange([...selected, muscle])
      }
    }
  }

  const removeMuscle = (muscle: string) => {
    onChange(selected.filter(m => m !== muscle))
  }

  const atMaxSelections = selected.length >= maxSelections

  return (
    <div className="space-y-2">
      {/* Dropdown Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <span className="text-sm text-muted-foreground">
          {selected.length === 0
            ? 'Select affected muscles (optional)'
            : `${selected.length}/${maxSelections} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="border rounded-lg p-3 bg-white dark:bg-gray-950 shadow-lg">
          {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
            <div key={groupName} className="mb-4 last:mb-0">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                {groupName}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {muscles.map(muscle => {
                  const isSelected = selected.includes(muscle)
                  const isDisabled = !isSelected && atMaxSelections

                  return (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => !isDisabled && toggleMuscle(muscle)}
                      disabled={isDisabled}
                      className={`
                        px-3 py-2 text-sm rounded-md transition-colors
                        ${isSelected
                          ? 'bg-blue-500 text-white'
                          : isDisabled
                            ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {muscle}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {atMaxSelections && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
              Maximum {maxSelections} muscles selected. Remove one to select another.
            </p>
          )}
        </div>
      )}

      {/* Selected Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(muscle => (
            <span
              key={muscle}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm rounded-full"
            >
              {muscle}
              <button
                type="button"
                onClick={() => removeMuscle(muscle)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
