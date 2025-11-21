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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProgressCheckDetail check={check} userId={user.id} />
    </div>
  )
}
