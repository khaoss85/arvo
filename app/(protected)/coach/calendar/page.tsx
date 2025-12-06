import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CoachService } from '@/lib/services/coach.service'
import { BookingService } from '@/lib/services/booking.service'
import { BookingCalendarClient } from '@/components/features/coach/booking/booking-calendar-client'

export const metadata: Metadata = {
  title: 'Calendar | Coach',
  description: 'Manage your training sessions and availability'
}

export default async function CoachCalendarPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get coach profile
  const coachProfile = await CoachService.getProfile(user.id)
  if (!coachProfile) {
    redirect('/coach')
  }

  // Get date range for initial data (current week + next week)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
  const endDate = new Date(startOfWeek)
  endDate.setDate(endDate.getDate() + 13) // 2 weeks

  const startDateStr = startOfWeek.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  // Fetch initial data in parallel
  const [availability, bookings, clients] = await Promise.all([
    BookingService.getCoachAvailability(user.id, startDateStr, endDateStr),
    BookingService.getCoachBookings(user.id, startDateStr, endDateStr),
    BookingService.getClientsWithBookingInfo(user.id)
  ])

  return (
    <div className="pb-20">
      <BookingCalendarClient
        coachId={user.id}
        coachName={coachProfile.display_name}
        initialAvailability={availability}
        initialBookings={bookings}
        clients={clients}
        initialStartDate={startDateStr}
        initialEndDate={endDateStr}
      />
    </div>
  )
}
