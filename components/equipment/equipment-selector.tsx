'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { EquipmentCategory } from './equipment-category'
import { EquipmentPresetBar } from './equipment-preset-bar'
import { EQUIPMENT_TAXONOMY } from '@/lib/constants/equipment-taxonomy'
import type { EquipmentPreset } from '@/lib/constants/equipment-presets'

interface EquipmentSelectorProps {
  initialSelection: string[]
  onSelectionChange: (equipment: string[]) => void
  onComplete?: () => void
  showContinueButton?: boolean
}

export function EquipmentSelector({
  initialSelection,
  onSelectionChange,
  onComplete,
  showContinueButton = true
}: EquipmentSelectorProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    new Set(initialSelection)
  )
  const [expandedCategory, setExpandedCategory] = useState<string | null>('free_weights')
  const [searchQuery, setSearchQuery] = useState('')

  // Toggle equipment selection
  const toggleEquipment = (equipmentId: string) => {
    const newSelection = new Set(selectedEquipment)
    if (newSelection.has(equipmentId)) {
      newSelection.delete(equipmentId)
    } else {
      newSelection.add(equipmentId)
    }
    setSelectedEquipment(newSelection)
    onSelectionChange(Array.from(newSelection))
  }

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  // Apply preset
  const applyPreset = (preset: EquipmentPreset) => {
    const newSelection = new Set(preset.equipment)
    setSelectedEquipment(newSelection)
    onSelectionChange(Array.from(newSelection))
  }

  // Clear all selections
  const clearAll = () => {
    setSelectedEquipment(new Set())
    onSelectionChange([])
  }

  // Total selected count
  const selectedCount = selectedEquipment.size

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with selection count */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Equipment Selection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </p>
          </div>
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Preset bar */}
      <EquipmentPresetBar onPresetSelect={applyPreset} />

      {/* Categories */}
      <div className={`flex-1 overflow-y-auto ${showContinueButton ? 'pb-24' : 'pb-4'}`}>
        {Object.entries(EQUIPMENT_TAXONOMY).map(([categoryId, category]) => (
          <EquipmentCategory
            key={categoryId}
            categoryId={categoryId}
            category={category}
            selectedItems={selectedEquipment}
            isExpanded={expandedCategory === categoryId}
            onToggle={() => toggleCategory(categoryId)}
            onItemToggle={toggleEquipment}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Fixed bottom action */}
      {showContinueButton && onComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4 z-10">
          <Button
            onClick={onComplete}
            disabled={selectedCount === 0}
            size="lg"
            className="w-full"
          >
            Continue ({selectedCount} selected)
          </Button>
        </div>
      )}
    </div>
  )
}
