'use client'

import { useEffect } from 'react'
import { LogOut, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExitWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ExitWorkoutModal({ isOpen, onClose, onConfirm }: ExitWorkoutModalProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        onClose() // Continue workout (close modal)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border border-gray-800 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <LogOut className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              End Workout Session?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-400 leading-relaxed">
            Your progress has been saved. You can resume this workout anytime from your dashboard.
          </p>

          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-950/20 border border-green-900/30 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>All sets saved automatically</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-6 flex gap-3">
          <Button
            onClick={onConfirm}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Exit to Dashboard
          </Button>
          <Button
            onClick={onClose}
            autoFocus
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue Workout
          </Button>
        </div>
      </div>
    </div>
  )
}
