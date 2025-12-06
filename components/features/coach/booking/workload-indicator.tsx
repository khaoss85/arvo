'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { WorkloadBalanceService, type DayDensity } from '@/lib/services/workload-balance.service'
import { cn } from '@/lib/utils/cn'

interface WorkloadIndicatorProps {
  className?: string
  showLabel?: boolean
}

export function WorkloadIndicator({ className, showLabel = true }: WorkloadIndicatorProps) {
  const { user } = useAuthStore()
  const [density, setDensity] = useState<DayDensity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [consecutiveDays, setConsecutiveDays] = useState(0)

  const loadWorkload = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [todayDensity, workDays] = await Promise.all([
        WorkloadBalanceService.calculateDayDensity(user.id, today),
        WorkloadBalanceService.getConsecutiveWorkDays(user.id)
      ])
      setDensity(todayDensity)
      setConsecutiveDays(workDays)
    } catch (error) {
      console.error('[WorkloadIndicator] Error loading workload:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadWorkload()
  }, [loadWorkload])

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!density) {
    return null
  }

  const color = WorkloadBalanceService.getDensityColor(density.density)
  const status = WorkloadBalanceService.getDensityStatus(density.density, 'it')
  const isOverloaded = density.isOverloaded
  const isBurnoutRisk = consecutiveDays >= WorkloadBalanceService.CONSECUTIVE_DAYS_THRESHOLD

  const badgeVariant = color === 'destructive' ? 'destructive' :
                       color === 'warning' ? 'warning' :
                       color === 'success' ? 'success' : 'secondary'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2 cursor-help', className)}>
            {isOverloaded || isBurnoutRisk ? (
              <AlertTriangle className="w-4 h-4 text-warning" />
            ) : (
              <Activity className="w-4 h-4 text-muted-foreground" />
            )}
            <Badge variant={badgeVariant as any}>
              {density.density}%
            </Badge>
            {showLabel && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {status}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Carico di lavoro oggi</p>
            <p className="text-sm text-muted-foreground">
              {density.sessionCount} sessioni ({density.bookedMinutes} min su {density.totalAvailableMinutes} min disponibili)
            </p>
            {isOverloaded && (
              <p className="text-sm text-warning">
                Attenzione: giornata molto impegnata
              </p>
            )}
            {isBurnoutRisk && (
              <p className="text-sm text-warning">
                {consecutiveDays} giorni consecutivi di lavoro
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
