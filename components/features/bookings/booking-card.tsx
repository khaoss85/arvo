'use client'

import { useState } from 'react'
import { format, differenceInHours, differenceInMinutes, differenceInDays, isToday, isTomorrow } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Clock, Calendar, User, Package, ChevronRight, X, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cancelBookingAction } from '@/app/actions/booking-actions'

interface BookingCardProps {
  booking: {
    id: string
    scheduled_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
    coach_notes?: string | null
    client_notes?: string | null
    coach_profiles?: {
      display_name: string
    }
    booking_packages?: {
      name: string
      sessions_remaining: number
    } | null
  }
  showCoach?: boolean
  isPast?: boolean
  onCancelled?: () => void
}

export function BookingCard({ booking, showCoach = true, isPast = false, onCancelled }: BookingCardProps) {
  const t = useTranslations('bookings')
  const locale = useLocale()
  const dateLocale = locale === 'it' ? it : enUS

  const [showDetails, setShowDetails] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Parse booking datetime
  const bookingDate = new Date(booking.scheduled_date)
  const [hours, minutes] = booking.start_time.split(':').map(Number)
  const bookingDateTime = new Date(bookingDate)
  bookingDateTime.setHours(hours, minutes, 0, 0)

  // Calculate time until booking
  const now = new Date()
  const hoursUntil = differenceInHours(bookingDateTime, now)
  const minutesUntil = differenceInMinutes(bookingDateTime, now)
  const daysUntil = differenceInDays(bookingDateTime, now)

  // Get relative time string
  const getTimeLabel = () => {
    if (isToday(bookingDate)) return t('card.today')
    if (isTomorrow(bookingDate)) return t('card.tomorrow')
    return format(bookingDate, 'EEEE d MMMM', { locale: dateLocale })
  }

  // Get countdown string
  const getCountdown = () => {
    if (isPast) return null
    if (hoursUntil < 0) return null
    if (hoursUntil < 1) return t('card.minutesLeft', { minutes: minutesUntil })
    if (hoursUntil < 24) return t('card.hoursLeft', { hours: hoursUntil })
    return t('card.daysLeft', { days: daysUntil })
  }

  // Status color
  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'no_show': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const result = await cancelBookingAction(booking.id, cancelReason || undefined)
      if (result.success) {
        setShowCancelDialog(false)
        setShowDetails(false)
        onCancelled?.()
      }
    } finally {
      setIsCancelling(false)
    }
  }

  const countdown = getCountdown()
  const canCancel = booking.status === 'confirmed' && !isPast && hoursUntil > 24

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={`p-4 cursor-pointer transition-all hover:border-gray-600 ${
            isPast ? 'opacity-60' : ''
          }`}
          onClick={() => setShowDetails(true)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Date and time */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium text-white">{getTimeLabel()}</span>
                {countdown && (
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-0">
                    {t('card.in')} {countdown}
                  </Badge>
                )}
              </div>

              {/* Time slot */}
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </span>
                <span className="text-gray-500">({booking.duration_minutes} min)</span>
              </div>

              {/* Coach name */}
              {showCoach && booking.coach_profiles && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{t('card.with')} {booking.coach_profiles.display_name}</span>
                </div>
              )}

              {/* Package info */}
              {booking.booking_packages && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {booking.booking_packages.name} - {t('card.sessionsRemaining', { count: booking.booking_packages.sessions_remaining })}
                  </span>
                </div>
              )}
            </div>

            {/* Status and chevron */}
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor()} border text-xs`}>
                {t(`status.${booking.status}`)}
              </Badge>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('details.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('details.date')}</span>
              <span className="font-medium">
                {format(bookingDate, 'EEEE d MMMM yyyy', { locale: dateLocale })}
              </span>
            </div>

            {/* Time */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('details.time')}</span>
              <span className="font-medium">
                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
              </span>
            </div>

            {/* Duration */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('details.duration')}</span>
              <span className="font-medium">{booking.duration_minutes} min</span>
            </div>

            {/* Coach */}
            {showCoach && booking.coach_profiles && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('details.coach')}</span>
                <span className="font-medium">{booking.coach_profiles.display_name}</span>
              </div>
            )}

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <Badge className={`${getStatusColor()} border`}>
                {t(`status.${booking.status}`)}
              </Badge>
            </div>

            {/* Coach notes */}
            {booking.coach_notes && (
              <div className="pt-2 border-t border-gray-800">
                <span className="text-sm text-gray-400 block mb-2">{t('details.coachNotes')}</span>
                <p className="text-gray-200 text-sm bg-gray-800/50 rounded-lg p-3">
                  {booking.coach_notes}
                </p>
              </div>
            )}
          </div>

          {/* Cancel button */}
          {canCancel && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                {t('details.cancel')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              {t('details.cancel')}
            </DialogTitle>
            <DialogDescription>
              {t('details.cancelConfirm')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={t('details.cancelReason')}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              {t('details.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? '...' : t('details.cancelButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
