'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import { useGenerateWorkout } from '@/lib/hooks/useAI'
import { WorkoutService } from '@/lib/services/workout.service'
import { SetLogService } from '@/lib/services/set-log.service'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils/workout-helpers'

interface WorkoutSummaryProps {
  workoutId: string
  userId: string
}

export function WorkoutSummary({ workoutId, userId }: WorkoutSummaryProps) {
  const router = useRouter()
  const { reset, startedAt, exercises } = useWorkoutExecutionStore()
  const { mutate: generateWorkout, isPending } = useGenerateWorkout()
  const [stats, setStats] = useState<{
    duration: number
    totalVolume: number
    totalSets: number
  } | null>(null)

  useEffect(() => {
    loadStats()
  }, [workoutId])

  const loadStats = async () => {
    try {
      const volume = await SetLogService.calculateWorkoutVolume(workoutId)
      const duration = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0
      const totalSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0)

      setStats({ duration, totalVolume: volume, totalSets })

      // Mark workout as completed
      await WorkoutService.markAsCompletedWithStats(workoutId, { totalVolume: volume, duration })
    } catch (error) {
      console.error('Failed to load stats:', error)
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
