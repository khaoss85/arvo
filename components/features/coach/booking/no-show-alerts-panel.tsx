'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Check, Loader2, X, Bell } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  getPendingNoShowAlertsAction,
  acknowledgeNoShowAlertAction,
} from '@/app/actions/no-show-tracking-actions'
import type { PendingNoShowAlert } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'

type SeverityLevel = 'warning' | 'high' | 'critical'

function getSeverityLevel(rate: number): SeverityLevel {
  if (rate >= 80) return 'critical'
  if (rate >= 60) return 'high'
  return 'warning'
}

function getSeverityBadgeVariant(severity: SeverityLevel): 'warning' | 'destructive' | 'default' {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'warning':
      return 'warning'
  }
}

interface NoShowAlertsPanelProps {
  className?: string
  onAlertCountChange?: (count: number) => void
}

export function NoShowAlertsPanel({ className, onAlertCountChange }: NoShowAlertsPanelProps) {
  const t = useTranslations('coach.noShow')
  const { user } = useAuthStore()

  const [alerts, setAlerts] = useState<PendingNoShowAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadAlerts = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getPendingNoShowAlertsAction(user.id)
      if (!result.error) {
        setAlerts(result.alerts)
        onAlertCountChange?.(result.alerts.length)
      }
    } catch (error) {
      console.error('[NoShowAlertsPanel] Error loading alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onAlertCountChange])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId)
    try {
      const notes = notesMap[alertId]
      const result = await acknowledgeNoShowAlertAction(alertId, notes)

      if (!result.error) {
        // Remove the acknowledged alert from the list
        setAlerts(prev => prev.filter(a => a.alert_id !== alertId))
        onAlertCountChange?.(alerts.length - 1)
        setNotesMap(prev => {
          const updated = { ...prev }
          delete updated[alertId]
          return updated
        })
      }
    } catch (error) {
      console.error('[NoShowAlertsPanel] Error acknowledging alert:', error)
    } finally {
      setAcknowledgingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t('noAlerts')}</p>
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
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">{t('alerts')}</h3>
          </div>
          <Badge variant="outline">{alerts.length} {t('pendingAlerts')}</Badge>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert) => {
            const severity = getSeverityLevel(alert.no_show_rate)
            const isExpanded = expandedId === alert.alert_id
            const isAcknowledging = acknowledgingId === alert.alert_id

            return (
              <div
                key={alert.alert_id}
                className="border rounded-lg p-4 space-y-3 bg-background"
              >
                {/* Alert Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.client_name}</span>
                      <Badge variant={getSeverityBadgeVariant(severity)}>
                        {t(`severity.${severity}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('clientMissed', {
                        name: alert.client_name,
                        count: alert.no_show_count,
                        total: alert.session_count,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(alert.no_show_rate)}%
                    </span>
                    <p className="text-xs text-muted-foreground">{t('rate')}</p>
                  </div>
                </div>

                {/* Expand/Collapse for Notes */}
                {!isExpanded ? (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(alert.alert_id)}
                    >
                      {t('notes')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      disabled={isAcknowledging}
                    >
                      {isAcknowledging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {t('acknowledge')}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <Textarea
                      placeholder={t('notesPlaceholder')}
                      value={notesMap[alert.alert_id] || ''}
                      onChange={(e) =>
                        setNotesMap(prev => ({
                          ...prev,
                          [alert.alert_id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        disabled={isAcknowledging}
                      >
                        {isAcknowledging ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            {t('acknowledge')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
