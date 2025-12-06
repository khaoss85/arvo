'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BookingService, type BookingContext } from '@/lib/services/booking.service'
import { BookingAgent, type BookingCommand, type BookingResponse } from '@/lib/agents/booking.agent'
import { BookingNotificationService } from '@/lib/services/booking-notification.service'
import type {
  InsertBooking,
  UpdateBooking,
  InsertCoachAvailability,
  InsertBookingPackage,
  UpdateBookingPackage
} from '@/lib/types/schemas'

// =====================================================
// AI Booking Actions
// =====================================================

/**
 * Process a natural language booking command
 */
export async function processBookingCommandAction(
  input: string,
  coachId: string,
  clientId?: string,
  clientName?: string,
  targetLanguage: 'en' | 'it' = 'it'
): Promise<{ success: boolean; response?: BookingResponse; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build context
    const context = await BookingService.buildBookingContext(coachId, clientId)

    // Create agent and process command
    const agent = new BookingAgent(supabase, user.id)
    const command: BookingCommand = {
      action: 'query', // Agent will determine actual action
      naturalLanguage: input,
      clientId,
      clientName
    }

    // Try quick parse first
    const quickResult = await agent.quickParse(input, context, targetLanguage)
    if (quickResult) {
      return { success: true, response: quickResult }
    }

    // Fall back to full AI processing
    const response = await agent.processCommand(command, context, targetLanguage)
    return { success: true, response }
  } catch (error) {
    console.error('processBookingCommandAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process command'
    }
  }
}

/**
 * Get AI suggestions for optimal booking slots
 */
export async function getAISuggestionsAction(
  coachId: string,
  clientId?: string,
  targetLanguage: 'en' | 'it' = 'it'
): Promise<{ success: boolean; response?: BookingResponse; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build context with client info
    const context = await BookingService.buildBookingContext(coachId, clientId)

    // Create agent and get suggestions
    const agent = new BookingAgent(supabase, user.id)
    const response = await agent.suggestOptimalSlots(context, targetLanguage)

    return { success: true, response }
  } catch (error) {
    console.error('getAISuggestionsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    }
  }
}

// =====================================================
// Booking CRUD Actions
// =====================================================

/**
 * Create a new booking
 */
export async function createBookingAction(
  booking: InsertBooking,
  sendNotifications = true
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const newBooking = await BookingService.createBooking(booking)

    // Queue notifications
    if (sendNotifications) {
      try {
        await BookingNotificationService.queueBookingConfirmation(newBooking)
        await BookingNotificationService.queueReminder(newBooking)
      } catch (notifError) {
        console.error('Failed to queue notifications:', notifError)
        // Don't fail the booking for notification errors
      }
    }

    return { success: true, booking: newBooking }
  } catch (error) {
    console.error('createBookingAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking'
    }
  }
}

/**
 * Update/reschedule a booking
 */
export async function rescheduleBookingAction(
  bookingId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  sendNotifications = true
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const updates: UpdateBooking = {
      scheduled_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime
    }

    const updatedBooking = await BookingService.updateBooking(bookingId, updates)

    // Queue reschedule notification
    if (sendNotifications) {
      try {
        await BookingNotificationService.queueRescheduleNotification(updatedBooking)
        // Update reminder to new date
        await BookingNotificationService.queueReminder(updatedBooking)
      } catch (notifError) {
        console.error('Failed to queue notifications:', notifError)
      }
    }

    return { success: true, booking: updatedBooking }
  } catch (error) {
    console.error('rescheduleBookingAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reschedule booking'
    }
  }
}

/**
 * Cancel a booking
 */
export async function cancelBookingAction(
  bookingId: string,
  reason?: string,
  sendNotifications = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const cancelledBooking = await BookingService.cancelBooking(bookingId, reason)

    // Queue cancellation notification
    if (sendNotifications) {
      try {
        await BookingNotificationService.queueCancellationNotification(cancelledBooking)
      } catch (notifError) {
        console.error('Failed to queue notifications:', notifError)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('cancelBookingAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel booking'
    }
  }
}

/**
 * Mark booking as completed
 */
export async function completeBookingAction(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    await BookingService.completeBooking(bookingId)
    return { success: true }
  } catch (error) {
    console.error('completeBookingAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete booking'
    }
  }
}

/**
 * Mark booking as no-show
 */
export async function markNoShowAction(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    await BookingService.markNoShow(bookingId)
    return { success: true }
  } catch (error) {
    console.error('markNoShowAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as no-show'
    }
  }
}

/**
 * Get coach bookings for a date range
 */
