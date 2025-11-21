'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Copy, Check, Eye, ExternalLink } from 'lucide-react'
import { createShareLinkAction } from '@/app/actions/share-actions'
import type { ShareType, SharePrivacySettings } from '@/lib/types/share.types'
import { DEFAULT_PRIVACY_SETTINGS } from '@/lib/types/share.types'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  shareType: ShareType
  entityId: string
}

/**
 * Share Dialog Component
 * Shows privacy controls and generated share link
 */
export function ShareDialog({
  isOpen,
  onClose,
  shareType,
  entityId
}: ShareDialogProps) {
  const t = useTranslations('share')
  const [privacySettings, setPrivacySettings] = useState<SharePrivacySettings>(DEFAULT_PRIVACY_SETTINGS)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState<number>(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate share link when dialog opens
  useEffect(() => {
    if (isOpen && !shareLink) {
      generateShareLink()
    }
  }, [isOpen])

  const generateShareLink = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await createShareLinkAction({
        shareType,
        entityId,
        privacySettings
      })

      if (result.success && result.data) {
        const token = result.data.token
        const fullUrl = `${window.location.origin}/share/${shareType}/${token}`
        setShareLink(fullUrl)
        setShareToken(token)

        // If link already existed, we might have view count
        if (!result.data.isNew) {
          // Could fetch view count here if needed
          setViewCount(0) // Placeholder
        }
      } else {
        setError(result.error || t('errorGenerating'))
      }
    } catch (err) {
      setError(t('errorGenerating'))
      console.error('Failed to generate share link:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareLink) return

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handlePrivacyChange = (key: keyof SharePrivacySettings, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleOpenPreview = () => {
    if (shareLink) {
      window.open(shareLink, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('dialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('privacySettings')}
            </h3>

            <div className="space-y-3">
              {/* Show Name */}
              <div className="flex items-center justify-between">
                <Label htmlFor="showName" className="text-sm cursor-pointer">
                  {t('showName')}
                </Label>
                <Switch
                  id="showName"
                  checked={privacySettings.showName}
                  onCheckedChange={(checked) => handlePrivacyChange('showName', checked)}
                />
              </div>

              {/* Show Stats */}
              <div className="flex items-center justify-between">
                <Label htmlFor="showStats" className="text-sm cursor-pointer">
                  {t('showStats')}
                </Label>
                <Switch
                  id="showStats"
                  checked={privacySettings.showStats}
                  onCheckedChange={(checked) => handlePrivacyChange('showStats', checked)}
                />
              </div>

              {/* Show Charts */}
              <div className="flex items-center justify-between">
                <Label htmlFor="showCharts" className="text-sm cursor-pointer">
                  {t('showCharts')}
                </Label>
                <Switch
                  id="showCharts"
                  checked={privacySettings.showCharts}
                  onCheckedChange={(checked) => handlePrivacyChange('showCharts', checked)}
                />
              </div>

              {/* Show Exercises */}
              {shareType === 'workout' && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="showExercises" className="text-sm cursor-pointer">
                    {t('showExercises')}
                  </Label>
                  <Switch
                    id="showExercises"
                    checked={privacySettings.showExercises}
                    onCheckedChange={(checked) => handlePrivacyChange('showExercises', checked)}
                  />
                </div>
              )}

              {/* Show Notes */}
              <div className="flex items-center justify-between">
                <Label htmlFor="showNotes" className="text-sm cursor-pointer">
                  {t('showNotes')}
                </Label>
                <Switch
                  id="showNotes"
                  checked={privacySettings.showNotes}
                  onCheckedChange={(checked) => handlePrivacyChange('showNotes', checked)}
                />
              </div>
            </div>
          </div>

          {/* Share Link */}
          {shareLink && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('shareLink')}
              </h3>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-300 truncate border border-gray-200 dark:border-gray-700">
                  {shareLink}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* View Count */}
              {viewCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Eye className="w-3 h-3" />
                  <span>{t('viewCount', { count: viewCount })}</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenPreview}
              disabled={!shareLink}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('preview')}
            </Button>
            <Button onClick={onClose} className="flex-1">
              {t('done')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
