'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BodyMap } from '@/components/features/onboarding/body-map'
import { updateWeakPointsAction } from '@/app/actions/ai-actions'
import { Pencil, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface WeakPointsEditorProps {
  userId: string
  initialWeakPoints: string[]
}

export function WeakPointsEditor({ userId, initialWeakPoints }: WeakPointsEditorProps) {
  const t = useTranslations('settings.weakPoints')
  const [isEditing, setIsEditing] = useState(false)
  const [weakPoints, setWeakPoints] = useState<string[]>(initialWeakPoints || [])
  const [tempWeakPoints, setTempWeakPoints] = useState<string[]>(initialWeakPoints || [])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const handleToggle = (part: string) => {
    if (tempWeakPoints.includes(part)) {
      setTempWeakPoints(tempWeakPoints.filter(p => p !== part))
    } else {
      if (tempWeakPoints.length >= 3) {
        setMessage({ type: 'error', text: t('maxWeakPointsError') })
        setTimeout(() => setMessage(null), 3000)
        return
      }
      setTempWeakPoints([...tempWeakPoints, part])
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    const result = await updateWeakPointsAction(userId, tempWeakPoints)
    setIsLoading(false)

    if (result.success) {
      setWeakPoints(tempWeakPoints)
      setIsEditing(false)
      setMessage({ type: 'success', text: t('updateSuccess') })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error || t('updateError') })
    }
  }

  const handleCancel = () => {
    setTempWeakPoints(weakPoints)
    setIsEditing(false)
    setMessage(null)
  }

  // Muscle group label mapping
  const muscleLabels: Record<string, string> = {
    'chest_upper': t('muscles.chestUpper'),
    'chest_lower': t('muscles.chestLower'),
    'shoulders': t('muscles.shoulders'),
    'back_width': t('muscles.backWidth'),
    'back_thickness': t('muscles.backThickness'),
    'biceps': t('muscles.biceps'),
    'triceps': t('muscles.triceps'),
    'quads': t('muscles.quads'),
    'hamstrings': t('muscles.hamstrings'),
    'glutes': t('muscles.glutes'),
    'calves': t('muscles.calves'),
    'abs': t('muscles.abs')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            {t('editButton')}
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <BodyMap
            selectedParts={tempWeakPoints}
            onToggle={handleToggle}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {t('cancelButton')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isLoading ? t('savingButton') : t('saveButton')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {weakPoints.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('emptyState')}
            </p>
          ) : (
            weakPoints.map(part => (
              <span
                key={part}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-lg text-sm font-medium"
              >
                {muscleLabels[part] || part}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  )
}
