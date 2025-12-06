'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserX
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getClientBookingHistoryAction,
  getClientPackagesAction
} from '@/app/actions/booking-actions'
import type { Booking, BookingPackage } from '@/lib/types/schemas'

// =====================================================
// Types
// =====================================================

interface ClientBookingsTabProps {
  coachId: string
  clientId: string
  clientName: string
}

type BookingFilter = 'upcoming' | 'past' | 'all'

// =====================================================
// Component
// =====================================================

export function ClientBookingsTab({
  coachId,
  clientId,
  clientName
}: ClientBookingsTabProps) {
  const t = useTranslations('coach.clientDetail')
  const locale = useTranslations('coach.calendar')('locale') === 'it' ? it : enUS

  const [bookings, setBookings] = useState<Booking[]>([])
  const [packages, setPackages] = useState<BookingPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<BookingFilter>('upcoming')

  // Load data
  useEffect(() => {
    loadData()
  }, [clientId, coachId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [bookingsResult, packagesResult] = await Promise.all([
        getClientBookingHistoryAction(coachId, clientId, 'all'),
        getClientPackagesAction(clientId, coachId)
      ])

      if (bookingsResult.success && bookingsResult.bookings) {
        setBookings(bookingsResult.bookings as Booking[])
      }
      if (packagesResult.success && packagesResult.packages) {
        setPackages(packagesResult.packages as BookingPackage[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    switch (filter) {
      case 'upcoming':
        return bookings
          .filter(b => b.scheduled_date >= today && b.status === 'confirmed')
          .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      case 'past':
        return bookings
          .filter(b => b.scheduled_date < today || b.status !== 'confirmed')
          .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
      default:
        return bookings.sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    }
  }, [bookings, filter])

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {}
    for (const booking of filteredBookings) {
      if (!groups[booking.scheduled_date]) {
        groups[booking.scheduled_date] = []
      }
      groups[booking.scheduled_date].push(booking)
    }
    return groups
  }, [filteredBookings])

  // Active packages
  const activePackages = packages.filter(p => p.status === 'active')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Packages Section */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          {t('activePackages')}
        </h3>

        {activePackages.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>{t('noPackages')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activePackages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* Bookings Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {filter === 'upcoming' ? t('upcomingBookings') : filter === 'past' ? t('pastBookings') : t('allBookings')}
          </h3>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(['upcoming', 'past', 'all'] as BookingFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  filter === f
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {f === 'upcoming' ? t('upcomingBookings') : f === 'past' ? t('pastBookings') : t('allBookings')}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">{t('noBookings')}</p>
            <p className="text-sm mt-1">{t('noBookingsDescription')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedBookings).map(([date, dateBookings]) => (
              <div key={date}>
                <DateHeader date={date} locale={locale} />
                <div className="space-y-2 mt-2">
                  {dateBookings.map(booking => (
                    <BookingItem key={booking.id} booking={booking} locale={locale} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// =====================================================
// Sub-components
// =====================================================

function PackageCard({
  pkg,
  locale,
  t
}: {
  pkg: BookingPackage
  locale: typeof it | typeof enUS
  t: any
}) {
  const remaining = pkg.total_sessions - pkg.sessions_used
  const progress = (pkg.sessions_used / pkg.total_sessions) * 100
  const isLow = remaining <= 2

  return (
    <Card className={cn(
      "p-4",
      isLow && "border-orange-500/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {pkg.name}
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 border text-xs">
              {pkg.status}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{pkg.sessions_used} / {pkg.total_sessions}</span>
              <span className={isLow ? 'text-orange-500 font-medium' : ''}>
                {t('sessionsRemaining', { count: remaining })}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isLow ? "bg-orange-500" : "bg-emerald-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{pkg.sessions_per_week} sessioni/sett</span>
            {pkg.end_date && (
              <span>
                {t('packageExpires', { date: format(parseISO(pkg.end_date), 'd MMM', { locale }) })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function DateHeader({ date, locale }: { date: string; locale: typeof it | typeof enUS }) {
  const parsedDate = parseISO(date)
  const dateLabel = isToday(parsedDate)
    ? 'Oggi'
    : isTomorrow(parsedDate)
    ? 'Domani'
    : format(parsedDate, 'EEEE d MMMM', { locale })

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "text-sm font-medium capitalize",
        isToday(parsedDate) ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-300"
      )}>
        {dateLabel}
      </div>
      {isPast(parsedDate) && !isToday(parsedDate) && (
        <span className="text-xs text-gray-400">
          ({format(parsedDate, 'yyyy')})
        </span>
      )}
    </div>
  )
}

function BookingItem({ booking, locale }: { booking: Booking; locale: typeof it | typeof enUS }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          label: 'Confermata'
        }
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          label: 'Completata'
        }
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
          label: 'Cancellata'
        }
      case 'no_show':
        return {
          icon: UserX,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          label: 'No Show'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-50 dark:bg-gray-800',
          label: status
        }
    }
  }

  const statusConfig = getStatusConfig(booking.status)
  const StatusIcon = statusConfig.icon

  return (
    <Card className={cn("p-3", statusConfig.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
            <Clock className={cn("w-4 h-4", statusConfig.color)} />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </div>
            {booking.coach_notes && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {booking.coach_notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {booking.recurring_series_id && (
            <RefreshCw className="w-3 h-3 text-blue-400" />
          )}
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            statusConfig.color,
            statusConfig.bg
          )}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
