'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RotateCcw, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VideoAngle, VideoGender, MuscleWikiVideo } from '@/lib/services/musclewiki.service'

interface ExerciseVideoProps {
  videos: MuscleWikiVideo[] | null
  exerciseName: string
  className?: string
  defaultAngle?: VideoAngle
  defaultGender?: VideoGender
  showControls?: boolean
  autoPlay?: boolean
}

const ANGLE_ICONS: Record<VideoAngle, string> = {
  front: 'Front',
  back: 'Back',
  side: 'Side',
}

export function ExerciseVideo({
  videos,
  exerciseName,
  className = '',
  defaultAngle = 'front',
  defaultGender = 'male',
  showControls = true,
  autoPlay = true,
}: ExerciseVideoProps) {
  const t = useTranslations('workout.components.exerciseVideo')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAngle, setSelectedAngle] = useState<VideoAngle>(defaultAngle)
  const [selectedGender, setSelectedGender] = useState<VideoGender>(defaultGender)

  // Get available angles and genders from videos
  const availableAngles = videos
    ? Array.from(new Set(videos.map((v) => v.angle))).sort()
    : []
  const availableGenders = videos
    ? Array.from(new Set(videos.map((v) => v.gender))).sort()
    : []

  // Find current video
  const currentVideo = videos?.find(
    (v) => v.angle === selectedAngle && v.gender === selectedGender
  ) || videos?.find((v) => v.angle === selectedAngle) || videos?.[0]

  // Reset loading state when video changes
  useEffect(() => {
    if (!currentVideo?.url) {
      setError(t('notAvailable'))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
  }, [currentVideo?.url, t])

  const handleVideoLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleVideoError = () => {
    setError(t('loadingFailed'))
    setIsLoading(false)
  }

  const cycleAngle = () => {
    if (availableAngles.length <= 1) return
    const currentIndex = availableAngles.indexOf(selectedAngle)
    const nextIndex = (currentIndex + 1) % availableAngles.length
    setSelectedAngle(availableAngles[nextIndex] as VideoAngle)
  }

  const toggleGender = () => {
    if (availableGenders.length <= 1) return
    setSelectedGender((prev) => (prev === 'male' ? 'female' : 'male'))
  }

  if (!videos || videos.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center px-4 bg-gray-900/50 rounded-lg',
          className
        )}
      >
        <p className="text-gray-400 text-sm">{t('notAvailable')}</p>
        <p className="text-gray-500 text-xs mt-2">{exerciseName}</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg z-10"
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
            className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center px-4 bg-gray-900/50 rounded-lg"
          >
            <p className="text-gray-400 text-sm">{t('loadingFailed')}</p>
            <p className="text-gray-500 text-xs mt-2">{exerciseName}</p>
          </motion.div>
        )}

        {currentVideo?.url && (
          <motion.div
            key={`video-${selectedAngle}-${selectedGender}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full bg-gray-900/50 rounded-lg overflow-hidden"
          >
            <video
              ref={videoRef}
              src={currentVideo.url}
              autoPlay={autoPlay}
              loop
              muted
              playsInline
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '400px' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {showControls && !error && (
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          {/* Angle Selector */}
          {availableAngles.length > 1 && (
            <button
              onClick={cycleAngle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{ANGLE_ICONS[selectedAngle]}</span>
            </button>
          )}

          {/* Gender Toggle */}
          {availableGenders.length > 1 && (
            <button
              onClick={toggleGender}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition-colors"
            >
              {selectedGender === 'male' ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              <span className="capitalize">{selectedGender}</span>
            </button>
          )}
        </div>
      )}

      {/* Angle Indicators */}
      {showControls && availableAngles.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {availableAngles.map((angle) => (
            <button
              key={angle}
              onClick={() => setSelectedAngle(angle as VideoAngle)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                selectedAngle === angle
                  ? 'bg-white scale-125'
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label={`View ${angle}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Simplified component for legacy compatibility (single video URL)
interface ExerciseAnimationProps {
  animationUrl: string | null
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
  const [isVideo, setIsVideo] = useState(false)

  useEffect(() => {
    if (!animationUrl) {
      setError(t('notAvailable'))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Detect if URL is video or image
    const isVideoUrl = animationUrl.includes('.mp4') || animationUrl.includes('.webm')
    setIsVideo(isVideoUrl)

    if (!isVideoUrl) {
      // Preload image
      const img = new Image()
      img.onload = () => {
        setIsLoading(false)
        setError(null)
      }
      img.onerror = () => {
        setError(t('loadingFailed'))
        setIsLoading(false)
      }
      img.src = animationUrl
      return () => {
        img.onload = null
        img.onerror = null
      }
    }
  }, [animationUrl, t])

  if (!animationUrl) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center px-4 bg-gray-900/50 rounded-lg',
          className
        )}
      >
        <p className="text-gray-400 text-sm">{t('notAvailable')}</p>
        <p className="text-gray-500 text-xs mt-2">{exerciseName}</p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg z-10 min-h-[200px]"
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
            className="flex flex-col items-center justify-center w-full h-full min-h-[200px] text-center px-4 bg-gray-900/50 rounded-lg"
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
            {isVideo ? (
              <video
                src={animationUrl}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => {
                  setIsLoading(false)
                  setError(null)
                }}
                onError={() => {
                  setError(t('loadingFailed'))
                  setIsLoading(false)
                }}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '400px' }}
              />
            ) : (
              <img
                src={animationUrl}
                alt={exerciseName}
                className="w-full h-auto object-contain"
                style={{
                  maxHeight: '400px',
                  imageRendering: 'crisp-edges',
                }}
                loading="lazy"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
