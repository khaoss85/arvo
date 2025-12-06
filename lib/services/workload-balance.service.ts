/**
 * Workload Balance Service
 * Monitors coach workload and detects overload/burnout risk conditions
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Thresholds
const DENSITY_THRESHOLD = 80 // % of time occupied
const CONSECUTIVE_DAYS_THRESHOLD = 5 // days without break
const SESSIONS_PER_3H_THRESHOLD = 6 // max sessions in 3 hours

export interface DayDensity {
  date: string
  totalAvailableMinutes: number
  bookedMinutes: number
  density: number // 0-100
  sessionCount: number
  isOverloaded: boolean
}

export interface WorkloadMetrics {
  todayDensity: DayDensity | null
  consecutiveWorkDays: number
  isAtBurnoutRisk: boolean
  overloadedDays: DayDensity[]
  weeklySessionCount: number
  averageDailyDensity: number
}

export interface BurnoutRiskAlert {
  consecutiveDays: number
  isAtRisk: boolean
  suggestion: string
}

export class WorkloadBalanceService {
  static readonly DENSITY_THRESHOLD = DENSITY_THRESHOLD
  static readonly CONSECUTIVE_DAYS_THRESHOLD = CONSECUTIVE_DAYS_THRESHOLD

  /**
   * Calculate workload density for a specific date
   * Density = (booked minutes / available minutes) * 100
   */
  static async calculateDayDensity(
    coachId: string,
    date: string
  ): Promise<DayDensity> {
    const supabase = getSupabaseBrowserClient()

    // Get bookings for the date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, end_time, duration_minutes')
      .eq('coach_id', coachId)
      .eq('scheduled_date', date)
      .eq('status', 'confirmed')

    if (bookingsError) {
      console.error('[WorkloadBalance] Error fetching bookings:', bookingsError)
      return {
        date,
        totalAvailableMinutes: 0,
        bookedMinutes: 0,
        density: 0,
        sessionCount: 0,
        isOverloaded: false
      }
    }

    // Get availability for the date
    const { data: availability, error: availError } = await supabase
      .from('coach_availability')
      .select('start_time, end_time')
      .eq('coach_id', coachId)
      .eq('date', date)
      .eq('is_available', true)

    if (availError) {
      console.error('[WorkloadBalance] Error fetching availability:', availError)
    }

    // Calculate total available minutes
    let totalAvailableMinutes = 0
    if (availability && availability.length > 0) {
      for (const slot of availability) {
        const start = this.timeToMinutes(slot.start_time)
        const end = this.timeToMinutes(slot.end_time)
        totalAvailableMinutes += end - start
      }
    } else {
      // Default 8-hour workday if no availability set
      totalAvailableMinutes = 480 // 8 hours
    }

    // Calculate booked minutes
    let bookedMinutes = 0
    const sessionCount = bookings?.length || 0

    if (bookings) {
      for (const booking of bookings) {
        bookedMinutes += booking.duration_minutes || 60
      }
    }

    // Calculate density
    const density = totalAvailableMinutes > 0
      ? Math.round((bookedMinutes / totalAvailableMinutes) * 100)
      : 0

    return {
      date,
      totalAvailableMinutes,
      bookedMinutes,
      density,
      sessionCount,
      isOverloaded: density >= DENSITY_THRESHOLD
    }
  }

  /**
   * Detect overloaded days in a date range
   */
  static async detectOverloadedDays(
    coachId: string,
    startDate: string,
    endDate: string
  ): Promise<DayDensity[]> {
    const overloaded: DayDensity[] = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const density = await this.calculateDayDensity(coachId, dateStr)

      if (density.isOverloaded) {
        overloaded.push(density)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return overloaded
  }

  /**
   * Count consecutive days with bookings (no breaks)
   */
  static async getConsecutiveWorkDays(coachId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    // Look back 14 days max
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('scheduled_date')
      .eq('coach_id', coachId)
      .gte('scheduled_date', startDate.toISOString().split('T')[0])
      .lte('scheduled_date', endDate.toISOString().split('T')[0])
      .in('status', ['confirmed', 'completed'])
      .order('scheduled_date', { ascending: false })

    if (error || !bookings) {
      console.error('[WorkloadBalance] Error counting consecutive days:', error)
      return 0
    }

    // Get unique dates
    const uniqueDates = [...new Set(bookings.map(b => b.scheduled_date))].sort().reverse()

    if (uniqueDates.length === 0) return 0

    // Count consecutive days from today backwards
    let consecutive = 0
    const today = new Date().toISOString().split('T')[0]

    // Check if there's a booking today or yesterday to start counting
    const hasRecentBooking = uniqueDates[0] === today ||
      uniqueDates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (!hasRecentBooking) return 0

    let expectedDate = new Date(uniqueDates[0])

    for (const dateStr of uniqueDates) {
      const currentDate = new Date(dateStr)
      const diffDays = Math.round((expectedDate.getTime() - currentDate.getTime()) / 86400000)

      if (diffDays <= 1) {
        consecutive++
        expectedDate = new Date(currentDate)
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }

    return consecutive
  }

  /**
   * Check for burnout risk based on consecutive work days
   */
  static async checkBurnoutRisk(coachId: string): Promise<BurnoutRiskAlert> {
    const consecutiveDays = await this.getConsecutiveWorkDays(coachId)
    const isAtRisk = consecutiveDays >= CONSECUTIVE_DAYS_THRESHOLD

    let suggestion = ''
    if (isAtRisk) {
      if (consecutiveDays >= 7) {
        suggestion = 'Considera di aggiungere un giorno di riposo questa settimana. 7+ giorni consecutivi aumentano il rischio di burnout.'
      } else {
        suggestion = `Hai ${consecutiveDays} giorni consecutivi di lavoro. Valuta di bloccare del tempo per il recupero.`
      }
    }

    return {
      consecutiveDays,
      isAtRisk,
      suggestion
    }
  }

  /**
   * Get comprehensive workload metrics for a coach
   */
  static async getWorkloadMetrics(
    coachId: string,
    daysToAnalyze: number = 7
  ): Promise<WorkloadMetrics> {
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysToAnalyze)
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get today's density
    const todayDensity = await this.calculateDayDensity(coachId, today)

    // Get consecutive work days and burnout risk
    const consecutiveWorkDays = await this.getConsecutiveWorkDays(coachId)
    const burnoutRisk = await this.checkBurnoutRisk(coachId)

    // Get overloaded days in the next week
    const overloadedDays = await this.detectOverloadedDays(coachId, today, endDateStr)

    // Calculate weekly session count
    const supabase = getSupabaseBrowserClient()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const { count: weeklySessionCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .gte('scheduled_date', weekStart.toISOString().split('T')[0])
      .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
      .eq('status', 'confirmed')

    // Calculate average daily density for the week
    let totalDensity = 0
    let daysWithBookings = 0
    const currentDate = new Date(weekStart)

    while (currentDate <= weekEnd) {
      const dayDensity = await this.calculateDayDensity(
        coachId,
        currentDate.toISOString().split('T')[0]
      )
      if (dayDensity.sessionCount > 0) {
        totalDensity += dayDensity.density
        daysWithBookings++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const averageDailyDensity = daysWithBookings > 0
      ? Math.round(totalDensity / daysWithBookings)
      : 0

    return {
      todayDensity,
      consecutiveWorkDays,
      isAtBurnoutRisk: burnoutRisk.isAtRisk,
      overloadedDays,
      weeklySessionCount: weeklySessionCount || 0,
      averageDailyDensity
    }
  }

  /**
   * Check if a specific time window is overloaded (too many sessions)
   */
  static async checkTimeWindowOverload(
    coachId: string,
    date: string,
    startTime: string,
    windowHours: number = 3
  ): Promise<{ isOverloaded: boolean; sessionCount: number; threshold: number }> {
    const supabase = getSupabaseBrowserClient()

    const startMinutes = this.timeToMinutes(startTime)
    const endMinutes = startMinutes + (windowHours * 60)
    const endTime = this.minutesToTime(endMinutes)

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('coach_id', coachId)
      .eq('scheduled_date', date)
      .eq('status', 'confirmed')
      .gte('start_time', startTime)
      .lt('start_time', endTime)

    if (error) {
      console.error('[WorkloadBalance] Error checking time window:', error)
      return { isOverloaded: false, sessionCount: 0, threshold: SESSIONS_PER_3H_THRESHOLD }
    }

    const sessionCount = bookings?.length || 0
    return {
      isOverloaded: sessionCount >= SESSIONS_PER_3H_THRESHOLD,
      sessionCount,
      threshold: SESSIONS_PER_3H_THRESHOLD
    }
  }

  /**
   * Get color based on density level
   */
  static getDensityColor(density: number): 'success' | 'warning' | 'destructive' | 'default' {
    if (density >= 90) return 'destructive'
    if (density >= 80) return 'warning'
    if (density >= 50) return 'success'
    return 'default'
  }

  /**
   * Get status text based on density
   */
  static getDensityStatus(density: number, language: 'en' | 'it' = 'it'): string {
    if (language === 'it') {
      if (density >= 90) return 'Sovraccarico critico'
      if (density >= 80) return 'Molto impegnato'
      if (density >= 60) return 'Buon carico'
      if (density >= 30) return 'Carico leggero'
      return 'Disponibile'
    }

    if (density >= 90) return 'Critical overload'
    if (density >= 80) return 'Very busy'
    if (density >= 60) return 'Good load'
    if (density >= 30) return 'Light load'
    return 'Available'
  }

  // Helper: Convert time string (HH:MM) to minutes since midnight
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Helper: Convert minutes since midnight to time string (HH:MM)
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
}
