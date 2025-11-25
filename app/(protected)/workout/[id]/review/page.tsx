import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { WorkoutService } from '@/lib/services/workout.service'
import { SplitPlanService } from '@/lib/services/split-plan.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { RefineWorkoutPage } from '@/components/features/workout/refine-workout-page'

export default async function WorkoutReviewPage({ params }: { params: { id: string } }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Create Supabase client for server-side operations
  const supabase = await getSupabaseServerClient()

  // Check if user is in simple mode - redirect to simple workout directly
  const profile = await UserProfileService.getByUserIdServer(user.id)
  if (profile?.app_mode === 'simple') {
    redirect(`/simple/workout/${params.id}`)
  }

  // Load workout using server-side method
  const workout = await WorkoutService.getByIdServer(params.id, supabase)

  if (!workout) {
    redirect('/dashboard')
  }

  // Verify ownership
  if (workout.user_id !== user.id) {
    redirect('/dashboard')
  }

  // Load split plan data if workout has a split plan
  let splitPlan = null
  let sessionDefinition = null

  if (workout.split_plan_id && workout.cycle_day) {
    splitPlan = await SplitPlanService.getActiveServer(user.id, supabase)

    if (splitPlan) {
      sessionDefinition = SplitPlanService.getSessionForDay(splitPlan, workout.cycle_day)
    }
  }

  return (
    <RefineWorkoutPage
      workout={workout}
      userId={user.id}
      splitPlan={splitPlan}
      sessionDefinition={sessionDefinition}
    />
  )
}
