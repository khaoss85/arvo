'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWorkoutExecutionStore, type ExerciseExecution } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { ExerciseSubstitution } from './exercise-substitution'

interface QuickAdjustmentsProps {
  currentExercise: ExerciseExecution
  exerciseIndex: number
  userId: string
  onClose: () => void
}

export function QuickAdjustments({
  currentExercise,
  exerciseIndex,
  userId,
  onClose
}: QuickAdjustmentsProps) {
  const t = useTranslations('workout.components.quickAdjustments')
  const { substituteExercise } = useWorkoutExecutionStore()
  const [showSubstitution, setShowSubstitution] = useState(false)

  const handleTooHeavy = () => {
    // Reduce weight by 10%
    const newWeight = Math.round(currentExercise.targetWeight * 0.9 * 2) / 2 // Round to nearest 0.5kg

    const adjusted: ExerciseExecution = {
      ...currentExercise,
      targetWeight: newWeight,
      currentAISuggestion: null
    }

    substituteExercise(exerciseIndex, adjusted)
    onClose()
  }

  const handleTooLight = () => {
    // Increase weight by 10%
    const newWeight = Math.round(currentExercise.targetWeight * 1.1 * 2) / 2 // Round to nearest 0.5kg

    const adjusted: ExerciseExecution = {
      ...currentExercise,
      targetWeight: newWeight,
      currentAISuggestion: null
    }

    substituteExercise(exerciseIndex, adjusted)
    onClose()
  }

  const handleShorterRest = () => {
    // This would typically adjust rest periods
    // For now, just close the modal as rest is auto-regulated
    alert(t('restPeriods.alertMessage'))
    onClose()
  }

  const handleEquipmentBusy = () => {
    setShowSubstitution(true)
  }

  if (showSubstitution) {
    return (
      <ExerciseSubstitution
        currentExercise={currentExercise}
        exerciseIndex={exerciseIndex}
        userId={userId}
        onClose={() => {
          setShowSubstitution(false)
          onClose()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-gray-900 rounded-t-2xl sm:rounded-lg w-full sm:max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{t('title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {/* Equipment Busy */}
            <button
              onClick={handleEquipmentBusy}
              className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors border border-gray-700 hover:border-blue-600 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:bg-blue-900">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{t('equipmentBusy.title')}</h3>
                  <p className="text-sm text-gray-400">{t('equipmentBusy.description')}</p>
                </div>
              </div>
            </button>

            {/* Too Heavy */}
            <button
              onClick={handleTooHeavy}
              className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors border border-gray-700 hover:border-red-600 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center group-hover:bg-red-900">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{t('weightTooHeavy.title')}</h3>
                  <p className="text-sm text-gray-400">{t('weightTooHeavy.description')}</p>
                </div>
              </div>
            </button>

            {/* Too Light */}
            <button
              onClick={handleTooLight}
              className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors border border-gray-700 hover:border-green-600 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center group-hover:bg-green-900">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{t('weightTooLight.title')}</h3>
                  <p className="text-sm text-gray-400">{t('weightTooLight.description')}</p>
                </div>
              </div>
            </button>

            {/* Shorter Rest */}
            <button
              onClick={handleShorterRest}
              className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg p-4 transition-colors border border-gray-700 hover:border-purple-600 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center group-hover:bg-purple-900">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-1">{t('restPeriods.title')}</h3>
                  <p className="text-sm text-gray-400">{t('restPeriods.description')}</p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-700 text-gray-300"
            >
              {t('cancelButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
