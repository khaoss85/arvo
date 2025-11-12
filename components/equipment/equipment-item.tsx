'use client'

import { useState } from 'react'
import { Check, Eye } from 'lucide-react'
import type { EquipmentItem as EquipmentItemType } from '@/lib/constants/equipment-taxonomy'
import { hasRepresentativeExercise } from '@/lib/constants/equipment-exercise-mapping'
import { EquipmentPreviewModal } from './equipment-preview-modal'

interface EquipmentItemProps {
  item: EquipmentItemType
  isSelected: boolean
  onToggle: () => void
}

export function EquipmentItem({ item, isSelected, onToggle }: EquipmentItemProps) {
  const [showPreview, setShowPreview] = useState(false)
  const hasPreview = hasRepresentativeExercise(item.id)

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPreview(true)
  }

  return (
    <>
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
        <div className="flex items-center gap-2">
          {hasPreview && (
            <button
              onClick={handlePreviewClick}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          )}
          {isSelected && (
            <Check className="text-green-600 dark:text-green-400 w-5 h-5 flex-shrink-0" />
          )}
        </div>
      </label>

      {showPreview && (
        <EquipmentPreviewModal
          equipmentId={item.id}
          equipmentLabel={item.label}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
