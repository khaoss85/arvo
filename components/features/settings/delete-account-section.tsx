'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteAccount } from '@/app/actions/account-actions'

interface DeleteAccountSectionProps {
  userId: string
  userEmail?: string
}

export function DeleteAccountSection({ userId, userEmail }: DeleteAccountSectionProps) {
  const t = useTranslations('settings.deleteAccount')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      // User will be redirected by the server action
    } catch (error) {
      console.error('Delete error:', error)
      alert(`${t('errorDeleting')}: ${error instanceof Error ? error.message : t('unknownError')}`)
      setIsDeleting(false)
    }
  }

  return (
    <Card className="p-6 border-red-200 dark:border-red-800">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              {t('title')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('button')}
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100">
                    {t('warningMessage')}
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {t('confirmMessage')}
                  </p>
                  <ul className="text-sm text-red-800 dark:text-red-200 list-disc list-inside ml-2 space-y-1">
                    <li>{t('deleteItems.profile')}</li>
                    <li>{t('deleteItems.workoutHistory')}</li>
                    <li>{t('deleteItems.splitPlans')}</li>
                    <li>{t('deleteItems.customExercises')}</li>
                    <li><strong>{t('deleteItems.account')}</strong> {t('deleteItems.accountNote')}</li>
                  </ul>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-3">
                    {t('canRecreate')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-red-300 dark:border-red-700">
                <label htmlFor="confirm-delete" className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  {t('typeDeleteLabel')} <span className="font-bold bg-red-200 dark:bg-red-800 px-1 rounded">DELETE</span> {t('typeDeleteSuffix')}
                </label>
                <Input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="bg-white dark:bg-gray-900 border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500"
                  placeholder="DELETE"
                  disabled={isDeleting}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || isDeleting}
                className="font-bold"
              >
                {isDeleting ? t('deleting') : t('confirmButton')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmText('')
                }}
                disabled={isDeleting}
              >
                {t('cancel')}
              </Button>
            </div>

            {confirmText !== '' && confirmText !== 'DELETE' && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {t('validationError')}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
