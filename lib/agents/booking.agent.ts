import { BaseAgent } from './base.agent'
import type { BookingContext } from '@/lib/services/booking.service'

// =====================================================
// Booking Agent Types
// =====================================================

export interface BookingCommand {
  action: 'suggest' | 'book' | 'reschedule' | 'cancel' | 'query'
  naturalLanguage: string
  bookingId?: string
  clientId?: string
  clientName?: string
}

export interface BookingSuggestion {
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  confidence: number // 0-100
  reason: string // Max 30 words
}

export interface BookingConfirmation {
  date: string
  startTime: string
  endTime: string
  clientId: string
  clientName?: string
  durationMinutes: number
}

export interface BookingResponse {
  action: 'suggest' | 'book' | 'reschedule' | 'cancel' | 'query' | 'error'
  suggestions?: BookingSuggestion[]
  confirmation?: BookingConfirmation
  queryResponse?: string
  needsClarification?: string
  error?: string
}

// =====================================================
// Booking Agent
// =====================================================

/**
 * AI-powered booking assistant for coaches
 *
 * Features:
 * - Natural language parsing (IT/EN)
 * - Smart slot suggestions based on client patterns
 * - Booking, rescheduling, and cancellation handling
 * - Package-aware scheduling
 */
export class BookingAgent extends BaseAgent {
  constructor(supabaseClient?: any, userId?: string) {
    // Use gpt-5-nano with reasoning='none' for ultra-fast responses (~1s)
    super(supabaseClient, 'none', 'low', userId)
    this.model = 'gpt-5-nano'
  }

  /**
   * System prompt for the booking assistant
   */
  get systemPrompt(): string {
    return `You are a smart booking assistant for fitness coaches.
Your role is to help manage training sessions efficiently.

## Capabilities
1. Parse natural language booking requests (Italian and English)
2. Suggest optimal time slots based on patterns
3. Handle rescheduling and cancellations
4. Consider client preferences and package constraints

## Response Rules
- Be concise: gym-friendly, max 30 words per reason
- Prioritize client's historical preferences (day/time patterns)
- Respect package session limits
- Never double-book
- Suggest 2-3 options when possible
- For dates, use YYYY-MM-DD format
- For times, use HH:MM format (24h)

## Natural Language Examples

### Italian
- "prenota Marco martedì alle 18" → book Marco, Tuesday 18:00
- "sposta l'appuntamento di giovedì alle 17" → reschedule Thursday to 17:00
- "annulla la sessione di venerdì" → cancel Friday session
- "quando è libero questa settimana?" → query availability
- "trova uno slot per 2 sessioni settimanali" → suggest recurring slots
- "Marco vuole allenarsi lunedì e mercoledì" → suggest Mon+Wed for Marco

### English
- "book John for Tuesday at 6pm" → book John, Tuesday 18:00
- "move Thursday's session to 5pm" → reschedule Thursday to 17:00
- "cancel Friday's session" → cancel Friday session
- "when am I free this week?" → query availability

## Date Interpretation
- "oggi" / "today" → current date
- "domani" / "tomorrow" → current date + 1
- "lunedì" / "Monday" → next Monday
- "questa settimana" / "this week" → current week
- "prossima settimana" / "next week" → next week

## Response Format
Always respond with valid JSON matching the BookingResponse interface.`
  }

  /**
   * Process a natural language booking command
   */
  async processCommand(
    command: BookingCommand,
    context: BookingContext,
    targetLanguage: 'en' | 'it' = 'it'
  ): Promise<BookingResponse> {
    const prompt = this.buildCommandPrompt(command, context, targetLanguage)

    try {
      const result = await this.complete<BookingResponse>(prompt, targetLanguage)
      return result
    } catch (error) {
      console.error('BookingAgent error:', error)
      return {
        action: 'error',
        error: targetLanguage === 'it'
          ? 'Si è verificato un errore. Riprova.'
          : 'An error occurred. Please try again.'
      }
    }
  }

