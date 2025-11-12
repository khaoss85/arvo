'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { getRepresentativeExercise } from '@/lib/constants/equipment-exercise-mapping'
import { ExerciseDBService } from '@/lib/services/exercisedb.service'
import { ExerciseAnimation } from '@/components/features/workout/exercise-animation'

interface EquipmentPreviewModalProps {
  equipmentId: string
  equipmentLabel: string
  isOpen: boolean
  onClose: () => void
}

export function EquipmentPreviewModal({
  equipmentId,
  equipmentLabel,
  isOpen,
  onClose,
}: EquipmentPreviewModalProps) {
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const exerciseMapping = getRepresentativeExercise(equipmentId)

  // Fetch exercise GIF from ExerciseDB
  useEffect(() => {
    if (!isOpen || !exerciseMapping) return

    const fetchGif = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await ExerciseDBService.getGifUrl(exerciseMapping.exerciseName)
        if (url) {
          setGifUrl(url)
        } else {
          setError('Animazione non disponibile per questo esercizio')
        }
      } catch (err) {
        console.error('[EquipmentPreviewModal] Error fetching GIF:', err)
        setError('Errore nel caricamento dell\'animazione')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGif()
  }, [isOpen, exerciseMapping])

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

  if (!exerciseMapping) {
    return null
  }

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
                  {equipmentLabel}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Esempio di utilizzo
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
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <span className="text-2xl">🏋️</span>
                    </div>
                    <p className="text-gray-400 mb-2">
                      {error}
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Non siamo riusciti a caricare l'esempio per questa attrezzatura.
                    </p>
                  </div>
                )}

                {gifUrl && !isLoading && !error && (
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <h4 className="text-sm font-medium text-gray-300 mb-1">
                        Esercizio rappresentativo
                      </h4>
                      <p className="text-base text-white font-semibold">
                        {exerciseMapping.exerciseName}
                      </p>
                      {exerciseMapping.description && (
                        <p className="text-sm text-gray-400 mt-2">
                          {exerciseMapping.description}
                        </p>
                      )}
                    </div>

                    <ExerciseAnimation
                      animationUrl={gifUrl}
                      exerciseName={exerciseMapping.exerciseName}
                      className="mx-auto"
                    />

                    <div className="text-center text-xs text-gray-500 pt-2">
                      Questo è un esempio di esercizio che puoi eseguire con questa attrezzatura
                    </div>
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
