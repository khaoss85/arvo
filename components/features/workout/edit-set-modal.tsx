'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Trash2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {t('editSet.title', { setNumber: setIndex + 1 })}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="p-4">
                {showDeleteConfirm ? (
                  <div className="space-y-6 py-4 animate-in fade-in zoom-in-95">
                    <div className="bg-red-900/20 border border-red-800/30 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trash2 className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-red-200 font-medium">
                        {t('editSet.deleteConfirmMessage')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 text-white"
                        disabled={isLoading}
                      >
                        {tCommon('actions.cancel')}
                      </Button>
                      <Button
                        onClick={handleDelete}
                        className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                        disabled={isLoading}
                      >
                        {isLoading ? tCommon('actions.deleting') : tCommon('actions.confirmDelete')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Main Inputs Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Weight Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                          {t('setLogger.weightLabel')}
                        </label>
                        <div className="relative flex items-center justify-center bg-gray-800/50 rounded-2xl border border-gray-700 p-1">
                          <Button
                            onClick={() => setWeight(Math.max(0, weight - 2.5))}
                            variant="ghost"
                            className="h-12 w-12 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                          >
                            <span className="text-xl font-medium">-</span>
                          </Button>
                          <Input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 text-center text-2xl font-bold h-12 bg-transparent border-none focus-visible:ring-0 p-0 text-white"
                            step="0.5"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={() => setWeight(weight + 2.5)}
                            variant="ghost"
                            className="h-12 w-12 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                          >
                            <span className="text-xl font-medium">+</span>
                          </Button>
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                          {t('setLogger.repsLabel')}
                        </label>
                        <div className="relative flex items-center justify-center bg-gray-800/50 rounded-2xl border border-gray-700 p-1">
                          <Button
                            onClick={() => setReps(Math.max(1, reps - 1))}
                            variant="ghost"
                            className="h-12 w-12 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                          >
                            <span className="text-xl font-medium">-</span>
                          </Button>
                          <Input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 text-center text-2xl font-bold h-12 bg-transparent border-none focus-visible:ring-0 p-0 text-white"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={() => setReps(reps + 1)}
                            variant="ghost"
                            className="h-12 w-12 rounded-xl hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                          >
                            <span className="text-xl font-medium">+</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* RIR Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                        {t('setLogger.rirLabel')}
                      </label>
                      <div className="grid grid-cols-6 gap-1 bg-gray-800/50 p-1 rounded-2xl border border-gray-700">
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => setRir(value)}
                            className={cn(
                              "h-10 rounded-xl font-bold text-sm transition-all duration-200",
                              rir === value
                                ? "bg-gray-700 text-blue-400 shadow-sm scale-105 ring-1 ring-white/10"
                                : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                            )}
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
                        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-purple-400 transition-colors py-2"
                        disabled={isLoading}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        {showMentalSelector ? t('setLogger.hideMentalState') : t('setLogger.mentalDrainedOptional')}
                      </button>

                      {showMentalSelector && (
                        <div className="mt-2 bg-gray-800/50 rounded-2xl p-2 border border-gray-700 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((value) => {
                              const readiness = getMentalReadinessEmoji(value)
                              const isSelected = mentalReadiness === value

                              return (
                                <button
                                  key={value}
                                  onClick={() => setMentalReadiness(isSelected ? undefined : value)}
                                  className={cn(
                                    "relative h-12 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 group",
                                    isSelected
                                      ? "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 scale-105 z-10"
                                      : "hover:bg-gray-700 hover:shadow-sm"
                                  )}
                                  title={readiness.label}
                                  disabled={isLoading}
                                >
                                  <span className={cn(
                                    "text-xl transition-transform duration-300",
                                    isSelected ? "scale-110" : "grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-110"
                                  )}>
                                    {readiness.emoji}
                                  </span>
                                </button>
                              )
                            })}
                          </div>

                          {/* Label Display */}
                          <div className="h-5 mt-1 flex items-center justify-center">
                            {mentalReadiness ? (
                              <span className="text-xs font-bold text-purple-400 animate-in fade-in">
                                {getMentalReadinessEmoji(mentalReadiness).label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                {t('setLogger.selectMentalState')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes Input */}
                    <div className="relative">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('editSet.notesPlaceholder')}
                        className="bg-gray-800/50 border-gray-700 text-white min-h-[80px] rounded-2xl resize-none focus:ring-blue-500/20"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{tCommon('actions.saving')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            <span>{t('editSet.saveButton')}</span>
                          </div>
                        )}
                      </Button>

                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isLoading}
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          <span>{t('editSet.deleteButton')}</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