  /**
   * Suggest optimal booking slots for a client
   */
  async suggestOptimalSlots(
    context: BookingContext,
    targetLanguage: 'en' | 'it' = 'it'
  ): Promise<BookingResponse> {
    const prompt = this.buildSuggestionPrompt(context, targetLanguage)

    try {
      const result = await this.complete<BookingResponse>(prompt, targetLanguage)
      return result
    } catch (error) {
      console.error('BookingAgent suggestion error:', error)
      return {
        action: 'error',
        error: targetLanguage === 'it'
          ? 'Impossibile generare suggerimenti. Riprova.'
          : 'Unable to generate suggestions. Please try again.'
      }
    }
  }

  /**
   * Build prompt for command processing
   */
  private buildCommandPrompt(
    command: BookingCommand,
    context: BookingContext,
    targetLanguage: 'en' | 'it'
  ): string {
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().toLocaleDateString(targetLanguage === 'it' ? 'it-IT' : 'en-US', { weekday: 'long' })

    return `${this.systemPrompt}

## Current Context
Today: ${today} (${dayOfWeek})
Language: ${targetLanguage === 'it' ? 'Italian' : 'English'}

## User Command
"${command.naturalLanguage}"
${command.clientName ? `Client mentioned: ${command.clientName}` : ''}
${command.bookingId ? `Related booking ID: ${command.bookingId}` : ''}

## Available Slots (next 2 weeks)
${context.availableSlots.length > 0
  ? context.availableSlots.slice(0, 20).map(s => `- ${s.date} ${s.startTime}-${s.endTime}`).join('\n')
  : 'No available slots in the selected period'}

## Existing Bookings
${context.existingBookings.length > 0
  ? context.existingBookings.slice(0, 10).map(b => `- ${b.date} ${b.startTime}: ${b.clientName || b.clientId}`).join('\n')
  : 'No existing bookings'}

${context.clientPreferences ? `
## Client Preferences (${command.clientName || context.clientId})
- Preferred days: ${context.clientPreferences.preferredDays?.join(', ') || 'any'}
- Preferred time: ${context.clientPreferences.preferredTimeRange?.start || 'any'}-${context.clientPreferences.preferredTimeRange?.end || 'any'}
- Recent pattern: ${context.clientPreferences.lastBookings?.map(b => `${b.dayOfWeek} ${b.time}`).join(', ') || 'none'}
` : ''}

${context.package ? `
## Active Package
- Name: ${context.package.name}
- Sessions/week: ${context.package.sessionsPerWeek}
- Remaining: ${context.package.sessionsRemaining}
` : ''}

${context.clientCaloricPhase ? `
## Training Phase Guidance
- Current phase: ${context.clientCaloricPhase}
- Recommended frequency: ${context.recommendedFrequency?.sessionsPerWeek} sessions/week
- Rationale: ${context.recommendedFrequency?.rationale}
Consider this phase when suggesting booking frequency.
` : ''}

## Task
Parse the user command and respond with the appropriate action.
- For "book": extract client, date, time → return confirmation object
- For "reschedule": extract new date/time → return confirmation object
- For "cancel": confirm which booking to cancel
- For "suggest": analyze patterns and suggest best slots
- For "query": answer the question about availability

If the request is unclear, return needsClarification asking for specific info.

Respond ONLY with valid JSON matching this structure:
{
  "action": "suggest" | "book" | "reschedule" | "cancel" | "query" | "error",
  "suggestions": [{ "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "confidence": 0-100, "reason": "..." }],
  "confirmation": { "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "clientId": "...", "clientName": "...", "durationMinutes": 60 },
  "queryResponse": "...",
  "needsClarification": "..."
}`
  }

