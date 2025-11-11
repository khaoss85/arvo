'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddSetButtonProps {
  currentSets: number
  onAddSet: () => Promise<void> | void
  variant?: 'inline' | 'full'
  className?: string
}

export function AddSetButton({
  currentSets,
  onAddSet,
  variant = 'inline',
  className = ''
}: AddSetButtonProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleClick = async () => {
    setIsAdding(true)
    try {
      await onAddSet()
    } catch (error) {
      console.error('Failed to add set:', error)
      alert('Failed to add set. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  if (variant === 'full') {
    return (
      <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">
            Feeling good? Add another set
          </p>
          <Button
            onClick={handleClick}
            disabled={isAdding}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isAdding ? (
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
    )
  }

  // Inline variant (for review page)
  return (
    <button
      onClick={handleClick}
      disabled={isAdding}
      className={`flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isAdding ? (
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
  )
}
