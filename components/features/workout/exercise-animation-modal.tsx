'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ExerciseAnimation } from './exercise-animation'
import { useEffect } from 'react'

interface ExerciseAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  exerciseName: string
  animationUrl: string | null
}

export function ExerciseAnimationModal({
  isOpen,
  onClose,
  exerciseName,
  animationUrl
}: ExerciseAnimationModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {exerciseName}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Visualizzazione esercizio
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div className="p-6">
                {animationUrl ? (
                  <ExerciseAnimation
                    animationUrl={animationUrl}
                    exerciseName={exerciseName}
                    className="mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <span className="text-2xl">🎬</span>
                    </div>
                    <p className="text-gray-400 mb-2">
                      Animazione non ancora disponibile
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Stiamo ancora costruendo la libreria di animazioni. Torna presto!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