  /**
   * Build prompt for slot suggestions
   */
  private buildSuggestionPrompt(
    context: BookingContext,
    targetLanguage: 'en' | 'it'
  ): string {
    const today = new Date().toISOString().split('T')[0]

    return `${this.systemPrompt}

## Task
Analyze the following context and suggest 2-3 optimal booking slots.

## Current Context
Today: ${today}
Language: ${targetLanguage === 'it' ? 'Italian' : 'English'}

## Available Slots
${context.availableSlots.slice(0, 30).map(s => `- ${s.date} ${s.startTime}-${s.endTime}`).join('\n')}

${context.clientPreferences ? `
## Client Preferences
- Preferred days: ${context.clientPreferences.preferredDays?.join(', ') || 'any'}
- Preferred time: ${context.clientPreferences.preferredTimeRange?.start || 'any'}-${context.clientPreferences.preferredTimeRange?.end || 'any'}
- Recent bookings: ${context.clientPreferences.lastBookings?.map(b => `${b.dayOfWeek} ${b.time}`).join(', ') || 'none'}
` : 'No client preferences recorded'}

${context.package ? `
## Package Constraints
- Sessions per week: ${context.package.sessionsPerWeek}
- Remaining sessions: ${context.package.sessionsRemaining}
` : 'No active package'}

${context.clientCaloricPhase ? `
## Training Phase Guidance
- Current phase: ${context.clientCaloricPhase}
- Recommended frequency: ${context.recommendedFrequency?.sessionsPerWeek} sessions/week
- Rationale: ${context.recommendedFrequency?.rationale}
Prioritize this recommended frequency when suggesting slots.
` : ''}

## Existing Bookings (avoid conflicts)
${context.existingBookings.map(b => `- ${b.date} ${b.startTime}`).join('\n') || 'None'}

## Instructions
1. Prioritize slots matching client's historical patterns
2. Consider package session frequency
3. Avoid consecutive days if possible (recovery time)
4. Prefer consistent weekly schedule
5. Provide clear, concise reasons in ${targetLanguage === 'it' ? 'Italian' : 'English'}

Respond ONLY with valid JSON:
{
  "action": "suggest",
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "confidence": 0-100,
      "reason": "max 30 words explaining why this slot"
    }
  ]
}`
  }

  /**
   * Quick parse for simple booking requests
   * Falls back to full AI processing if needed
   */
  async quickParse(
    input: string,
    context: BookingContext,
    targetLanguage: 'en' | 'it' = 'it'
  ): Promise<BookingResponse | null> {
    const lowerInput = input.toLowerCase()

    // Quick patterns for common operations
    const cancelPatterns = ['annulla', 'cancella', 'cancel', 'disdici']
    const queryPatterns = ['quando', 'libero', 'disponibile', 'when', 'free', 'available']

    // Check for cancel intent
    if (cancelPatterns.some(p => lowerInput.includes(p))) {
      // Need AI to extract which booking
      return this.processCommand(
        { action: 'cancel', naturalLanguage: input },
        context,
        targetLanguage
      )
    }

    // Check for query intent
    if (queryPatterns.some(p => lowerInput.includes(p))) {
      const availableCount = context.availableSlots.length
      const nextSlot = context.availableSlots[0]

      return {
        action: 'query',
        queryResponse: targetLanguage === 'it'
          ? `Hai ${availableCount} slot disponibili. ${nextSlot ? `Il prossimo è ${nextSlot.date} alle ${nextSlot.startTime}.` : ''}`
          : `You have ${availableCount} available slots. ${nextSlot ? `Next one is ${nextSlot.date} at ${nextSlot.startTime}.` : ''}`
      }
    }

    // For complex requests, use full AI processing
    return null
  }

