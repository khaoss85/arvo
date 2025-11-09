'use client'

import { Button } from '@/components/ui/button'
import { EQUIPMENT_PRESETS, type EquipmentPreset } from '@/lib/constants/equipment-presets'

interface EquipmentPresetBarProps {
  onPresetSelect: (preset: EquipmentPreset) => void
}

export function EquipmentPresetBar({ onPresetSelect }: EquipmentPresetBarProps) {
  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Quick Presets:
      </p>
      <div className="flex gap-2 flex-wrap">
        {EQUIPMENT_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => onPresetSelect(preset)}
            className="flex items-center gap-1.5"
          >
            <span>{preset.icon}</span>
            <span>{preset.name}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
