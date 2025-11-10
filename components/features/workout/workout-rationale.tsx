'use client'

import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
import { generateWorkoutRationaleAction } from '@/app/actions/ai-actions'
import type { WorkoutRationaleInput, WorkoutRationaleOutput } from '@/lib/agents/workout-rationale.agent'

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
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/70 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="workout-rationale-content"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">
            Why these exercises?
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id="workout-rationale-content"
          className="px-4 py-3 border-t border-gray-700 bg-gray-800/30"
        >
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
              <span className="text-sm text-gray-400">Generating explanation...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="py-2">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={loadRationale}
                className="text-sm text-purple-400 hover:text-purple-300 underline mt-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Rationale Content */}
          {rationale && !loading && (
            <div className="space-y-2">
              {/* Overall Focus */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Workout Focus
                </h4>
                <p className="text-xs text-gray-300 leading-snug">
                  {rationale.overallFocus}
                </p>
              </div>

              {/* Exercise Sequencing */}
              {rationale.exerciseSequencing && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Workout Flow
                  </h4>
                  <p className="text-xs text-gray-300 leading-snug">
                    {rationale.exerciseSequencing}
                  </p>
                </div>
              )}

              {/* Exercise Connections */}
              {rationale.exerciseConnections && rationale.exerciseConnections.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Exercise Flow
                  </h4>
                  <div className="space-y-1.5">
                    {rationale.exerciseConnections.map((conn, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-xs font-semibold text-purple-400 flex-shrink-0 mt-0.5">
                          {conn.fromExerciseIndex + 1} → {conn.toExerciseIndex + 1}
                        </span>
                        <p className="text-xs text-gray-400 leading-snug">
                          {conn.connectionRationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Rationales */}
              {rationale.exerciseRationales.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Exercise Breakdown
                  </h4>
                  <ol className="space-y-1.5">
                    {rationale.exerciseRationales.map((exerciseRationale, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-xs font-semibold text-purple-400 flex-shrink-0 mt-0.5">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-300">
                            {exerciseRationale.exerciseName}
                          </p>
                          <p className="text-xs text-gray-400 leading-snug mt-0.5">
                            {exerciseRationale.rationale}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
