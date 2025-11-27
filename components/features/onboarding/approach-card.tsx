'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import type { TrainingApproach } from '@/lib/types/schemas'
import { Card } from '@/components/ui/card'
import { ApproachDetails } from './approach-details'

interface ApproachCardProps {
  approach: TrainingApproach
  selected: boolean
  onSelect: () => void
}

// Get badge styling based on recommended level
function getLevelBadgeStyles(level: string | null | undefined): { bg: string; text: string } {
  switch (level) {
    case 'beginner':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
    case 'intermediate':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' }
    case 'advanced':
      return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' }
    case 'all_levels':
    default:
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' }
  }
}

export function ApproachCard({ approach, selected, onSelect }: ApproachCardProps) {
  const t = useTranslations('onboarding.approachCard')
  const locale = useLocale()
  const variables = approach.variables as any
  const progression = approach.progression_rules as any
  const [showDetails, setShowDetails] = useState(false)

  // Get level info from approach
  const recommendedLevel = (approach as any).recommended_level || 'all_levels'
  const levelNotes = (approach as any).level_notes as { it?: string; en?: string } | null
  const levelNote = levelNotes?.[locale as 'it' | 'en'] || levelNotes?.en
  const levelStyles = getLevelBadgeStyles(recommendedLevel)

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card selection when clicking Learn More
    setShowDetails(true)
  }

  return (
    <>
      <Card
        className={`p-6 cursor-pointer transition-all ${
          selected
            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onClick={onSelect}
      >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{approach.name}</h3>
          {approach.creator && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('by')} {approach.creator}
            </p>
          )}
          {/* Level Badge */}
          <div className="mt-2 flex flex-col gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${levelStyles.bg} ${levelStyles.text}`}>
              {t(`levels.${recommendedLevel}`)}
            </span>
            {levelNote && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {levelNote}
              </p>
            )}
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selected
              ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {(approach.short_philosophy || approach.philosophy) && (
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {approach.short_philosophy || approach.philosophy}
        </p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('workingSets')}</span>
          <span className="font-medium">{variables?.setsPerExercise?.working || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('repRanges')}</span>
          <span className="font-medium">
            {variables?.repRanges?.compound?.join('-') || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('rirTarget')}</span>
          <span className="font-medium">{variables?.rirTarget?.normal || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('progression')}</span>
          <span className="font-medium capitalize">
            {progression?.priority?.replace('_', ' ') || 'N/A'}
          </span>
        </div>
      </div>

      {/* Learn More Button */}
      <button
        onClick={handleLearnMore}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-lg transition-colors"
      >
        <Info className="w-4 h-4" />
        {t('learnMore')}
      </button>
    </Card>

    {/* Details Modal */}
    {showDetails && (
      <ApproachDetails
        approach={approach}
        onClose={() => setShowDetails(false)}
      />
    )}
  </>
  )
}
