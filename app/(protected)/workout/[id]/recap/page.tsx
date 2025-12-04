import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { CoachService } from '@/lib/services/coach.service'
import { WorkoutRecap } from '@/components/features/workout/workout-recap'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function WorkoutRecapPage({ params }: { params: { id: string } }) {
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

  // Verify workout is completed
  if (workout.status !== 'completed') {
    // Redirect to workout execution if not completed
    redirect(`/workout/${params.id}`)
  }

  // Calculate workout volume
  const totalVolume = await SetLogService.calculateWorkoutVolume(params.id)

  // Get workout modifications (skipped sets + exercise substitutions)
  // Using server-side method for SSR compatibility
  const modifications = await SetLogService.getWorkoutModificationsServer(params.id)

  return (
    <WorkoutRecap
      workout={workout}
      totalVolume={totalVolume}
      userId={user.id}
      modifications={modifications}
    />
  )
}
