import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { WorkoutService } from '@/lib/services/workout.service'
import { RefineWorkoutPage } from '@/components/features/workout/refine-workout-page'

export default async function WorkoutReviewPage({ params }: { params: { id: string } }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Load workout using server-side method
  const workout = await WorkoutService.getByIdServer(params.id)

  if (!workout) {
    redirect('/dashboard')
  }

  // Verify ownership
  if (workout.user_id !== user.id) {
    redirect('/dashboard')
  }

  return <RefineWorkoutPage workout={workout} userId={user.id} />
}
