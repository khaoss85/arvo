'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [isAdding, setIsAdding] = useState(false)

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
          alert(result.message || 'Cannot add more exercises')
        } else {
          alert('Failed to add exercise. Please try again.')
        }
        return
      }

      // Success - modal will handle exercise selection
    } catch (error) {
      console.error('Failed to add exercise:', error)
      alert('Failed to add exercise. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const isLoading = isAdding

  if (variant === 'full') {
    return (
      <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">
            Want to add another exercise?
          </p>
          <Button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isAdding ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Opening...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Extra Exercise
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Current: {currentExerciseCount} {currentExerciseCount === 1 ? 'exercise' : 'exercises'}
          </p>
        </div>
      </div>
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
          Opening...
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          Add Exercise {position === 'after' ? 'After This' : 'at End'}
        </>
      )}
    </button>
  )
}
