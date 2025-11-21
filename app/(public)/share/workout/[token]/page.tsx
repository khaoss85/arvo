import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicShareDataAction } from '@/app/actions/share-actions'
import { PublicWorkoutView } from '@/components/features/sharing/public-workout-view'
import type { WorkoutShareData, SharePrivacySettings } from '@/lib/types/share.types'
import { extractMuscleGroupsFromExercise } from '@/lib/utils/exercise-muscle-mapper'
import { getSplitDisplayName } from '@/lib/utils/split-display-names'

interface PublicWorkoutSharePageProps {
  params: { token: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Public Workout Share Page (Strava-style)
 * This page is publicly accessible without authentication
 */
export default async function PublicWorkoutSharePage({
  params,
  searchParams
}: PublicWorkoutSharePageProps) {
  const { token } = params
  const locale = typeof searchParams.lang === 'string' ? searchParams.lang : 'en'

  // Fetch share data
  const result = await getPublicShareDataAction(token)

  if (!result.success || !result.data) {
    notFound()
  }

  const { shareType, entityData, privacySettings, viewCount, createdAt, userInfo } = result.data

  if (shareType !== 'workout') {
    notFound()
  }

  // Calculate total volume from exercises (handle real DB structure)
  let totalVolume = 0
  let totalSets = 0
  const exercises: Array<{ name: string; sets: number; reps?: number; weight?: number; volume?: number }> = []
  const volumeByMuscleGroup: Record<string, number> = {}

  if (entityData.exercises && Array.isArray(entityData.exercises)) {
    for (const ex of entityData.exercises) {
      const name = ex.exerciseName || 'Unknown Exercise'
      const completedSets = ex.completedSets || []

      if (completedSets.length === 0) continue

      // Calculate aggregate stats for this exercise
      let exerciseVolume = 0
      let totalReps = 0
      let totalWeight = 0
      const workingSets = completedSets.filter((set: any) => !set.isWarmup && set.weight > 0)

      for (const set of workingSets) {
        const weight = set.weight || 0
        const reps = set.reps || 0
        const setVolume = weight * reps

        exerciseVolume += setVolume
        totalReps += reps
        totalWeight += weight
      }

      totalVolume += exerciseVolume
      totalSets += workingSets.length

      // Add to exercises array
      const avgWeight = workingSets.length > 0 ? Math.round(totalWeight / workingSets.length) : 0
      const avgReps = workingSets.length > 0 ? Math.round(totalReps / workingSets.length) : 0

      exercises.push({
        name,
        sets: workingSets.length,
        reps: avgReps,
        weight: avgWeight,
        volume: exerciseVolume
      })

      // Calculate muscle group volumes
      const muscleGroups = extractMuscleGroupsFromExercise(name)
      for (const muscleGroup of muscleGroups.primary) {
        volumeByMuscleGroup[muscleGroup] = (volumeByMuscleGroup[muscleGroup] || 0) + exerciseVolume
      }
    }
  }

  // Transform entity data to WorkoutShareData format
  const workoutData: WorkoutShareData = {
    workoutDate: entityData.created_at || new Date().toISOString(),
    splitName: getSplitDisplayName(entityData.split_type, locale as 'en' | 'it') || undefined,
    totalVolume: Math.round(totalVolume),
    totalSets,
    durationSeconds: entityData.duration_seconds || 0,
    exercises: (privacySettings as SharePrivacySettings).showExercises ? exercises : undefined,
    volumeByMuscleGroup: Object.keys(volumeByMuscleGroup).length > 0 ? volumeByMuscleGroup : undefined,
    notes: entityData.notes || undefined,
    userName: userInfo?.name || undefined,
    userPhoto: userInfo?.photo || undefined
  }

  return (
    <PublicWorkoutView
      data={workoutData}
      privacySettings={privacySettings as SharePrivacySettings}
      viewCount={viewCount ?? 0}
      createdAt={createdAt ?? new Date().toISOString()}
      locale={locale}
    />
  )
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({
  params,
  searchParams
}: PublicWorkoutSharePageProps): Promise<Metadata> {
  const { token } = params
  const locale = typeof searchParams.lang === 'string' ? searchParams.lang : 'en'

  const result = await getPublicShareDataAction(token)

  if (!result.success || !result.data) {
    return {
      title: 'Shared Workout',
      description: 'View workout results'
    }
  }

  const { entityData, userInfo, privacySettings } = result.data
  const displayName = (privacySettings as SharePrivacySettings).showName && userInfo?.name
    ? userInfo.name
    : (locale === 'it' ? 'Qualcuno' : 'Someone')

  // Calculate total volume for metadata (use DB total_volume if available, otherwise calculate)
  let totalVolume = entityData.total_volume ? parseFloat(entityData.total_volume) : 0

  if (totalVolume === 0 && entityData.exercises && Array.isArray(entityData.exercises)) {
    for (const ex of entityData.exercises) {
      const completedSets = ex.completedSets || []
      for (const set of completedSets) {
        if (!set.isWarmup && set.weight > 0) {
          totalVolume += (set.weight || 0) * (set.reps || 0)
        }
      }
    }
  }

  const volume = new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(
    Math.round(totalVolume)
  )

  const workoutDate = new Date(entityData.created_at || Date.now()).toLocaleDateString(
    locale === 'it' ? 'it-IT' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  const title = locale === 'it'
    ? `${displayName} ha completato un allenamento`
    : `${displayName} completed a workout`

  const description = locale === 'it'
    ? `${volume}kg di volume totale • ${workoutDate}`
    : `${volume}kg total volume • ${workoutDate}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yourapp.com/share/workout/${token}`,
      images: [
        {
          url: `/api/og/workout/${token}`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/workout/${token}`]
    }
  }
}
