'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { format, addDays, startOfWeek, isToday, isTomorrow } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Loader2, Users, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { JoinWaitlistModal } from '@/components/features/client/booking/join-waitlist-modal'
import {
  getCoachAvailabilityAction,
  getCoachBookingsAction,
  createBookingAction
} from '@/app/actions/booking-actions'
import { getCancellationPolicyAction } from '@/app/actions/cancellation-policy-actions'
import type { CoachAvailability, Booking, InsertBooking, CoachCancellationPolicy } from '@/lib/types/schemas'

interface BookSessionModalProps {
  isOpen: boolean
  onClose: () => void
  coachId: string
  coachName: string
  clientId: string
  onBooked?: () => void
}

interface AvailableSlot {
  date: string
  startTime: string
  endTime: string
}

export function BookSessionModal({
  isOpen,
  onClose,
  coachId,
  coachName,
  clientId,
  onBooked
}: BookSessionModalProps) {
  const t = useTranslations('bookings.selfBook')
  const tCommon = useTranslations('common')
  const locale = useTranslations('bookings')('locale') === 'it' ? it : enUS

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [availability, setAvailability] = useState<CoachAvailability[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [showJoinWaitlist, setShowJoinWaitlist] = useState(false)
  const [cancellationPolicy, setCancellationPolicy] = useState<CoachCancellationPolicy | null>(null)

  // Calculate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  // Load availability when modal opens or week changes
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, currentWeekStart])

  const loadData = async () => {
    setIsLoading(true)
    const startDate = format(currentWeekStart, 'yyyy-MM-dd')
    const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')

    try {
      const [availResult, bookingsResult, policyResult] = await Promise.all([
        getCoachAvailabilityAction(coachId, startDate, endDate),
        getCoachBookingsAction(coachId, startDate, endDate),
        getCancellationPolicyAction(coachId)
      ])

      if (availResult.success && availResult.availability) {
        setAvailability(availResult.availability as CoachAvailability[])
      }
      if (bookingsResult.success && bookingsResult.bookings) {
        setBookings(bookingsResult.bookings as Booking[])
      }
      if (policyResult.policy) {
        setCancellationPolicy(policyResult.policy)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Get available slots for a day
  const getAvailableSlotsForDay = (date: Date): AvailableSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const now = new Date()

    // Get availability for this day
    const dayAvailability = availability.filter(a =>
      a.date === dateStr && a.is_available
    )

    // Get bookings for this day
    const dayBookings = bookings.filter(b =>
      b.scheduled_date === dateStr && b.status === 'confirmed'
    )

    // Filter out slots that are already booked or in the past
    return dayAvailability.filter(slot => {
      // Check if in the past
      const slotTime = new Date(date)
      const [hours, minutes] = slot.start_time.split(':').map(Number)
      slotTime.setHours(hours, minutes, 0, 0)
      if (slotTime < now) return false

      // Check if already booked
      const isBooked = dayBookings.some(b =>
        b.start_time === slot.start_time
      )
      return !isBooked
    }).map(slot => ({
      date: dateStr,
      startTime: slot.start_time,
      endTime: slot.end_time
    }))
  }

  // Navigate weeks
  const goToPrevWeek = () => {
    const prevWeek = addDays(currentWeekStart, -7)
    if (prevWeek >= startOfWeek(new Date(), { weekStartsOn: 1 })) {
      setCurrentWeekStart(prevWeek)
    }
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  // Handle booking
  const handleBook = async () => {
    if (!selectedSlot) return

    setIsBooking(true)
    try {
      const booking: InsertBooking = {
        coach_id: coachId,
        client_id: clientId,
        scheduled_date: selectedSlot.date,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        duration_minutes: 60,
        status: 'confirmed',
        ai_scheduled: false,
        package_id: null,
        ai_suggestion_accepted: null,
        coach_notes: null,
        client_notes: null,
        cancellation_reason: null,
        recurring_series_id: null,
        recurring_pattern: null,
        occurrence_index: null,
        location_type: 'in_person',
        meeting_url: null
      }

      const result = await createBookingAction(booking)
      if (result.success) {
        setBookingSuccess(true)
        setTimeout(() => {
          onBooked?.()
          handleClose()
        }, 1500)
      }
    } finally {
      setIsBooking(false)
    }
  }

  const handleClose = () => {
    setSelectedSlot(null)
    setBookingSuccess(false)
    onClose()
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return t('today')
    if (isTomorrow(date)) return t('tomorrow')
    return format(date, 'EEE d', { locale })
  }

  const isPastDay = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const canGoPrev = currentWeekStart > startOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('selectSlotWith', { coach: coachName })}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {bookingSuccess ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {t('booked')}
            </p>
          </div>
        ) : (
          <>
            {/* Week Navigation */}
            <div className="flex items-center justify-between py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevWeek}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium">
                {format(currentWeekStart, 'd MMM', { locale })} - {format(addDays(currentWeekStart, 6), 'd MMM', { locale })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextWeek}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {/* Slots Grid */}
            {!isLoading && (
              <div className="space-y-4 max-h-80 overflow-y-auto py-2">
                {weekDays.map((day) => {
                  const slots = getAvailableSlotsForDay(day)
                  const isPast = isPastDay(day)

                  if (isPast || slots.length === 0) return null

                  return (
                    <div key={day.toISOString()}>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        {getDateLabel(day)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => {
                          const isSelected =
                            selectedSlot?.date === slot.date &&
                            selectedSlot?.startTime === slot.startTime

                          return (
                            <Button
                              key={`${slot.date}-${slot.startTime}`}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "min-w-[80px]",
                                isSelected && "bg-emerald-600 hover:bg-emerald-700"
                              )}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {slot.startTime.slice(0, 5)}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* No slots available */}
                {weekDays.every(day => {
                  const slots = getAvailableSlotsForDay(day)
                  return isPastDay(day) || slots.length === 0
                }) && (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">{t('noSlots')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('tryNextWeek')}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowJoinWaitlist(true)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {t('joinWaitlist')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Selected Slot Summary */}
            {selectedSlot && (
              <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(selectedSlot.date), 'EEEE d MMMM', { locale })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Cancellation Policy Info */}
            {selectedSlot && cancellationPolicy && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('cancellationPolicy', { hours: cancellationPolicy.free_cancellation_hours })}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button
                onClick={handleBook}
                disabled={!selectedSlot || isBooking}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isBooking ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {t('confirm')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Join Waitlist Modal */}
      <JoinWaitlistModal
        isOpen={showJoinWaitlist}
        onClose={() => setShowJoinWaitlist(false)}
        coachId={coachId}
        onJoined={() => {
          setShowJoinWaitlist(false)
          handleClose()
        }}
      />
    </Dialog>
  )
}
