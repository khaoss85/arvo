'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { it, enUS, type Locale } from 'date-fns/locale'
import { Calendar, Check, X, UserX, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Booking } from '@/lib/types/schemas'

interface BookingRecapProps {
  bookings: Array<Booking & { client_name?: string }>
  onBookingClick?: (booking: Booking & { client_name?: string }) => void
}

export function BookingRecap({ bookings, onBookingClick }: BookingRecapProps) {
  const t = useTranslations('coach.recap')
  const locale = useTranslations('coach.calendar')('locale') === 'it' ? it : enUS

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const todayBookings = bookings.filter(b => {
      const date = new Date(b.scheduled_date)
      return isToday(date) && b.status !== 'cancelled'
    })

    const weekBookings = bookings.filter(b => {
      const date = new Date(b.scheduled_date)
      return isWithinInterval(date, { start: weekStart, end: weekEnd })
    })

    const completed = weekBookings.filter(b => b.status === 'completed').length
    const cancelled = weekBookings.filter(b => b.status === 'cancelled').length
    const noShow = weekBookings.filter(b => b.status === 'no_show').length
    const confirmed = weekBookings.filter(b => b.status === 'confirmed').length

    // Next upcoming sessions
    const upcoming = bookings
      .filter(b => {
        const date = new Date(b.scheduled_date)
        return date >= today && b.status === 'confirmed'
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .slice(0, 5)

    return {
      todayCount: todayBookings.length,
      todayBookings,
      weekTotal: weekBookings.length,
      completed,
      cancelled,
      noShow,
      confirmed,
      upcoming
    }
  }, [bookings])

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Calendar}
          label={t('today')}
          value={stats.todayCount}
          color="orange"
        />
        <StatCard
          icon={Check}
          label={t('completed')}
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon={X}
          label={t('cancelled')}
          value={stats.cancelled}
          color="red"
        />
        <StatCard
          icon={UserX}
          label={t('noShow')}
          value={stats.noShow}
          color="yellow"
        />
      </div>

      {/* Today's Sessions */}
      {stats.todayBookings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('todaySessions')}
          </h4>
          <div className="space-y-2">
            {stats.todayBookings.map((booking) => (
              <SessionCard
                key={booking.id}
                booking={booking}
                locale={locale}
                onClick={() => onBookingClick?.(booking)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {stats.upcoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('upcoming')}
          </h4>
          <div className="space-y-2">
            {stats.upcoming.map((booking) => (
              <SessionCard
                key={booking.id}
                booking={booking}
                locale={locale}
                showDate
                onClick={() => onBookingClick?.(booking)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.todayBookings.length === 0 && stats.upcoming.length === 0 && (
        <Card className="p-6 text-center">
          <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{t('noSessions')}</p>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: 'orange' | 'green' | 'red' | 'yellow' | 'blue'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500">
            {label}
          </p>
        </div>
      </div>
    </Card>
  )
}

interface SessionCardProps {
  booking: Booking & { client_name?: string }
  locale: Locale
  showDate?: boolean
  onClick?: () => void
}

function SessionCard({ booking, locale, showDate = false, onClick }: SessionCardProps) {
  const bookingDate = new Date(booking.scheduled_date)
  const isTodaySession = isToday(bookingDate)
  const isTomorrowSession = isTomorrow(bookingDate)

  const getDateLabel = () => {
    if (isTodaySession) return 'Oggi'
    if (isTomorrowSession) return 'Domani'
    return format(bookingDate, 'EEE d MMM', { locale })
  }

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed': return 'bg-blue-500/10 text-blue-400'
      case 'completed': return 'bg-emerald-500/10 text-emerald-400'
      case 'cancelled': return 'bg-red-500/10 text-red-400'
      case 'no_show': return 'bg-yellow-500/10 text-yellow-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-colors hover:border-gray-400 dark:hover:border-gray-600",
        onClick && "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            getStatusColor()
          )}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {booking.client_name || 'Client'}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {showDate && (
                <>
                  <span>{getDateLabel()}</span>
                  <span>-</span>
                </>
              )}
              <span>{booking.start_time.slice(0, 5)}</span>
              {booking.duration_minutes && (
                <span className="text-xs">({booking.duration_minutes} min)</span>
              )}
            </div>
          </div>
        </div>
        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </div>
    </Card>
  )
}
