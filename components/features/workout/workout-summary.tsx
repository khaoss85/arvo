'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, TrendingUp, Target, Heart } from 'lucide-react'
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

export function WorkoutSummary({ workoutId, userId }: WorkoutSummaryProps) {
  const router = useRouter()
  const { reset, startedAt, exercises, workout } = useWorkoutExecutionStore()
  const { mutate: generateWorkout, isPending } = useGenerateWorkout()
  const [stats, setStats] = useState<{
    duration: number
    totalVolume: number
    totalSets: number
  } | null>(null)
  const [aiSummary, setAiSummary] = useState<WorkoutSummaryOutput | null>(null)
  const [loadingAiSummary, setLoadingAiSummary] = useState(false)

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
      const duration = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0
      const totalSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0)

      setStats({ duration, totalVolume: volume, totalSets })

      // Mark workout as completed
      await WorkoutService.markAsCompletedWithStats(workoutId, { totalVolume: volume, duration })

      // Generate AI summary
      generateAISummary(duration, volume, totalSets)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const generateAISummary = async (duration: number, totalVolume: number, totalSets: number) => {
    if (!workout || !workout.approach_id) return

    setLoadingAiSummary(true)
    try {
      const result = await generateWorkoutSummaryAction({
        exercises: exercises.map(ex => ({
          name: ex.exerciseName,
          sets: ex.targetSets,
          totalVolume: ex.completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0),
          avgRIR: ex.completedSets.reduce((sum, set) => sum + set.rir, 0) / ex.completedSets.length,
          completedSets: ex.completedSets.length
        })),
        totalDuration: duration,
        totalVolume,
        workoutType: workout.workout_type || 'general',
        approachId: workout.approach_id,
        userAge: userAge,
        userGender: userGender,
        experienceYears: userExperienceYears
      })

      if (result.success && result.summary) {
        setAiSummary(result.summary)
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error)
    } finally {
      setLoadingAiSummary(false)
    }
  }

  const handleGenerateNext = () => {
    generateWorkout(userId, {
      onSuccess: () => {
        reset()
        router.push('/dashboard')
      }
    })
  }

  const handleFinish = () => {
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

        <h1 className="text-3xl font-bold text-white mb-2">Workout Complete!</h1>
        <p className="text-gray-400 mb-8">Great work! Here's your summary:</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.totalSets}</div>
              <div className="text-sm text-gray-400">Sets</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(stats.totalVolume)}kg
              </div>
              <div className="text-sm text-gray-400">Volume</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white mb-1">
                {formatDuration(stats.duration)}
              </div>
              <div className="text-sm text-gray-400">Duration</div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {loadingAiSummary && (
          <div className="mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-sm text-blue-300">Generating AI feedback...</p>
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
                {aiSummary.overallPerformance.charAt(0).toUpperCase() + aiSummary.overallPerformance.slice(1)} Performance
              </span>
            </div>

            {/* Key Highlights */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-green-300">Today's Highlights</h3>
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
                <h3 className="text-sm font-semibold text-blue-300">Quick Observations</h3>
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
                <h3 className="text-sm font-semibold text-purple-300">Recovery Advice</h3>
              </div>
              <p className="text-sm text-purple-100 ml-6">{aiSummary.recoveryRecommendation}</p>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border border-orange-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-orange-100 italic font-medium">{aiSummary.motivationalMessage}</p>
            </div>
          </div>
        )}

        {/* Exercise Breakdown */}
        <div className="mb-8 text-left">
          <h3 className="text-lg font-medium text-white mb-4">Exercises Completed</h3>
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={idx} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                <span className="text-sm text-gray-300">{ex.exerciseName}</span>
                <span className="text-sm text-gray-400">{ex.completedSets.length} sets</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleGenerateNext}
            disabled={isPending}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Generating...' : 'Generate Next Workout'}
          </Button>
          <Button
            onClick={handleFinish}
            variant="outline"
            className="w-full h-12 border-gray-700 text-gray-300"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
