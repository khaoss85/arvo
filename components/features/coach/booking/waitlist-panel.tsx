'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Calendar,
  Package,
  Loader2,
  Users,
  ArrowUpDown,
  Bell,
  Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  getCoachWaitlistAction,
  cancelWaitlistEntryAction,
} from '@/app/actions/waitlist-actions'
import type { BookingWaitlistEntry } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'
import { formatDays, formatTimeRange, getDaysWaiting } from '@/lib/utils/waitlist-helpers'

interface WaitlistPanelProps {
  className?: string
  onEntryCountChange?: (count: number) => void
  onNotifyClick?: (entry: BookingWaitlistEntry) => void
}

export function WaitlistPanel({
  className,
  onEntryCountChange,
  onNotifyClick,
}: WaitlistPanelProps) {
  const t = useTranslations('coach.waitlist')
  const { user } = useAuthStore()

  const [entries, setEntries] = useState<BookingWaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'waiting'>('priority')

  const loadEntries = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getCoachWaitlistAction(user.id, 'active')
      if (!result.error) {
        setEntries(result.entries)
        onEntryCountChange?.(result.entries.length)
      }
    } catch (error) {
      console.error('[WaitlistPanel] Error loading entries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onEntryCountChange])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleRemove = async (entryId: string) => {
    setRemovingId(entryId)
    try {
      const result = await cancelWaitlistEntryAction(entryId)
      if (result.success) {
        setEntries(prev => prev.filter(e => e.id !== entryId))
        onEntryCountChange?.(entries.length - 1)
      }
    } catch (error) {
      console.error('[WaitlistPanel] Error removing entry:', error)
    } finally {
      setRemovingId(null)
    }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'priority') {
      return (b.ai_priority_score ?? 50) - (a.ai_priority_score ?? 50)
    } else {
      const daysA = getDaysWaiting(a.created_at)
      const daysB = getDaysWaiting(b.created_at)
      return daysB - daysA
    }
  })

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{t('title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{entries.length}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(sortBy === 'priority' ? 'waiting' : 'priority')}
              className="text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              {sortBy === 'priority' ? t('sortByWaiting') : t('sortByPriority')}
            </Button>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {sortedEntries.map((entry, index) => {
            const daysWaiting = getDaysWaiting(entry.created_at)
            const isRemoving = removingId === entry.id
            const hasPackage = !!entry.package_id

            return (
              <div
                key={entry.id}
                className="border rounded-lg p-4 space-y-3 bg-background"
              >
                {/* Entry Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{entry.client_id.slice(0, 8)}...</span>
                      {hasPackage && (
                        <Badge variant="secondary" className="text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          {t('hasPackage')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {entry.ai_priority_score ?? 50}
                    </span>
                    <p className="text-xs text-muted-foreground">{t('priority')}</p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDays(entry.preferred_days || [], t('anyDay'))}
                  </div>
                  {(entry.preferred_time_start || entry.preferred_time_end) && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatTimeRange(entry.preferred_time_start, entry.preferred_time_end)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {t('daysWaiting', { days: daysWaiting })}
                  </div>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;{entry.notes}&rdquo;
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {onNotifyClick && (
                    <Button
                      size="sm"
                      onClick={() => onNotifyClick(entry)}
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      {t('notify')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(entry.id)}
                    disabled={isRemoving}
                    className="text-destructive hover:text-destructive"
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
