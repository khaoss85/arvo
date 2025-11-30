'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import {
  Zap,
  Timer,
  Repeat,
  TrendingUp,
  Flame,
  Target,
  ArrowUpDown,
  Layers,
  X,
  Check,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Loader2,
  // New technique icons
  CircleDot,
  Flower2,
  RefreshCw,
  Ruler,
  Users,
  Crosshair,
} from 'lucide-react'
import type {
  AppliedTechnique,
  TechniqueType,
  TechniqueConfig,
} from '@/lib/types/advanced-techniques'
import {
  TECHNIQUE_COMPATIBILITY,
  DEFAULT_TECHNIQUE_CONFIGS,
} from '@/lib/types/advanced-techniques'
import {
  getTechniqueRecommendationsAction,
  validateTechniqueChoiceAction,
} from '@/app/actions/technique-recommendation-actions'
import type {
  TechniqueRecommendationInput,
  TechniqueRecommendationOutput,
  TechniqueRecommendation,
  TechniqueValidationOutput,
} from '@/lib/agents/technique-recommender.agent'

interface TechniqueSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTechnique?: AppliedTechnique | null
  exerciseName: string
  onSelectTechnique: (technique: AppliedTechnique | null) => void
  // For superset/giant set - list of other exercises in workout
  otherExercises?: Array<{ index: number; name: string }>
  currentExerciseIndex?: number
  // AI recommendation context (optional - if provided, will show AI suggestions)
  aiContext?: TechniqueRecommendationInput
}

// Icons for each technique type
const TECHNIQUE_ICONS: Record<TechniqueType, React.ReactNode> = {
  drop_set: <Zap className="w-5 h-5" />,
  rest_pause: <Timer className="w-5 h-5" />,
  superset: <Repeat className="w-5 h-5" />,
  top_set_backoff: <TrendingUp className="w-5 h-5" />,
  myo_reps: <Flame className="w-5 h-5" />,
  giant_set: <Layers className="w-5 h-5" />,
  cluster_set: <Target className="w-5 h-5" />,
  pyramid: <ArrowUpDown className="w-5 h-5" />,
  // Proprietary techniques
  fst7_protocol: <CircleDot className="w-5 h-5" />,
  loaded_stretching: <Flower2 className="w-5 h-5" />,
  mechanical_drop_set: <RefreshCw className="w-5 h-5" />,
  lengthened_partials: <Ruler className="w-5 h-5" />,
  forced_reps: <Users className="w-5 h-5" />,
  pre_exhaust: <Crosshair className="w-5 h-5" />,
}

// Colors for each technique
const TECHNIQUE_COLORS: Record<TechniqueType, { bg: string; border: string; text: string }> = {
  drop_set: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  rest_pause: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  superset: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  top_set_backoff: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  myo_reps: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  giant_set: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  cluster_set: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  pyramid: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  // Proprietary techniques
  fst7_protocol: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
  loaded_stretching: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  mechanical_drop_set: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  lengthened_partials: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400' },
  forced_reps: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  pre_exhaust: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400' },
}

// All technique types in display order
const ALL_TECHNIQUES: TechniqueType[] = [
  'drop_set',
  'rest_pause',
  'myo_reps',
  'top_set_backoff',
  'cluster_set',
  'pyramid',
  'superset',
  'giant_set',
  // Proprietary techniques
  'fst7_protocol',
  'loaded_stretching',
  'mechanical_drop_set',
  'lengthened_partials',
  'forced_reps',
  'pre_exhaust',
]

