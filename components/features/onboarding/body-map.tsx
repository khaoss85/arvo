'use client'

import { useState } from 'react'

interface BodyMapProps {
  selectedParts: string[]
  onToggle: (part: string) => void
}

const muscleGroups = [
  { id: 'chest_upper', label: 'Upper Chest', x: 150, y: 120, view: 'front' },
  { id: 'chest_lower', label: 'Lower Chest', x: 150, y: 140, view: 'front' },
  { id: 'shoulders', label: 'Shoulders', x: 120, y: 110, view: 'front' },
  { id: 'back_width', label: 'Back Width', x: 150, y: 130, view: 'back' },
  { id: 'back_thickness', label: 'Back Thickness', x: 150, y: 150, view: 'back' },
  { id: 'biceps', label: 'Biceps', x: 110, y: 160, view: 'front' },
  { id: 'triceps', label: 'Triceps', x: 190, y: 160, view: 'front' },
  { id: 'quads', label: 'Quadriceps', x: 140, y: 230, view: 'front' },
  { id: 'hamstrings', label: 'Hamstrings', x: 160, y: 240, view: 'back' },
  { id: 'glutes', label: 'Glutes', x: 150, y: 200, view: 'back' },
  { id: 'calves', label: 'Calves', x: 150, y: 300, view: 'back' },
  { id: 'abs', label: 'Abs', x: 150, y: 180, view: 'front' }
]

export function BodyMap({ selectedParts, onToggle }: BodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front')

  const visibleGroups = muscleGroups.filter(
    g => !g.view || g.view === view
  )

  return (
    <div className="relative">
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
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'back'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Back
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
        {visibleGroups.map((group) => (
          <g key={group.id}>
            <circle
              cx={group.x}
              cy={group.y}
              r="15"
              fill={selectedParts.includes(group.id) ? '#ef4444' : 'transparent'}
              fillOpacity="0.5"
              stroke={selectedParts.includes(group.id) ? '#ef4444' : '#9ca3af'}
              strokeWidth="2"
              className="cursor-pointer hover:stroke-blue-500 transition-colors"
              onClick={() => onToggle(group.id)}
            />
            <text
              x={group.x}
              y={group.y + 30}
              textAnchor="middle"
              className="text-xs pointer-events-none fill-gray-700 dark:fill-gray-300"
            >
              {group.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Selected parts list */}
      <div className="mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Selected weak points: {selectedParts.length}/3
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedParts.map(part => {
            const muscle = muscleGroups.find(m => m.id === part)
            return (
              <span
                key={part}
                className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-sm flex items-center gap-1"
              >
                {muscle?.label}
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
