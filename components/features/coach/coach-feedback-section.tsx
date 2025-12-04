'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, Edit2, Save, X, Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CoachWorkoutAssignment } from '@/lib/types/schemas'

interface CoachFeedbackSectionProps {
  assignment?: CoachWorkoutAssignment | null
  workoutId: string
}

export function CoachFeedbackSection({ assignment, workoutId }: CoachFeedbackSectionProps) {
  const t = useTranslations('coach.workoutRecap')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [coachNotes, setCoachNotes] = useState(assignment?.coach_notes || '')
  const [clientNotes, setClientNotes] = useState(assignment?.client_notes || '')

  // Auto-hide saved message
  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSaved])

  // If no assignment exists, this workout wasn't assigned by coach
  if (!assignment) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('feedbackSection')}</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm italic">
          {t('notAssignedByCoach')}
        </p>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/coach/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coach_notes: coachNotes,
          client_notes: clientNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      setShowSaved(true)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setCoachNotes(assignment?.coach_notes || '')
    setClientNotes(assignment?.client_notes || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('feedbackSection')}</h2>
          {showSaved && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              {t('notesSaved')}
            </span>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t('editNotes')}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Private Notes (Coach Only) */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <EyeOff className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('privateNotes')}
            </label>
          </div>
          {isEditing ? (
            <Textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder={t('privateNotesPlaceholder')}
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {coachNotes || <span className="italic text-gray-400">{t('noNotes')}</span>}
            </p>
          )}
        </div>

        {/* Client-Visible Notes */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <label className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('clientNotes')}
            </label>
          </div>
          {isEditing ? (
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder={t('clientNotesPlaceholder')}
              className="min-h-[80px] border-blue-200 dark:border-blue-800 focus:border-blue-400"
            />
          ) : (
            <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
              {clientNotes || <span className="italic text-blue-400">{t('noNotes')}</span>}
            </p>
          )}
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              {t('cancelEdit')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {t('saveNotes')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