export async function getCoachBookingsAction(
  coachId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const bookings = await BookingService.getCoachBookings(coachId, startDate, endDate)
    return { success: true, bookings }
  } catch (error) {
    console.error('getCoachBookingsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookings'
    }
  }
}

/**
 * Get client upcoming bookings
 */
export async function getClientUpcomingBookingsAction(
  clientId: string,
  limit = 10
): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const bookings = await BookingService.getClientUpcomingBookings(clientId, limit)
    return { success: true, bookings }
  } catch (error) {
    console.error('getClientUpcomingBookingsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookings'
    }
  }
}

// =====================================================
// Availability Actions
// =====================================================

/**
 * Get coach availability for a date range
 */
export async function getCoachAvailabilityAction(
  coachId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; availability?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const availability = await BookingService.getCoachAvailability(coachId, startDate, endDate)
    return { success: true, availability }
  } catch (error) {
    console.error('getCoachAvailabilityAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch availability'
    }
  }
}

/**
 * Set availability slots for a coach
 */
export async function setAvailabilityAction(
  slots: InsertCoachAvailability[]
): Promise<{ success: boolean; availability?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const availability = await BookingService.setAvailability(slots)
    return { success: true, availability }
  } catch (error) {
    console.error('setAvailabilityAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set availability'
    }
  }
}

/**
 * Clear availability for a specific date
 */
export async function clearAvailabilityAction(
  coachId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    await BookingService.clearAvailability(coachId, date)
    return { success: true }
  } catch (error) {
    console.error('clearAvailabilityAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear availability'
    }
  }
}

/**
 * Copy availability from previous week
 */
export async function copyLastWeekAvailabilityAction(
  coachId: string,
  targetWeekStart: string
): Promise<{ success: boolean; availability?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const availability = await BookingService.copyLastWeekAvailability(coachId, targetWeekStart)
    return { success: true, availability }
  } catch (error) {
    console.error('copyLastWeekAvailabilityAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy availability'
    }
  }
}

// =====================================================
// Package Actions
// =====================================================

/**
 * Get client packages
 */
export async function getClientPackagesAction(
  clientId: string,
  coachId: string
): Promise<{ success: boolean; packages?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const packages = await BookingService.getClientPackages(clientId, coachId)
    return { success: true, packages }
  } catch (error) {
    console.error('getClientPackagesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch packages'
    }
  }
}

/**
 * Get client booking history with optional filter
 */
export async function getClientBookingHistoryAction(
  coachId: string,
  clientId: string,
  filter: 'all' | 'upcoming' | 'past' = 'all'
): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: filter === 'upcoming' })
      .order('start_time', { ascending: true })

    // Apply filter
    if (filter === 'upcoming') {
      query = query.gte('scheduled_date', today).eq('status', 'confirmed')
    } else if (filter === 'past') {
      query = query.lt('scheduled_date', today)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { success: true, bookings: data || [] }
  } catch (error) {
    console.error('getClientBookingHistoryAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookings'
    }
  }
}

/**
 * Create a new package
 */
export async function createPackageAction(
  pkg: InsertBookingPackage
): Promise<{ success: boolean; package?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const newPackage = await BookingService.createPackage(pkg)
    return { success: true, package: newPackage }
  } catch (error) {
    console.error('createPackageAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create package'
    }
  }
}

/**
 * Update a package
 */
export async function updatePackageAction(
  packageId: string,
  updates: UpdateBookingPackage
): Promise<{ success: boolean; package?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const updatedPackage = await BookingService.updatePackage(packageId, updates)
    return { success: true, package: updatedPackage }
  } catch (error) {
    console.error('updatePackageAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update package'
    }
  }
}

// =====================================================
// Context Actions
// =====================================================

/**
 * Get booking context for AI
 */
export async function getBookingContextAction(
  coachId: string,
  clientId?: string
): Promise<{ success: boolean; context?: BookingContext; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const context = await BookingService.buildBookingContext(coachId, clientId)
    return { success: true, context }
  } catch (error) {
    console.error('getBookingContextAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build context'
    }
  }
}

/**
 * Get clients with booking info for coach calendar
 */
export async function getClientsWithBookingInfoAction(
  coachId: string
): Promise<{ success: boolean; clients?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const clients = await BookingService.getClientsWithBookingInfo(coachId)
    return { success: true, clients }
  } catch (error) {
    console.error('getClientsWithBookingInfoAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients'
    }
  }
}

// =====================================================
// Recurring Booking Actions
// =====================================================

/**
 * Create a recurring booking series
 */
