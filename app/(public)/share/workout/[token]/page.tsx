import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicShareDataAction } from '@/app/actions/share-actions'
import { PublicWorkoutView } from '@/components/features/sharing/public-workout-view'
import type { WorkoutShareData, SharePrivacySettings } from '@/lib/types/share.types'

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

  // Calculate total volume from exercises
  let totalVolume = 0
  let totalSets = 0
  const exercises: Array<{ name: string; sets: number; reps?: number; weight?: number }> = []

  if (entityData.exercises && Array.isArray(entityData.exercises)) {
    // Group exercises by name and aggregate
    const exerciseMap = new Map<string, { sets: number; totalReps: number; totalWeight: number; count: number }>()

    for (const ex of entityData.exercises) {
      const name = ex.exercise_name || 'Unknown Exercise'
      const weight = ex.weight || 0
      const reps = ex.reps || 0

      // Add to total volume
      totalVolume += weight * reps
      totalSets += 1

      // Aggregate by exercise name
      if (!exerciseMap.has(name)) {
        exerciseMap.set(name, { sets: 0, totalReps: 0, totalWeight: 0, count: 0 })
      }
      const agg = exerciseMap.get(name)!
      agg.sets += 1
      agg.totalReps += reps
      agg.totalWeight += weight
      agg.count += 1
    }

    // Convert to exercise array
    for (const [name, agg] of Array.from(exerciseMap.entries())) {
      exercises.push({
        name,
        sets: agg.sets,
        reps: Math.round(agg.totalReps / agg.count),
        weight: Math.round(agg.totalWeight / agg.count)
      })
    }
  }

  // Transform entity data to WorkoutShareData format
  const workoutData: WorkoutShareData = {
    workoutDate: entityData.created_at || new Date().toISOString(),
    splitName: entityData.split_name || undefined,
    totalVolume: Math.round(totalVolume),
    totalSets,
    durationSeconds: entityData.duration_seconds || 0,
    exercises: (privacySettings as SharePrivacySettings).showExercises ? exercises : undefined,
    notes: entityData.notes || undefined,
    userName: userInfo?.name || undefined,
    userPhoto: userInfo?.photo || undefined
  }

  return (
    <PublicWorkoutView
      data={workoutData}
      privacySettings={privacySettings as SharePrivacySettings}
      viewCount={viewCount}
      createdAt={createdAt}
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

  // Calculate total volume for metadata
  let totalVolume = 0
  if (entityData.exercises && Array.isArray(entityData.exercises)) {
    for (const ex of entityData.exercises) {
      totalVolume += (ex.weight || 0) * (ex.reps || 0)
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
