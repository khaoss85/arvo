import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicShareDataAction } from '@/app/actions/share-actions'
import { PublicCycleView } from '@/components/features/sharing/public-cycle-view'
import type { CycleShareData, SharePrivacySettings } from '@/lib/types/share.types'

interface PublicCycleSharePageProps {
  params: { token: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

/**
 * Public Cycle Share Page (Strava-style)
 * This page is publicly accessible without authentication
 */
export default async function PublicCycleSharePage({
  params,
  searchParams
}: PublicCycleSharePageProps) {
  const { token } = params
  const locale = typeof searchParams.lang === 'string' ? searchParams.lang : 'en'

  // Fetch share data
  const result = await getPublicShareDataAction(token)

  if (!result.success || !result.data) {
    notFound()
  }

  const { shareType, entityData, privacySettings, viewCount, createdAt, userInfo } = result.data

  if (shareType !== 'cycle') {
    notFound()
  }

  // Transform entity data to CycleShareData format
  const cycleData: CycleShareData = {
    cycleNumber: entityData.cycle_number,
    completedAt: entityData.completed_at,
    totalVolume: entityData.total_volume,
    totalWorkouts: entityData.total_workouts_completed,
    totalSets: entityData.total_sets,
    totalDurationSeconds: entityData.total_duration_seconds || 0,
    volumeByMuscleGroup: (entityData.volume_by_muscle_group as Record<string, number>) || {},
    splitType: entityData.split_type || undefined,
    targetVolumeDistribution: (entityData.target_volume_distribution as Record<string, number>) || undefined,
    userName: userInfo?.name || undefined,
    userPhoto: userInfo?.photo || undefined,
    notes: entityData.notes || undefined
  }

  return (
    <PublicCycleView
      data={cycleData}
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
}: PublicCycleSharePageProps): Promise<Metadata> {
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

  const cycleNumber = entityData.cycle_number
  const totalVolume = new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(
    entityData.total_volume
  )

  const title = locale === 'it'
    ? `${displayName} ha completato Ciclo #${cycleNumber}`
    : `${displayName} completed Cycle #${cycleNumber}`

  const description = locale === 'it'
    ? `${totalVolume}kg volume totale, ${entityData.total_workouts_completed} allenamenti completati`
    : `${totalVolume}kg total volume, ${entityData.total_workouts_completed} workouts completed`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yourapp.com/share/cycle/${token}`,
      images: [
        {
          url: `/api/og/cycle/${token}`, // We'll create this API route later
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
      images: [`/api/og/cycle/${token}`]
    }
  }
}
