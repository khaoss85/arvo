import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { WorkoutService } from '@/lib/services/workout.service'
import { CoachService } from '@/lib/services/coach.service'
import { WorkoutExecution } from '@/components/features/workout/workout-execution'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function WorkoutPage({ params }: { params: { id: string } }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Load workout using server-side method
  const workout = await WorkoutService.getByIdServer(params.id)

  if (!workout) {
    redirect('/dashboard')
  }

  // Verify ownership or coach access
  const isOwner = workout.user_id === user.id
  let isCoachOfClient = false

  if (!isOwner && workout.user_id) {
    // Check if current user is the coach of the workout owner
    const supabase = await getSupabaseServerClient()
    const relationship = await CoachService.getClientRelationshipServer(
      user.id,
      workout.user_id,
      supabase
    )
    isCoachOfClient = relationship?.status === 'active'
  }

  if (!isOwner && !isCoachOfClient) {
    redirect('/dashboard')
  }

  // For coaches viewing client workouts, redirect to recap if completed
  if (isCoachOfClient && workout.status === 'completed') {
    redirect(`/workout/${params.id}/recap`)
  }

  return <WorkoutExecution workout={workout} userId={user.id} />
}
