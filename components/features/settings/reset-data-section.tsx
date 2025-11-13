'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { resetUserData } from '@/app/actions/account-actions'

export function ResetDataSection() {
  const t = useTranslations('settings.resetData')
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetUserData()
      // After successful reset, redirect to onboarding
      router.push('/onboarding/approach')
    } catch (error) {
      console.error('Reset error:', error)
      alert(`${t('errorResetting')}: ${error instanceof Error ? error.message : t('unknownError')}`)
      setIsResetting(false)
    }
  }

  return (
    <Card className="p-6 border-orange-200 dark:border-orange-800">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {t('title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
            onClick={() => setShowConfirm(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('button')}
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    {t('confirmMessage')}
                  </p>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 list-disc list-inside ml-2 space-y-1">
                    <li>{t('deleteItems.profile')}</li>
                    <li>{t('deleteItems.workoutHistory')}</li>
                    <li>{t('deleteItems.splitPlans')}</li>
                    <li>{t('deleteItems.customExercises')}</li>
                  </ul>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mt-3">
                    {t('accountRemains')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? t('resetting') : t('confirmButton')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
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
