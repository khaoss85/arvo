import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  CoachAvailability,
  InsertCoachAvailability,
  UpdateCoachAvailability,
  Booking,
  InsertBooking,
  UpdateBooking,
  BookingPackage,
  InsertBookingPackage,
  UpdateBookingPackage,
  BookingNotification,
  InsertBookingNotification,
  RecurringPattern,
  AISlotSuggestion,
  SessionLocationType,
} from '@/lib/types/schemas'
import { PackageUpgradeService } from './package-upgrade.service'

// =====================================================
// Booking Context for AI Agent
// =====================================================

export interface BookingContext {
  coachId: string
  clientId?: string
  availableSlots: Array<{
    date: string
    startTime: string
    endTime: string
    locationType: SessionLocationType
  }>
  clientPreferences?: {
    preferredDays?: string[]
    preferredTimeRange?: { start: string; end: string }
    lastBookings?: Array<{ dayOfWeek: string; time: string }>
    preferredLocationType?: SessionLocationType
  }
  package?: {
    id: string
    name: string
    sessionsPerWeek: number
    sessionsRemaining: number
  }
  existingBookings: Array<{
    id: string
    date: string
    startTime: string
    endTime: string
    clientId: string
    clientName?: string
    status: string
    locationType?: SessionLocationType
  }>
  // Phase-aware booking
  clientCaloricPhase?: 'bulk' | 'cut' | 'maintenance' | null
  recommendedFrequency?: {
    sessionsPerWeek: number
    rationale: string
  }
}

export interface ClientWithBookingInfo {
  id: string
  name: string
  lastBooking?: {
    date: string
    time: string
  }
  activePackage?: {
    id: string
    name: string
    sessionsRemaining: number
  }
}

// =====================================================
// Booking Service
// =====================================================

export class BookingService {
  // =====================================================
  // Phase-Aware Booking Utilities
  // =====================================================

  /**
   * Get recommended training frequency based on client's caloric phase
   * - Cut: 4 sessions/week (higher frequency to preserve muscle during deficit)
   * - Bulk: 3 sessions/week (moderate frequency for recovery and growth)
   * - Maintenance: 3 sessions/week (standard frequency)
   */
  static getRecommendedFrequency(caloricPhase: string | null | undefined): {
    sessionsPerWeek: number
    rationale: string
  } {
    switch (caloricPhase) {
      case 'cut':
        return {
          sessionsPerWeek: 4,
          rationale: 'Alta frequenza per preservare massa muscolare durante il deficit calorico'
        }
      case 'bulk':
        return {
          sessionsPerWeek: 3,
          rationale: 'Frequenza moderata per massimizzare recupero e crescita muscolare'
        }
      case 'maintenance':
      default:
        return {
          sessionsPerWeek: 3,
          rationale: 'Frequenza standard per mantenimento della forma fisica'
        }
    }
  }

  // =====================================================
  // Availability Management
  // =====================================================

