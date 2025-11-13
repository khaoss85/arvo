'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, Check, X, Info } from 'lucide-react'
import { MuscleDropdown } from './muscle-dropdown'
import {
  createProactiveLimitationAction,
  resolveLimitationAction,
  getActiveLimitationsAction
} from '@/app/actions/limitation-actions'
import {
  mapDatabaseSeverityToUser,
  type UserSeverity
} from '@/lib/utils/limitation-helpers'
import { MedicalDisclaimerModal } from '@/components/features/legal/medical-disclaimer-modal'

interface ActiveLimitation {
  id: string
  user_note: string
  severity: string // database severity (caution/warning/critical)
  metadata?: {
    affectedMuscles?: string[]
    context?: Record<string, unknown>
  }
  exercise_name?: string | null
  created_at: string
  workout_id?: string | null
}

const MAX_LIMITATIONS = 3

const getSeverityInfo = (t: any): Record<UserSeverity, { color: string; icon: string; description: string }> => ({
  'Mild': {
    color: 'green',
    icon: t('severity.mild.icon'),
    description: t('severity.mild.description')
  },
  'Moderate': {
    color: 'orange',
    icon: t('severity.moderate.icon'),
    description: t('severity.moderate.description')
  },
  'Severe': {
    color: 'red',
    icon: t('severity.severe.icon'),
    description: t('severity.severe.description')
  }
})

const MEDICAL_DISCLAIMER_KEY = 'physical_limitations_disclaimer_accepted'

