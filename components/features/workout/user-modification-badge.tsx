'use client'

import { Plus } from 'lucide-react'

interface UserModificationBadgeProps {
  addedSets: number
  aiRecommendedSets: number
  variant?: 'compact' | 'detailed'
  className?: string
}

export function UserModificationBadge({
  addedSets,
  aiRecommendedSets,
  variant = 'compact',
  className = ''
}: UserModificationBadgeProps) {
  if (addedSets === 0) return null

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 ${className}`}
        title={`You added ${addedSets} extra ${addedSets === 1 ? 'set' : 'sets'} beyond AI recommendation`}
      >
        <Plus className="w-3 h-3" />
        {addedSets}
      </span>
    )
  }

  // Detailed variant
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 ${className}`}>
      <Plus className="w-3.5 h-3.5" />
      <span>
        {addedSets} extra {addedSets === 1 ? 'set' : 'sets'} added
      </span>
    </div>
  )
}
