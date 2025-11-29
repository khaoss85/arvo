'use client'

import { useTranslations } from 'next-intl'
import type { AppliedTechnique, TechniqueType } from '@/lib/types/advanced-techniques'
import { TECHNIQUE_I18N_KEYS, TECHNIQUE_COMPATIBILITY } from '@/lib/types/advanced-techniques'
import {
  Zap,
  Timer,
  Repeat,
  TrendingUp,
  Flame,
  Layers,
  Target,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TechniqueIndicatorProps {
  technique: AppliedTechnique
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  showRationale?: boolean
}

// Icon mapping for each technique type
const TECHNIQUE_ICONS: Record<TechniqueType, React.ComponentType<{ className?: string }>> = {
  drop_set: Zap,
  rest_pause: Timer,
  superset: Repeat,
  top_set_backoff: TrendingUp,
  myo_reps: Flame,
  giant_set: Layers,
  cluster_set: Target,
  pyramid: ArrowUpDown,
}

// Color mapping for each technique type
const TECHNIQUE_COLORS: Record<TechniqueType, string> = {
  drop_set: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rest_pause: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  superset: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  top_set_backoff: 'bg-red-500/20 text-red-400 border-red-500/30',
  myo_reps: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  giant_set: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  cluster_set: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  pyramid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export function TechniqueIndicator({
  technique,
  onClick,
  size = 'md',
  showRationale = false,
}: TechniqueIndicatorProps) {
  const t = useTranslations('workout.techniques')

  const Icon = TECHNIQUE_ICONS[technique.technique]
  const colorClass = TECHNIQUE_COLORS[technique.technique]
  const i18nKey = TECHNIQUE_I18N_KEYS[technique.technique]
  const compatibility = TECHNIQUE_COMPATIBILITY[technique.technique]

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  // Get technique name with fallback
  const techniqueName = (() => {
    try {
      return t(`${i18nKey}.name`)
    } catch {
      // Fallback to formatted technique type
      return technique.technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  })()

  // Get technique description with fallback
  const techniqueDescription = (() => {
    try {
      return t(`${i18nKey}.description`)
    } catch {
      return compatibility.description
    }
  })()

  // Build tooltip text
  const tooltipText = showRationale && technique.rationale
    ? `${techniqueName}: ${techniqueDescription}\n\n${technique.rationale}`
    : `${techniqueName}: ${techniqueDescription}`

  return (
    <button
      onClick={onClick}
      title={tooltipText}
      className={cn(
        'flex items-center font-medium border rounded-md transition-all hover:scale-105 inline-flex',
        colorClass,
        sizeClasses[size],
        onClick && 'hover:brightness-110 cursor-pointer'
      )}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>{techniqueName}</span>
    </button>
  )
}

// Compact version for tight spaces (e.g., exercise list)
export function TechniqueIndicatorCompact({
  technique,
  onClick,
}: {
  technique: AppliedTechnique
  onClick?: () => void
}) {
  const Icon = TECHNIQUE_ICONS[technique.technique]
  const colorClass = TECHNIQUE_COLORS[technique.technique]

  const techniqueName = technique.technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <button
      onClick={onClick}
      title={techniqueName}
      className={cn(
        'flex items-center justify-center h-6 w-6 rounded-full border transition-all hover:scale-110',
        colorClass,
        onClick && 'cursor-pointer'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}
