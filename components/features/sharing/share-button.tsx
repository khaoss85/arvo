'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareDialog } from './share-dialog'
import type { ShareType } from '@/lib/types/share.types'
import { useTranslations } from 'next-intl'

interface ShareButtonProps {
  shareType: ShareType
  entityId: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  iconOnly?: boolean
  className?: string
}

/**
 * Discreet share button component
 * Opens ShareDialog when clicked
 */
export function ShareButton({
  shareType,
  entityId,
  variant = 'ghost',
  size = 'sm',
  iconOnly = false,
  className = ''
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('share')

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ${className}`}
        aria-label={t('shareButton')}
      >
        <Share2 className={iconOnly ? 'w-5 h-5' : 'w-4 h-4 mr-2'} />
        {!iconOnly && t('share')}
      </Button>

      <ShareDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shareType={shareType}
        entityId={entityId}
      />
    </>
  )
}
