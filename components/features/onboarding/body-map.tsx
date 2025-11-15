'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface BodyMapProps {
  selectedParts: string[]
  onToggle: (part: string) => void
}

const muscleGroupsCoordinates = [
  { id: 'chest_upper', x: 150, y: 120, view: 'front' },
  { id: 'chest_lower', x: 150, y: 140, view: 'front' },
  { id: 'shoulders', x: 120, y: 110, view: 'front' },
  { id: 'back_width', x: 150, y: 130, view: 'back' },
  { id: 'back_thickness', x: 150, y: 150, view: 'back' },
  { id: 'biceps', x: 110, y: 160, view: 'front' },
  { id: 'triceps', x: 190, y: 160, view: 'front' },
  { id: 'quads', x: 140, y: 230, view: 'front' },
  { id: 'hamstrings', x: 160, y: 240, view: 'back' },
  { id: 'glutes', x: 150, y: 200, view: 'back' },
  { id: 'calves', x: 150, y: 300, view: 'back' },
  { id: 'abs', x: 150, y: 180, view: 'front' }
] as const

const MAX_WEAK_POINTS = 3

export function BodyMap({ selectedParts, onToggle }: BodyMapProps) {
  const t = useTranslations('onboarding.steps.weakPoints.bodyMap')
  const [view, setView] = useState<'front' | 'back'>('front')
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false)

  const isLimitReached = selectedParts.length >= MAX_WEAK_POINTS

  const visibleGroups = muscleGroupsCoordinates.filter(
    g => !g.view || g.view === view
  )

  return (
    <div className="relative">
      {/* Educational Section - Why Max 3? */}
      <div className="mb-6 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden bg-blue-50 dark:bg-blue-950/30">
        <button
          onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <span className="font-medium text-blue-900 dark:text-blue-100">
            {t('whyMaxThree.title')}
          </span>
          {isExplanationExpanded ? (
            <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </button>

        {isExplanationExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {(['point1', 'point2', 'point3', 'point4'] as const).map((point) => (
              <div key={point} className="space-y-1">
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  {t(`whyMaxThree.principles.${point}.title`)}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t(`whyMaxThree.principles.${point}.description`)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setView('front')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'front'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {t('front')}
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'back'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {t('back')}
        </button>
      </div>

      {/* SVG body outline */}
      <svg width="300" height="400" className="mx-auto">
        {/* Simple body outline */}
        <ellipse
          cx="150"
          cy="80"
          rx="30"
          ry="40"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
        />
        <rect
          x="120"
          y="100"
          width="60"
          height="100"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
          rx="10"
        />
        <rect
          x="100"
          y="110"
          width="20"
          height="80"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
          rx="5"
        />
        <rect
          x="180"
          y="110"
          width="20"
          height="80"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
          rx="5"
        />
        <rect
          x="130"
          y="200"
          width="20"
          height="100"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
          rx="5"
        />
        <rect
          x="150"
          y="200"
          width="20"
          height="100"
          fill="none"
          stroke="currentColor"
          className="text-gray-400 dark:text-gray-600"
          rx="5"
        />

        {/* Muscle group clickable areas */}
        {visibleGroups.map((group) => {
          const isSelected = selectedParts.includes(group.id)
          const isDisabled = !isSelected && isLimitReached

          return (
            <g key={group.id}>
              <circle
                cx={group.x}
                cy={group.y}
                r="15"
                fill={isSelected ? '#ef4444' : 'transparent'}
                fillOpacity={isDisabled ? '0.2' : '0.5'}
                stroke={isSelected ? '#ef4444' : isDisabled ? '#9ca3af' : '#9ca3af'}
                strokeWidth="2"
                className={
                  isDisabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:stroke-blue-500 transition-colors'
                }
                onClick={() => !isDisabled && onToggle(group.id)}
              />
              <text
                x={group.x}
                y={group.y + 30}
                textAnchor="middle"
                className={`text-xs pointer-events-none ${
                  isDisabled
                    ? 'fill-gray-400 dark:fill-gray-600 opacity-40'
                    : 'fill-gray-700 dark:fill-gray-300'
                }`}
              >
                {t(`muscles.${group.id}` as any)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Selected parts list */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <p
            className={`text-sm font-medium transition-all duration-300 ${
              isLimitReached
                ? 'text-blue-600 dark:text-blue-400 scale-105'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t('selectedWeakPoints', { count: selectedParts.length })}
          </p>
          {isLimitReached && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
              {t('limitReachedMessage')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedParts.map(part => {
            return (
              <span
                key={part}
                className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-sm flex items-center gap-1"
              >
                {t(`muscles.${part}` as any)}
                <button
                  onClick={() => onToggle(part)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
