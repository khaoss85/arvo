'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2, LogOut, AlertTriangle } from 'lucide-react'
import { useGymContextStore } from '@/lib/stores/gym-context.store'

export function GymMembershipSection() {
  const t = useTranslations('settings.gymMembership')
  const router = useRouter()
  const { gymContext, branding, clearContext } = useGymContextStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // Don't show if user is not a member of any gym
  if (!gymContext?.gym_id) {
    return null
  }

  // Don't show if user is the gym owner (they can't leave their own gym)
  if (gymContext.role === 'owner') {
    return null
  }

  const handleLeaveGym = async () => {
    setIsLeaving(true)
    try {
      const response = await fetch('/api/client/leave-gym', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave gym')
      }

      // Clear local gym context
      clearContext()

      // Refresh the page to update UI
      router.refresh()

      // Close the confirmation dialog
      setShowConfirm(false)
    } catch (error) {
      console.error('Leave gym error:', error)
      alert(error instanceof Error ? error.message : t('leaveError'))
      setIsLeaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold">
              {t('title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('currentGym')}: <span className="font-medium">{gymContext.gym_name}</span>
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900/20"
            onClick={() => setShowConfirm(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('leaveGym')}
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {t('leaveConfirmTitle')}
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    {t('leaveConfirmMessage', { gymName: gymContext.gym_name })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleLeaveGym}
                disabled={isLeaving}
              >
                {isLeaving ? t('leaving') : t('confirmLeave')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isLeaving}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