export function TechniqueSelectionModal({
  open,
  onOpenChange,
  currentTechnique,
  exerciseName,
  onSelectTechnique,
  otherExercises = [],
  currentExerciseIndex,
  aiContext,
}: TechniqueSelectionModalProps) {
  const t = useTranslations('workout.modals.techniqueSelection')

  // Needed for Portal - document.body doesn't exist during SSR
  const [mounted, setMounted] = useState(false)

  // State for multi-step flow
  const [step, setStep] = useState<'list' | 'configure' | 'validation'>('list')
  const [selectedType, setSelectedType] = useState<TechniqueType | null>(null)

  // State for superset/giant set exercise selection
  const [pairedExerciseIndex, setPairedExerciseIndex] = useState<number | null>(null)
  const [giantSetIndices, setGiantSetIndices] = useState<number[]>([])

  // AI Recommendation state
  const [recommendations, setRecommendations] = useState<TechniqueRecommendationOutput | null>(null)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [pendingTechnique, setPendingTechnique] = useState<TechniqueType | null>(null)
  const [validationResult, setValidationResult] = useState<TechniqueValidationOutput | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch AI recommendations when modal opens with aiContext
  const fetchRecommendations = useCallback(async () => {
    if (!aiContext) return

    setIsLoadingRecommendations(true)
    try {
      const result = await getTechniqueRecommendationsAction(aiContext)
      if (result.success && result.data) {
        setRecommendations(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch technique recommendations:', error)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [aiContext])

  useEffect(() => {
    if (open && aiContext) {
      fetchRecommendations()
    }
  }, [open, aiContext, fetchRecommendations])

  // Get recommendation for a specific technique
  const getRecommendation = (type: TechniqueType): TechniqueRecommendation | undefined => {
    return recommendations?.recommendations.find(r => r.technique === type)
  }

  // Check if technique is recommended (score >= 60)
  const isRecommended = (type: TechniqueType): boolean => {
    const rec = getRecommendation(type)
    return rec !== undefined && rec.score >= 60
  }

  // Get not recommended reason
  const getNotRecommendedReason = (type: TechniqueType): string | undefined => {
    return recommendations?.notRecommended.find(r => r.technique === type)?.reason
  }

  // Reset state when modal opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('list')
      setSelectedType(null)
      setPairedExerciseIndex(null)
      setGiantSetIndices([])
      setPendingTechnique(null)
      setValidationResult(null)
      setIsValidating(false)
      // Don't reset recommendations - keep them cached for the modal session
    }
    onOpenChange(isOpen)
  }

  // Handle technique card click
  const handleTechniqueSelect = async (type: TechniqueType) => {
    setSelectedType(type)

    // For superset/giant set, go to configure step to select exercises
    if (type === 'superset' || type === 'giant_set') {
      setStep('configure')
      return
    }

    // If AI context exists and technique is NOT recommended, show validation dialog
    if (aiContext && recommendations && !isRecommended(type)) {
      setPendingTechnique(type)
      setStep('validation')
      setIsValidating(true)

      try {
        const result = await validateTechniqueChoiceAction(aiContext, type)
        if (result.success && result.data) {
          setValidationResult(result.data)
        }
      } catch (error) {
        console.error('Failed to validate technique choice:', error)
      } finally {
        setIsValidating(false)
      }
      return
    }

    // For other techniques, apply with default config
    applyTechnique(type)
  }

  // Confirm pending technique selection after validation
  const confirmPendingTechnique = () => {
    if (pendingTechnique) {
      applyTechnique(pendingTechnique)
    }
  }

  // Cancel pending technique and go back to list
  const cancelPendingTechnique = () => {
    setStep('list')
    setPendingTechnique(null)
    setValidationResult(null)
  }

  // Apply the selected technique
  const applyTechnique = (type: TechniqueType) => {
    let config: TechniqueConfig = { ...DEFAULT_TECHNIQUE_CONFIGS[type] }

    // For superset, set the paired exercise index
    if (type === 'superset' && pairedExerciseIndex !== null) {
      config = {
        type: 'superset',
        pairedExerciseIndex,
        restAfterBoth: 90, // Default rest after both exercises
      }
    }

    // For giant set, set the exercise indices
    if (type === 'giant_set' && giantSetIndices.length >= 2) {
      config = {
        type: 'giant_set',
        exerciseIndices: giantSetIndices,
        restAfterAll: 120, // Default rest after all exercises
      }
    }

    const technique: AppliedTechnique = {
      technique: type,
      config,
      rationale: t('userSelected'),
    }

    onSelectTechnique(technique)
    handleOpenChange(false)
  }

  // Remove current technique
  const handleRemoveTechnique = () => {
    onSelectTechnique(null)
    handleOpenChange(false)
  }

  // Toggle giant set exercise selection
  const toggleGiantSetExercise = (index: number) => {
    if (giantSetIndices.includes(index)) {
      setGiantSetIndices(giantSetIndices.filter(i => i !== index))
    } else {
      setGiantSetIndices([...giantSetIndices, index])
    }
  }

  // Filter out current exercise from other exercises
  const availableExercises = otherExercises.filter(
    ex => ex.index !== currentExerciseIndex
  )

  // Don't render on server
  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl shadow-xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-2">
              <div className="flex items-center gap-2">
                {(step === 'configure' || step === 'validation') && (
                  <button
                    onClick={() => step === 'validation' ? cancelPendingTechnique() : setStep('list')}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-white">
                  {step === 'list' ? t('title') : step === 'validation' ? t('validation.title') : t('configureTitle')}
                </h2>
                {/* AI Loading indicator */}
                {isLoadingRecommendations && (
                  <span className="flex items-center gap-1 text-xs text-purple-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI
                  </span>
                )}
              </div>
              <button
                onClick={() => handleOpenChange(false)}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Exercise name */}
            <div className="text-sm text-gray-400 px-6 pb-4">
              {exerciseName}
            </div>

            {/* Content - scrollable */}
            <div className="px-4 pb-8 overflow-y-auto max-h-[calc(85vh-120px)]">
              {step === 'list' && (
                <>
                  {/* Current technique - remove option */}
                  {currentTechnique && (
                    <div className="mb-4 p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400">
                            {TECHNIQUE_ICONS[currentTechnique.technique]}
                          </span>
                          <span className="font-medium text-white">
                            {t(`techniques.${currentTechnique.technique}.name`)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveTechnique}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('removeTechnique')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* AI General Advice */}
                  {recommendations?.generalAdvice && (
                    <div className="mb-4 p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-200">{recommendations.generalAdvice}</p>
                      </div>
                    </div>
                  )}

                  {/* Technique grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_TECHNIQUES.map((type) => {
                      const colors = TECHNIQUE_COLORS[type]
                      const compatibility = TECHNIQUE_COMPATIBILITY[type]
                      const isSelected = currentTechnique?.technique === type
                      const recommendation = getRecommendation(type)
                      const recommended = isRecommended(type)
                      const notRecommendedReason = getNotRecommendedReason(type)

                      // Disable superset/giant set if no other exercises
                      const isDisabled =
                        (type === 'superset' || type === 'giant_set') &&
                        availableExercises.length < 1

                      return (
                        <button
                          key={type}
                          onClick={() => !isDisabled && handleTechniqueSelect(type)}
                          disabled={isDisabled}
                          className={cn(
                            'p-3 rounded-lg border text-left transition-all relative',
                            colors.bg,
                            colors.border,
                            isSelected && 'ring-2 ring-orange-500',
                            recommended && 'ring-1 ring-purple-500/50',
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'
                          )}
                        >
                          {/* AI Recommended Badge */}
                          {recommended && (
                            <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500 text-[10px] font-medium text-white shadow-lg">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-1">
                            <span className={colors.text}>
                              {TECHNIQUE_ICONS[type]}
                            </span>
                            <span className="font-medium text-white text-sm">
                              {t(`techniques.${type}.name`)}
                            </span>
                          </div>

                          {/* Show AI rationale if recommended, otherwise show brief description */}
                          {recommendation && recommendation.score >= 60 ? (
                            <p className="text-xs text-purple-300 line-clamp-2">
                              {recommendation.rationale}
                            </p>
                          ) : notRecommendedReason ? (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {notRecommendedReason}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {t(`techniques.${type}.brief`)}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded border',
                                compatibility.minExperience === 'beginner' &&
                                  'border-green-500/30 text-green-400 bg-green-500/10',
                                compatibility.minExperience === 'intermediate' &&
                                  'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
                                compatibility.minExperience === 'advanced' &&
                                  'border-red-500/30 text-red-400 bg-red-500/10'
                              )}
                            >
                              {t(`levels.${compatibility.minExperience}`)}
                            </span>
                            {/* Show score badge if AI recommendation exists */}
                            {recommendation && (
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded',
                                  recommendation.score >= 80 && 'bg-green-500/20 text-green-400',
                                  recommendation.score >= 60 && recommendation.score < 80 && 'bg-blue-500/20 text-blue-400',
                                  recommendation.score < 60 && 'bg-gray-500/20 text-gray-400'
                                )}
                              >
                                {recommendation.score}%
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Cancel button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </>
              )}

              {/* Configure step - for superset/giant set */}
              {step === 'configure' && selectedType === 'superset' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    {t('superset.selectExercise')}
                  </p>

                  <div className="space-y-2">
                    {availableExercises.map((ex) => (
                      <button
                        key={ex.index}
                        onClick={() => setPairedExerciseIndex(ex.index)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          pairedExerciseIndex === ex.index
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{ex.name}</span>
                          {pairedExerciseIndex === ex.index && (
                            <Check className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {availableExercises.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t('superset.noExercises')}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setStep('list')}
                    >
                      {t('back')}
                    </Button>
                    <Button
                      onClick={() => applyTechnique('superset')}
                      disabled={pairedExerciseIndex === null}
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'configure' && selectedType === 'giant_set' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    {t('giantSet.selectExercises')}
                    <span className="text-gray-500 ml-1">
                      ({giantSetIndices.length} {t('giantSet.selected')})
                    </span>
                  </p>

                  <div className="space-y-2">
                    {availableExercises.map((ex) => {
                      const isSelected = giantSetIndices.includes(ex.index)
                      return (
                        <button
                          key={ex.index}
                          onClick={() => toggleGiantSetExercise(ex.index)}
                          className={cn(
                            'w-full p-3 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-pink-500 bg-pink-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white">{ex.name}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-pink-400" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {availableExercises.length < 2 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t('giantSet.needMore')}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setStep('list')}
                    >
                      {t('back')}
                    </Button>
                    <Button
                      onClick={() => applyTechnique('giant_set')}
                      disabled={giantSetIndices.length < 2}
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation step - when selecting non-recommended technique */}
              {step === 'validation' && pendingTechnique && (
                <div className="space-y-4">
                  {isValidating ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                      <p className="text-sm text-gray-400">{t('validation.checking')}</p>
                    </div>
                  ) : validationResult ? (
                    <>
                      {/* Validation result card */}
                      <div
                        className={cn(
                          'p-4 rounded-lg border',
                          validationResult.validation === 'approved' &&
                            'border-green-500/30 bg-green-500/10',
                          validationResult.validation === 'caution' &&
                            'border-yellow-500/30 bg-yellow-500/10',
                          validationResult.validation === 'not_recommended' &&
                            'border-red-500/30 bg-red-500/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {validationResult.validation === 'approved' ? (
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          ) : validationResult.validation === 'caution' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <div>
                            <h3
                              className={cn(
                                'font-medium mb-1',
                                validationResult.validation === 'approved' && 'text-green-400',
                                validationResult.validation === 'caution' && 'text-yellow-400',
                                validationResult.validation === 'not_recommended' && 'text-red-400'
                              )}
                            >
                              {t(`validation.${validationResult.validation}`)}
                            </h3>
                            <p className="text-sm text-gray-300">{validationResult.reasoning}</p>
                          </div>
                        </div>
                      </div>

                      {/* Alternative suggestion */}
                      {validationResult.alternative && (
                        <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-purple-300 font-medium mb-0.5">
                                {t('validation.tryInstead', {
                                  technique: t(`techniques.${validationResult.alternative.technique}.name`),
                                })}
                              </p>
                              <p className="text-xs text-purple-200/70">
                                {validationResult.alternative.reason}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                            onClick={() => {
                              if (validationResult.alternative) {
                                applyTechnique(validationResult.alternative.technique as TechniqueType)
                              }
                            }}
                          >
                            {t('validation.useAlternative')}
                          </Button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={cancelPendingTechnique}>
                          {t('back')}
                        </Button>
                        <Button
                          onClick={confirmPendingTechnique}
                          variant={validationResult.validation === 'not_recommended' ? 'destructive' : 'default'}
                        >
                          {validationResult.validation === 'not_recommended'
                            ? t('validation.proceedAnyway')
                            : t('apply')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Error state
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
                      <p className="text-sm text-gray-400">{t('validation.error')}</p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={cancelPendingTechnique}>
                          {t('back')}
                        </Button>
                        <Button onClick={confirmPendingTechnique}>{t('apply')}</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Safe area for iOS */}
            <div className="h-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
