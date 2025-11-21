import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import { ProgressCheckService } from '@/lib/services/progress-check.service'
import { ProgressCheckCompare } from '@/components/features/progress-checks/progress-check-compare'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default async function CompareChecksPage({
  params,
}: {
  params: { beforeId: string; afterId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Use client-side service method for comparison
  const comparison = await ProgressCheckService.compareChecks(
    params.beforeId,
    params.afterId,
    user.id
  )

  if (!comparison) {
    redirect('/progress-checks')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ProgressCheckCompare comparison={comparison} userId={user.id} />
    </div>
  )
}
