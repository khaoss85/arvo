'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, TrendingUp, Target, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import { useGenerateWorkout } from '@/lib/hooks/useAI'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { UserProfileService } from '@/lib/services/user-profile.service'
import { generateWorkoutSummaryAction } from '@/app/actions/ai-actions'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils/workout-helpers'
import type { WorkoutSummaryOutput } from '@/lib/agents/workout-summary.agent'

interface WorkoutSummaryProps {
  workoutId: string
  userId: string
}

// Mental readiness emoji mapping
const MENTAL_READINESS_EMOJIS: Record<number, { emoji: string; label: string; description: string }> = {
  1: { emoji: '😫', label: 'Drained', description: 'Struggled mentally throughout' },
  2: { emoji: '😕', label: 'Struggling', description: 'Lacked motivation' },
  3: { emoji: '😐', label: 'Neutral', description: 'Average mental state' },
  4: { emoji: '🙂', label: 'Engaged', description: 'Focused and present' },
  5: { emoji: '🔥', label: 'Locked In', description: 'Peak mental flow state' },
}

export function WorkoutSummary({ workoutId, userId }: WorkoutSummaryProps) {
  const router = useRouter()
  const t = useTranslations('workout.summary')
  const { reset, startedAt, exercises, workout, setOverallMentalReadiness, overallMentalReadiness } = useWorkoutExecutionStore()
  const { mutate: generateWorkout, isPending } = useGenerateWorkout()
  const [stats, setStats] = useState<{
    duration: number
    totalVolume: number
    totalSets: number
  } | null>(null)
  const [aiSummary, setAiSummary] = useState<WorkoutSummaryOutput | null>(null)
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)
  const [mentalReadinessSelected, setMentalReadinessSelected] = useState<number | null>(overallMentalReadiness)
  const [workoutNotes, setWorkoutNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)

  // User demographics for personalized feedback
  const [userAge, setUserAge] = useState<number | null>(null)
  const [userGender, setUserGender] = useState<'male' | 'female' | 'other' | null>(null)
  const [userExperienceYears, setUserExperienceYears] = useState<number | null>(null)

  useEffect(() => {
    loadStats()
  }, [workoutId])

  // Fetch user demographics for personalized summary
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await UserProfileService.getByUserId(userId)
        if (profile) {
          setUserAge(profile.age)
          setUserGender(profile.gender)
          setUserExperienceYears(profile.experience_years)
        }
      } catch (error) {
        console.error('Failed to fetch user profile for demographics:', error)
      }
    }

    fetchUserProfile()
  }, [userId])

  const loadStats = async () => {
    try {
      const volume = await SetLogService.calculateWorkoutVolume(workoutId)
      // Handle both Date objects and date strings from localStorage
      const duration = startedAt
        ? Math.floor((Date.now() - (startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime())) / 1000)
        : 0
      const totalSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0)

      setStats({ duration, totalVolume: volume, totalSets })

      // Don't auto-complete - wait for mental readiness selection
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleCompleteSummary = async () => {
    if (!mentalReadinessSelected || !stats) {
      alert('Please select your mental state before completing the workout')
      return
    }

    console.log('[WorkoutSummary] Starting workout completion', {
      workoutId,
      userId,
      mentalReadiness: mentalReadinessSelected,
      stats: {
        totalVolume: stats.totalVolume,
        duration: stats.duration,
        totalSets: stats.totalSets
      },
      exerciseCount: exercises.length,
      timestamp: new Date().toISOString()
    })

    try {
      // Save mental readiness to store
      console.log('[WorkoutSummary] Saving mental readiness to store:', mentalReadinessSelected)
      setOverallMentalReadiness(mentalReadinessSelected)

      // Mark workout as completed with mental readiness
      console.log('[WorkoutSummary] Calling WorkoutService.markAsCompletedWithStats...', {
        workoutId,
        stats: {
          totalVolume: stats.totalVolume,
          duration: stats.duration,
          mentalReadinessOverall: mentalReadinessSelected
        }
      })

      await WorkoutService.markAsCompletedWithStats(workoutId, {
        totalVolume: stats.totalVolume,
        duration: stats.duration,
        mentalReadinessOverall: mentalReadinessSelected
      })

      console.log('[WorkoutSummary] Workout marked as completed successfully')

      // Generate AI summary with mental readiness data
      console.log('[WorkoutSummary] Generating AI summary...')
      generateAISummary(stats.duration, stats.totalVolume, stats.totalSets, mentalReadinessSelected)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined

      console.error('[WorkoutSummary] Failed to complete workout:', {
        error: errorMessage,
        stack: errorStack,
        workoutId,
        userId,
        stats,
        mentalReadinessSelected,
        workoutData: {
          approach_id: workout?.approach_id,
          workout_type: workout?.workout_type,
          exerciseCount: exercises.length
        },
        timestamp: new Date().toISOString()
      })

      // Provide more specific error message
      const specificError = errorMessage.includes('not found')
        ? 'Workout not found in database. Please refresh and try again.'
        : errorMessage.includes('permission') || errorMessage.includes('denied')
        ? 'Database permission error. Please contact support.'
        : errorMessage.includes('split plan') || errorMessage.includes('cycle')
        ? 'Failed to advance training cycle. Please try again.'
        : errorMessage.includes('network') || errorMessage.includes('fetch')
        ? 'Network error. Check your connection and try again.'
        : `Failed to complete workout: ${errorMessage}`

      alert(specificError)
    }
  }

  const generateAISummary = async (duration: number, totalVolume: number, totalSets: number, mentalReadinessOverall: number) => {
    if (!workout || !workout.approach_id) {
      console.warn('[WorkoutSummary] Cannot generate AI summary - missing workout or approach_id', {
        hasWorkout: !!workout,
        approachId: workout?.approach_id
      })
      return
    }

    console.log('[WorkoutSummary] Starting AI summary generation', {
      userId,
      workoutId,
      duration,
      totalVolume,
      totalSets,
      mentalReadinessOverall,
      approachId: workout.approach_id,
      exerciseCount: exercises.length,
      userDemographics: {
        age: userAge,
        gender: userGender,
        experienceYears: userExperienceYears
      }
    })

    setLoadingAiSummary(true)
    try {
      const exerciseData = exercises.map(ex => ({
        name: ex.exerciseName,
        sets: ex.targetSets,
        totalVolume: ex.completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0),
        avgRIR: ex.completedSets.reduce((sum, set) => sum + set.rir, 0) / ex.completedSets.length,
        completedSets: ex.completedSets.length
      }))

      console.log('[WorkoutSummary] Calling generateWorkoutSummaryAction with data:', {
        exerciseDataSample: exerciseData[0],
        exerciseCount: exerciseData.length
      })

      const result = await generateWorkoutSummaryAction(userId, {
        exercises: exerciseData,
        totalDuration: duration,
        totalVolume,
        workoutType: workout.workout_type || 'general',
        approachId: workout.approach_id,
        userAge: userAge,
        userGender: userGender,
        experienceYears: userExperienceYears,
        mentalReadinessOverall: mentalReadinessOverall
      })

      console.log('[WorkoutSummary] AI summary generation result:', {
        success: result.success,
        hasSummary: !!result.summary,
        error: result.error
      })

      if (result.success && result.summary) {
        console.log('[WorkoutSummary] AI summary generated successfully', {
          overallPerformance: result.summary.overallPerformance,
          highlightsCount: result.summary.keyHighlights.length,
          insightsCount: result.summary.immediateInsights.length
        })
        setAiSummary(result.summary)
      } else {
        console.error('[WorkoutSummary] AI summary generation failed:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined

      console.error('[WorkoutSummary] Failed to generate AI summary:', {
        error: errorMessage,
        stack: errorStack,
        userId,
        workoutId,
        approachId: workout.approach_id,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoadingAiSummary(false)
      console.log('[WorkoutSummary] AI summary generation completed (success or failure)')
    }
  }

  const handleSaveNotes = async () => {
    if (!workoutNotes.trim()) {
      return // Nothing to save
    }

    setSavingNotes(true)
    try {
      // Save notes to workout
      await WorkoutService.updateWorkoutNotes(workoutId, workoutNotes)

      // Trigger insight parsing (background job)
      // This will be handled by a server action
      const response = await fetch('/api/insights/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workoutId,
          notes: workoutNotes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to parse insights')
      }

      console.log('[WorkoutSummary] Notes saved and insights parsed successfully')
    } catch (error) {
      console.error('[WorkoutSummary] Failed to save notes:', error)
      alert('Failed to save notes. Please try again.')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleGenerateNext = async () => {
    // Save notes before generating next workout
    if (workoutNotes.trim()) {
      await handleSaveNotes()
    }

    generateWorkout(userId, {
      onSuccess: () => {
        reset()
        router.push('/dashboard')
      }
    })
  }

  const handleFinish = async () => {
    // Save notes before finishing
    if (workoutNotes.trim()) {
      await handleSaveNotes()
    }

    reset()
    router.push('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
        {/* Success Icon */}
        <div className="mb-6 text-green-400">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{t('workoutComplete')}</h1>
        <p className="text-gray-400 mb-8">{t('greatWork')}</p>

        {/* Mental Readiness Selector - Required before completion */}
        {!aiSummary && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-3 text-center">{t('mentalReadinessTitle')}</h3>
            <p className="text-sm text-gray-400 mb-4 text-center">{t('mentalReadinessDescription')}</p>

            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setMentalReadinessSelected(value)}
                  className={`h-24 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                    mentalReadinessSelected === value
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-102'
                  }`}
                  title={MENTAL_READINESS_EMOJIS[value].description}
                >
                  <span className="text-3xl">{MENTAL_READINESS_EMOJIS[value].emoji}</span>
                  <span className="text-xs font-semibold">{MENTAL_READINESS_EMOJIS[value].label}</span>
                  <span className="text-xs opacity-75">{value}</span>
                </button>
              ))}
            </div>

            {mentalReadinessSelected && (
              <p className="text-sm text-purple-300 mt-3 text-center">
                {MENTAL_READINESS_EMOJIS[mentalReadinessSelected].description}
              </p>
            )}

            <Button
              onClick={handleCompleteSummary}
              disabled={!mentalReadinessSelected || !stats}
              className="w-full h-12 mt-6 bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mentalReadinessSelected ? t('completeWorkoutButton') : t('selectMentalState')}
            </Button>
          </div>
        )}

        {/* Stats */}
        {stats && aiSummary && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.totalSets}</div>
              <div className="text-sm text-gray-400">{t('sets')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(stats.totalVolume)}kg
              </div>
              <div className="text-sm text-gray-400">{t('volume')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">
                {formatDuration(stats.duration)}
              </div>
              <div className="text-sm text-gray-400">{t('duration')}</div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {loadingAiSummary && (
          <div className="mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-sm text-blue-300">{t('generatingAiFeedback')}</p>
          </div>
        )}

        {aiSummary && !loadingAiSummary && (
          <div className="mb-8 text-left space-y-4">
            {/* Performance Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className={`text-lg font-semibold ${
                aiSummary.overallPerformance === 'excellent' ? 'text-green-400' :
                aiSummary.overallPerformance === 'good' ? 'text-blue-400' :
                aiSummary.overallPerformance === 'fair' ? 'text-yellow-400' :
                'text-orange-400'
              }`}>
                {aiSummary.overallPerformance.charAt(0).toUpperCase() + aiSummary.overallPerformance.slice(1)} {t('performance')}
              </span>
            </div>

            {/* Key Highlights */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-green-300">{t('todaysHighlights')}</h3>
              </div>
              <ul className="space-y-1.5 ml-6">
                {aiSummary.keyHighlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm text-green-100">{highlight}</li>
                ))}
              </ul>
            </div>

            {/* Immediate Insights */}
            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-blue-300">{t('quickObservations')}</h3>
              </div>
              <ul className="space-y-1.5 ml-6">
                {aiSummary.immediateInsights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-blue-100">{insight}</li>
                ))}
              </ul>
            </div>

            {/* Recovery Recommendation */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Heart className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-purple-300">{t('recoveryAdvice')}</h3>
              </div>
              <p className="text-sm text-purple-100 ml-6">{aiSummary.recoveryRecommendation}</p>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border border-orange-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-100 italic font-medium">{aiSummary.motivationalMessage}</p>
            </div>
          </div>
        )}

        {/* Exercise Breakdown - Only show after AI summary */}
        {aiSummary && (
          <div className="mb-8 text-left">
            <h3 className="text-lg font-medium text-white mb-4">{t('exercisesCompleted')}</h3>
            <div className="space-y-2">
              {exercises.map((ex, idx) => {
                const hasModifications = ex.userAddedSets && ex.userAddedSets > 0
                return (
                  <div key={idx} className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{ex.exerciseName}</span>
                      <span className="text-sm text-gray-400">{t('setsCount', { count: ex.completedSets.length })}</span>
                    </div>

                    {/* User Modification Metadata */}
                    {hasModifications && ex.aiRecommendedSets && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {t('aiRecommended', { count: ex.aiRecommendedSets })}
                          </span>
                          <span className="text-blue-400 font-medium">
                            {t('youAdded', { count: ex.userAddedSets || 0 })}
                          </span>
                        </div>
                        {ex.userModifications?.aiWarnings && ex.userModifications.aiWarnings.length > 0 && (
                          <p className="text-xs text-yellow-400 mt-1 italic">
                            ⚠️ {ex.userModifications.aiWarnings[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Workout Notes - Only show after AI summary */}
        {aiSummary && (
          <div className="mb-8 text-left">
            <h3 className="text-lg font-medium text-white mb-2">{t('notesTitle')}</h3>
            <p className="text-sm text-gray-400 mb-3">
              {t('notesDescription')}
            </p>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{t('charactersCount', { count: workoutNotes.length })}</span>
              {workoutNotes.trim() && (
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50"
                >
                  {savingNotes ? t('savingNotes') : t('saveNotes')}
                </button>
              )}
            </div>
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              AI will analyze your notes. For persistent pain, consult a medical professional.
            </p>
          </div>
        )}

        {/* Actions - Only show after AI summary */}
        {aiSummary && (
          <div className="space-y-3">
            <Button
              onClick={handleGenerateNext}
              disabled={isPending}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? t('generating') : t('generateNextWorkout')}
            </Button>
            <Button
              onClick={handleFinish}
              variant="outline"
              className="w-full h-12 border-gray-700 text-gray-300"
            >
              {t('backToDashboard')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
