'use client'

import { TrendingUp, TrendingDown, Target, Award, AlertCircle, Sparkles } from 'lucide-react'
import type { CycleTrendAnalysis } from '@/lib/types/cycle-trends.types'

interface AIInsightsProps {
  insights: {
    summary: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    nextFocus: string
    cycleTrends?: CycleTrendAnalysis
    cycleCount?: number
  }
  loading?: boolean
  className?: string
}

export function AIInsights({ insights, loading = false, className = '' }: AIInsightsProps) {
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded w-3/4 mb-4" />
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-full mb-2" />
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-5/6" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-blue-600 text-white rounded-lg flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            AI Training Insights
            <span className="text-xs font-normal text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">
              Powered by GPT-5-mini
            </span>
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {insights.summary}
          </p>
        </div>
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-gray-900 dark:text-white">What's Working</span>
          </div>
          <ul className="space-y-2">
            {insights.strengths.map((strength, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Focus Areas</span>
          </div>
          <ul className="space-y-2">
            {insights.improvements.map((improvement, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Recommendations</span>
        </div>
        <ul className="space-y-2">
          {insights.recommendations.map((rec, i) => (
            <li
              key={i}
              className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
            >
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 flex-shrink-0">
                {i + 1}.
              </span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Multi-Cycle Trends (if available) */}
      {insights.cycleTrends && insights.cycleCount && insights.cycleCount >= 2 && (
        <div className="mb-6 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Multi-Cycle Trends ({insights.cycleCount} cycles)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Volume Progression */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volume</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">
                  {insights.cycleTrends.volumeProgression.trend}
                </span>
                {insights.cycleTrends.volumeProgression.trend === 'increasing' && (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                )}
                {insights.cycleTrends.volumeProgression.trend === 'decreasing' && (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {insights.cycleTrends.volumeProgression.percentChangePerCycle > 0 ? '+' : ''}
                {insights.cycleTrends.volumeProgression.percentChangePerCycle.toFixed(1)}% per cycle
              </div>
            </div>

            {/* Mental Readiness Trend */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mental State</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold capitalize">
                  {insights.cycleTrends.mentalReadinessTrend.trend}
                </span>
                {insights.cycleTrends.mentalReadinessTrend.trend === 'improving' && (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                )}
                {insights.cycleTrends.mentalReadinessTrend.trend === 'declining' && (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Avg: {insights.cycleTrends.mentalReadinessTrend.average?.toFixed(1) || 'N/A'}/5
              </div>
            </div>

            {/* Workout Consistency */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Consistency</div>
              <div className="text-sm font-semibold capitalize">
                {insights.cycleTrends.workoutConsistency.rating}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {insights.cycleTrends.workoutConsistency.averageWorkoutsPerCycle.toFixed(1)} workouts/cycle
              </div>
            </div>

            {/* Top Muscle Trend */}
            {Object.entries(insights.cycleTrends.muscleBalanceTrends)
              .sort(([, a], [, b]) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
              .slice(0, 1)
              .map(([muscle, trend]) => (
                <div key={muscle} className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top Change</div>
                  <div className="text-sm font-semibold capitalize">{muscle}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                    {trend.trend === 'increasing' && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {trend.trend === 'decreasing' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    {trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(0)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Next Focus */}
      <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-gray-900 dark:text-white text-sm block mb-1">
              This Week's Priority
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {insights.nextFocus}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
