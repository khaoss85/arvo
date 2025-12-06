'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Package, Loader2, Calendar, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { getExpiringPackagesGroupedAction } from '@/app/actions/package-expiration-actions'
import type { ExpiringPackage } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'

type UrgencyLevel = 'critical' | 'warning' | 'info'

function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining <= 1) return 'critical'
  if (daysRemaining <= 3) return 'warning'
  return 'info'
}

function getUrgencyBadgeVariant(urgency: UrgencyLevel): 'destructive' | 'warning' | 'default' {
  switch (urgency) {
    case 'critical':
      return 'destructive'
    case 'warning':
      return 'warning'
    case 'info':
      return 'default'
  }
}

interface GroupedPackages {
  today: ExpiringPackage[]
  threeDays: ExpiringPackage[]
  sevenDays: ExpiringPackage[]
}

interface ExpiringPackagesPanelProps {
  className?: string
  onCountChange?: (count: number) => void
}

export function ExpiringPackagesPanel({ className, onCountChange }: ExpiringPackagesPanelProps) {
  const t = useTranslations('packages.expiring')
  const { user } = useAuthStore()

  const [grouped, setGrouped] = useState<GroupedPackages>({
    today: [],
    threeDays: [],
    sevenDays: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadPackages = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getExpiringPackagesGroupedAction()
      if (result.success && result.grouped) {
        setGrouped(result.grouped)
        const totalCount =
          result.grouped.today.length +
          result.grouped.threeDays.length +
          result.grouped.sevenDays.length
        onCountChange?.(totalCount)
      }
    } catch (error) {
      console.error('[ExpiringPackagesPanel] Error loading packages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onCountChange])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  const totalCount =
    grouped.today.length + grouped.threeDays.length + grouped.sevenDays.length

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t('noExpiring')}</p>
        </div>
      </Card>
    )
  }

  const renderPackageItem = (pkg: ExpiringPackage) => {
    const urgency = getUrgencyLevel(pkg.days_until_expiry)

    return (
      <div
        key={pkg.package_id}
        className="flex items-center justify-between p-3 border rounded-lg bg-background"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{pkg.client_name}</span>
            <Badge variant={getUrgencyBadgeVariant(urgency)} className="text-xs">
              {pkg.days_until_expiry === 0
                ? t('expiresToday')
                : t('expiresIn', { days: pkg.days_until_expiry })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {pkg.package_name} - {t('sessionsRemaining', { count: pkg.sessions_remaining })}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-1" />
          {t('contact')}
        </Button>
      </div>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">{t('title')}</h3>
          </div>
          <Badge variant="outline">{totalCount}</Badge>
        </div>

        {/* Today Section */}
        {grouped.today.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {t('expiresGroup.today')}
              </span>
            </div>
            <div className="space-y-2 ml-4">
              {grouped.today.map(renderPackageItem)}
            </div>
          </div>
        )}

        {/* 3 Days Section */}
        {grouped.threeDays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {t('expiresGroup.threeDays')}
              </span>
            </div>
            <div className="space-y-2 ml-4">
              {grouped.threeDays.map(renderPackageItem)}
            </div>
          </div>
        )}

        {/* 7 Days Section */}
        {grouped.sevenDays.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {t('expiresGroup.sevenDays')}
              </span>
            </div>
            <div className="space-y-2 ml-4">
              {grouped.sevenDays.map(renderPackageItem)}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
