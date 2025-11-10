'use client'

import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ExerciseAnimationProps {
  animationUrl: string
  exerciseName: string
  className?: string
}

export function ExerciseAnimation({ animationUrl, exerciseName, className = '' }: ExerciseAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadAnimation = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log('[ExerciseAnimation] Loading:', animationUrl)
        const response = await fetch(animationUrl)

        console.log('[ExerciseAnimation] Response status:', response.status)
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[ExerciseAnimation] Data loaded:', {
          hasVersion: !!data.v,
          hasLayers: !!data.layers,
          layerCount: data.layers?.length,
          width: data.w,
          height: data.h,
          frames: data.op
        })

        if (isMounted) {
          setAnimationData(data)
          console.log('[ExerciseAnimation] Animation data set successfully')
        }
      } catch (err) {
        console.error('[ExerciseAnimation] Error loading animation:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load animation')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAnimation()

    return () => {
      isMounted = false
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
            <p className="text-gray-400 text-sm">
              Animazione non disponibile
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {exerciseName}
            </p>
          </motion.div>
        )}

        {animationData && !isLoading && (
          <motion.div
            key="animation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full bg-gray-900/50 rounded-lg"
          >
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-full h-full"
              style={{ maxHeight: '400px' }}
              onDataReady={() => console.log('[ExerciseAnimation] Lottie data ready')}
              onComplete={() => console.log('[ExerciseAnimation] Lottie complete (should loop)')}
              onLoopComplete={() => console.log('[ExerciseAnimation] Lottie loop complete')}
              onError={(error) => console.error('[ExerciseAnimation] Lottie error:', error)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
