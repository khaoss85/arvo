'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface EditSetModalProps {
  isOpen: boolean
  onClose: () => void
  exerciseIndex: number
  setIndex: number
  setData: {
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number
    notes?: string
  }
}

export function EditSetModal({
  isOpen,
  onClose,
  exerciseIndex,
  setIndex,
  setData,
}: EditSetModalProps) {
  const t = useTranslations('workout.execution')
  const tCommon = useTranslations('common')
  const { editSet, deleteSet } = useWorkoutExecutionStore()

  // Mental readiness emoji mapping with translations
  const getMentalReadinessEmoji = (value: number): { emoji: string; label: string } => {
    const emojis: Record<number, string> = {
      1: '😫',
      2: '😕',
      3: '😐',
      4: '🙂',
      5: '🔥',
    }
    const labels: Record<number, string> = {
      1: t('mentalReadiness.drained'),
      2: t('mentalReadiness.struggling'),
      3: t('mentalReadiness.neutral'),
      4: t('mentalReadiness.engaged'),
      5: t('mentalReadiness.lockedIn'),
    }
    return { emoji: emojis[value], label: labels[value] }
  }

  const [weight, setWeight] = useState(setData.weight)
  const [reps, setReps] = useState(setData.reps)
  const [rir, setRir] = useState(setData.rir)
  const [mentalReadiness, setMentalReadiness] = useState<number | undefined>(setData.mentalReadiness)
  const [notes, setNotes] = useState(setData.notes || '')
  const [showMentalSelector, setShowMentalSelector] = useState(!!setData.mentalReadiness)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await editSet(exerciseIndex, setIndex, {
        weight,
        reps,
        rir,
        mentalReadiness,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to edit set:', error)
      alert(tCommon('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteSet(exerciseIndex, setIndex)
      onClose()
    } catch (error) {
      console.error('Failed to delete set:', error)
      alert(tCommon('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('editSet.title', { setNumber: setIndex + 1 })}
          </DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
              <p className="text-red-200 text-center">
                {t('editSet.deleteConfirmMessage')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700"
                disabled={isLoading}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? tCommon('actions.deleting') : tCommon('actions.confirmDelete')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weight Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('setLogger.weightLabel')}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setWeight(Math.max(0, weight - 2.5))}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  -2.5
                </Button>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
                  step="0.5"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => setWeight(weight + 2.5)}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  +2.5
                </Button>
              </div>
            </div>

            {/* Reps Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('setLogger.repsLabel')}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setReps(Math.max(1, reps - 1))}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  -1
                </Button>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => setReps(reps + 1)}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  +1
                </Button>
              </div>
            </div>

            {/* RIR Selector */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('setLogger.rirLabel')}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRir(value)}
                    className={`h-12 rounded font-medium transition-colors ${
                      rir === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    disabled={isLoading}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Mental State Selector */}
            <div>
              <button
                onClick={() => setShowMentalSelector(!showMentalSelector)}
                className="text-sm text-gray-400 hover:text-gray-300 mb-2 transition-colors"
                disabled={isLoading}
              >
                {showMentalSelector ? '▼' : '▶'} {t('setLogger.mentalDrainedOptional')}
              </button>

              {showMentalSelector && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const readiness = getMentalReadinessEmoji(value)
                    return (
                      <button
                        key={value}
                        onClick={() => setMentalReadiness(mentalReadiness === value ? undefined : value)}
                        className={`h-16 rounded font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                          mentalReadiness === value
                            ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                        title={readiness.label}
                        disabled={isLoading}
                      >
                        <span className="text-2xl">{readiness.emoji}</span>
                        <span className="text-xs">{value}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {mentalReadiness && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {t('setLogger.mentalState', { state: getMentalReadinessEmoji(mentalReadiness).label })}
                </p>
              )}
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('editSet.notesLabel')}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('editSet.notesPlaceholder')}
                className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                disabled={isLoading}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                {isLoading ? tCommon('actions.saving') : t('editSet.saveButton')}
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-red-600 text-red-400 hover:bg-red-950 hover:text-red-300"
              >
                {t('editSet.deleteButton')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
