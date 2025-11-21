'use client'

import { Activity, Calendar, Timer, Dumbbell, TrendingUp, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { MuscleRadarChart } from '../analytics/muscle-radar-chart'
import type { CycleShareData, SharePrivacySettings } from '@/lib/types/share.types'

interface PublicCycleViewProps {
  data: CycleShareData
  privacySettings: SharePrivacySettings
  viewCount: number
  createdAt: string
  locale?: string
}

/**
 * Public Cycle Completion View (Strava-style)
 * Shows cycle stats in a beautiful, shareable format
 */
export function PublicCycleView({
  data,
  privacySettings,
  viewCount,
  createdAt,
  locale = 'en'
}: PublicCycleViewProps) {
  const dateLocale = locale === 'it' ? it : enUS
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: dateLocale
  })

  const displayName = privacySettings.showName && data.userName
    ? data.userName
    : (locale === 'it' ? 'Qualcuno' : 'Someone')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* User Info & Time */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {privacySettings.showPhoto && data.userPhoto ? (
                <img
                  src={data.userPhoto}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {displayName} {locale === 'it' ? 'ha completato' : 'completed'}{' '}
                  <span className="text-blue-600 dark:text-blue-400">Cycle #{data.cycleNumber}</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{timeAgo}</p>
              </div>
            </div>

            {/* View Count */}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{viewCount} {locale === 'it' ? 'visualizzazioni' : 'views'}</span>
            </div>
          </div>

          {/* Key Stats Grid */}
          {privacySettings.showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Volume */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">
                    {locale === 'it' ? 'Volume' : 'Volume'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-US').format(data.totalVolume)}
                  <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">kg</span>
                </div>
              </div>

              {/* Total Workouts */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">
                    {locale === 'it' ? 'Allenamenti' : 'Workouts'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.totalWorkouts}
                </div>
              </div>

              {/* Total Time */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase">
                    {locale === 'it' ? 'Tempo' : 'Time'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(data.totalDurationSeconds / 3600)}h{' '}
                  {Math.floor((data.totalDurationSeconds % 3600) / 60)}m
                </div>
              </div>

              {/* Total Sets */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase">
                    {locale === 'it' ? 'Serie' : 'Sets'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.totalSets}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      {privacySettings.showCharts && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Muscle Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {locale === 'it' ? 'Distribuzione Gruppi Muscolari' : 'Muscle Group Distribution'}
            </h2>
            <MuscleRadarChart
              targetData={data.targetVolumeDistribution || {}}
              actualData={data.volumeByMuscleGroup}
              comparisonMode="target"
              loading={false}
              maxMuscles={8}
            />
          </div>

          {/* Split Type Info */}
          {data.splitType && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">
                  {locale === 'it' ? 'Programma' : 'Program'}:
                </span>{' '}
                {data.splitType}
              </p>
            </div>
          )}

          {/* Notes */}
          {privacySettings.showNotes && data.notes && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {locale === 'it' ? 'Note' : 'Notes'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center shadow-xl">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {locale === 'it'
              ? `Monitora i tuoi progressi come ${displayName}`
              : `Track your progress like ${displayName}`}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {locale === 'it'
              ? 'Registra ogni allenamento, visualizza i tuoi progressi e raggiungi i tuoi obiettivi fitness.'
              : 'Log every workout, visualize your progress, and achieve your fitness goals.'}
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg">
            {locale === 'it' ? 'Inizia Gratis' : 'Get Started Free'}
          </button>
          <p className="text-blue-100 text-sm mt-3">
            {locale === 'it' ? 'Disponibile su iOS e Android' : 'Available on iOS & Android'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by <span className="font-semibold">Your App Name</span>
          </p>
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
