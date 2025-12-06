import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BookingService } from '@/lib/services/booking.service'
import { BookingsClient } from '@/components/features/bookings/bookings-client'

export const metadata: Metadata = {
  title: 'My Sessions',
  description: 'View your upcoming training sessions'
}

export default async function BookingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch client's bookings (upcoming + recent past)
  const bookings = await BookingService.getClientUpcomingBookings(user.id, 50)

  return <BookingsClient userId={user.id} initialBookings={bookings} />
}
