'use client'

import { redirect } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ProgressChecksGallery } from '@/components/features/progress-checks/progress-checks-gallery'

export default function ProgressChecksPage() {
  const { user } = useAuthStore()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ProgressChecksGallery userId={user.id} />
    </div>
  )
}
