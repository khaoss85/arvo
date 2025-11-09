'use client'

import { Check } from 'lucide-react'
import type { EquipmentItem as EquipmentItemType } from '@/lib/constants/equipment-taxonomy'

interface EquipmentItemProps {
  item: EquipmentItemType
  isSelected: boolean
  onToggle: () => void
}

export function EquipmentItem({ item, isSelected, onToggle }: EquipmentItemProps) {
  return (
    <label
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors min-h-[48px]"
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">
          {item.label}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {item.commonFor.join(", ")}
        </p>
      </div>
      {isSelected && (
        <Check className="text-green-600 dark:text-green-400 w-5 h-5 flex-shrink-0" />
      )}
    </label>
  )
}
