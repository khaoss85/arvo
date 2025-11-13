'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  validateCustomEquipmentAction,
  addCustomEquipmentAction,
  removeCustomEquipmentAction
} from '@/app/actions/ai-actions'
import { PlayCircle, Trash2, CheckCircle, AlertCircle, XCircle, Loader2, Plus, X } from 'lucide-react'
import { ExerciseAnimationModal } from '../workout/exercise-animation-modal'
import { AnimationService } from '@/lib/services/animation.service'

interface CustomEquipmentManagerProps {
  userId: string
  initialCustomEquipment: Array<{
    id: string
    name: string
    category: string
    exampleExercises: string[]
    validated: boolean
    addedAt: string
  }>
}

interface ValidationResult {
  validation: 'approved' | 'duplicate' | 'invalid' | 'unclear'
  normalizedName: string
  suggestedCategory: string
  rationale: string
  isDuplicateOfExisting?: string
  similarEquipment?: string[]
  exampleExercises: string[]
  warnings?: string[]
  suggestions?: string[]
}

export function CustomEquipmentManager({
  userId,
  initialCustomEquipment
}: CustomEquipmentManagerProps) {
  const t = useTranslations('settings.customEquipment')
  const [customEquipment, setCustomEquipment] = useState(initialCustomEquipment)
  const [inputValue, setInputValue] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [animationModal, setAnimationModal] = useState<{
    exerciseName: string
    animationUrl: string | null
  } | null>(null)

  const handleValidate = async () => {
    if (!inputValue.trim()) return

    setIsValidating(true)
    setError(null)
    setValidationResult(null)

    try {
      const result = await validateCustomEquipmentAction(userId, inputValue.trim())

      if (result.success && result.result) {
        setValidationResult(result.result as ValidationResult)
      } else {
        setError(result.error || t('errors.validationFailed'))
      }
    } catch (err) {
      setError(t('errors.validationError'))
      console.error(err)
    } finally {
      setIsValidating(false)
    }
  }

  const handleAdd = async () => {
    if (!validationResult || validationResult.validation === 'invalid' || validationResult.validation === 'duplicate') {
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const result = await addCustomEquipmentAction(userId, {
        name: validationResult.normalizedName,
        category: validationResult.suggestedCategory,
        exampleExercises: validationResult.exampleExercises,
        validated: validationResult.validation === 'approved'
      })

      if (result.success && result.equipment) {
        setCustomEquipment([...customEquipment, result.equipment])
        setInputValue('')
        setValidationResult(null)
      } else {
        setError(result.error || t('errors.addFailed'))
      }
    } catch (err) {
      setError(t('errors.addError'))
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (equipmentId: string) => {
    try {
      const result = await removeCustomEquipmentAction(userId, equipmentId)

      if (result.success) {
        setCustomEquipment(customEquipment.filter(eq => eq.id !== equipmentId))
      } else {
        setError(result.error || t('errors.removeFailed'))
      }
    } catch (err) {
      setError(t('errors.removeError'))
      console.error(err)
    }
  }

  const handlePreview = async (exerciseName: string) => {
    const animationUrl = await AnimationService.getAnimationUrl({
      name: exerciseName,
      canonicalPattern: exerciseName,
      equipmentVariant: undefined
    })

    setAnimationModal({
      exerciseName,
      animationUrl: animationUrl || null
    })
  }

  const handleClearValidation = () => {
    setValidationResult(null)
    setError(null)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('inputPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isValidating) {
                  handleValidate()
                }
              }}
              disabled={isValidating || !!validationResult}
              className="flex-1"
            />
            {validationResult ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearValidation}
                title={t('clearButton')}
              >
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleValidate}
                disabled={!inputValue.trim() || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('validating')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('validateButton')}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`border-2 rounded-lg p-4 ${
              validationResult.validation === 'approved'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : validationResult.validation === 'unclear'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                : validationResult.validation === 'duplicate'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-red-500 bg-red-50 dark:bg-red-950/20'
            }`}>
              <div className="flex items-start gap-2 mb-3">
                {validationResult.validation === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : validationResult.validation === 'unclear' ? (
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : validationResult.validation === 'duplicate' ? (
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{validationResult.normalizedName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{validationResult.rationale}</p>
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {validationResult.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-400">
                          ⚠️ {warning}
                        </p>
                      ))}
                    </div>
                  )}
                  {validationResult.exampleExercises.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">{t('exampleExercises')}</p>
                      <div className="flex flex-wrap gap-1">
                        {validationResult.exampleExercises.map((exercise, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePreview(exercise)}
                            className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <PlayCircle className="w-3 h-3" />
                            {exercise}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">{t('suggestions')}</p>
                      <ul className="text-xs space-y-0.5 list-disc list-inside">
                        {validationResult.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {(validationResult.validation === 'approved' || validationResult.validation === 'unclear') && (
                <Button
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="w-full"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('adding')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addButton')}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Custom Equipment List */}
        {customEquipment.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('yourEquipment')}</h4>
            <div className="space-y-2">
              {customEquipment.map((equipment) => (
                <div
                  key={equipment.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{equipment.name}</p>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {t('customBadge')}
                      </span>
                      {!equipment.validated && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                          {t('unverifiedBadge')}
                        </span>
                      )}
                    </div>
                    {equipment.exampleExercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {equipment.exampleExercises.slice(0, 3).map((exercise, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePreview(exercise)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <PlayCircle className="w-3 h-3" />
                            {exercise}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(equipment.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animation Modal */}
      {animationModal && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => setAnimationModal(null)}
          exerciseName={animationModal.exerciseName}
          animationUrl={animationModal.animationUrl}
        />
      )}
    </Card>
  )
}
