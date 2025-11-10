import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemoryDashboardClient } from './memory-dashboard-client'

export default async function MemoryDashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <MemoryDashboardClient userId={user.id} />
}