export function PhysicalLimitationsManager({ userId }: { userId: string }) {
  const t = useTranslations('settings.limitations')
  const [limitations, setLimitations] = useState<ActiveLimitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  // Form state
  const [newLimitation, setNewLimitation] = useState({
    description: '',
    severity: 'Moderate' as UserSeverity,
    affectedMuscles: [] as string[],
    exerciseName: ''
  })

  // Load limitations and disclaimer state on mount
  useEffect(() => {
    loadLimitations()
    // Check if user has accepted disclaimer before
    const accepted = localStorage.getItem(MEDICAL_DISCLAIMER_KEY) === 'true'
    setDisclaimerAccepted(accepted)
  }, [])

  const loadLimitations = async () => {
    setIsLoading(true)
    const result = await getActiveLimitationsAction()

    if (result.success) {
      // Filter to show only proactive limitations (workout_id = null)
      const proactiveLimitations = result.data.filter((l: any) => l.workout_id === null)
      setLimitations(proactiveLimitations as ActiveLimitation[])
    } else {
      setMessage({ type: 'error', text: result.error || t('messages.loadError') })
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setNewLimitation({
      description: '',
      severity: 'Moderate',
      affectedMuscles: [],
      exerciseName: ''
    })
  }

  const handleAddLimitation = async () => {
    if (!newLimitation.description.trim()) {
      setMessage({ type: 'error', text: t('messages.descriptionRequired') })
      return
    }

    setIsSaving(true)
    setMessage(null) // Clear previous messages

    const result = await createProactiveLimitationAction({
      description: newLimitation.description,
      severity: newLimitation.severity,
      affectedMuscles: newLimitation.affectedMuscles.length > 0 ? newLimitation.affectedMuscles : undefined,
      exerciseName: newLimitation.exerciseName || undefined
    })

    setIsSaving(false)

    if (result.success) {
      setMessage({ type: 'success', text: t('messages.addSuccess') })
      setIsAdding(false)
      resetForm()
      loadLimitations()
    } else {
      setMessage({ type: 'error', text: result.error || t('messages.addError') })
    }
  }

  const handleResolveLimitation = async (id: string, description: string) => {
    const result = await resolveLimitationAction(id)

    if (result.success) {
      setMessage({ type: 'success', text: t('messages.resolveSuccess') })
      loadLimitations()
    } else {
      setMessage({ type: 'error', text: result.error || t('messages.resolveError') })
    }
  }

  const handleReportIssueClick = () => {
    // If disclaimer not accepted yet, show modal first
    if (!disclaimerAccepted) {
      setShowMedicalDisclaimer(true)
    } else {
      setIsAdding(true)
    }
  }

  const handleMedicalDisclaimerAccept = () => {
    // Save acceptance to localStorage
    localStorage.setItem(MEDICAL_DISCLAIMER_KEY, 'true')
    setDisclaimerAccepted(true)
    setShowMedicalDisclaimer(false)
    // Now show the form
    setIsAdding(true)
  }

  const handleMedicalDisclaimerCancel = () => {
    setShowMedicalDisclaimer(false)
  }

  const SeverityBadge = ({ severity }: { severity: string }) => {
    const userSeverity = mapDatabaseSeverityToUser(severity)
    const SEVERITY_INFO = getSeverityInfo(t)
    const info = SEVERITY_INFO[userSeverity]

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full
        ${info.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : ''}
        ${info.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' : ''}
        ${info.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : ''}
      `}>
        <span>{info.icon}</span>
        <span>{userSeverity.toUpperCase()}</span>
      </span>
    )
  }

  const proactiveCount = limitations.length
  const canAddMore = proactiveCount < MAX_LIMITATIONS

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {t('title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {t('activeLimitations', { count: proactiveCount, max: MAX_LIMITATIONS })}
            </span>
            {!canAddMore && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                {t('maxReached')}
              </span>
            )}
          </div>
        </div>
        {!isAdding && canAddMore && (
          <Button onClick={handleReportIssueClick} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('reportIssue')}
          </Button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          {t('loadingMessage')}
        </div>
      )}

      {/* Active Limitations List */}
      {!isLoading && limitations.length > 0 && !isAdding && (
        <div className="space-y-3 mb-4">
          {limitations.map(limitation => {
            const affectedMuscles = limitation.metadata?.affectedMuscles || []
            return (
              <div key={limitation.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <SeverityBadge severity={limitation.severity} />
                      {limitation.exercise_name && (
                        <span className="text-xs text-muted-foreground">
                          {t('limitationCard.onExercise', { exerciseName: limitation.exercise_name })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2 break-words">{limitation.user_note}</p>
                    {affectedMuscles && affectedMuscles.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {affectedMuscles.map(muscle => (
                          <span
                            key={muscle}
                            className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResolveLimitation(limitation.id, limitation.user_note)}
                    className="shrink-0"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t('limitationCard.resolvedButton')}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && limitations.length === 0 && !isAdding && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <div className="text-4xl mb-2">{t('emptyState.emoji')}</div>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {t('emptyState.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('emptyState.description')}
          </p>
        </div>
      )}

      {/* Add New Limitation Form */}
      {isAdding && (
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-950 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('form.infoMessage')}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('form.descriptionLabel')} <span className="text-red-500">{t('form.descriptionRequired')}</span>
            </label>
            <textarea
              value={newLimitation.description}
              onChange={(e) => setNewLimitation({ ...newLimitation, description: e.target.value })}
              placeholder={t('form.descriptionPlaceholder')}
              className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('form.charactersCount', { count: newLimitation.description.length })}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('form.severityLabel')} <span className="text-red-500">{t('form.severityRequired')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(getSeverityInfo(t)) as UserSeverity[]).map(sev => {
                const SEVERITY_INFO = getSeverityInfo(t)
                const info = SEVERITY_INFO[sev]
                const isSelected = newLimitation.severity === sev
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewLimitation({ ...newLimitation, severity: sev })}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? `border-${info.color}-500 bg-${info.color}-50 dark:bg-${info.color}-950`
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-1">{info.icon}</div>
                    <div>{sev}</div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getSeverityInfo(t)[newLimitation.severity].description}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('form.specificExerciseLabel')}
            </label>
            <input
              type="text"
              value={newLimitation.exerciseName}
              onChange={(e) => setNewLimitation({ ...newLimitation, exerciseName: e.target.value })}
              placeholder={t('form.specificExercisePlaceholder')}
              className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('form.affectedMusclesLabel')}
            </label>
            <MuscleDropdown
              selected={newLimitation.affectedMuscles}
              onChange={(muscles) => setNewLimitation({ ...newLimitation, affectedMuscles: muscles })}
              maxSelections={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAddLimitation}
              disabled={!newLimitation.description.trim() || isSaving}
            >
              {isSaving ? (
                <>{t('form.saving')}</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('form.addButton')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                resetForm()
              }}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              {t('form.cancelButton')}
            </Button>
          </div>
        </div>
      )}

      {/* Medical Disclaimer Modal */}
      <MedicalDisclaimerModal
        open={showMedicalDisclaimer}
        onAccept={handleMedicalDisclaimerAccept}
        onCancel={handleMedicalDisclaimerCancel}
        context="injury_tracking"
        title="Medical Disclaimer - Injury Tracking"
      />
    </Card>
  )
}
