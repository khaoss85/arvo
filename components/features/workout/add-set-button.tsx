'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModificationWarningModal } from './modification-warning-modal'
import type { ModificationValidationOutput } from '@/lib/agents/workout-modification-validator.agent'

interface AddSetButtonProps {
  currentSets: number
  onAddSet: () => Promise<{ success: boolean; error?: string; message?: string; warning?: string }> | { success: boolean; error?: string; message?: string; warning?: string }
  variant?: 'inline' | 'full'
  className?: string
  userAddedSets?: number
  // AI Validation (Phase 2)
  enableAIValidation?: boolean
  onRequestValidation?: () => Promise<ModificationValidationOutput | null>
  exerciseName?: string
}

export function AddSetButton({
  currentSets,
  onAddSet,
  variant = 'inline',
  className = '',
  userAddedSets = 0,
  enableAIValidation = false,
  onRequestValidation,
  exerciseName = 'Exercise',
}: AddSetButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ModificationValidationOutput | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleClick = async () => {
    // Phase 2: AI Validation Flow
    if (enableAIValidation && onRequestValidation) {
      setIsValidating(true)
      try {
        const validation = await onRequestValidation()

        if (!validation) {
          // Validation failed, fallback to Phase 1 behavior
          console.warn('AI validation failed, proceeding with Phase 1 flow')
          await executeAddSet()
          return
        }

        setValidationResult(validation)

        // Auto-proceed if approved
        if (validation.validation === 'approved') {
          console.log('[AddSetButton] Validation approved, auto-proceeding')
          await executeAddSet()
          return
        }

        // Show modal for caution/not_recommended
        setShowModal(true)
      } catch (error) {
        console.error('AI validation error:', error)
        // Fallback to Phase 1 behavior
        await executeAddSet()
      } finally {
        setIsValidating(false)
      }
      return
    }

    // Phase 1: Direct add (no AI validation)
    await executeAddSet()
  }

  const executeAddSet = async () => {
    setIsAdding(true)
    try {
      const result = await onAddSet()

      // Handle validation errors
      if (result && !result.success) {
        if (result.error === 'hard_limit') {
          alert(result.message || 'Cannot add more sets')
        } else {
          alert('Failed to add set. Please try again.')
        }
        return
      }

      // Show warning toast (soft warning at 3+ sets)
      if (result?.warning) {
        // Log warning for now - can be replaced with toast notification
        console.warn('SET_ADDITION_WARNING:', result.warning)
      }
    } catch (error) {
      console.error('Failed to add set:', error)
      alert('Failed to add set. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleModalProceed = async () => {
    setShowModal(false)
    await executeAddSet()
  }

  const handleModalClose = () => {
    setShowModal(false)
    setValidationResult(null)
  }

  const isLoading = isAdding || isValidating

  if (variant === 'full') {
    return (
      <>
        <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">
              Feeling good? Add another set
            </p>
            <Button
              onClick={handleClick}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isValidating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : isAdding ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Set...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Extra Set
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Current: {currentSets} {currentSets === 1 ? 'set' : 'sets'}
            </p>
          </div>
        </div>

        {/* Validation Modal */}
        {validationResult && (
          <ModificationWarningModal
            isOpen={showModal}
            onClose={handleModalClose}
            onProceed={handleModalProceed}
            validation={validationResult}
            exerciseName={exerciseName}
            addedSets={(userAddedSets || 0) + 1}
          />
        )}
      </>
    )
  }

  // Inline variant (for review page)
  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isValidating ? (
          <>
            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
            Validating...
          </>
        ) : isAdding ? (
          <>
            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
            Adding...
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" />
            Add Set
          </>
        )}
      </button>

      {/* Validation Modal */}
      {validationResult && (
        <ModificationWarningModal
          isOpen={showModal}
          onClose={handleModalClose}
          onProceed={handleModalProceed}
          validation={validationResult}
          exerciseName={exerciseName}
          addedSets={(userAddedSets || 0) + 1}
        />
      )}
    </>
  )
}
