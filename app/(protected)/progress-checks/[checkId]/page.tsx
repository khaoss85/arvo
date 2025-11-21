import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import { ProgressCheckDetail } from '@/components/features/progress-checks/progress-check-detail'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { ProgressCheckWithDetails } from '@/lib/types/progress-check.types'

export default async function ProgressCheckDetailPage({
  params,
}: {
  params: { checkId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch check with server-side Supabase client
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('progress_checks')
    .select('*, photos:progress_photos(*), measurements:body_measurements(*)')
    .eq('id', params.checkId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    redirect('/progress-checks')
  }

  const check = data as unknown as ProgressCheckWithDetails

  // Refresh signed URLs for photos (server-side)
  if (check.photos && check.photos.length > 0) {
    const refreshedPhotos = await Promise.all(
      check.photos.map(async (photo) => {
        try {
          // Extract file path from existing URL
          const url = new URL(photo.photo_url)
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(sign|public)\/progress-photos\/(.+)/)

          if (!pathMatch || !pathMatch[2]) {
            return photo
          }

          const filePath = pathMatch[2]

          // Generate new signed URL with server client
          const { data: urlData, error: urlError } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(filePath, 86400) // 24 hours

          if (urlError || !urlData) {
            console.error('Failed to refresh signed URL:', urlError)
            return photo
          }

          return {
            ...photo,
            photo_url: urlData.signedUrl,
          }
        } catch (error) {
          console.error('Error refreshing photo URL:', error)
          return photo
        }
      })
    )
    check.photos = refreshedPhotos
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProgressCheckDetail check={check} userId={user.id} />
    </div>
  )
}
