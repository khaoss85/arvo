'use client'

import { useState } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  useExerciseProgress,
  usePersonalRecords,
  useVolumeAnalytics,
  useAIInsights
} from '@/lib/hooks/useAnalytics'
import { ProgressChart } from '@/components/features/analytics/progress-chart'
import { VolumeChart } from '@/components/features/analytics/volume-chart'
import { PRCards } from '@/components/features/analytics/pr-cards'
import { AIInsights } from '@/components/features/analytics/ai-insights'
import { ExerciseSelector } from '@/components/features/analytics/exercise-selector'
import { ArrowLeft } from 'lucide-react'

export default function ProgressPage() {
  const { user } = useAuthStore()
  const [selectedExercise, setSelectedExercise] = useState<string>('all')
  const [timeRange, setTimeRange] = useState(30) // days

  if (!user) {
    redirect('/login')
  }

  // Fetch analytics data
  const { data: progressData, isLoading: progressLoading } = useExerciseProgress(
    user.id,
    selectedExercise === 'all' ? '' : selectedExercise,
    timeRange
  )

  const { data: volumeData, isLoading: volumeLoading } = useVolumeAnalytics(
    user.id,
    timeRange
  )

  const { data: prs, isLoading: prsLoading } = usePersonalRecords(user.id)

  const { data: insights, isLoading: insightsLoading } = useAIInsights(
    user.id,
    timeRange
  )

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Progress & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your strength gains and training consistency
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <ExerciseSelector
            value={selectedExercise}
            onChange={setSelectedExercise}
            userId={user.id}
          />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full sm:w-48 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value={7}>Last Week</option>
            <option value={30}>Last Month</option>
            <option value={90}>Last 3 Months</option>
            <option value={365}>Last Year</option>
          </select>
        </div>

        {/* AI Insights (only for 'all' exercises) */}
        {selectedExercise === 'all' && (
          <AIInsights
            insights={insights || {
              summary: '',
              strengths: [],
              improvements: [],
              recommendations: [],
              nextFocus: ''
            }}
            loading={insightsLoading}
            className="mb-8"
          />
        )}

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Progress Chart */}
          {selectedExercise !== 'all' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Strength Progress
              </h2>
              <ProgressChart
                data={progressData || []}
                loading={progressLoading}
              />
            </div>
          )}

          {/* Volume Chart */}
          <div className={`bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${
            selectedExercise === 'all' ? 'lg:col-span-2' : ''
          }`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Training Volume
            </h2>
            <VolumeChart
              data={volumeData || []}
              loading={volumeLoading}
            />
          </div>
        </div>

        {/* Personal Records */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Personal Records
          </h2>
          <PRCards records={prs || []} loading={prsLoading} />
        </div>

        {/* Stats Summary */}
        {prs && prs.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total PRs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {prs.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top e1RM</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(prs[0]?.e1rm || 0)}kg
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(volumeData?.reduce((sum, week) => sum + week.totalVolume, 0) || 0)}kg
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Workouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {volumeData?.reduce((sum, week) => sum + week.workoutCount, 0) || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
