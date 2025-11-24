'use client'

import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, Sparkles, Loader2, Target, ArrowRight, List } from 'lucide-react'
import { generateWorkoutRationaleAction } from '@/app/actions/ai-actions'
import type { WorkoutRationaleInput, WorkoutRationaleOutput } from '@/lib/agents/workout-rationale.agent'
import { cn } from '@/lib/utils/cn'

interface WorkoutRationaleProps {
  workoutType: string
  exercises: Array<{
    exerciseName: string
    targetSets: number
    targetReps: [number, number]
    targetWeight?: number
  }>
  userId: string
}

export interface WorkoutRationaleHandle {
  invalidate: () => void
}

export const WorkoutRationale = forwardRef<WorkoutRationaleHandle, WorkoutRationaleProps>(
  function WorkoutRationale({ workoutType, exercises, userId }, ref) {
    const t = useTranslations('workout.components.workoutRationale')
    const [isExpanded, setIsExpanded] = useState(false)
    const [rationale, setRationale] = useState<WorkoutRationaleOutput | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Track exercise fingerprint to detect changes
    const exerciseFingerprint = useMemo(() =>
      exercises.map(ex => ex.exerciseName).join('|'),
      [exercises]
    )

    // Store the fingerprint when rationale was generated
    const rationaleFingerprint = useRef<string | null>(null)

    // Expose invalidate method to parent
    useImperativeHandle(ref, () => ({
      invalidate: () => {
        setRationale(null)
        setIsExpanded(false)
        setError(null)
        rationaleFingerprint.current = null
      }
    }))

    // Auto-invalidate when exercises change
    useEffect(() => {
      if (rationaleFingerprint.current && rationaleFingerprint.current !== exerciseFingerprint) {
        // Exercises changed - invalidate rationale
        setRationale(null)
        setIsExpanded(false)
        setError(null)
        rationaleFingerprint.current = null
      }
    }, [exerciseFingerprint])

    // Load rationale when user expands (lazy loading)
    useEffect(() => {
      if (isExpanded && !rationale && !loading && !error) {
        loadRationale()
      }
    }, [isExpanded])

    const loadRationale = async () => {
      try {
        setLoading(true)
        setError(null)

        const input: WorkoutRationaleInput = {
          workoutType,
          exercises: exercises.map(ex => ({
            name: ex.exerciseName,
            sets: ex.targetSets,
            repRange: ex.targetReps,
            targetWeight: ex.targetWeight
          })),
          userId,
          approachId: '', // Server loads from profile
          weakPoints: []
        }

        const result = await generateWorkoutRationaleAction(userId, input)

        if (result.success && result.data) {
          setRationale(result.data)
          // Store fingerprint of exercises for which rationale was generated
          rationaleFingerprint.current = exerciseFingerprint
        } else {
          setError(result.error || 'Failed to load rationale')
        }
      } catch (err) {
        console.error('Failed to load workout rationale:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900/30">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors group"
          aria-expanded={isExpanded}
          aria-controls="workout-rationale-content"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
              {t('title')}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          )}
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div
            id="workout-rationale-content"
            className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800/50 animate-in slide-in-from-top-2 duration-200"
          >
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                  <Loader2 className="relative w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">{t('generatingExplanation')}</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="py-4 text-center">
                <p className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</p>
                <button
                  onClick={loadRationale}
                  className="text-xs font-medium px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  {t('tryAgain')}
                </button>
              </div>
            )}

            {/* Rationale Content */}
            {rationale && !loading && (
              <div className="space-y-4 mt-2">
                {/* Overall Focus */}
                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-100 dark:border-purple-900/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      {t('workoutFocus')}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {rationale.overallFocus}
                  </p>
                </div>

                {/* Exercise Sequencing */}
                {rationale.exerciseSequencing && (
                  <div className="pl-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('workoutFlow')}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-5 border-l-2 border-blue-100 dark:border-blue-900/30">
                      {rationale.exerciseSequencing}
                    </p>
                  </div>
                )}

                {/* Exercise Connections */}
                {rationale.exerciseConnections && rationale.exerciseConnections.length > 0 && (
                  <div className="pl-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('exerciseFlow')}
                      </h4>
                    </div>
                    <div className="space-y-2 pl-5 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                      {rationale.exerciseConnections.map((conn, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-indigo-200 dark:bg-indigo-800"></span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                            {conn.fromExerciseIndex + 1} → {conn.toExerciseIndex + 1}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {conn.connectionRationale}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise Rationales */}
                {rationale.exerciseRationales.length > 0 && (
                  <div className="pl-1">
                    <div className="flex items-center gap-2 mb-2">
                      <List className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('exerciseBreakdown')}
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {rationale.exerciseRationales.map((exerciseRationale, index) => (
                        <div key={index} className="group flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                              {exerciseRationale.exerciseName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                              {exerciseRationale.rationale}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  })
