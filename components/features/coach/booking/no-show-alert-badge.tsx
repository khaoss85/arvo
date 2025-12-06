'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getClientNoShowStatsAction } from '@/app/actions/no-show-tracking-actions'
import type { NoShowStats } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'

interface NoShowAlertBadgeProps {
  coachId: string
  clientId: string
  clientName?: string
  size?: 'sm' | 'md'
  showOnlyIfExceeds?: boolean
  /** Pre-loaded stats to avoid redundant fetches */
  preloadedStats?: NoShowStats | null
}

type SeverityLevel = 'warning' | 'high' | 'critical'

function getSeverityLevel(rate: number): SeverityLevel {
  if (rate >= 80) return 'critical'
  if (rate >= 60) return 'high'
  return 'warning'
}

function getSeverityStyles(severity: SeverityLevel): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'high':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
  }
}

export function NoShowAlertBadge({
  coachId,
  clientId,
  clientName,
  size = 'sm',
  showOnlyIfExceeds = true,
  preloadedStats,
}: NoShowAlertBadgeProps) {
  const t = useTranslations('coach.noShow')
  const [stats, setStats] = useState<NoShowStats | null>(preloadedStats ?? null)
  const [isLoading, setIsLoading] = useState(!preloadedStats)

  useEffect(() => {
    // Skip fetch if we have preloaded stats
    if (preloadedStats !== undefined) return

    async function loadStats() {
      if (!coachId || !clientId) return

      try {
        const result = await getClientNoShowStatsAction(coachId, clientId)
        if (!result.error && result.stats) {
          setStats(result.stats)
        }
      } catch (error) {
        console.error('[NoShowAlertBadge] Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [coachId, clientId, preloadedStats])

  // Don't render if loading, no stats, or rate is 0
  if (isLoading || !stats || stats.no_show_rate === 0) {
    return null
  }

  // If showOnlyIfExceeds is true, only show when threshold is exceeded
  if (showOnlyIfExceeds && !stats.exceeds_threshold) {
    return null
  }

  const severity = getSeverityLevel(stats.no_show_rate)
  const severityStyles = getSeverityStyles(severity)

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full p-1 transition-colors',
            'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2',
            severityStyles
          )}
          aria-label={t('alert')}
        >
          <AlertTriangle className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="center" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('w-4 h-4', getSeverityStyles(severity).split(' ')[0])} />
            <span className="text-sm font-medium">{t('alert')}</span>
          </div>

          {clientName && (
            <p className="text-sm text-muted-foreground">
              {clientName}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('rate')}</span>
            <span className={cn('font-medium', getSeverityStyles(severity).split(' ')[0])}>
              {Math.round(stats.no_show_rate)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('stats')}</span>
            <span className="font-medium">
              {stats.no_show_count}/{stats.session_count}
            </span>
          </div>

          {stats.exceeds_threshold && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {t('threshold')} ({Math.round(stats.no_show_rate)}% &gt; 40%)
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
