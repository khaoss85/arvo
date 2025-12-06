'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, CalendarX2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingCard } from './booking-card'
import { getClientUpcomingBookingsAction } from '@/app/actions/booking-actions'

interface BookingsClientProps {
  userId: string
  initialBookings: any[]
}

export function BookingsClient({ userId, initialBookings }: BookingsClientProps) {
  const t = useTranslations('bookings')
  const [bookings, setBookings] = useState(initialBookings)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  // Separate bookings into upcoming and past
  const now = new Date()
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date)
    return bookingDate >= now && b.status !== 'cancelled'
  }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date)
    return bookingDate < now || b.status === 'cancelled'
  }).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())

  // Refresh bookings
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const result = await getClientUpcomingBookingsAction(userId, 50)
      if (result.success && result.bookings) {
        setBookings(result.bookings)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [userId])

  // Handle booking cancelled
  const handleBookingCancelled = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  // Next booking countdown
  const nextBooking = upcomingBookings[0]
  const getNextBookingText = () => {
    if (!nextBooking) return null
    const bookingDate = new Date(nextBooking.scheduled_date)
    const [hours, minutes] = nextBooking.start_time.split(':').map(Number)
    bookingDate.setHours(hours, minutes)

    const diff = bookingDate.getTime() - now.getTime()
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hoursUntil < 0) return null
    if (hoursUntil < 1) return `${minutesUntil} ${t('countdown.minutes')}`
    if (hoursUntil < 24) return `${hoursUntil} ${t('countdown.hours')}`
    return null
  }

  const countdownText = getNextBookingText()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-sm text-gray-400">{t('subtitle')}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Countdown banner */}
          {countdownText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 mt-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-400">{t('countdown.startsIn')}</p>
                  <p className="text-lg font-bold text-white">{countdownText}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tab buttons */}
        <div className="flex bg-gray-900 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t('upcoming')} ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t('past')} ({pastBookings.length})
          </button>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="popLayout">
          {activeTab === 'upcoming' ? (
            upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancelled={handleBookingCancelled}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            pastBookings.length > 0 ? (
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isPast
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No past sessions</p>
              </div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyState() {
  const t = useTranslations('bookings.empty')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
        <CalendarX2 className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{t('title')}</h3>
      <p className="text-gray-400 max-w-sm mx-auto">{t('description')}</p>
    </motion.div>
  )
}
