'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link2, Check } from 'lucide-react'
import type { SupersetConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface SupersetLoggerProps {
  config: SupersetConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

export function SupersetLogger({
  config,
  onComplete,
  onCancel,
}: SupersetLoggerProps) {
  const t = useTranslations('workout.techniques.superset')
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'superset',
      config,
      completedFully: true,
    }

    onComplete(result)
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-indigo-400">
        <Link2 className="h-5 w-5" />
        <span className="font-semibold">{t('name')}</span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        {t('noRestBetween')}
        <span className="block mt-1 text-indigo-300">
          {t('restAfterBoth')} {config.restAfterBoth}s
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          size="sm"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          {t('complete')}
        </Button>
      </div>
    </div>
  )
}
