/**
 * Calendar Optimization Service
 * Handles gap detection and optimization suggestions (Anti-buchi feature)
 * Generates AI-driven suggestions to consolidate bookings and create free blocks
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  CalendarOptimizationSuggestion,
  InsertCalendarOptimizationSuggestion,
  Booking,
  GapDetails,
  OptimizationSuggestionType,
} from '@/lib/types/schemas'

// Minimum gap size in minutes to consider for optimization
const MIN_GAP_MINUTES = 30
// Minimum benefit score to create a suggestion
const MIN_BENEFIT_SCORE = 30
// Default expiration days for suggestions
const SUGGESTION_EXPIRATION_DAYS = 7

export interface GapAnalysis {
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  bookingBefore?: {
    id: string
    clientName: string
    endTime: string
  }
  bookingAfter?: {
    id: string
    clientName: string
    startTime: string
  }
}

export interface OptimizationOpportunity {
  sourceBooking: Booking & { client_name?: string }
  proposedDate: string
  proposedStartTime: string
  proposedEndTime: string
  suggestionType: OptimizationSuggestionType
  gapDetails: GapDetails
  reasonShort: string
  reasonDetailed: string
  benefitScore: number
  clientPreferenceScore: number
}

export class CalendarOptimizationService {
  /**
   * Detect gaps in coach's schedule for a specific date
   */
  static async detectGaps(
    coachId: string,
    date: string,
    minGapMinutes: number = MIN_GAP_MINUTES
  ): Promise<GapAnalysis[]> {
    const supabase = getSupabaseBrowserClient()

    // Get all confirmed bookings for the date, ordered by start time
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        client_id
      `)
      .eq('coach_id', coachId)
      .eq('scheduled_date', date)
      .eq('status', 'confirmed')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('[CalendarOptimization] Error fetching bookings:', error)
      return []
    }

    if (!bookings || bookings.length < 2) {
      // Need at least 2 bookings to have a gap between them
      return []
    }

    // Get client names for display
    const clientIds = Array.from(new Set(bookings.map((b) => b.client_id)))
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .in('user_id', clientIds)

    const clientNames = new Map(
      (profiles || []).map((p) => [p.user_id, p.first_name || 'Cliente'])
    )

    const gaps: GapAnalysis[] = []

    // Find gaps between consecutive bookings
    for (let i = 0; i < bookings.length - 1; i++) {
      const current = bookings[i]
      const next = bookings[i + 1]

      const currentEndMinutes = this.timeToMinutes(current.end_time)
      const nextStartMinutes = this.timeToMinutes(next.start_time)
      const gapMinutes = nextStartMinutes - currentEndMinutes

      if (gapMinutes >= minGapMinutes) {
        gaps.push({
          date,
          startTime: current.end_time,
          endTime: next.start_time,
          durationMinutes: gapMinutes,
          bookingBefore: {
            id: current.id,
            clientName: clientNames.get(current.client_id) || 'Cliente',
            endTime: current.end_time,
          },
          bookingAfter: {
            id: next.id,
            clientName: clientNames.get(next.client_id) || 'Cliente',
            startTime: next.start_time,
          },
        })
      }
    }

    return gaps
  }

  /**
   * Analyze optimization opportunities for a date range
   */
  static async analyzeOptimizationOpportunities(
    coachId: string,
    startDate: string,
    endDate: string
  ): Promise<OptimizationOpportunity[]> {
    const supabase = getSupabaseBrowserClient()
    const opportunities: OptimizationOpportunity[] = []

    // Get all bookings in the date range
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        coach_id,
        client_id,
        scheduled_date,
        start_time,
        end_time,
        duration_minutes,
        status,
        location_type
      `)
      .eq('coach_id', coachId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .eq('status', 'confirmed')
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error || !bookings || bookings.length === 0) {
      return []
    }

    // Get client names
    const clientIds = Array.from(new Set(bookings.map((b) => b.client_id)))
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .in('user_id', clientIds)

    const clientNames = new Map(
      (profiles || []).map((p) => [p.user_id, p.first_name || 'Cliente'])
    )

    // Group bookings by date
    const bookingsByDate = new Map<string, typeof bookings>()
    for (const booking of bookings) {
      const dateBookings = bookingsByDate.get(booking.scheduled_date) || []
      dateBookings.push(booking)
      bookingsByDate.set(booking.scheduled_date, dateBookings)
    }

    // Analyze each date
    for (const [date, dateBookings] of Array.from(bookingsByDate.entries())) {
      if (dateBookings.length < 2) continue

      // Check for gaps that could be filled by moving a booking
      for (let i = 0; i < dateBookings.length - 1; i++) {
        const current = dateBookings[i]
        const next = dateBookings[i + 1]

        const currentEndMinutes = this.timeToMinutes(current.end_time)
        const nextStartMinutes = this.timeToMinutes(next.start_time)
        const gapMinutes = nextStartMinutes - currentEndMinutes

        if (gapMinutes >= MIN_GAP_MINUTES && gapMinutes <= 90) {
          // Gap is between 30-90 minutes - could consolidate
          const nextDuration = next.duration_minutes || 60

          // Check if next booking could move earlier
          const proposedStartTime = current.end_time
          const proposedEndMinutes = currentEndMinutes + nextDuration
          const proposedEndTime = this.minutesToTime(proposedEndMinutes)

          // Check availability for the new slot
          const { data: isAvailable } = await supabase.rpc('is_slot_available', {
            p_coach_id: coachId,
            p_date: date,
            p_start_time: proposedStartTime,
            p_end_time: proposedEndTime,
            p_location_type: next.location_type || 'in_person',
          })

          if (isAvailable) {
            // Calculate client preference score based on historical patterns
            const clientPrefScore = await this.getClientPreferenceScore(
              next.client_id,
              coachId,
              new Date(date).getDay(),
              proposedStartTime
            )

            // Calculate benefit score
            const benefitScore = this.calculateBenefitScore(
              gapMinutes,
              dateBookings.length,
              clientPrefScore
            )

            if (benefitScore >= MIN_BENEFIT_SCORE) {
              const freedMinutes = gapMinutes
              const newBlockSize = this.calculateNewBlockSize(
                dateBookings,
                i + 1,
                proposedStartTime,
                proposedEndTime
              )

              opportunities.push({
                sourceBooking: {
                  ...next,
                  client_name: clientNames.get(next.client_id),
                } as Booking & { client_name?: string },
                proposedDate: date,
                proposedStartTime,
                proposedEndTime,
                suggestionType: newBlockSize >= 60 ? 'create_block' : 'consolidate_gap',
                gapDetails: {
                  originalDate: date,
                  originalStartTime: next.start_time,
                  originalEndTime: next.end_time,
                  gapBeforeMinutes: 0,
                  gapAfterMinutes: freedMinutes,
                  freedMinutes,
                  newBlockSize,
                },
                reasonShort: `Sposta alle ${proposedStartTime.slice(0, 5)} per ${freedMinutes}min liberi`,
                reasonDetailed: `Spostando la sessione di ${clientNames.get(next.client_id) || 'Cliente'} ` +
                  `dalle ${next.start_time.slice(0, 5)} alle ${proposedStartTime.slice(0, 5)}, ` +
                  `si crea un blocco libero di ${freedMinutes} minuti.`,
                benefitScore,
                clientPreferenceScore: clientPrefScore,
              })
            }
          }
        }
      }
    }

    // Sort by benefit score descending
    return opportunities.sort((a, b) => b.benefitScore - a.benefitScore)
  }

  /**
   * Get client preference score based on their booking history
   */
  static async getClientPreferenceScore(
    clientId: string,
    coachId: string,
    dayOfWeek: number,
    startTime: string
  ): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    // Get client's past bookings to analyze patterns
    const { data: pastBookings } = await supabase
      .from('bookings')
      .select('scheduled_date, start_time')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
      .limit(20)

    if (!pastBookings || pastBookings.length === 0) {
      return 50 // Default neutral score
    }

    let score = 50

    // Analyze day of week preference
    const proposedDayBookings = pastBookings.filter(
      (b) => new Date(b.scheduled_date).getDay() === dayOfWeek
    )
    if (proposedDayBookings.length > pastBookings.length * 0.3) {
      score += 20 // Client often books on this day
    }

    // Analyze time preference
    const proposedTimeMinutes = this.timeToMinutes(startTime)
    const similarTimeBookings = pastBookings.filter((b) => {
      const bookingMinutes = this.timeToMinutes(b.start_time)
      return Math.abs(bookingMinutes - proposedTimeMinutes) <= 60 // Within 1 hour
    })
    if (similarTimeBookings.length > pastBookings.length * 0.3) {
      score += 20 // Client often books around this time
    }

    // Penalize if very different from usual
    if (proposedDayBookings.length === 0) {
      score -= 10 // Client never books on this day
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Create optimization suggestions in the database
   */
  static async createSuggestions(
    coachId: string,
    opportunities: OptimizationOpportunity[]
  ): Promise<CalendarOptimizationSuggestion[]> {
    const supabase = getSupabaseBrowserClient()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SUGGESTION_EXPIRATION_DAYS)

    const suggestions = opportunities.map((opp) => ({
      coach_id: coachId,
      suggestion_type: opp.suggestionType,
      source_booking_id: opp.sourceBooking.id,
      client_id: opp.sourceBooking.client_id,
      proposed_date: opp.proposedDate,
      proposed_start_time: opp.proposedStartTime,
      proposed_end_time: opp.proposedEndTime,
      gap_details: opp.gapDetails,
      reason_short: opp.reasonShort,
      reason_detailed: opp.reasonDetailed,
      benefit_score: opp.benefitScore,
      client_preference_score: opp.clientPreferenceScore,
      status: 'pending' as const,
      expires_at: expiresAt.toISOString(),
    }))

    const { data, error } = await supabase
      .from('calendar_optimization_suggestions')
      .insert(suggestions)
      .select()

    if (error) {
      console.error('[CalendarOptimization] Error creating suggestions:', error)
      throw new Error('Failed to create optimization suggestions')
    }

    return (data || []) as unknown as CalendarOptimizationSuggestion[]
  }

  /**
   * Get pending suggestions for a coach
   */
  static async getPendingSuggestions(
    coachId: string
  ): Promise<CalendarOptimizationSuggestion[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('calendar_optimization_suggestions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('benefit_score', { ascending: false })

    if (error) {
      console.error('[CalendarOptimization] Error fetching suggestions:', error)
      return []
    }

    return (data || []) as unknown as CalendarOptimizationSuggestion[]
  }

  /**
   * Respond to a suggestion (accept or reject)
   */
  static async respondToSuggestion(
    suggestionId: string,
    response: 'accept' | 'reject'
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('calendar_optimization_suggestions')
      .update({
        status: response === 'accept' ? 'accepted' : 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestionId)

    if (error) {
      console.error('[CalendarOptimization] Error updating suggestion:', error)
      throw new Error('Failed to update suggestion')
    }
  }

  /**
   * Apply an accepted optimization (reschedule the booking)
   */
  static async applyOptimization(
    suggestionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseBrowserClient()

    // Get the suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('calendar_optimization_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single()

    if (fetchError || !suggestion) {
      return { success: false, error: 'Suggestion not found' }
    }

    if (suggestion.status !== 'accepted') {
      return { success: false, error: 'Suggestion must be accepted first' }
    }

    // Check if the proposed slot is still available
    const { data: isAvailable } = await supabase.rpc('is_slot_available', {
      p_coach_id: suggestion.coach_id,
      p_date: suggestion.proposed_date,
      p_start_time: suggestion.proposed_start_time,
      p_end_time: suggestion.proposed_end_time,
    })

    if (!isAvailable) {
      // Mark as expired
      await supabase
        .from('calendar_optimization_suggestions')
        .update({ status: 'expired' })
        .eq('id', suggestionId)
      return { success: false, error: 'Slot is no longer available' }
    }

    // Update the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        scheduled_date: suggestion.proposed_date,
        start_time: suggestion.proposed_start_time,
        end_time: suggestion.proposed_end_time,
        ai_scheduled: true,
        ai_suggestion_accepted: true,
      })
      .eq('id', suggestion.source_booking_id)

    if (updateError) {
      console.error('[CalendarOptimization] Error updating booking:', updateError)
      return { success: false, error: 'Failed to reschedule booking' }
    }

    // Mark suggestion as applied
    await supabase
      .from('calendar_optimization_suggestions')
      .update({ status: 'applied' })
      .eq('id', suggestionId)

    return { success: true }
  }

  /**
   * Expire old suggestions
   */
  static async expireOldSuggestions(): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('calendar_optimization_suggestions')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[CalendarOptimization] Error expiring suggestions:', error)
      return 0
    }

    return data?.length || 0
  }

  // ==================== Helper Methods ====================

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
  }

  private static calculateBenefitScore(
    gapMinutes: number,
    totalBookings: number,
    clientPrefScore: number
  ): number {
    // Base score from gap size (bigger gaps = more valuable to fill)
    let score = Math.min(40, gapMinutes / 2)

    // Bonus for days with more bookings (more valuable optimization)
    score += Math.min(20, totalBookings * 5)

    // Factor in client preference
    score += (clientPrefScore / 100) * 30

    // Normalize to 0-100
    return Math.min(100, Math.max(0, Math.round(score)))
  }

  private static calculateNewBlockSize(
    bookings: { start_time: string; end_time: string }[],
    movedIndex: number,
    newStartTime: string,
    newEndTime: string
  ): number {
    // Calculate how much consecutive free time is created after the move
    const newEndMinutes = this.timeToMinutes(newEndTime)

    // Find the next booking after the moved one
    const nextBooking = bookings[movedIndex + 1]
    if (!nextBooking) {
      // No booking after - assume end of day at 21:00
      return Math.max(0, 21 * 60 - newEndMinutes)
    }

    const nextStartMinutes = this.timeToMinutes(nextBooking.start_time)
    return Math.max(0, nextStartMinutes - newEndMinutes)
  }
}
