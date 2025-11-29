'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TrendingUp, Trophy, Calendar, Weight, Dumbbell, Loader2, History } from 'lucide-react'
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
  const t = useTranslations('workout.exerciseHistory')
  const locale = useLocale()
  const dateLocale = locale === 'it' ? it : enUS

  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<ExerciseHistoryData | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM', { locale: dateLocale })
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-800 text-gray-900 dark:text-white max-h-[85vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            {t('title')}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {exerciseName}
          </p>
        </DialogHeader>

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
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('noHistory')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('noHistoryHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Personal Bests */}
            {(historyData.personalBest.maxWeight || historyData.personalBest.maxVolume) && (
              <div className="grid grid-cols-2 gap-3">
                {historyData.personalBest.maxWeight && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                        {t('maxWeight')}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                      {historyData.personalBest.maxWeight} kg
                    </p>
                    {historyData.personalBest.maxWeightDate && (
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1">
                        {formatDate(historyData.personalBest.maxWeightDate)}
                      </p>
                    )}
                  </div>
                )}
                {historyData.personalBest.maxVolume && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {t('maxVolume')}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                      {historyData.personalBest.maxVolume.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                      kg × reps
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Last Sessions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                        "bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50",
                        idx === 0 && "ring-1 ring-blue-200 dark:ring-blue-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {formatDate(session.completedAt)}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
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
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium"
                                : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            <span className="font-semibold">{set.weight ?? '-'}</span>
                            <span className="text-gray-400 dark:text-gray-500">kg</span>
                            {' × '}
                            <span className="font-semibold">{set.reps ?? '-'}</span>
                            {set.rir !== null && (
                              <span className="text-gray-400 dark:text-gray-500 ml-1">
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
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {t('lastPerformed')}: {formatDate(historyData.lastPerformedAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
