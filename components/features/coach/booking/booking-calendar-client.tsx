"use client"

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format, addDays, startOfWeek, isSameDay, parseISO, differenceInHours } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Copy,
  X,
  Clock,
  User,
  Send,
  RefreshCw,
  Building2,
  Video,
  Ban,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CoachAvailability, Booking, CoachBlock, SessionLocationType, WaitlistCandidate } from '@/lib/types/schemas'
import { BlockCreateModal } from './block-create-modal'
import { OptimizationSuggestionsPanel } from './optimization-suggestions-panel'
import { NoShowAlertBadge } from './no-show-alert-badge'
import { WaitlistOfferModal } from './waitlist-offer-modal'
import { getBlocksAction } from '@/app/actions/block-actions'
import { getSuggestionCountAction } from '@/app/actions/calendar-optimization-actions'
import { getCandidatesForCancelledSlotAction } from '@/app/actions/waitlist-actions'
import type { ClientWithBookingInfo } from '@/lib/services/booking.service'
import {
  getCoachAvailabilityAction,
  getCoachBookingsAction,
  setAvailabilityAction,
  copyLastWeekAvailabilityAction,
  createBookingAction,
  createRecurringBookingAction,
  cancelBookingAction,
  cancelRecurringSeriesAction,
  processBookingCommandAction,
  getAISuggestionsAction
} from '@/app/actions/booking-actions'

// =====================================================
// Types
// =====================================================

interface BookingCalendarClientProps {
  coachId: string
  coachName: string
  initialAvailability: CoachAvailability[]
  initialBookings: Array<Booking & { client_name?: string }>
  clients: ClientWithBookingInfo[]
  initialStartDate: string
  initialEndDate: string
}

interface TimeSlot {
  time: string // HH:MM
  label: string
}

// =====================================================
// Constants
// =====================================================

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6 // Start at 6 AM
  const minutes = i % 2 === 0 ? '00' : '30'
  return {
    time: `${hour.toString().padStart(2, '0')}:${minutes}`,
    label: `${hour}:${minutes}`
  }
}).filter(slot => {
  const hour = parseInt(slot.time.split(':')[0])
  return hour >= 6 && hour < 22 // 6 AM to 10 PM
})

// =====================================================
// Component
// =====================================================

