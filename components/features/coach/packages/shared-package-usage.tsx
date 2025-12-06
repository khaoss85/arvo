'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Users, Loader2, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getSharedPackageUsageAction } from '@/app/actions/shared-package-actions'
import type { SharedPackageUsage } from '@/lib/types/schemas'

interface SharedPackageUsageProps {
  packageId: string
  packageName: string
  totalSessions: number
  sessionsUsed: number
  className?: string
}

export function SharedPackageUsagePanel({
  packageId,
  packageName,
  totalSessions,
  sessionsUsed,
  className,
}: SharedPackageUsageProps) {
  const t = useTranslations('packages.shared')

  const [usage, setUsage] = useState<SharedPackageUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [packageId])

  const loadUsage = async () => {
    setIsLoading(true)
    try {
      const result = await getSharedPackageUsageAction(packageId)
      if (result.success && result.usage) {
        setUsage(result.usage)
      }
    } catch (error) {
      console.error('[SharedPackageUsage] Error loading usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sessionsRemaining = totalSessions - sessionsUsed
  const overallProgress = (sessionsUsed / totalSessions) * 100

  // Calculate colors for each user
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (usage.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <PieChart className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{t('noUsageData')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">{packageName}</h3>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('usageBreakdown')}</span>
            <span className="font-medium">
              {sessionsUsed}/{totalSessions} {t('sessions')}
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            {usage.map((user, index) => {
              const percentage = (user.sessions_used / totalSessions) * 100
              if (percentage === 0) return null
              return (
                <div
                  key={user.client_id}
                  className={cn(colors[index % colors.length], 'h-full transition-all')}
                  style={{ width: `${percentage}%` }}
                  title={`${user.client_name}: ${user.sessions_used} sessions`}
                />
              )
            })}
            {/* Remaining sessions (empty space) */}
            <div
              className="h-full bg-transparent"
              style={{ width: `${100 - overallProgress}%` }}
            />
          </div>
        </div>

        {/* Per-User Breakdown */}
        <div className="space-y-3">
          {usage.map((user, index) => {
            const percentage = sessionsUsed > 0
              ? Math.round((user.sessions_used / sessionsUsed) * 100)
              : 0
            const totalPercentage = Math.round((user.sessions_used / totalSessions) * 100)

            return (
              <div key={user.client_id} className="flex items-center gap-3">
                {/* Color Indicator */}
                <div className={cn(
                  'w-3 h-3 rounded-full shrink-0',
                  colors[index % colors.length]
                )} />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{user.client_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {user.sessions_used} {t('sessions')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={totalPercentage}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Remaining Sessions */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('sessionsRemaining')}</span>
            <Badge variant={sessionsRemaining <= 2 ? 'destructive' : 'secondary'}>
              {sessionsRemaining}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
