'use client'

import { useState } from 'react'
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
      alert(`Error deleting account: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
              Danger Zone
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>

        {!showConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100">
                    ⚠️ WARNING: This action CANNOT be undone!
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-800 dark:text-red-200 list-disc list-inside ml-2 space-y-1">
                    <li>Your user profile and preferences</li>
                    <li>All workout history and sets logged</li>
                    <li>All split plans and training data</li>
                    <li>Custom exercises you've created</li>
                    <li><strong>Your entire account</strong> (you will be signed out)</li>
                  </ul>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-3">
                    You can create a new account with the same email after deletion.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-red-300 dark:border-red-700">
                <label htmlFor="confirm-delete" className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Type <span className="font-bold bg-red-200 dark:bg-red-800 px-1 rounded">DELETE</span> to confirm:
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
                {isDeleting ? 'Deleting Account...' : 'Delete My Account Permanently'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmText('')
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>

            {confirmText !== '' && confirmText !== 'DELETE' && (
              <p className="text-xs text-red-600 dark:text-red-400">
                You must type exactly "DELETE" (all caps) to proceed
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