export function BookingCalendarClient({
  coachId,
  coachName,
  initialAvailability,
  initialBookings,
  clients,
  initialStartDate,
  initialEndDate
}: BookingCalendarClientProps) {
  const t = useTranslations('coach.calendar')
  const locale = t('locale') === 'it' ? it : enUS

  // State
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [availability, setAvailability] = useState<CoachAvailability[]>(initialAvailability)
  const [bookings, setBookings] = useState<Array<Booking & { client_name?: string }>>(initialBookings)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { client_name?: string }) | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [showSeriesCancelOptions, setShowSeriesCancelOptions] = useState(false)

  // Smart Calendar state
  const [locationFilter, setLocationFilter] = useState<'all' | SessionLocationType>('all')
  const [blocks, setBlocks] = useState<CoachBlock[]>([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [suggestionCount, setSuggestionCount] = useState(0)

  // Waitlist and cancellation state
  const [showWaitlistOfferModal, setShowWaitlistOfferModal] = useState(false)
  const [waitlistCandidates, setWaitlistCandidates] = useState<WaitlistCandidate[]>([])
  const [waitlistSlot, setWaitlistSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null)

  // Computed values
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  const startDateStr = format(currentWeekStart, 'yyyy-MM-dd')
  const endDateStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')

  // =====================================================
  // Data Fetching
  // =====================================================

  const loadBlocksAndSuggestions = useCallback(async () => {
    try {
      const [blocksResult, countResult] = await Promise.all([
        getBlocksAction(coachId, startDateStr, endDateStr),
        getSuggestionCountAction(coachId)
      ])

      if (blocksResult.blocks) {
        setBlocks(blocksResult.blocks)
      }
      if (typeof countResult.count === 'number') {
        setSuggestionCount(countResult.count)
      }
    } catch (err) {
      console.error('Error loading blocks/suggestions:', err)
    }
  }, [coachId, startDateStr, endDateStr])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [availResult, bookingsResult] = await Promise.all([
        getCoachAvailabilityAction(coachId, startDateStr, endDateStr),
        getCoachBookingsAction(coachId, startDateStr, endDateStr)
      ])

      if (availResult.success && availResult.availability) {
        setAvailability(availResult.availability)
      }
      if (bookingsResult.success && bookingsResult.bookings) {
        setBookings(bookingsResult.bookings)
      }

      // Also refresh blocks and suggestions
      await loadBlocksAndSuggestions()
    } finally {
      setIsLoading(false)
    }
  }, [coachId, startDateStr, endDateStr, loadBlocksAndSuggestions])

  // Load blocks and suggestions on mount and when week changes
  useEffect(() => {
    loadBlocksAndSuggestions()
  }, [loadBlocksAndSuggestions])

  // =====================================================
  // Navigation
  // =====================================================

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7))
  }

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // =====================================================
  // Slot Helpers
  // =====================================================

  const isSlotAvailable = (date: Date, time: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability.some(
      a => a.date === dateStr && a.start_time.startsWith(time) && a.is_available
    )
  }

  const getBookingForSlot = (date: Date, time: string): (Booking & { client_name?: string }) | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return bookings.find(
      b => b.scheduled_date === dateStr &&
           b.start_time.startsWith(time) &&
           b.status === 'confirmed'
    )
  }

  const isPastSlot = (date: Date, time: string): boolean => {
    const now = new Date()
    const slotDate = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    slotDate.setHours(hours, minutes, 0, 0)
    return slotDate < now
  }

  const isPastDay = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  const isSlotBlocked = (date: Date, time: string): CoachBlock | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return blocks.find(block => {
      // Check if date is within block range
      if (dateStr < block.start_date || dateStr > block.end_date) return false
      // If block has specific times, check time overlap
      if (block.start_time && block.end_time) {
        const slotTime = time + ':00'
        return slotTime >= block.start_time.slice(0, 5) && slotTime < block.end_time.slice(0, 5)
      }
      // Full-day block
      return true
    })
  }

  const getBlockTypeLabel = (blockType: string): string => {
    const labels: Record<string, string> = {
      competition: t('blocks.types.competition'),
      travel: t('blocks.types.travel'),
      study: t('blocks.types.study'),
      personal: t('blocks.types.personal'),
      custom: t('blocks.types.custom'),
    }
    return labels[blockType] || blockType
  }

  // =====================================================
  // Actions
  // =====================================================

  const handleSlotClick = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const booking = getBookingForSlot(date, time)

    if (booking) {
      setSelectedBooking(booking)
      setSelectedSlot(null)
    } else {
      setSelectedSlot({ date: dateStr, time })
      setSelectedBooking(null)
    }
  }

  const handleToggleAvailability = async (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isAvail = isSlotAvailable(date, time)

    setIsLoading(true)
    try {
      if (isAvail) {
        // For now, we just remove from local state
        // In production, would call clearAvailabilityAction for specific slot
        setAvailability(prev =>
          prev.filter(a => !(a.date === dateStr && a.start_time.startsWith(time)))
        )
      } else {
        // Add availability
        const [hours] = time.split(':').map(Number)
        const endTime = `${(hours + 1).toString().padStart(2, '0')}:00:00`

        const result = await setAvailabilityAction([{
          coach_id: coachId,
          date: dateStr,
          start_time: `${time}:00`,
          end_time: endTime,
          is_available: true,
          location_type: 'in_person' as const
        }])

        if (result.success && result.availability) {
          setAvailability(prev => [...prev, ...result.availability!])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLastWeek = async () => {
    setIsLoading(true)
    try {
      const result = await copyLastWeekAvailabilityAction(coachId, startDateStr)
      if (result.success) {
        await refreshData()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (skipWaitlist = false) => {
    if (!selectedBooking) return

    setIsLoading(true)
    try {
      // Check for waitlist candidates before cancelling (unless skipped)
      if (!skipWaitlist) {
        const candidatesResult = await getCandidatesForCancelledSlotAction(selectedBooking.id)
        if (candidatesResult.candidates && candidatesResult.candidates.length > 0) {
          // Parse end time (1 hour after start)
          const [hours] = selectedBooking.start_time.split(':').map(Number)
          const endTime = `${(hours + 1).toString().padStart(2, '0')}:00:00`

          setWaitlistCandidates(candidatesResult.candidates)
          setWaitlistSlot({
            date: selectedBooking.scheduled_date,
            startTime: selectedBooking.start_time,
            endTime: endTime
          })
          setShowWaitlistOfferModal(true)
          setIsLoading(false)
          return // Don't cancel yet - let coach decide about waitlist
        }
      }

      const result = await cancelBookingAction(selectedBooking.id)
      if (result.success) {
        setBookings(prev => prev.filter(b => b.id !== selectedBooking.id))
        setSelectedBooking(null)
        setShowSeriesCancelOptions(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleWaitlistOfferSent = async () => {
    // After offering to waitlist, proceed with cancellation
    if (selectedBooking) {
      await handleCancelBooking(true) // Skip waitlist check this time
    }
    setShowWaitlistOfferModal(false)
    setWaitlistCandidates([])
    setWaitlistSlot(null)
  }

  const handleSkipWaitlist = async () => {
    // Close modal and proceed with cancellation
    setShowWaitlistOfferModal(false)
    setWaitlistCandidates([])
    setWaitlistSlot(null)
    await handleCancelBooking(true)
  }

  const handleCancelSeries = async (scope: 'single' | 'following' | 'all') => {
    if (!selectedBooking || !selectedBooking.recurring_series_id) return

    setIsLoading(true)
    try {
      const result = await cancelRecurringSeriesAction(
        selectedBooking.recurring_series_id,
        scope,
        scope === 'single' || scope === 'following' ? selectedBooking.id : undefined
      )

      if (result.success) {
        // Refresh data to get updated bookings
        await refreshData()
        setSelectedBooking(null)
        setShowSeriesCancelOptions(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // AI Chat
  // =====================================================

  const handleAISubmit = async () => {
    if (!aiInput.trim()) return

    setIsLoading(true)
    setAiResponse(null)
    setAiSuggestions([])

    try {
      const targetLanguage = locale === it ? 'it' : 'en'
      const result = await processBookingCommandAction(
        aiInput,
        coachId,
        undefined,
        undefined,
        targetLanguage as 'en' | 'it'
      )

      if (result.success && result.response) {
        if (result.response.suggestions) {
          setAiSuggestions(result.response.suggestions)
        }
        if (result.response.queryResponse) {
          setAiResponse(result.response.queryResponse)
        }
        if (result.response.needsClarification) {
          setAiResponse(result.response.needsClarification)
        }
      }
    } finally {
      setIsLoading(false)
      setAiInput('')
    }
  }

  const handleGetSuggestions = async (clientId?: string) => {
    setIsLoading(true)
    try {
      const targetLanguage = locale === it ? 'it' : 'en'
      const result = await getAISuggestionsAction(coachId, clientId, targetLanguage as 'en' | 'it')

      if (result.success && result.response?.suggestions) {
        setAiSuggestions(result.response.suggestions)
        setShowAIChat(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <div className="flex items-center gap-2">
            {/* Add Block Button */}
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{t('blocks.createBlock')}</span>
            </button>

            {/* Optimization Suggestions Badge */}
            <button
              onClick={() => setShowOptimizationPanel(true)}
              className={cn(
                "relative flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                suggestionCount > 0
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Sparkles className="h-4 w-4" />
              {suggestionCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {suggestionCount}
                </span>
              )}
            </button>

            <button
              onClick={handleCopyLastWeek}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">{t('copyLastWeek')}</span>
            </button>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
                showAIChat
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setLocationFilter('all')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                locationFilter === 'all'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {t('location.all')}
            </button>
            <button
              onClick={() => setLocationFilter('in_person')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                locationFilter === 'in_person'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <Building2 className="h-3 w-3" />
              {t('location.inPerson')}
            </button>
            <button
              onClick={() => setLocationFilter('online')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
                locationFilter === 'online'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              <Video className="h-3 w-3" />
              {t('location.online')}
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {format(currentWeekStart, 'd MMM', { locale })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale })}
            </span>
            <button
              onClick={goToToday}
              className="px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
            >
              {t('today')}
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* AI Chat Panel */}
      {showAIChat && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
              placeholder={t('aiPlaceholder')}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAISubmit}
              disabled={isLoading || !aiInput.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
              {aiResponse}
            </p>
          )}

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // Navigate to suggested slot
                    const suggestDate = parseISO(suggestion.date)
                    setCurrentWeekStart(startOfWeek(suggestDate, { weekStartsOn: 1 }))
                    setSelectedSlot({ date: suggestion.date, time: suggestion.startTime })
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  <span className="font-medium">{format(parseISO(suggestion.date), 'EEE d', { locale })}</span>
                  <span className="text-gray-500">{suggestion.startTime}</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    {suggestion.confidence}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-gray-50 dark:bg-gray-900">
            <div className="p-2 text-xs text-gray-500" /> {/* Time column */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center border-l border-gray-200 dark:border-gray-800",
                  isSameDay(day, new Date()) && "bg-orange-50 dark:bg-orange-900/20",
                  isPastDay(day) && "opacity-50 bg-gray-100 dark:bg-gray-800"
                )}
              >
                <div className={cn(
                  "text-xs",
                  isPastDay(day) ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                )}>
                  {format(day, 'EEE', { locale })}
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  isSameDay(day, new Date())
                    ? "text-orange-600 dark:text-orange-400"
                    : isPastDay(day)
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-900 dark:text-white"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.time}
              className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800"
            >
              {/* Time Label */}
              <div className="p-2 text-xs text-gray-400 text-right pr-3">
                {slot.label}
              </div>

              {/* Day Cells */}
              {weekDays.map((day) => {
                const isAvail = isSlotAvailable(day, slot.time)
                const booking = getBookingForSlot(day, slot.time)
                const block = isSlotBlocked(day, slot.time)
                const isPast = isPastSlot(day, slot.time)
                const isSelected = selectedSlot?.date === format(day, 'yyyy-MM-dd') &&
                                   selectedSlot?.time === slot.time

                // Filter by location type
                const showBooking = booking && (
                  locationFilter === 'all' ||
                  booking.location_type === locationFilter
                )

                return (
                  <div
                    key={`${day.toISOString()}-${slot.time}`}
                    onClick={() => !isPast && !block && handleSlotClick(day, slot.time)}
                    onDoubleClick={() => !isPast && !booking && !block && handleToggleAvailability(day, slot.time)}
                    className={cn(
                      "h-10 border-l border-gray-100 dark:border-gray-800 cursor-pointer transition-colors",
                      isPast && "opacity-50 cursor-not-allowed",
                      block && "cursor-not-allowed",
                      !isPast && !booking && !block && !isAvail && "hover:bg-gray-50 dark:hover:bg-gray-800",
                      isAvail && !booking && !block && "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
                      isSelected && !block && "ring-2 ring-orange-500 ring-inset",
                      showBooking && "bg-blue-100 dark:bg-blue-900/30",
                      block && "bg-red-50 dark:bg-red-900/20"
                    )}
                    style={block ? {
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239,68,68,0.1) 5px, rgba(239,68,68,0.1) 10px)'
                    } : undefined}
                  >
                    {/* Block Display */}
                    {block && !booking && (
                      <div className="h-full px-1 py-0.5 overflow-hidden">
                        <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <Ban className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getBlockTypeLabel(block.block_type)}</span>
                        </div>
                      </div>
                    )}

                    {/* Booking Display with Location Icon */}
                    {showBooking && (
                      <div className="h-full px-1 py-0.5 overflow-hidden">
                        <div className="flex items-center gap-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                          {/* Location Icon */}
                          {booking.location_type === 'online' ? (
                            <Video className="w-3 h-3 flex-shrink-0 text-purple-500" />
                          ) : (
                            <Building2 className="w-3 h-3 flex-shrink-0 text-blue-500" />
                          )}
                          <span className="truncate">{booking.client_name || 'Client'}</span>
                          {booking.recurring_series_id && (
                            <RefreshCw className="w-3 h-3 flex-shrink-0 text-blue-400" />
                          )}
                          {/* No-Show Alert Badge */}
                          <NoShowAlertBadge
                            coachId={coachId}
                            clientId={booking.client_id}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded" />
          <span>{t('available')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded" />
          <span>{t('booked')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded" />
          <span>{t('blocked')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          <span>{t('location.inPerson')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="w-3 h-3" />
          <span>{t('location.online')}</span>
        </div>
        <span className="text-gray-400 hidden sm:inline">
          {t('doubleClickToToggle')}
        </span>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('bookingDetails')}
              </h3>
              <button
                onClick={() => {
                  setSelectedBooking(null)
                  setShowSeriesCancelOptions(false)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {selectedBooking.client_name || 'Client'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {format(parseISO(selectedBooking.scheduled_date), 'EEEE d MMMM', { locale })} - {selectedBooking.start_time.slice(0, 5)}
                </span>
              </div>
              {selectedBooking.coach_notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {selectedBooking.coach_notes}
                </p>
              )}

              {/* Recurring Series Indicator */}
              {selectedBooking.recurring_series_id && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {t('partOfRecurringSeries')}
                  </span>
                </div>
              )}

              {/* Late Cancellation Warning */}
              {(() => {
                const bookingDateTime = parseISO(`${selectedBooking.scheduled_date}T${selectedBooking.start_time}`)
                const hoursUntil = differenceInHours(bookingDateTime, new Date())
                if (hoursUntil > 0 && hoursUntil <= 24) {
                  return (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          {t('lateCancellation')}
                        </p>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          {t('lateCancelWarning', { hours: hoursUntil })}
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            {/* Series Cancel Options */}
            {showSeriesCancelOptions && selectedBooking.recurring_series_id ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">
                  {t('partOfRecurringSeries')}
                </p>
                <button
                  onClick={() => handleCancelSeries('single')}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('cancelThisOnly')}
                </button>
                <button
                  onClick={() => handleCancelSeries('following')}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  {t('cancelThisAndFollowing')}
                </button>
                <button
                  onClick={() => handleCancelSeries('all')}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {t('cancelEntireSeries')}
                </button>
                <button
                  onClick={() => setShowSeriesCancelOptions(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 mt-2"
                >
                  {t('close')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedBooking.recurring_series_id) {
                      setShowSeriesCancelOptions(true)
                    } else {
                      handleCancelBooking()
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    setSelectedBooking(null)
                    setShowSeriesCancelOptions(false)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {t('close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Book Modal */}
      {selectedSlot && !selectedBooking && (
        <QuickBookModal
          slot={selectedSlot}
          clients={clients}
          coachId={coachId}
          onClose={() => setSelectedSlot(null)}
          onBook={async (clientId, notes, locationType, meetingUrl) => {
            setIsLoading(true)
            try {
              const [hours] = selectedSlot.time.split(':').map(Number)
              const endTime = `${(hours + 1).toString().padStart(2, '0')}:00:00`

              const result = await createBookingAction({
                coach_id: coachId,
                client_id: clientId,
                scheduled_date: selectedSlot.date,
                start_time: `${selectedSlot.time}:00`,
                end_time: endTime,
                duration_minutes: 60,
                status: 'confirmed',
                coach_notes: notes || null,
                package_id: null,
                ai_scheduled: false,
                ai_suggestion_accepted: null,
                client_notes: null,
                cancellation_reason: null,
                recurring_series_id: null,
                recurring_pattern: null,
                occurrence_index: null,
                location_type: locationType || 'in_person',
                meeting_url: meetingUrl || null
              })

              if (result.success && result.booking) {
                const client = clients.find(c => c.id === clientId)
                setBookings(prev => [...prev, {
                  ...result.booking,
                  client_name: client?.name
                }])
                setSelectedSlot(null)
              }
            } finally {
              setIsLoading(false)
            }
          }}
          onBookRecurring={async (clientId, pattern, notes, locationType, meetingUrl) => {
            setIsLoading(true)
            try {
              const [hours] = selectedSlot.time.split(':').map(Number)
              const endTime = `${(hours + 1).toString().padStart(2, '0')}:00:00`
              const date = parseISO(selectedSlot.date)
              const dayOfWeek = date.getDay()

              const result = await createRecurringBookingAction(
                {
                  coach_id: coachId,
                  client_id: clientId,
                  scheduled_date: selectedSlot.date,
                  start_time: `${selectedSlot.time}:00`,
                  end_time: endTime,
                  duration_minutes: 60,
                  status: 'confirmed',
                  coach_notes: notes || null,
                  package_id: null,
                  ai_scheduled: false,
                  ai_suggestion_accepted: null,
                  client_notes: null,
                  cancellation_reason: null,
                  recurring_series_id: null,
                  recurring_pattern: null,
                  occurrence_index: null,
                  location_type: locationType || 'in_person',
                  meeting_url: meetingUrl || null
                },
                {
                  frequency: pattern.frequency,
                  endType: pattern.endType,
                  endValue: pattern.endValue,
                  sourceType: 'manual',
                  dayOfWeek: [dayOfWeek],
                  timeSlot: selectedSlot.time
                }
              )

              if (result.success && result.created && result.created.length > 0) {
                const client = clients.find(c => c.id === clientId)
                // Add all created bookings to state
                setBookings(prev => [
                  ...prev,
                  ...result.created!.map(b => ({
                    ...b,
                    client_name: client?.name
                  }))
                ])
                setSelectedSlot(null)
              }
            } finally {
              setIsLoading(false)
            }
          }}
          locale={locale}
        />
      )}

      {/* Block Create Modal */}
      {showBlockModal && (
        <BlockCreateModal
          coachId={coachId}
          initialDate={format(currentWeekStart, 'yyyy-MM-dd')}
          onClose={() => setShowBlockModal(false)}
          onCreated={() => {
            setShowBlockModal(false)
            refreshData()
          }}
          locale={locale}
        />
      )}

      {/* Optimization Suggestions Panel */}
      {showOptimizationPanel && (
        <OptimizationSuggestionsPanel
          coachId={coachId}
          weekStartDate={startDateStr}
          onClose={() => setShowOptimizationPanel(false)}
          onApplied={() => {
            refreshData()
            loadBlocksAndSuggestions()
          }}
          locale={locale}
        />
      )}

      {/* Waitlist Offer Modal */}
      {showWaitlistOfferModal && waitlistSlot && (
        <WaitlistOfferModal
          isOpen={showWaitlistOfferModal}
          onClose={() => {
            setShowWaitlistOfferModal(false)
            setWaitlistCandidates([])
            setWaitlistSlot(null)
          }}
          slot={waitlistSlot}
          candidates={waitlistCandidates}
          onOfferSent={handleWaitlistOfferSent}
        />
      )}
    </div>
  )
}

// =====================================================
// Quick Book Modal Component
// =====================================================

function QuickBookModal({
  slot,
  clients,
  coachId,
  onClose,
  onBook,
  onBookRecurring,
  locale
}: {
  slot: { date: string; time: string }
  clients: ClientWithBookingInfo[]
  coachId: string
  onClose: () => void
  onBook: (clientId: string, notes?: string, locationType?: SessionLocationType, meetingUrl?: string) => Promise<void>
  onBookRecurring?: (clientId: string, pattern: {
    frequency: 'weekly' | 'biweekly'
    endType: 'count' | 'date'
    endValue: number | string
  }, notes?: string, locationType?: SessionLocationType, meetingUrl?: string) => Promise<void>
  locale: typeof it | typeof enUS
}) {
  const t = useTranslations('coach.calendar')
  const [selectedClient, setSelectedClient] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Location state
  const [locationType, setLocationType] = useState<SessionLocationType>('in_person')
  const [meetingUrl, setMeetingUrl] = useState('')

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly')
  const [endType, setEndType] = useState<'count' | 'date'>('count')
  const [endCount, setEndCount] = useState(4)
  const [endDate, setEndDate] = useState('')

  const handleSubmit = async () => {
    if (!selectedClient) return
    setIsLoading(true)

    const url = locationType === 'online' && meetingUrl ? meetingUrl : undefined

    if (isRecurring && onBookRecurring) {
      await onBookRecurring(selectedClient, {
        frequency,
        endType,
        endValue: endType === 'count' ? endCount : endDate
      }, notes, locationType, url)
    } else {
      await onBook(selectedClient, notes, locationType, url)
    }

    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('newBooking')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date/Time Display */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900 dark:text-white">
              {format(parseISO(slot.date), 'EEEE d MMMM', { locale })} - {slot.time}
            </span>
          </div>

          {/* Client Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('selectClient')}
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">{t('chooseClient')}</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.activePackage && ` (${client.activePackage.sessionsRemaining} ${t('sessionsLeft')})`}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('notes')} ({t('optional')})
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder={t('notesPlaceholder')}
            />
          </div>

          {/* Location Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('location.sessionType')}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocationType('in_person')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center gap-2",
                  locationType === 'in_person'
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Building2 className="h-4 w-4" />
                {t('location.inPerson')}
              </button>
              <button
                type="button"
                onClick={() => setLocationType('online')}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center gap-2",
                  locationType === 'online'
                    ? "bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Video className="h-4 w-4" />
                {t('location.online')}
              </button>
            </div>
          </div>

          {/* Meeting URL (only for online) */}
          {locationType === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('location.meetingUrl')} ({t('optional')})
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder={t('location.enterMeetingUrl')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Recurring Toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-10 h-6 rounded-full transition-colors",
                  isRecurring ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                    isRecurring ? "translate-x-5" : "translate-x-1"
                  )} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('repeats')}
                </span>
              </div>
            </label>

            {/* Recurring Options */}
            {isRecurring && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-orange-500/30">
                {/* Frequency */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly')}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                      frequency === 'weekly'
                        ? "bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {t('weekly')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('biweekly')}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                      frequency === 'biweekly'
                        ? "bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {t('biweekly')}
                  </button>
                </div>

                {/* End Type */}
                <div className="flex items-center gap-2">
                  <select
                    value={endType}
                    onChange={(e) => setEndType(e.target.value as 'count' | 'date')}
                    className="px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <option value="count">{t('after')}</option>
                    <option value="date">{t('until')}</option>
                  </select>

                  {endType === 'count' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={endCount}
                        onChange={(e) => setEndCount(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={52}
                        className="w-16 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      />
                      <span className="text-sm text-gray-500">{t('occurrences')}</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedClient || isLoading || (isRecurring && endType === 'date' && !endDate)}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {isRecurring ? t('bookSeries') : t('book')}
          </button>
        </div>
      </div>
    </div>
  )
}
