import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { WorkoutRecap } from '@/components/features/workout/workout-recap'

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

  // Verify ownership
  if (workout.user_id !== user.id) {
    redirect('/dashboard')
  }

  // Verify workout is completed
  if (!workout.completed) {
    // Redirect to workout execution if not completed
    redirect(`/workout/${params.id}`)
  }

  // Calculate workout volume
  const totalVolume = await SetLogService.calculateWorkoutVolume(params.id)

  return (
    <WorkoutRecap
      workout={workout}
      totalVolume={totalVolume}
      userId={user.id}
    />
  )
}
