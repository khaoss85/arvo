'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/stores/ui.store'

interface AddExerciseButtonProps {
  position: 'after' | 'end' // Where to add: after current exercise or at end
  onAddExercise: () => Promise<{ success: boolean; error?: string; message?: string }> | { success: boolean; error?: string; message?: string }
  variant?: 'inline' | 'full'
  className?: string
  currentExerciseCount?: number
  // AI Validation (Phase 2 - will be added later)
  enableAIValidation?: boolean
  onRequestValidation?: () => Promise<any | null>
}

export function AddExerciseButton({
  position,
  onAddExercise,
  variant = 'inline',
  className = '',
  currentExerciseCount = 0,
  enableAIValidation = false,
  onRequestValidation,
}: AddExerciseButtonProps) {
  const t = useTranslations('workout.modals.addExercise')
  const [isAdding, setIsAdding] = useState(false)
  const { addToast } = useUIStore()

  const handleClick = async () => {
    // Phase 1: Direct add (no AI validation yet)
    // Phase 2 will add AI validation here
    await executeAddExercise()
  }

  const executeAddExercise = async () => {
    setIsAdding(true)
    try {
      const result = await onAddExercise()

      // Handle errors
      if (result && !result.success) {
        if (result.error === 'hard_limit') {
          addToast(
            result.message || t('errors.hardLimit'),
            'warning'
          )
        } else {
          addToast(t('errors.failed'), 'error')
        }
        return
      }

      // Success - modal will handle exercise selection
    } catch (error) {
      console.error('Failed to add exercise:', error)
      addToast(t('errors.failed'), 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const isLoading = isAdding

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200 ${className}`}
      >
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors mb-3">
          {isAdding ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 dark:border-purple-400"></div>
          ) : (
            <Plus className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
          {isAdding ? t('opening') : t('addButton')}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('currentExercises', { count: currentExerciseCount })}
        </p>
      </button>
    )
  }

  // Inline variant (for review page)
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isAdding ? (
        <>
          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
          {t('opening')}
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          {position === 'after' ? t('addButtonAfter') : t('addButtonEnd')}
        </>
      )}
    </button>
  )
}
