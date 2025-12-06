'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Check, Loader2, X, UserX, Clock, XCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  getPendingChurnAlertsAction,
  acknowledgeChurnAlertAction,
} from '@/app/actions/churn-risk-actions'
import { ChurnRiskService, type PendingChurnRiskAlert, type ChurnRiskLevel } from '@/lib/services/churn-risk.service'
import { cn } from '@/lib/utils/cn'

function getRiskBadgeVariant(level: ChurnRiskLevel): 'destructive' | 'warning' | 'secondary' | 'default' {
  switch (level) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'medium':
      return 'warning'
    default:
      return 'secondary'
  }
}

function getTriggerIcon(trigger: string) {
  switch (trigger) {
    case 'inactivity':
      return <Clock className="w-4 h-4" />
    case 'high_cancellations':
      return <XCircle className="w-4 h-4" />
    default:
      return <UserX className="w-4 h-4" />
  }
}

interface ChurnRiskAlertsPanelProps {
  className?: string
  onAlertCountChange?: (count: number) => void
}

export function ChurnRiskAlertsPanel({ className, onAlertCountChange }: ChurnRiskAlertsPanelProps) {
  const { user } = useAuthStore()

  const [alerts, setAlerts] = useState<PendingChurnRiskAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadAlerts = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getPendingChurnAlertsAction(user.id)
      if (!result.error) {
        setAlerts(result.alerts)
        onAlertCountChange?.(result.alerts.length)
      }
    } catch (error) {
      console.error('[ChurnRiskAlertsPanel] Error loading alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onAlertCountChange])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const handleAcknowledge = async (alertId: string, action?: string) => {
    setAcknowledgingId(alertId)
    try {
      const notes = notesMap[alertId]
      const result = await acknowledgeChurnAlertAction(alertId, notes, action)

      if (!result.error) {
        // Remove the acknowledged alert from the list
        setAlerts(prev => prev.filter(a => a.alert_id !== alertId))
        onAlertCountChange?.(alerts.length - 1)
        setNotesMap(prev => {
          const updated = { ...prev }
          delete updated[alertId]
          return updated
        })
        setExpandedId(null)
      }
    } catch (error) {
      console.error('[ChurnRiskAlertsPanel] Error acknowledging alert:', error)
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
          <UserX className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nessun cliente a rischio churn
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            I tuoi clienti sono attivi!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-semibold">Clienti a Rischio</h3>
          <Badge variant="secondary">{alerts.length}</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => {
          const isExpanded = expandedId === alert.alert_id
          const isAcknowledging = acknowledgingId === alert.alert_id
          const triggerText = ChurnRiskService.getTriggerText(
            alert.primary_trigger,
            alert.days_since_last_booking,
            alert.cancellation_rate,
            'it'
          )

          return (
            <div
              key={alert.alert_id}
              className={cn(
                'p-3 rounded-lg border bg-card transition-all',
                isExpanded && 'ring-2 ring-primary'
              )}
            >
              {/* Header */}
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : alert.alert_id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getTriggerIcon(alert.primary_trigger)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.client_name}</span>
                      <Badge variant={getRiskBadgeVariant(alert.risk_level)}>
                        {alert.risk_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {triggerText}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold">{Math.round(alert.risk_score)}%</span>
                  <p className="text-xs text-muted-foreground">rischio</p>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ultimo booking:</span>
                      <span className="ml-2 font-medium">
                        {alert.days_since_last_booking} giorni fa
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasso cancellazioni:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(alert.cancellation_rate)}%
                      </span>
                    </div>
                  </div>

                  {/* Suggested actions */}
                  {alert.suggested_actions && alert.suggested_actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Azioni suggerite:</p>
                      <div className="flex flex-wrap gap-2">
                        {alert.suggested_actions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.alert_id, action)}
                            disabled={isAcknowledging}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Textarea
                      placeholder="Aggiungi note (opzionale)..."
                      value={notesMap[alert.alert_id] || ''}
                      onChange={(e) => setNotesMap(prev => ({
                        ...prev,
                        [alert.alert_id]: e.target.value
                      }))}
                      className="min-h-[60px]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Chiudi
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      disabled={isAcknowledging}
                    >
                      {isAcknowledging ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Conferma
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