export async function createRecurringBookingAction(
  baseBooking: InsertBooking,
  pattern: {
    frequency: 'weekly' | 'biweekly'
    endType: 'count' | 'date'
    endValue: number | string
    sourceType: 'manual' | 'ai_package'
    packageId?: string
    dayOfWeek: number[]
    timeSlot: string
  },
  skipConflicts?: boolean
): Promise<{
  success: boolean
  seriesId?: string
  created?: any[]
  skipped?: Array<{ date: string; reason: string }>
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await BookingService.createRecurringSeries({
      baseBooking,
      pattern,
      skipConflicts
    })

    // Queue notifications for all created bookings
    for (const booking of result.created) {
      await BookingNotificationService.queueBookingConfirmation(booking)
      await BookingNotificationService.queueReminder(booking)
    }

    return {
      success: true,
      seriesId: result.seriesId,
      created: result.created,
      skipped: result.skipped
    }
  } catch (error) {
    console.error('createRecurringBookingAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recurring booking'
    }
  }
}

/**
 * Check availability for a recurring pattern
 */
export async function checkRecurringAvailabilityAction(
  coachId: string,
  dates: string[],
  startTime: string,
  endTime: string
): Promise<{
  success: boolean
  availability?: Array<{ date: string; available: boolean; reason?: string }>
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const availability = await BookingService.checkRecurringAvailability(
      coachId,
      dates,
      startTime,
      endTime
    )

    return { success: true, availability }
  } catch (error) {
    console.error('checkRecurringAvailabilityAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check availability'
    }
  }
}

/**
 * Get all bookings in a series
 */
export async function getBookingSeriesAction(
  seriesId: string
): Promise<{
  success: boolean
  bookings?: any[]
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const bookings = await BookingService.getSeriesBookings(seriesId)
    return { success: true, bookings }
  } catch (error) {
    console.error('getBookingSeriesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch series'
    }
  }
}

/**
 * Cancel recurring series
 */
export async function cancelRecurringSeriesAction(
  seriesId: string,
  scope: 'single' | 'following' | 'all',
  bookingId?: string,
  reason?: string
): Promise<{
  success: boolean
  cancelled?: number
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    let cancelled = 0

    switch (scope) {
      case 'single':
        if (!bookingId) {
          return { success: false, error: 'Booking ID required for single cancellation' }
        }
        await BookingService.cancelSingleOccurrence(bookingId, reason)
        cancelled = 1
        break

      case 'following':
        if (!bookingId) {
          return { success: false, error: 'Booking ID required for following cancellation' }
        }
        cancelled = await BookingService.cancelSeriesFromOccurrence(bookingId, reason)
        break

      case 'all':
        cancelled = await BookingService.cancelEntireSeries(seriesId, reason)
        break
    }

    return { success: true, cancelled }
  } catch (error) {
    console.error('cancelRecurringSeriesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel series'
    }
  }
}

/**
 * Get AI suggestions for package recurring slots
 */
export async function getPackageSlotSuggestionsAction(
  coachId: string,
  clientId: string,
  packageId: string | undefined,
  sessionsPerWeek: number,
  targetLanguage: 'en' | 'it' = 'it'
): Promise<{
  success: boolean
  suggestions?: Array<{
    dayOfWeek: number
    dayName: string
    time: string
    confidence: number
    reason: string
  }>
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build context for AI
    const context = await BookingService.buildBookingContext(coachId, clientId)

    // Use BookingAgent to get suggestions
    const agent = new BookingAgent(supabase, user.id)
    const suggestions = await agent.suggestRecurringSlots(context, sessionsPerWeek, targetLanguage)

    // Save suggestions to package if packageId is provided
    if (packageId && suggestions && suggestions.length > 0) {
      await BookingService.updatePackageSuggestedSlots(packageId, suggestions)
    }

    return { success: true, suggestions }
  } catch (error) {
    console.error('getPackageSlotSuggestionsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestions'
    }
  }
}

/**
 * Confirm and create bookings from AI suggestions
 */
export async function confirmPackageSlotsAction(
  packageId: string,
  coachId: string,
  clientId: string,
  slots: Array<{ dayOfWeek: number; time: string }>,
  weeksToGenerate?: number
): Promise<{
  success: boolean
  seriesId?: string
  created?: any[]
  skipped?: Array<{ date: string; reason: string }>
  error?: string
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const result = await BookingService.confirmPackageSlots({
      packageId,
      coachId,
      clientId,
      slots,
      weeksToGenerate
    })

    // Queue notifications for all created bookings
    for (const booking of result.created) {
      await BookingNotificationService.queueBookingConfirmation(booking)
      await BookingNotificationService.queueReminder(booking)
    }

    return {
      success: true,
      seriesId: result.seriesId,
      created: result.created,
      skipped: result.skipped
    }
  } catch (error) {
    console.error('confirmPackageSlotsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm slots'
    }
  }
}
