'use client'

import { useTranslations } from 'next-intl'
import type { ApproachCategory } from '@/lib/types/schemas'

interface ApproachCategoryTabsProps {
  activeCategory: ApproachCategory
  onCategoryChange: (category: ApproachCategory) => void
  counts?: Record<ApproachCategory, number>
}

export function ApproachCategoryTabs({
  activeCategory,
  onCategoryChange,
  counts,
}: ApproachCategoryTabsProps) {
  const t = useTranslations('onboarding.approachCategories')

  const categories: { id: ApproachCategory; label: string }[] = [
    { id: 'bodybuilding', label: t('bodybuilding') },
    { id: 'powerlifting', label: t('powerlifting') },
  ]

  return (
    <div
      role="tablist"
      className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeCategory === cat.id
              ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span>{cat.label}</span>
          {counts && counts[cat.id] !== undefined && (
            <span
              className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {counts[cat.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
