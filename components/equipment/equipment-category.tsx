'use client'

import { ChevronDown } from 'lucide-react'
import { EquipmentItem } from './equipment-item'
import type { EquipmentCategory as EquipmentCategoryType } from '@/lib/constants/equipment-taxonomy'

interface EquipmentCategoryProps {
  categoryId: string
  category: EquipmentCategoryType
  selectedItems: Set<string>
  isExpanded: boolean
  onToggle: () => void
  onItemToggle: (equipmentId: string) => void
  searchQuery?: string
}

export function EquipmentCategory({
  categoryId,
  category,
  selectedItems,
  isExpanded,
  onToggle,
  onItemToggle,
  searchQuery = ''
}: EquipmentCategoryProps) {
  const selectedCount = category.items.filter(item =>
    selectedItems.has(item.id)
  ).length

  const filteredItems = category.items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.commonFor.some(use => use.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Don't show category if no items match search
  if (searchQuery && filteredItems.length === 0) {
    return null
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {category.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount}/{category.items.length} selected
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable items */}
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-900 px-4 pb-4">
          {/* Select all button */}
          {selectedCount < category.items.length && (
            <button
              onClick={() => {
                category.items.forEach(item => {
                  if (!selectedItems.has(item.id)) {
                    onItemToggle(item.id)
                  }
                })
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              Select All in {category.label}
            </button>
          )}

          {/* Equipment items */}
          <div className="space-y-1">
            {filteredItems.map(item => (
              <EquipmentItem
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onToggle={() => onItemToggle(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
