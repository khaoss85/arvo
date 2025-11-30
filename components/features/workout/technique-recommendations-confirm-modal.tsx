'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Zap,
  Timer,
  Repeat,
  TrendingUp,
  Flame,
  Target,
  ArrowUpDown,
  Layers,
  CircleDot,
  Flower2,
  RefreshCw,
  Ruler,
  Users,
  Crosshair,
} from 'lucide-react'
import type { TechniqueType, AppliedTechnique } from '@/lib/types/advanced-techniques'
import type { TechniqueRecommendationOutput } from '@/lib/agents/technique-recommender.agent'
import { DEFAULT_TECHNIQUE_CONFIGS } from '@/lib/types/advanced-techniques'

interface ExerciseRecommendation {
  exerciseIndex: number
  exerciseName: string
  recommendations: TechniqueRecommendationOutput | null
  error?: string
}

interface TechniqueRecommendationsConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseRecommendations: ExerciseRecommendation[]
  isLoading: boolean
  onConfirm: (selectedTechniques: Map<number, AppliedTechnique>) => void
  onSkip: () => void
}

// Icons for each technique type
const TECHNIQUE_ICONS: Record<TechniqueType, React.ReactNode> = {
  drop_set: <Zap className="w-4 h-4" />,
  rest_pause: <Timer className="w-4 h-4" />,
  superset: <Repeat className="w-4 h-4" />,
  top_set_backoff: <TrendingUp className="w-4 h-4" />,
  myo_reps: <Flame className="w-4 h-4" />,
  giant_set: <Layers className="w-4 h-4" />,
  cluster_set: <Target className="w-4 h-4" />,
  pyramid: <ArrowUpDown className="w-4 h-4" />,
  fst7_protocol: <CircleDot className="w-4 h-4" />,
  loaded_stretching: <Flower2 className="w-4 h-4" />,
  mechanical_drop_set: <RefreshCw className="w-4 h-4" />,
  lengthened_partials: <Ruler className="w-4 h-4" />,
  forced_reps: <Users className="w-4 h-4" />,
  pre_exhaust: <Crosshair className="w-4 h-4" />,
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
  fst7_protocol: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
  loaded_stretching: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  mechanical_drop_set: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  lengthened_partials: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400' },
  forced_reps: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  pre_exhaust: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400' },
}

export function TechniqueRecommendationsConfirmModal({
  open,
  onOpenChange,
  exerciseRecommendations,
  isLoading,
  onConfirm,
  onSkip,
}: TechniqueRecommendationsConfirmModalProps) {
  const t = useTranslations('workout.modals.techniqueRecommendations')
  const tTech = useTranslations('workout.modals.techniqueSelection.techniques')

  // Track which recommendations are selected (by exercise index)
  const [selectedTechniques, setSelectedTechniques] = useState<Map<number, TechniqueType>>(new Map())

  // Get best recommendation for each exercise (score >= 60)
  const getBestRecommendation = (rec: ExerciseRecommendation) => {
    if (!rec.recommendations?.recommendations) return null
    const best = rec.recommendations.recommendations
      .filter(r => r.score >= 60)
      .sort((a, b) => b.score - a.score)[0]
    return best || null
  }

  // Toggle selection for an exercise
  const toggleSelection = (exerciseIndex: number, techniqueType: TechniqueType) => {
    const newSelected = new Map(selectedTechniques)
    if (newSelected.get(exerciseIndex) === techniqueType) {
      newSelected.delete(exerciseIndex)
    } else {
      newSelected.set(exerciseIndex, techniqueType)
    }
    setSelectedTechniques(newSelected)
  }

  // Handle confirm with selected techniques
  const handleConfirm = () => {
    const techniquesMap = new Map<number, AppliedTechnique>()

    selectedTechniques.forEach((techniqueType, exerciseIndex) => {
      const rec = exerciseRecommendations.find(r => r.exerciseIndex === exerciseIndex)
      const recommendation = rec?.recommendations?.recommendations.find(r => r.technique === techniqueType)

      // Always use default config - suggestedConfig from AI is partial and may have different types
      techniquesMap.set(exerciseIndex, {
        technique: techniqueType,
        config: DEFAULT_TECHNIQUE_CONFIGS[techniqueType],
        rationale: recommendation?.rationale || 'AI recommended',
      })
    })

    onConfirm(techniquesMap)
  }

  // Count exercises with valid recommendations
  const exercisesWithRecommendations = exerciseRecommendations.filter(rec => getBestRecommendation(rec) !== null)

  // Don't render on server
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">
                  {t('title')}
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-gray-400 px-6 pb-4">
              {t('subtitle')}
            </p>

            {/* Content */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-200px)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">{t('loading')}</p>
                </div>
              ) : exercisesWithRecommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-400 text-center">{t('noRecommendations')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exerciseRecommendations.map((rec) => {
                    const bestRec = getBestRecommendation(rec)
                    if (!bestRec) return null

                    const colors = TECHNIQUE_COLORS[bestRec.technique]
                    const isSelected = selectedTechniques.get(rec.exerciseIndex) === bestRec.technique

                    return (
                      <button
                        key={rec.exerciseIndex}
                        onClick={() => toggleSelection(rec.exerciseIndex, bestRec.technique)}
                        className={cn(
                          'w-full p-4 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50'
                            : 'border-gray-700 hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                              isSelected
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-600'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Exercise name */}
                            <p className="font-medium text-white mb-2 truncate">
                              {rec.exerciseName}
                            </p>

                            {/* Recommended technique */}
                            <div
                              className={cn(
                                'inline-flex items-center gap-2 px-2 py-1 rounded',
                                colors.bg,
                                colors.border,
                                'border'
                              )}
                            >
                              <span className={colors.text}>
                                {TECHNIQUE_ICONS[bestRec.technique]}
                              </span>
                              <span className={cn('text-sm font-medium', colors.text)}>
                                {tTech(`${bestRec.technique}.name`)}
                              </span>
                              <span
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded',
                                  bestRec.score >= 80 && 'bg-green-500/20 text-green-400',
                                  bestRec.score >= 60 && bestRec.score < 80 && 'bg-blue-500/20 text-blue-400'
                                )}
                              >
                                {bestRec.score}%
                              </span>
                            </div>

                            {/* Rationale */}
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                              {bestRec.rationale}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-6 pt-2 border-t border-gray-800 bg-gray-900">
              {!isLoading && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onSkip}
                    className="flex-1"
                  >
                    {t('saveWithout')}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={selectedTechniques.size === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {selectedTechniques.size > 0
                      ? t('applySelected', { count: selectedTechniques.size })
                      : t('selectToApply')}
                  </Button>
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
