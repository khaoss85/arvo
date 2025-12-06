'use client'

import { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Calendar, Coffee } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { WorkloadBalanceService, type WorkloadMetrics } from '@/lib/services/workload-balance.service'
import { cn } from '@/lib/utils/cn'

interface WorkloadAlertsBannerProps {
  className?: string
  onCreateBlock?: () => void
}

export function WorkloadAlertsBanner({ className, onCreateBlock }: WorkloadAlertsBannerProps) {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<WorkloadMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  const loadMetrics = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const workloadMetrics = await WorkloadBalanceService.getWorkloadMetrics(user.id, 7)
      setMetrics(workloadMetrics)
    } catch (error) {
      console.error('[WorkloadAlertsBanner] Error loading metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  // Don't show if loading, dismissed, or no alerts needed
  if (isLoading || isDismissed || !metrics) {
    return null
  }

  const hasOverloadedDays = metrics.overloadedDays.length > 0
  const hasBurnoutRisk = metrics.isAtBurnoutRisk
  const todayOverloaded = metrics.todayDensity?.isOverloaded

  // Don't show if everything is fine
  if (!hasOverloadedDays && !hasBurnoutRisk && !todayOverloaded) {
    return null
  }

  // Determine alert severity
  const isCritical = todayOverloaded && metrics.todayDensity!.density >= 90
  const isWarning = todayOverloaded || hasBurnoutRisk

  return (
    <Alert
      variant={isCritical ? 'destructive' : 'warning'}
      className={cn('relative', className)}
    >
      <AlertTriangle className="h-4 w-4" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <AlertTitle className="pr-8">
        {isCritical
          ? 'Sovraccarico critico'
          : hasBurnoutRisk
          ? 'Rischio burnout'
          : 'Carico elevato'}
      </AlertTitle>

      <AlertDescription className="mt-2 space-y-3">
        {/* Today's status */}
        {todayOverloaded && metrics.todayDensity && (
          <p>
            Oggi hai {metrics.todayDensity.sessionCount} sessioni programmate
            ({metrics.todayDensity.density}% del tempo disponibile).
          </p>
        )}

        {/* Burnout warning */}
        {hasBurnoutRisk && (
          <p>
            Hai lavorato {metrics.consecutiveWorkDays} giorni consecutivi senza pausa.
            Considera di aggiungere un giorno di riposo.
          </p>
        )}

        {/* Upcoming overloaded days */}
        {hasOverloadedDays && metrics.overloadedDays.length > 1 && (
          <p className="text-sm">
            Hai {metrics.overloadedDays.length} giorni sovraccarichi nei prossimi 7 giorni.
          </p>
        )}

        {/* Weekly summary */}
        <p className="text-sm text-muted-foreground">
          Media settimanale: {metrics.averageDailyDensity}% |
          Sessioni questa settimana: {metrics.weeklySessionCount}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onCreateBlock && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateBlock}
              className="gap-1"
            >
              <Calendar className="h-3 w-3" />
              Aggiungi blocco
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="gap-1"
          >
            <Coffee className="h-3 w-3" />
            Ricordamelo dopo
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
