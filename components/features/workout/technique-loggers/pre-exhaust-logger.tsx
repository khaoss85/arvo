'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Target, Check, ArrowRight } from 'lucide-react'
import type { PreExhaustConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface PreExhaustLoggerProps {
  config: PreExhaustConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

export function PreExhaustLogger({
  config,
  onComplete,
  onCancel,
}: PreExhaustLoggerProps) {
  const t = useTranslations('workout.techniques.preExhaust')
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'pre_exhaust',
      config,
      completedFully: true,
    }

    onComplete(result)
  }

  return (
    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-teal-400">
        <Target className="h-5 w-5" />
        <span className="font-semibold">{t('name')}</span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>{t('isolation')}</span>
          <ArrowRight className="h-4 w-4" />
          <span>{t('compound')}</span>
        </div>
        <span className="block mt-1 text-teal-300">
          {t('restBetween')} {config.restBetween}s
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
