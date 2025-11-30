'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TrendingUp, Trophy, Calendar, Dumbbell, Loader2, History, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  getExerciseHistoryAction,
  type ExerciseHistoryData,
  type ExerciseSession,
} from '@/app/actions/exercise-history-actions'

interface ExerciseHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  exerciseName: string
}

export function ExerciseHistoryModal({
  isOpen,
  onClose,
  exerciseName,
}: ExerciseHistoryModalProps) {
  const t = useTranslations('workout.execution.exerciseHistory')
  const locale = useLocale()
  const dateLocale = locale === 'it' ? it : enUS

  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<ExerciseHistoryData | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (isOpen && exerciseName) {
      loadHistory()
    }
  }, [isOpen, exerciseName])

  const loadHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getExerciseHistoryAction(exerciseName, 5)
      if (result.success && result.data) {
        setHistoryData(result.data)
      } else {
        setError(result.error || 'Failed to load history')
      }
    } catch (err) {
      console.error('Failed to load exercise history:', err)
      setError('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: dateLocale })
    } catch {
      return dateString
    }
  }

  // Calculate best set from a session (highest volume)
  const getBestSetFromSession = (session: ExerciseSession) => {
    if (!session.sets.length) return null
    return session.sets.reduce((best, current) => {
      const currentVolume = (current.weight ?? 0) * (current.reps ?? 0)
      const bestVolume = (best.weight ?? 0) * (best.reps ?? 0)
      return currentVolume > bestVolume ? current : best
    })
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
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  {t('title')}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5 truncate">
                  {exerciseName}
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div className="p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-500">{t('loading')}</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <p className="text-sm text-red-500">{error}</p>
                    <Button onClick={loadHistory} variant="outline" size="sm">
                      {t('retry')}
                    </Button>
                  </div>
                ) : !historyData || historyData.sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                      <Dumbbell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400">
                      {t('noHistory')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('noHistoryHint')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Personal Bests */}
                    {(historyData.personalBest.maxWeight || historyData.personalBest.maxVolume) && (
                      <div className="grid grid-cols-2 gap-3">
                        {historyData.personalBest.maxWeight && (
                          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs font-medium text-yellow-300">
                                {t('maxWeight')}
                              </span>
                            </div>
                            <p className="text-xl font-bold text-yellow-100">
                              {historyData.personalBest.maxWeight} kg
                            </p>
                            {historyData.personalBest.maxWeightDate && (
                              <p className="text-[10px] text-yellow-400 mt-1">
                                {formatDate(historyData.personalBest.maxWeightDate)}
                              </p>
                            )}
                          </div>
                        )}
                        {historyData.personalBest.maxVolume && (
                          <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-blue-400" />
                              <span className="text-xs font-medium text-blue-300">
                                {t('maxVolume')}
                              </span>
                            </div>
                            <p className="text-xl font-bold text-blue-100">
                              {historyData.personalBest.maxVolume.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-blue-400 mt-1">
                              kg × reps
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Last Sessions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {t('lastSessions')}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {historyData.totalSessionsCount} {t('totalSessions')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {historyData.sessions.map((session, idx) => {
                          const bestSet = getBestSetFromSession(session)
                          return (
                            <div
                              key={session.workoutId}
                              className={cn(
                                "bg-gray-800/50 rounded-xl p-3 border border-gray-700/50",
                                idx === 0 && "ring-1 ring-blue-800"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400">
                                  {formatDate(session.completedAt)}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    {t('mostRecent')}
                                  </span>
                                )}
                              </div>

                              {/* Sets summary */}
                              <div className="flex flex-wrap gap-2">
                                {session.sets.map((set, setIdx) => (
                                  <div
                                    key={setIdx}
                                    className={cn(
                                      "text-xs px-2 py-1 rounded-lg",
                                      bestSet === set
                                        ? "bg-green-900/30 text-green-300 font-medium"
                                        : "bg-gray-700/50 text-gray-400"
                                    )}
                                  >
                                    <span className="font-semibold">{set.weight ?? '-'}</span>
                                    <span className="text-gray-500">kg</span>
                                    {' × '}
                                    <span className="font-semibold">{set.reps ?? '-'}</span>
                                    {set.rir !== null && (
                                      <span className="text-gray-500 ml-1">
                                        @{set.rir}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    {historyData.lastPerformedAt && (
                      <div className="pt-2 border-t border-gray-800">
                        <p className="text-xs text-gray-500 text-center">
                          {t('lastPerformed')}: {formatDate(historyData.lastPerformedAt)}
                        </p>
                      </div>
                    )}
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