  /**
   * Suggest optimal recurring slots for a package
   * Analyzes availability patterns and client preferences to suggest
   * the best N slots per week for recurring sessions
   */
  async suggestRecurringSlots(
    context: BookingContext,
    sessionsPerWeek: number,
    targetLanguage: 'en' | 'it' = 'it'
  ): Promise<Array<{
    dayOfWeek: number
    dayName: string
    time: string
    confidence: number
    reason: string
  }>> {
    const dayNames = targetLanguage === 'it'
      ? ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // Analyze availability patterns
    const availabilityByDay: Record<number, string[]> = {}
    for (const slot of context.availableSlots) {
      const date = new Date(slot.date)
      const dow = date.getDay()
      if (!availabilityByDay[dow]) {
        availabilityByDay[dow] = []
      }
      // Extract just HH:MM
      const time = slot.startTime.substring(0, 5)
      if (!availabilityByDay[dow].includes(time)) {
        availabilityByDay[dow].push(time)
      }
    }

    // Analyze client preferences from history
    const clientPreferredDays: number[] = []
    const clientPreferredTimes: string[] = []

    if (context.clientPreferences?.lastBookings) {
      for (const booking of context.clientPreferences.lastBookings) {
        const dowIndex = dayNames.findIndex(d =>
          d.toLowerCase() === booking.dayOfWeek.toLowerCase()
        )
        if (dowIndex >= 0 && !clientPreferredDays.includes(dowIndex)) {
          clientPreferredDays.push(dowIndex)
        }
        const time = booking.time.substring(0, 5)
        if (!clientPreferredTimes.includes(time)) {
          clientPreferredTimes.push(time)
        }
      }
    }

    // Score each available day/time
    const scoredSlots: Array<{
      dayOfWeek: number
      time: string
      score: number
    }> = []

    for (const [dowStr, times] of Object.entries(availabilityByDay)) {
      const dow = parseInt(dowStr)
      for (const time of times) {
        let score = 50 // Base score

        // Bonus for client preference match
        if (clientPreferredDays.includes(dow)) {
          score += 30
        }
        if (clientPreferredTimes.includes(time)) {
          score += 20
        }

        // Bonus for weekday consistency (prefer working days)
        if (dow >= 1 && dow <= 5) {
          score += 5
        }

        // Bonus for reasonable times (9-12, 16-20)
        const hour = parseInt(time.split(':')[0])
        if ((hour >= 9 && hour <= 12) || (hour >= 16 && hour <= 20)) {
          score += 10
        }

        scoredSlots.push({ dayOfWeek: dow, time, score })
      }
    }

    // Sort by score descending
    scoredSlots.sort((a, b) => b.score - a.score)

    // Select best N slots, trying to distribute across different days
    const selectedSlots: typeof scoredSlots = []
    const usedDays = new Set<number>()

    // First pass: get best slot for different days
    for (const slot of scoredSlots) {
      if (selectedSlots.length >= sessionsPerWeek) break
      if (!usedDays.has(slot.dayOfWeek)) {
        selectedSlots.push(slot)
        usedDays.add(slot.dayOfWeek)
      }
    }

    // Second pass: fill remaining if needed (same day allowed)
    if (selectedSlots.length < sessionsPerWeek) {
      for (const slot of scoredSlots) {
        if (selectedSlots.length >= sessionsPerWeek) break
        if (!selectedSlots.find(s => s.dayOfWeek === slot.dayOfWeek && s.time === slot.time)) {
          selectedSlots.push(slot)
        }
      }
    }

    // Generate reasons and format response
    return selectedSlots.map(slot => {
      const reasons: string[] = []

      if (clientPreferredDays.includes(slot.dayOfWeek)) {
        reasons.push(targetLanguage === 'it' ? 'giorno preferito' : 'preferred day')
      }
      if (clientPreferredTimes.includes(slot.time)) {
        reasons.push(targetLanguage === 'it' ? 'orario abituale' : 'usual time')
      }

      const hour = parseInt(slot.time.split(':')[0])
      if (hour >= 16 && hour <= 20) {
        reasons.push(targetLanguage === 'it' ? 'fascia serale' : 'evening slot')
      } else if (hour >= 9 && hour <= 12) {
        reasons.push(targetLanguage === 'it' ? 'fascia mattutina' : 'morning slot')
      }

      if (reasons.length === 0) {
        reasons.push(targetLanguage === 'it' ? 'coach disponibile' : 'coach available')
      }

      return {
        dayOfWeek: slot.dayOfWeek,
        dayName: dayNames[slot.dayOfWeek],
        time: slot.time,
        confidence: Math.min(slot.score, 100),
        reason: reasons.slice(0, 2).join(', ')
      }
    })
  }
}
