'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Sparkles, RefreshCw, Camera, Dumbbell, Zap, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface TourStep {
  id: string
  targetSelector: string
  icon: LucideIcon
  translationKey: string
}

// Default steps for Advanced Dashboard
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'startWorkout',
    targetSelector: '[data-tour="timeline-current"]',
    icon: Sparkles,
    translationKey: 'dashboard.tour',
  },
  {
    id: 'modeSwitch',
    targetSelector: '[data-tour="mode-switch"]',
    icon: RefreshCw,
    translationKey: 'dashboard.tour',
  },
  {
    id: 'progressCheck',
    targetSelector: '[data-tour="check-room"]',
    icon: Camera,
    translationKey: 'dashboard.tour',
  },
]

// Steps for Simple Mode
export const SIMPLE_TOUR_STEPS: TourStep[] = [
  {
    id: 'workoutCard',
    targetSelector: '[data-tour="simple-workout"]',
    icon: Dumbbell,
    translationKey: 'simpleMode.tour',
  },
  {
    id: 'modeSwitch',
    targetSelector: '[data-tour="mode-switch"]',
    icon: RefreshCw,
    translationKey: 'simpleMode.tour',
  },
  {
    id: 'quickActions',
    targetSelector: '[data-tour="simple-actions"]',
    icon: Zap,
    translationKey: 'simpleMode.tour',
  },
]

interface OnboardingTourProps {
  onComplete: () => void
  steps?: TourStep[]
  translationNamespace?: string
}

export function OnboardingTour({
  onComplete,
  steps = DASHBOARD_TOUR_STEPS,
  translationNamespace = 'dashboard.tour'
}: OnboardingTourProps) {
  const t = useTranslations(translationNamespace)
  const [currentStep, setCurrentStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [validSteps, setValidSteps] = useState<TourStep[]>([])
  const skipAttemptRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter out steps with missing elements on mount
  useEffect(() => {
    if (!mounted) return

    const checkValidSteps = () => {
      const valid = steps.filter(step => {
        const element = document.querySelector(step.targetSelector)
        return element !== null
      })
      setValidSteps(valid)

      // If no valid steps, complete tour immediately
      if (valid.length === 0) {
        onComplete()
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(checkValidSteps, 100)
    return () => clearTimeout(timer)
  }, [mounted, steps, onComplete])

  // Calculate target element position for spotlight
  useEffect(() => {
    if (!mounted || validSteps.length === 0) return

    const step = validSteps[currentStep]
    if (!step) {
      onComplete()
      return
    }

    const element = document.querySelector(step.targetSelector)

    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      skipAttemptRef.current = false
    } else {
      // Element not found - skip to next step (fallback)
      if (!skipAttemptRef.current) {
        skipAttemptRef.current = true
        if (currentStep < validSteps.length - 1) {
          setCurrentStep(prev => prev + 1)
        } else {
          onComplete()
        }
      }
      return
    }

    // Update position on resize/scroll
    const updatePosition = () => {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      }
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [currentStep, mounted, validSteps, onComplete])

  const handleNext = useCallback(() => {
    if (currentStep < validSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }, [currentStep, validSteps.length, onComplete])

  const handleSkip = useCallback(() => {
    onComplete()
  }, [onComplete])

  if (!mounted || validSteps.length === 0) return null

  const step = validSteps[currentStep]
  if (!step) return null

  const StepIcon = step.icon
  const isLastStep = currentStep === validSteps.length - 1

  // Calculate spotlight mask position
  const spotlightStyle = targetRect ? {
    maskImage: `radial-gradient(ellipse ${Math.max(targetRect.width + 40, 200)}px ${Math.max(targetRect.height + 40, 150)}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, transparent 70%, black 100%)`,
    WebkitMaskImage: `radial-gradient(ellipse ${Math.max(targetRect.width + 40, 200)}px ${Math.max(targetRect.height + 40, 150)}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, transparent 70%, black 100%)`,
  } : {}

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Dark overlay with spotlight hole */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          style={spotlightStyle}
        />

        {/* Highlight ring around target element */}
        {targetRect && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-primary rounded-xl pointer-events-none shadow-[0_0_20px_rgba(147,51,234,0.5)]"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}

        {/* Bottom Sheet Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-4">
            {validSteps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  idx === currentStep
                    ? 'bg-primary'
                    : idx < currentStep
                      ? 'bg-primary/50'
                      : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                key={`icon-${currentStep}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10"
              >
                <StepIcon className="w-7 h-7 text-primary" />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              key={`text-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t(`steps.${step.id}.title`)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(`steps.${step.id}.description`)}
              </p>
            </motion.div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {t('skip')}
                </button>
              )}
              <button
                onClick={handleNext}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold transition-colors',
                  isLastStep
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                )}
              >
                {isLastStep ? t('finish') : t('next')}
              </button>
            </div>
          </div>

          {/* Safe area for iOS */}
          <div className="h-safe pb-4" />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
