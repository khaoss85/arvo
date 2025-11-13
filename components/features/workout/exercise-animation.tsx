'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ExerciseAnimationProps {
  animationUrl: string
  exerciseName: string
  className?: string
}

export function ExerciseAnimation({
  animationUrl,
  exerciseName,
  className = '',
}: ExerciseAnimationProps) {
  const t = useTranslations('workout.components.exerciseAnimation')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset loading state when URL changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // Preload image to detect loading/error
    const img = new Image()

    img.onload = () => {
      console.log('[ExerciseAnimation] GIF loaded:', animationUrl)
      setIsLoading(false)
      setError(null)
    }

    img.onerror = () => {
      console.error('[ExerciseAnimation] Failed to load GIF:', animationUrl)
      setError(t('loadingFailed'))
      setIsLoading(false)
    }

    img.src = animationUrl

    // Cleanup on unmount
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [animationUrl])

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-full h-full min-h-[200px]"
          >
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center px-4"
          >
            <p className="text-gray-400 text-sm">{t('notAvailable')}</p>
            <p className="text-gray-500 text-xs mt-2">{exerciseName}</p>
          </motion.div>
        )}

        {!isLoading && !error && (
          <motion.div
            key="animation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full bg-gray-900/50 rounded-lg overflow-hidden flex items-center justify-center"
          >
            <img
              src={animationUrl}
              alt={exerciseName}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '400px' }}
              loading="lazy"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
