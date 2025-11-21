'use client'

import { Activity, Calendar, Timer, Dumbbell, TrendingUp, Share2, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import type { WorkoutShareData, SharePrivacySettings } from '@/lib/types/share.types'

interface PublicWorkoutViewProps {
  data: WorkoutShareData
  privacySettings: SharePrivacySettings
  viewCount: number
  createdAt: string
  locale?: string
}

/**
 * Public Workout View (Strava-style)
 * Shows workout stats in a beautiful, shareable format
 */
export function PublicWorkoutView({
  data,
  privacySettings,
  viewCount,
  createdAt,
  locale = 'en'
}: PublicWorkoutViewProps) {
  const dateLocale = locale === 'it' ? it : enUS
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: dateLocale
  })

  const workoutDate = new Date(data.workoutDate).toLocaleDateString(
    locale === 'it' ? 'it-IT' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  )

  const displayName = privacySettings.showName && data.userName
    ? data.userName
    : (locale === 'it' ? 'Qualcuno' : 'Someone')

  // Format duration
  const hours = Math.floor(data.durationSeconds / 3600)
  const minutes = Math.floor((data.durationSeconds % 3600) / 60)
  const durationDisplay = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m`

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
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {displayName} {locale === 'it' ? 'ha completato' : 'completed'}{' '}
                  <span className="text-blue-600 dark:text-blue-400">
                    {locale === 'it' ? 'un allenamento' : 'a workout'}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {workoutDate} • {timeAgo}
                </p>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

              {/* Total Sets */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">
                    {locale === 'it' ? 'Serie' : 'Sets'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.totalSets}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase">
                    {locale === 'it' ? 'Durata' : 'Duration'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {durationDisplay}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Split Name */}
        {data.splitName && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">
                {locale === 'it' ? 'Programma' : 'Program'}:
              </span>{' '}
              {data.splitName}
            </p>
          </div>
        )}

        {/* Exercises List */}
        {privacySettings.showExercises && data.exercises && data.exercises.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {locale === 'it' ? 'Esercizi Completati' : 'Completed Exercises'}
            </h2>
            <div className="space-y-3">
              {data.exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {exercise.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exercise.sets} {locale === 'it' ? 'serie' : 'sets'}
                        {exercise.reps && exercise.reps > 0 && (
                          <> • {exercise.reps} {locale === 'it' ? 'rip' : 'reps'}</>
                        )}
                        {exercise.weight && exercise.weight > 0 && (
                          <> • {exercise.weight}kg</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center shadow-xl">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {locale === 'it'
              ? `Registra i tuoi allenamenti come ${displayName}`
              : `Track your workouts like ${displayName}`}
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {locale === 'it'
              ? 'Registra ogni serie, monitora il volume totale e raggiungi i tuoi obiettivi fitness.'
              : 'Log every set, track your total volume, and achieve your fitness goals.'}
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
            Powered by <span className="font-semibold">Arvo</span>
          </p>
          <div className="flex items-center gap-2 text-gray-400">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
