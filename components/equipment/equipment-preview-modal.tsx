'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getRepresentativeExercises, type ExerciseExample } from '@/lib/constants/equipment-exercise-mapping'
import { ExerciseDBService } from '@/lib/services/exercisedb.service'
import { ExerciseAnimation } from '@/components/features/workout/exercise-animation'

interface EquipmentPreviewModalProps {
  equipmentId: string
  equipmentLabel: string
  isOpen: boolean
  onClose: () => void
}

interface ExerciseWithGif extends ExerciseExample {
  gifUrl: string | null
}

export function EquipmentPreviewModal({
  equipmentId,
  equipmentLabel,
  isOpen,
  onClose,
}: EquipmentPreviewModalProps) {
  const [exercises, setExercises] = useState<ExerciseWithGif[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const exerciseMapping = getRepresentativeExercises(equipmentId)

  // Fetch all exercise GIFs in parallel
  useEffect(() => {
    if (!isOpen || !exerciseMapping) return

    const fetchGifs = async () => {
      setIsLoading(true)
      setError(null)
      setCurrentIndex(0) // Reset to first exercise

      try {
        // Fetch all GIFs in parallel
        const gifPromises = exerciseMapping.exercises.map(async (exercise) => {
          const gifUrl = await ExerciseDBService.getGifUrl(exercise.name)
          return {
            ...exercise,
            gifUrl,
          }
        })

        const exercisesWithGifs = await Promise.all(gifPromises)

        // Check if at least one GIF was found
        const hasAnyGif = exercisesWithGifs.some((ex) => ex.gifUrl !== null)

        if (!hasAnyGif) {
          setError('Nessuna animazione disponibile per questa attrezzatura')
        } else {
          setExercises(exercisesWithGifs)
        }
      } catch (err) {
        console.error('[EquipmentPreviewModal] Error fetching GIFs:', err)
        setError('Errore nel caricamento delle animazioni')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGifs()
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

  // Handle keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!isOpen || exercises.length <= 1) return

      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isOpen, currentIndex, exercises.length])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % exercises.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + exercises.length) % exercises.length)
  }

  if (!exerciseMapping) {
    return null
  }

  const currentExercise = exercises[currentIndex]
  const hasMultipleExercises = exercises.length > 1

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
                  {hasMultipleExercises
                    ? `${exercises.length} esempi di utilizzo`
                    : 'Esempio di utilizzo'}
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
                    <p className="text-gray-400 mb-2">{error}</p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Non siamo riusciti a caricare gli esempi per questa attrezzatura.
                    </p>
                  </div>
                )}

                {!isLoading && !error && exercises.length > 0 && currentExercise && (
                  <div className="space-y-4">
                    {/* Exercise Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-300">
                          {hasMultipleExercises
                            ? `Esercizio ${currentIndex + 1} di ${exercises.length}`
                            : 'Esercizio rappresentativo'}
                        </h4>
                        {hasMultipleExercises && (
                          <div className="flex gap-1">
                            {exercises.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === currentIndex
                                    ? 'bg-blue-500 w-6'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                                aria-label={`Vai all'esercizio ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-base text-white font-semibold">{currentExercise.name}</p>
                      <p className="text-sm text-gray-400 mt-2">{currentExercise.description}</p>
                    </div>

                    {/* Carousel Container */}
                    <div className="relative">
                      {/* Navigation Buttons (Desktop) */}
                      {hasMultipleExercises && (
                        <>
                          <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 rounded-full p-2 transition-colors hidden sm:flex items-center justify-center"
                            aria-label="Esercizio precedente"
                          >
                            <ChevronLeft className="w-5 h-5 text-white" />
                          </button>
                          <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 rounded-full p-2 transition-colors hidden sm:flex items-center justify-center"
                            aria-label="Esercizio successivo"
                          >
                            <ChevronRight className="w-5 h-5 text-white" />
                          </button>
                        </>
                      )}

                      {/* Carousel with Swipe Gesture */}
                      <div className="overflow-hidden">
                        <motion.div
                          key={currentIndex}
                          drag={hasMultipleExercises ? 'x' : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.2}
                          onDragEnd={(_, info) => {
                            if (!hasMultipleExercises) return

                            // Swipe threshold
                            if (info.offset.x > 100) {
                              goToPrevious()
                            } else if (info.offset.x < -100) {
                              goToNext()
                            }
                          }}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          {currentExercise.gifUrl ? (
                            <ExerciseAnimation
                              animationUrl={currentExercise.gifUrl}
                              exerciseName={currentExercise.name}
                              className="mx-auto"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                                <span className="text-2xl">🎬</span>
                              </div>
                              <p className="text-gray-400 mb-2">
                                Animazione non disponibile
                              </p>
                              <p className="text-sm text-gray-500 max-w-xs">
                                per {currentExercise.name}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-center text-xs text-gray-500 pt-2">
                      {hasMultipleExercises ? (
                        <>
                          <span className="hidden sm:inline">
                            Usa le frecce o scorri per vedere altri esercizi
                          </span>
                          <span className="sm:hidden">
                            Scorri per vedere altri esercizi
                          </span>
                        </>
                      ) : (
                        'Questo è un esempio di esercizio che puoi eseguire con questa attrezzatura'
                      )}
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
