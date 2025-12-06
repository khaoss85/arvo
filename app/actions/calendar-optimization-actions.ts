'use server'

/**
 * Server Actions for Calendar Optimization
 * Handles anti-buchi (anti-gap) suggestions and calendar optimization
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CalendarOptimizationService, type GapAnalysis } from '@/lib/services/calendar-optimization.service'
import type { CalendarOptimizationSuggestion } from '@/lib/types/schemas'

// =====================================================
// Optimization Suggestion Actions
// =====================================================

/**
 * Get pending optimization suggestions for a coach
 */
export async function getOptimizationSuggestionsAction(
  coachId: string
): Promise<{ suggestions: CalendarOptimizationSuggestion[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('calendar_optimization_suggestions')
      .select(`
        *,
        source_booking:bookings!source_booking_id (
          id,
          scheduled_date,
          start_time,
          end_time,
          client_id
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('benefit_score', { ascending: false })

    if (error) {
      console.error('[OptimizationActions] Error fetching suggestions:', error)
      return { suggestions: [], error: 'Failed to fetch suggestions' }
    }

    return { suggestions: (data || []) as unknown as CalendarOptimizationSuggestion[] }
  } catch (error) {
    console.error('[OptimizationActions] Unexpected error:', error)
    return { suggestions: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Detect gaps in the calendar for a specific date
 */
export async function detectGapsAction(
  coachId: string,
  date: string,
  minGapMinutes?: number
): Promise<{ gaps: GapAnalysis[]; error?: string }> {
  try {
    const gaps = await CalendarOptimizationService.detectGaps(
      coachId,
      date,
      minGapMinutes
    )
    return { gaps }
  } catch (error) {
    console.error('[OptimizationActions] Error detecting gaps:', error)
    return { gaps: [], error: 'Failed to detect gaps' }
  }
}

/**
 * Generate optimization suggestions for a week
 */
export async function generateOptimizationsAction(
  coachId: string,
  weekStartDate: string
): Promise<{ suggestionsCount: number; error?: string }> {
  try {
    // Calculate week end date
    const startDate = new Date(weekStartDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    // Analyze opportunities
    const opportunities = await CalendarOptimizationService.analyzeOptimizationOpportunities(
      coachId,
      weekStartDate,
      endDate.toISOString().split('T')[0]
    )

    if (opportunities.length === 0) {
      return { suggestionsCount: 0 }
    }

    // Create suggestions (limit to top 5)
    const topOpportunities = opportunities.slice(0, 5)
    await CalendarOptimizationService.createSuggestions(coachId, topOpportunities)

    return { suggestionsCount: topOpportunities.length }
  } catch (error) {
    console.error('[OptimizationActions] Error generating optimizations:', error)
    return { suggestionsCount: 0, error: 'Failed to generate optimizations' }
  }
}

/**
 * Accept an optimization suggestion
 */
export async function acceptSuggestionAction(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await CalendarOptimizationService.respondToSuggestion(suggestionId, 'accept')
    return { success: true }
  } catch (error) {
    console.error('[OptimizationActions] Error accepting suggestion:', error)
    return { success: false, error: 'Failed to accept suggestion' }
  }
}

/**
 * Reject an optimization suggestion
 */
export async function rejectSuggestionAction(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await CalendarOptimizationService.respondToSuggestion(suggestionId, 'reject')
    return { success: true }
  } catch (error) {
    console.error('[OptimizationActions] Error rejecting suggestion:', error)
    return { success: false, error: 'Failed to reject suggestion' }
  }
}

/**
 * Apply an accepted optimization (reschedule the booking)
 */
export async function applyOptimizationAction(
  suggestionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await CalendarOptimizationService.applyOptimization(suggestionId)
    return result
  } catch (error) {
    console.error('[OptimizationActions] Error applying optimization:', error)
    return { success: false, error: 'Failed to apply optimization' }
  }
}

/**
 * Get suggestion count for badge display
 */
export async function getSuggestionCountAction(
  coachId: string
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const { count, error } = await supabase
      .from('calendar_optimization_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    if (error) {
      console.error('[OptimizationActions] Error getting count:', error)
      return { count: 0, error: 'Failed to get suggestion count' }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('[OptimizationActions] Unexpected error:', error)
    return { count: 0, error: 'An unexpected error occurred' }
  }
}

/**
 * Analyze calendar and show summary (for display purposes)
 */
export async function analyzeCalendarAction(
  coachId: string,
  targetDate: string
): Promise<{
  gaps: GapAnalysis[]
  totalGapMinutes: number
  potentialOptimizations: number
  error?: string
}> {
  try {
    const gaps = await CalendarOptimizationService.detectGaps(coachId, targetDate)

    const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.durationMinutes, 0)
    const potentialOptimizations = gaps.filter(g => g.durationMinutes <= 90).length

    return {
      gaps,
      totalGapMinutes,
      potentialOptimizations,
    }
  } catch (error) {
    console.error('[OptimizationActions] Error analyzing calendar:', error)
    return {
      gaps: [],
      totalGapMinutes: 0,
      potentialOptimizations: 0,
      error: 'Failed to analyze calendar'
    }
  }
}