  /**
   * Get coach availability for a date range
   */
  static async getCoachAvailability(
    coachId: string,
    startDate: string,
    endDate: string
  ): Promise<CoachAvailability[]> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching coach availability:', error)
      throw new Error('Failed to fetch availability')
    }

    return (data || []) as CoachAvailability[]
  }

  /**
   * Set availability slots for a coach
   */
  static async setAvailability(
    slots: InsertCoachAvailability[]
  ): Promise<CoachAvailability[]> {
    const supabase = await getSupabaseServerClient()

    // Ensure location_type has a default value
    const slotsWithDefaults = slots.map(slot => ({
      ...slot,
      location_type: slot.location_type || 'in_person'
    }))

    const { data, error } = await supabase
      .from('coach_availability')
      .upsert(slotsWithDefaults as any[], {
        onConflict: 'coach_id,date,start_time,location_type',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Error setting availability:', error)
      throw new Error('Failed to set availability')
    }

    return (data || []) as CoachAvailability[]
  }

  /**
   * Clear availability for a specific date
   */
  static async clearAvailability(
    coachId: string,
    date: string
  ): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('coach_availability')
      .delete()
      .eq('coach_id', coachId)
      .eq('date', date)

    if (error) {
      console.error('Error clearing availability:', error)
      throw new Error('Failed to clear availability')
    }
  }

  /**
   * Copy availability from previous week
   */
  static async copyLastWeekAvailability(
    coachId: string,
    targetWeekStart: string
  ): Promise<CoachAvailability[]> {
    const supabase = await getSupabaseServerClient()

    // Calculate previous week dates
    const targetDate = new Date(targetWeekStart)
    const prevWeekStart = new Date(targetDate)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekEnd = new Date(prevWeekStart)
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6)

    // Get previous week's availability
    const prevAvailability = await this.getCoachAvailability(
      coachId,
      prevWeekStart.toISOString().split('T')[0],
      prevWeekEnd.toISOString().split('T')[0]
    )

    if (prevAvailability.length === 0) {
      return []
    }

    // Create new slots with updated dates
    const newSlots: InsertCoachAvailability[] = prevAvailability.map(slot => {
      const slotDate = new Date(slot.date)
      const dayOfWeek = slotDate.getDay()
      const newDate = new Date(targetWeekStart)
      newDate.setDate(newDate.getDate() + dayOfWeek)

      return {
        coach_id: coachId,
        date: newDate.toISOString().split('T')[0],
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: true,
        location_type: slot.location_type || 'in_person'
      }
    })

    return this.setAvailability(newSlots)
  }

  // =====================================================
  // Booking Management
  // =====================================================

  /**
   * Get bookings for a coach in a date range
   */
  static async getCoachBookings(
    coachId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<Booking & { client_name?: string; package_name?: string }>> {
    const supabase = await getSupabaseServerClient()

    let query = supabase
      .from('bookings')
      .select(`
        *,
        user_profiles!bookings_client_id_fkey(display_name, full_name, first_name),
        booking_packages(name)
      `)
      .eq('coach_id', coachId)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (startDate) {
      query = query.gte('scheduled_date', startDate)
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching coach bookings:', error)
      // Fallback to simple query without joins
      const { data: simpleData, error: simpleError } = await supabase
        .from('bookings')
        .select('*')
        .eq('coach_id', coachId)
        .order('scheduled_date', { ascending: true })

      if (simpleError) throw new Error('Failed to fetch bookings')
      return (simpleData || []) as unknown as Array<Booking & { client_name?: string; package_name?: string }>
    }

    // Transform data to include client_name
    return (data || []).map(booking => ({
      ...booking,
      client_name: (booking as any).user_profiles?.display_name ||
                   (booking as any).user_profiles?.full_name ||
                   (booking as any).user_profiles?.first_name ||
                   undefined,
      package_name: (booking as any).booking_packages?.name || undefined,
      user_profiles: undefined,
      booking_packages: undefined
    })) as unknown as Array<Booking & { client_name?: string; package_name?: string }>
  }

  /**
   * Get bookings for a client
   */
  static async getClientBookings(
    clientId: string,
    includeCoachName = true
  ): Promise<Array<Booking & { coach_name?: string }>> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        coach_profiles!bookings_coach_id_fkey(display_name)
      `)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching client bookings:', error)
      // Fallback
      const { data: simpleData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: true })

      return (simpleData || []) as unknown as Array<Booking & { coach_name?: string }>
    }

    return (data || []).map(booking => ({
      ...booking,
      coach_name: (booking as any).coach_profiles?.display_name || undefined,
      coach_profiles: undefined
    })) as unknown as Array<Booking & { coach_name?: string }>
  }

  /**
   * Get upcoming bookings for a client
   */
  static async getClientUpcomingBookings(
    clientId: string,
    limit = 10
  ): Promise<Array<Booking & { coach_name?: string; days_until: number }>> {
    const supabase = await getSupabaseServerClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        coach_profiles!bookings_coach_id_fkey(display_name)
      `)
      .eq('client_id', clientId)
      .eq('status', 'confirmed')
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming bookings:', error)
      return []
    }

    const todayDate = new Date(today)
    return (data || []).map(booking => {
      const bookingDate = new Date(booking.scheduled_date)
      const daysUntil = Math.ceil((bookingDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...booking,
        coach_name: (booking as any).coach_profiles?.display_name || undefined,
        coach_profiles: undefined,
        days_until: daysUntil
      }
    }) as any[]
  }

  /**
   * Create a new booking
   */
  static async createBooking(
    booking: InsertBooking
  ): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    // Ensure location_type has a default value
    const bookingWithDefaults = {
      ...booking,
      location_type: booking.location_type || 'in_person'
    }

    // Check slot availability (includes block check and cross-location conflict check)
    const { data: isAvailable } = await supabase
      .rpc('is_slot_available', {
        p_coach_id: bookingWithDefaults.coach_id,
        p_date: bookingWithDefaults.scheduled_date,
        p_start_time: bookingWithDefaults.start_time,
        p_end_time: bookingWithDefaults.end_time,
        p_location_type: bookingWithDefaults.location_type
      })

    if (!isAvailable) {
      throw new Error('Selected time slot is not available')
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingWithDefaults)
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      throw new Error('Failed to create booking')
    }

    // If linked to a package, increment sessions_used
    if (bookingWithDefaults.package_id) {
      await this.usePackageSession(bookingWithDefaults.package_id)
    }

    return data as unknown as Booking
  }

  /**
   * Update a booking
   */
  static async updateBooking(
    bookingId: string,
    updates: UpdateBooking
  ): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    // If rescheduling, check new slot availability
    if (updates.scheduled_date || updates.start_time || updates.end_time) {
      // Get current booking
      const { data: current } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (current) {
        const newDate = updates.scheduled_date || current.scheduled_date
        const newStart = updates.start_time || current.start_time
        const newEnd = updates.end_time || current.end_time

        const { data: isAvailable } = await supabase
          .rpc('is_slot_available', {
            p_coach_id: current.coach_id,
            p_date: newDate,
            p_start_time: newStart,
            p_end_time: newEnd
          })

        // Note: is_slot_available will see the current booking as a conflict
        // We need to handle this case - for now, we allow the update
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      throw new Error('Failed to update booking')
    }

    return data as unknown as Booking
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(
    bookingId: string,
    reason?: string
  ): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling booking:', error)
      throw new Error('Failed to cancel booking')
    }

    // If linked to a package, decrement sessions_used
    if (data.package_id) {
      await this.decrementPackageSession(data.package_id)
    }

    return data as unknown as Booking
  }

  /**
   * Mark booking as completed
   */
  static async completeBooking(bookingId: string): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error completing booking:', error)
      throw new Error('Failed to complete booking')
    }

    return data as unknown as Booking
  }

  /**
   * Mark booking as no-show
   */
  static async markNoShow(bookingId: string): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error marking no-show:', error)
      throw new Error('Failed to mark as no-show')
    }

    return data as unknown as Booking
  }

  // =====================================================
  // Package Management
  // =====================================================

  /**
   * Get packages for a client with a specific coach
   */
  static async getClientPackages(
    clientId: string,
    coachId: string
  ): Promise<BookingPackage[]> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching packages:', error)
      throw new Error('Failed to fetch packages')
    }

    return (data || []) as BookingPackage[]
  }

  /**
   * Get active package for a client
   */
  static async getActivePackage(
    clientId: string,
    coachId: string
  ): Promise<BookingPackage | null> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching active package:', error)
    }

    return (data as BookingPackage | null) || null
  }

  /**
   * Create a new package
   */
  static async createPackage(
    pkg: InsertBookingPackage
  ): Promise<BookingPackage> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .insert(pkg)
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error)
      throw new Error('Failed to create package')
    }

    return data as unknown as BookingPackage
  }

  /**
   * Update a package
   */
  static async updatePackage(
    packageId: string,
    updates: UpdateBookingPackage
  ): Promise<BookingPackage> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating package:', error)
      throw new Error('Failed to update package')
    }

    return data as unknown as BookingPackage
  }

  /**
   * Use one session from a package
   */
  static async usePackageSession(packageId: string): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const { data: pkg, error: fetchError } = await supabase
      .from('booking_packages')
      .select('sessions_used, total_sessions')
      .eq('id', packageId)
      .single()

    if (fetchError) {
      console.error('Error fetching package:', fetchError)
      return
    }

    const newSessionsUsed = (pkg.sessions_used || 0) + 1
    const isCompleted = newSessionsUsed >= pkg.total_sessions
    const status = isCompleted ? 'completed' : 'active'

    await supabase
      .from('booking_packages')
      .update({
        sessions_used: newSessionsUsed,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId)

    // Check for upgrade suggestion when package is completed
    if (isCompleted) {
      try {
        await PackageUpgradeService.checkForUpgradeSuggestion(packageId)
      } catch (error) {
        // Don't fail the booking if upgrade suggestion fails
        console.error('Error checking for upgrade suggestion:', error)
      }
    }
  }

  /**
   * Decrement package session (for cancellations)
   */
  private static async decrementPackageSession(packageId: string): Promise<void> {
    const supabase = await getSupabaseServerClient()

    const { data: pkg, error: fetchError } = await supabase
      .from('booking_packages')
      .select('sessions_used')
      .eq('id', packageId)
      .single()

    if (fetchError || !pkg) return

    const newSessionsUsed = Math.max(0, (pkg.sessions_used || 0) - 1)

    await supabase
      .from('booking_packages')
      .update({
        sessions_used: newSessionsUsed,
        status: 'active', // Reactivate if was completed
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId)
  }

  // =====================================================
  // AI Context Building
  // =====================================================

  /**
   * Build context for AI booking agent
   */
  static async buildBookingContext(
    coachId: string,
    clientId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BookingContext> {
    const supabase = await getSupabaseServerClient()

    // Default to next 2 weeks
    const start = startDate || new Date().toISOString().split('T')[0]
    const end = endDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    })()

    // Get availability
    const availability = await this.getCoachAvailability(coachId, start, end)

    // Get existing bookings
    const bookings = await this.getCoachBookings(coachId, start, end)

    // Build available slots (availability minus booked)
    const availableSlots = availability
      .filter(slot => {
        // Check if this slot has a confirmed booking
        const hasBooking = bookings.some(
          b => b.scheduled_date === slot.date &&
               b.start_time === slot.start_time &&
               b.status === 'confirmed'
        )
        return !hasBooking
      })
      .map(slot => ({
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        locationType: (slot.location_type || 'in_person') as SessionLocationType
      }))

    // Build existing bookings context
    const existingBookings = bookings
      .filter(b => b.status === 'confirmed')
      .map(b => ({
        id: b.id,
        date: b.scheduled_date,
        startTime: b.start_time,
        endTime: b.end_time,
        clientId: b.client_id,
        clientName: b.client_name,
        status: b.status
      }))

    // Build client preferences if clientId provided
    let clientPreferences: BookingContext['clientPreferences']
    let packageInfo: BookingContext['package']
    let clientCaloricPhase: BookingContext['clientCaloricPhase']
    let recommendedFrequency: BookingContext['recommendedFrequency']

    if (clientId) {
      // Get client's booking history for pattern detection
      const clientBookings = await this.getClientBookings(clientId)
      const recentBookings = clientBookings
        .filter(b => b.status === 'completed')
        .slice(0, 10)

      if (recentBookings.length > 0) {
        // Analyze patterns
        const dayFrequency: Record<string, number> = {}
        const timeSlots: string[] = []

        recentBookings.forEach(b => {
          const date = new Date(b.scheduled_date)
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
          dayFrequency[dayName] = (dayFrequency[dayName] || 0) + 1
          timeSlots.push(b.start_time)
        })

        // Find preferred days (top 2)
        const preferredDays = Object.entries(dayFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([day]) => day)

        // Find preferred time range
        const sortedTimes = timeSlots.sort()
        const preferredTimeRange = sortedTimes.length > 0 ? {
          start: sortedTimes[0],
          end: sortedTimes[sortedTimes.length - 1]
        } : undefined

        clientPreferences = {
          preferredDays,
          preferredTimeRange,
          lastBookings: recentBookings.slice(0, 5).map(b => ({
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(b.scheduled_date).getDay()],
            time: b.start_time
          }))
        }
      }

      // Get active package
      const activePackage = await this.getActivePackage(clientId, coachId)
      if (activePackage) {
        packageInfo = {
          id: activePackage.id,
          name: activePackage.name,
          sessionsPerWeek: activePackage.sessions_per_week || 1,
          sessionsRemaining: activePackage.total_sessions - (activePackage.sessions_used || 0)
        }
      }

      // Get client's caloric phase for phase-aware booking suggestions
      const { data: clientProfile } = await supabase
        .from('user_profiles')
        .select('caloric_phase')
        .eq('user_id', clientId)
        .single()

      if (clientProfile?.caloric_phase) {
        clientCaloricPhase = clientProfile.caloric_phase as 'bulk' | 'cut' | 'maintenance'
        recommendedFrequency = this.getRecommendedFrequency(clientCaloricPhase)
      }
    }

    return {
      coachId,
      clientId,
      availableSlots,
      clientPreferences,
      package: packageInfo,
      existingBookings,
      clientCaloricPhase,
      recommendedFrequency
    }
  }

  /**
   * Get clients with booking info for coach
   */
  static async getClientsWithBookingInfo(
    coachId: string
  ): Promise<ClientWithBookingInfo[]> {
    const supabase = await getSupabaseServerClient()

    // Get active relationships
    const { data: relationships, error } = await supabase
      .from('coach_client_relationships')
      .select(`
        client_id,
        user_profiles!coach_client_relationships_client_id_fkey(
          display_name,
          full_name,
          first_name
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching relationships:', error)
      return []
    }

    const clients: ClientWithBookingInfo[] = []

    for (const rel of relationships || []) {
      const clientId = rel.client_id
      const profile = (rel as any).user_profiles

      // Get last booking
      const { data: lastBooking } = await supabase
        .from('bookings')
        .select('scheduled_date, start_time')
        .eq('client_id', clientId)
        .eq('coach_id', coachId)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .single()

      // Get active package
      const activePackage = await this.getActivePackage(clientId, coachId)

      clients.push({
        id: clientId,
        name: profile?.display_name || profile?.full_name || profile?.first_name || 'Unknown',
        lastBooking: lastBooking ? {
          date: lastBooking.scheduled_date,
          time: lastBooking.start_time
        } : undefined,
        activePackage: activePackage ? {
          id: activePackage.id,
          name: activePackage.name,
          sessionsRemaining: activePackage.total_sessions - (activePackage.sessions_used || 0)
        } : undefined
      })
    }

    return clients
  }

  // =====================================================
  // Recurring Booking Management
  // =====================================================

  /**
   * Generate a new series ID
   */
  static generateSeriesId(): string {
    return crypto.randomUUID()
  }

  /**
   * Generate occurrence dates from a recurring pattern
   */
  static generateOccurrenceDates(
    startDate: Date,
    pattern: {
      frequency: 'weekly' | 'biweekly'
      endType: 'count' | 'date'
      endValue: number | string
      dayOfWeek: number[]
    }
  ): Date[] {
    const dates: Date[] = []
    const maxOccurrences = pattern.endType === 'count'
      ? (pattern.endValue as number)
      : 52 // Max 1 year for date-based

    const endDate = pattern.endType === 'date'
      ? new Date(pattern.endValue as string)
      : null

    const weekIncrement = pattern.frequency === 'weekly' ? 7 : 14
    const currentWeekStart = new Date(startDate)
    currentWeekStart.setHours(0, 0, 0, 0)

    // Find the start of the current week (Monday)
    const dayOfWeek = currentWeekStart.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    currentWeekStart.setDate(currentWeekStart.getDate() + diff)

    while (dates.length < maxOccurrences) {
      for (const dow of pattern.dayOfWeek) {
        // Calculate the date for this day of week
        const targetDate = new Date(currentWeekStart)
        // Convert: 0=Sun, 1=Mon in pattern to actual date offset
        const daysToAdd = dow === 0 ? 6 : dow - 1
        targetDate.setDate(targetDate.getDate() + daysToAdd)

        // Skip dates before start date
        if (targetDate < startDate) continue

        // Check end date
        if (endDate && targetDate > endDate) return dates

        // Check max count
        if (dates.length >= maxOccurrences) return dates

        dates.push(new Date(targetDate))
      }

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + weekIncrement)
    }

    return dates
  }

  /**
   * Check availability for multiple dates/times
   */
  static async checkRecurringAvailability(
    coachId: string,
    dates: string[],
    startTime: string,
    endTime: string
  ): Promise<Array<{ date: string; available: boolean; reason?: string }>> {
    const supabase = await getSupabaseServerClient()

    const results: Array<{ date: string; available: boolean; reason?: string }> = []

    for (const date of dates) {
      // Check coach availability
      const { data: availability } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId)
        .eq('date', date)
        .eq('is_available', true)
        .lte('start_time', startTime)
        .gte('end_time', endTime)
        .limit(1)

      if (!availability || availability.length === 0) {
        results.push({ date, available: false, reason: 'Coach not available' })
        continue
      }

      // Check existing bookings
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('coach_id', coachId)
        .eq('scheduled_date', date)
        .eq('status', 'confirmed')
        .or(`start_time.lte.${startTime},end_time.gt.${startTime}`)
        .limit(1)

      if (existingBooking && existingBooking.length > 0) {
        results.push({ date, available: false, reason: 'Slot already booked' })
        continue
      }

      results.push({ date, available: true })
    }

    return results
  }

  /**
   * Create a recurring booking series
   */
  static async createRecurringSeries(params: {
    baseBooking: InsertBooking
    pattern: {
      frequency: 'weekly' | 'biweekly'
      endType: 'count' | 'date'
      endValue: number | string
      sourceType: 'manual' | 'ai_package'
      packageId?: string
      dayOfWeek: number[]
      timeSlot: string
    }
    skipConflicts?: boolean
  }): Promise<{
    seriesId: string
    created: Booking[]
    skipped: Array<{ date: string; reason: string }>
  }> {
    const { baseBooking, pattern, skipConflicts = true } = params
    const seriesId = this.generateSeriesId()

    // Generate occurrence dates
    const startDate = new Date(baseBooking.scheduled_date)
    const occurrenceDates = this.generateOccurrenceDates(startDate, pattern)

    // Format dates to strings
    const dateStrings = occurrenceDates.map(d =>
      d.toISOString().split('T')[0]
    )

    // Check availability for all dates
    const availabilityResults = await this.checkRecurringAvailability(
      baseBooking.coach_id,
      dateStrings,
      baseBooking.start_time,
      baseBooking.end_time
    )

    const created: Booking[] = []
    const skipped: Array<{ date: string; reason: string }> = []

    // Create bookings for available slots
    for (let i = 0; i < dateStrings.length; i++) {
      const date = dateStrings[i]
      const availability = availabilityResults[i]

      if (!availability.available) {
        if (skipConflicts) {
          skipped.push({ date, reason: availability.reason || 'Unavailable' })
          continue
        } else {
          throw new Error(`Slot not available for ${date}: ${availability.reason}`)
        }
      }

      // Create the booking
      const bookingData: InsertBooking = {
        ...baseBooking,
        scheduled_date: date,
        recurring_series_id: seriesId,
        recurring_pattern: pattern as any,
        occurrence_index: created.length + 1
      }

      try {
        const booking = await this.createBooking(bookingData)
        created.push(booking)
      } catch (err) {
        skipped.push({ date, reason: (err as Error).message })
      }
    }

    return { seriesId, created, skipped }
  }

  /**
   * Get all bookings in a series
   */
  static async getSeriesBookings(seriesId: string): Promise<Booking[]> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('recurring_series_id', seriesId)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching series bookings:', error)
      throw new Error('Failed to fetch series bookings')
    }

    return (data || []) as unknown as Booking[]
  }

  /**
   * Cancel a single occurrence (keeps it in series for reference)
   */
  static async cancelSingleOccurrence(
    bookingId: string,
    reason?: string
  ): Promise<Booking> {
    const supabase = await getSupabaseServerClient()

    // Get the booking first
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Update to cancelled
    const { data: updated, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to cancel booking')
    }

    // Decrement package session if applicable
    if (booking.package_id) {
      await this.decrementPackageSession(booking.package_id)
    }

    return updated as unknown as Booking
  }

  /**
   * Cancel entire series
   */
  static async cancelEntireSeries(
    seriesId: string,
    reason?: string
  ): Promise<number> {
    const supabase = await getSupabaseServerClient()

    // Get all bookings to decrement packages
    const bookings = await this.getSeriesBookings(seriesId)
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')

    // Cancel all confirmed bookings
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('recurring_series_id', seriesId)
      .eq('status', 'confirmed')
      .select()

    if (error) {
      throw new Error('Failed to cancel series')
    }

    // Decrement package sessions for each cancelled booking
    const packageIds = Array.from(new Set(confirmedBookings.filter(b => b.package_id).map(b => b.package_id!)))
    for (const packageId of packageIds) {
      const count = confirmedBookings.filter(b => b.package_id === packageId).length
      for (let i = 0; i < count; i++) {
        await this.decrementPackageSession(packageId)
      }
    }

    return data?.length || 0
  }

  /**
   * Cancel this and all following occurrences in a series
   */
  static async cancelSeriesFromOccurrence(
    bookingId: string,
    reason?: string
  ): Promise<number> {
    const supabase = await getSupabaseServerClient()

    // Get the booking to find series and date
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    const booking = bookingData as Booking | null

    if (!booking || !booking.recurring_series_id) {
      // Just cancel the single booking
      await this.cancelSingleOccurrence(bookingId, reason)
      return 1
    }

    // Get all bookings from this date onwards
    const { data: bookingsToCancel } = await supabase
      .from('bookings')
      .select('*')
      .eq('recurring_series_id', booking.recurring_series_id)
      .eq('status', 'confirmed')
      .gte('scheduled_date', booking.scheduled_date)

    if (!bookingsToCancel || bookingsToCancel.length === 0) {
      return 0
    }

    // Cancel all
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('recurring_series_id', booking.recurring_series_id)
      .eq('status', 'confirmed')
      .gte('scheduled_date', booking.scheduled_date)

    if (error) {
      throw new Error('Failed to cancel series')
    }

    // Decrement package sessions
    const packageIds = Array.from(new Set(bookingsToCancel.filter(b => b.package_id).map(b => b.package_id!)))
    for (const packageId of packageIds) {
      const count = bookingsToCancel.filter(b => b.package_id === packageId).length
      for (let i = 0; i < count; i++) {
        await this.decrementPackageSession(packageId)
      }
    }

    return bookingsToCancel.length
  }

  /**
   * Update AI suggested slots for a package
   */
  static async updatePackageSuggestedSlots(
    packageId: string,
    slots: Array<{ dayOfWeek: number; time: string; confidence: number; reason?: string }>
  ): Promise<BookingPackage> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .update({
        ai_suggested_slots: slots,
        slots_confirmed: false
      } as any)
      .eq('id', packageId)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update package slots')
    }

    return data as unknown as BookingPackage
  }

  /**
   * Confirm package slots and optionally create recurring bookings
   */
  static async confirmPackageSlots(params: {
    packageId: string
    coachId: string
    clientId: string
    slots: Array<{ dayOfWeek: number; time: string }>
    weeksToGenerate?: number
  }): Promise<{
    seriesId: string
    created: Booking[]
    skipped: Array<{ date: string; reason: string }>
  }> {
    const { packageId, coachId, clientId, slots, weeksToGenerate = 4 } = params
    const supabase = await getSupabaseServerClient()

    // Mark package slots as confirmed
    await supabase
      .from('booking_packages')
      .update({ slots_confirmed: true } as any)
      .eq('id', packageId)

    // Get package info for session duration
    const pkg = await this.getPackage(packageId)
    if (!pkg) {
      throw new Error('Package not found')
    }

    // Create the recurring pattern
    const pattern = {
      frequency: 'weekly' as const,
      endType: 'count' as const,
      endValue: weeksToGenerate,
      sourceType: 'ai_package' as const,
      packageId,
      dayOfWeek: slots.map(s => s.dayOfWeek),
      timeSlot: slots[0]?.time || '09:00'
    }

    // Parse start time to get end time (default 1 hour)
    const startTime = slots[0]?.time || '09:00'
    const [hours, mins] = startTime.split(':').map(Number)
    const endHours = hours + 1
    const endTime = `${String(endHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

    // Create recurring series
    const today = new Date()
    const result = await this.createRecurringSeries({
      baseBooking: {
        coach_id: coachId,
        client_id: clientId,
        scheduled_date: today.toISOString().split('T')[0],
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        duration_minutes: 60,
        status: 'confirmed',
        package_id: packageId,
        ai_scheduled: true,
        ai_suggestion_accepted: null,
        cancellation_reason: null,
        client_notes: null,
        coach_notes: null,
        recurring_series_id: null,
        recurring_pattern: null,
        occurrence_index: null,
        location_type: 'in_person',
        meeting_url: null
      },
      pattern,
      skipConflicts: true
    })

    return result
  }

  /**
   * Get a single package by ID
   */
  static async getPackage(packageId: string): Promise<BookingPackage | null> {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('booking_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (error) {
      return null
    }

    return data as unknown as BookingPackage
  }
}
