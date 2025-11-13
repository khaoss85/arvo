import { NextRequest, NextResponse } from 'next/server'
import { WorkoutService } from '@/lib/services/workout.service'
import { getTranslations } from 'next-intl/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserLanguage } from '@/lib/utils/get-user-language'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user locale for translations
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const locale = user ? await getUserLanguage(user.id) : 'en'
    const t = await getTranslations({ locale, namespace: 'api.workouts.errors' })

    const workout = await WorkoutService.getByIdServer(params.id)

    if (!workout) {
      return NextResponse.json(
        { error: t('workoutNotFound') },
        { status: 404 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    // Fall back to default locale for errors
    const t = await getTranslations({ locale: 'en', namespace: 'api.workouts.errors' })
    return NextResponse.json(
      { error: t('failedToFetch') },
      { status: 500 }
    )
  }
}
