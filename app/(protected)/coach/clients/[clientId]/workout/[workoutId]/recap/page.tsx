import { redirect } from 'next/navigation'
import { requireCoach, getUser } from '@/lib/utils/auth.server'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { CoachService } from '@/lib/services/coach.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { CoachWorkoutRecap } from '@/components/features/coach/coach-workout-recap'

interface PageProps {
  params: { clientId: string; workoutId: string }
}

export default async function CoachWorkoutRecapPage({ params }: PageProps) {
  await requireCoach()

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const { clientId, workoutId } = params

  // Verify coach-client relationship
  const relationship = await CoachService.getClientRelationshipServer(
    user.id,
    clientId
  )

  if (!relationship || relationship.status !== 'active') {
    redirect('/coach')
  }

  // Load workout
  const workout = await WorkoutService.getByIdServer(workoutId)

  if (!workout) {
    redirect(`/coach/clients/${clientId}`)
  }

  // Verify workout belongs to client
  if (workout.user_id !== clientId) {
    redirect(`/coach/clients/${clientId}`)
  }

  // Load client profile for name
  const clientProfile = await UserProfileService.getByUserIdServer(clientId)
  const clientName = clientProfile?.first_name || 'Cliente'

  // Load assignment (for notes)
  const assignment = await CoachService.getAssignmentForWorkoutServer(workoutId)

  // Calculate workout volume
  const totalVolume = await SetLogService.calculateWorkoutVolume(workoutId)

  // Get workout modifications
  const modifications = await SetLogService.getWorkoutModificationsServer(workoutId)

  return (
    <CoachWorkoutRecap
      workout={workout}
      totalVolume={totalVolume}
      modifications={modifications}
      clientId={clientId}
      clientName={clientName}
      assignment={assignment}
    />
  )
}
