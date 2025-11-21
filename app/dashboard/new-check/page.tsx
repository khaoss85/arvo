import { redirect } from 'next/navigation'
import { getUser } from '@/lib/utils/auth.server'
import NewCheckClient from './new-check-client'

export default async function NewCheckPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <NewCheckClient userId={user.id} />
}
