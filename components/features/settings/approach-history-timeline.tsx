'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar, TrendingUp, Clock, CheckCircle2, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getApproachHistoryAction } from '@/app/actions/approach-actions'
import type { TrainingApproach } from '@/lib/types/schemas'

interface ApproachHistoryEntry {
  id: string
  approach_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  is_active: boolean | null
  switch_reason: string | null
  notes: string | null
  total_workouts_completed: number | null
  total_weeks: number | null
  calculated_duration_weeks: number
  calculated_workouts_completed: number
  approach: TrainingApproach | null
}

interface ApproachHistoryTimelineProps {
  userId: string
}

export function ApproachHistoryTimeline({ userId }: ApproachHistoryTimelineProps) {
  const t = useTranslations('settings.approachHistory')
  const [history, setHistory] = useState<ApproachHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [userId])

  const loadHistory = async () => {
    setIsLoading(true)
    setError(null)

    const result = await getApproachHistoryAction(userId)

    setIsLoading(false)

    if (result.success && result.data) {
      setHistory(result.data)
    } else {
      setError(result.error || t('errors.loadError'))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = formatDate(start)
    const endDate = end ? formatDate(end) : 'Present'
    return `${startDate} - ${endDate}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
        {error}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('emptyState')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {history.map((entry, index) => {
            const isExpanded = expandedId === entry.id
            const isActive = entry.is_active

            return (
              <Card
                key={entry.id}
                className={`relative pl-12 pr-5 py-4 ${
                  isActive
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-[7px] top-6 w-4 h-4 rounded-full border-2 ${
                    isActive
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                />

                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {entry.approach?.name || 'Unknown Approach'}
                        </h4>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            {t('activeBadge')}
                          </span>
                        )}
                      </div>
                      {entry.approach?.creator && (
                        <p className="text-xs text-muted-foreground">
                          {t('byCreator', { creator: entry.approach.creator })}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      {isExpanded ? t('lessButton') : t('moreButton')}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('stats.duration')}</p>
                        <p className="font-medium">
                          {t('stats.weeks', { count: entry.calculated_duration_weeks })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('stats.workouts')}</p>
                        <p className="font-medium">
                          {entry.calculated_workouts_completed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('stats.period')}</p>
                        <p className="font-medium text-xs">
                          {formatDateRange(entry.started_at, entry.ended_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="pt-3 border-t space-y-3">
                      {(entry.approach?.short_philosophy || entry.approach?.philosophy) && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">{t('expandedSections.philosophy')}</h5>
                          <p className="text-sm text-muted-foreground">
                            {entry.approach.short_philosophy || entry.approach.philosophy}
                          </p>
                        </div>
                      )}

                      {entry.switch_reason && (
                        <div className="flex gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="text-sm font-medium mb-1">{t('expandedSections.switchReason')}</h5>
                            <p className="text-sm text-muted-foreground">
                              {entry.switch_reason}
                            </p>
                          </div>
                        </div>
                      )}

                      {entry.notes && (
                        <div className="flex gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="text-sm font-medium mb-1">{t('expandedSections.notes')}</h5>
                            <p className="text-sm text-muted-foreground">
                              {entry.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {entry.approach && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">{t('expandedSections.keyVariables')}</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between p-2 rounded bg-muted/50">
                              <span className="text-muted-foreground">{t('expandedSections.workingSets')}</span>
                              <span className="font-medium">
                                {(entry.approach.variables as any)?.setsPerExercise?.working || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-muted/50">
                              <span className="text-muted-foreground">{t('expandedSections.rirTarget')}</span>
                              <span className="font-medium">
                                {(entry.approach.variables as any)?.targetRIR?.normal ?? 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      {history.length > 1 && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-sm">{t('summary.title')}</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t('summary.totalApproaches')}</p>
              <p className="text-lg font-semibold">{history.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('summary.totalWorkouts')}</p>
              <p className="text-lg font-semibold">
                {history.reduce((sum, entry) => sum + entry.calculated_workouts_completed, 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('summary.trainingWeeks')}</p>
              <p className="text-lg font-semibold">
                {history.reduce((sum, entry) => sum + entry.calculated_duration_weeks, 0)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
