'use client'

import { useState, useEffect } from 'react'
import { X, Search, Dumbbell, Target, Sparkles, CheckCircle, AlertCircle, XCircle, PlayCircle, ChevronLeft, Zap, Camera, Type, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { suggestExerciseAdditionAction, validateExerciseAdditionAction, extractEquipmentNameFromImageAction } from '@/app/actions/ai-actions'
import { PhotoUploader } from '@/components/ui/photo-uploader'
import { ExerciseDBService, type ExerciseDBExercise } from '@/lib/services/exercisedb.service'
import type { ExerciseSuggestionInput } from '@/lib/agents/exercise-suggester.agent'
import type { ExerciseAdditionInput, ExerciseAdditionOutput } from '@/lib/agents/exercise-addition-validator.agent'
import { ExerciseValidationModal } from './exercise-validation-modal'
import { ExerciseAnimationModal } from './exercise-animation-modal'
import { useUIStore } from '@/lib/stores/ui.store'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import type { AppliedTechnique, TechniqueType, TechniqueConfig } from '@/lib/types/advanced-techniques'
import { TECHNIQUE_COMPATIBILITY, DEFAULT_TECHNIQUE_CONFIGS } from '@/lib/types/advanced-techniques'

interface Exercise {
  id: string
  name: string
  bodyPart: string
  equipment: string
  target: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  animationUrl?: string | null
  hasAnimation?: boolean
  advancedTechnique?: AppliedTechnique
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: Exercise) => Promise<void>
  currentWorkoutType?: string
  excludeExercises?: string[] // Exercise names to exclude (already in workout)
  // AI enhancements (Phase 2)
  enableAISuggestions?: boolean
  enableAIValidation?: boolean
  userId?: string
  currentWorkoutContext?: {
    existingExercises: Array<{
      name: string
      sets: number
      muscleGroups: {
        primary: string[]
        secondary: string[]
      }
      movementPattern?: string
      isCompound: boolean
    }>
    totalExercises: number
    totalSets: number
  }
}

/**
 * Modal for selecting an exercise to add to the workout
 *
 * Phase 1: Basic search and selection
 * Phase 2: AI suggestions at the top + validation on selection
 */
export function AddExerciseModal({
  isOpen,
  onClose,
  onSelectExercise,
  currentWorkoutType = 'push',
  excludeExercises = [],
  enableAISuggestions = false,
  enableAIValidation = false,
  userId,
  currentWorkoutContext,
}: AddExerciseModalProps) {
  const t = useTranslations('workout.components.addExerciseModal')
  const tTechnique = useTranslations('workout.modals.techniqueSelection')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  // Step flow state: 'select' for exercise selection, 'technique' for optional technique
  const [step, setStep] = useState<'select' | 'technique'>('select')
  const [selectedExerciseForTechnique, setSelectedExerciseForTechnique] = useState<Exercise | null>(null)
  const [selectedTechnique, setSelectedTechnique] = useState<AppliedTechnique | null>(null)

  // AI suggestions state
  const [aiSuggestions, setAISuggestions] = useState<any[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map())

  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationResult, setValidationResult] = useState<ExerciseAdditionOutput | null>(null)
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null)

  // Animation modal state
  const [animationModalOpen, setAnimationModalOpen] = useState<string | null>(null)
  const [selectedExerciseForAnimation, setSelectedExerciseForAnimation] = useState<Exercise | null>(null)

  // 3-tab input mode state: 'library' | 'photo' | 'text'
  const [inputMode, setInputMode] = useState<'library' | 'photo' | 'text'>('library')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textValidationResult, setTextValidationResult] = useState<ExerciseAdditionOutput | null>(null)
  const [isValidatingText, setIsValidatingText] = useState(false)

  // Library search state (ExerciseDB)
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [libraryResults, setLibraryResults] = useState<ExerciseDBExercise[]>([])
  const [isSearchingLibrary, setIsSearchingLibrary] = useState(false)

  // Toast notifications
  const { addToast } = useUIStore()

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select')
      setSelectedExerciseForTechnique(null)
      setSelectedTechnique(null)
      // Reset 3-tab state
      setInputMode('library')
      setUploadedImage(null)
      setIsExtracting(false)
      setTextInput('')
      setTextValidationResult(null)
      setIsValidatingText(false)
      setLibrarySearchQuery('')
      setLibraryResults([])
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'technique') {
          // Go back to selection step instead of closing
          setStep('select')
          setSelectedExerciseForTechnique(null)
          setSelectedTechnique(null)
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, step])

  // Load exercises from API
  useEffect(() => {
    if (!isOpen) return

    const loadExercises = async () => {
      setIsLoading(true)
      try {
        // Fetch from exercise_generations table
        const response = await fetch('/api/exercises/list')

        if (!response.ok) {
          throw new Error('Failed to load exercises')
        }

        const data = await response.json()
        setExercises(data.exercises || [])
      } catch (error) {
        console.error('Error loading exercises:', error)
        // Fallback to hardcoded popular exercises
        setExercises(getDefaultExercises())
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [isOpen])

  // Load AI suggestions (Phase 2)
  useEffect(() => {
    if (!isOpen || !enableAISuggestions || !userId || !currentWorkoutContext) return

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const input: ExerciseSuggestionInput = {
          currentWorkout: {
            workoutType: currentWorkoutType as any,
            existingExercises: currentWorkoutContext.existingExercises,
            totalExercises: currentWorkoutContext.totalExercises,
            totalSets: currentWorkoutContext.totalSets,
          },
          userContext: {
            userId,
            approachId: '', // Will be enriched server-side
          },
        }

        const result = await suggestExerciseAdditionAction(userId, input)

        if (result.success && result.suggestions) {
          setAISuggestions(result.suggestions.suggestions || [])
        }
      } catch (error) {
        console.error('Error loading AI suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    loadSuggestions()
  }, [isOpen, enableAISuggestions, userId, currentWorkoutContext, currentWorkoutType])

  // Filter exercises based on search and category
  useEffect(() => {
    let filtered = exercises

    // Exclude exercises already in workout
    if (excludeExercises.length > 0) {
      filtered = filtered.filter(
        ex => !excludeExercises.includes(ex.name.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ex => {
        if (selectedCategory === 'chest') return ex.bodyPart === 'chest' || ex.target.includes('pectoral')
        if (selectedCategory === 'back') return ex.bodyPart === 'back' || ex.target.includes('lats') || ex.target.includes('traps')
        if (selectedCategory === 'legs') return ex.bodyPart === 'legs' || ex.bodyPart === 'upper legs' || ex.bodyPart === 'lower legs'
        if (selectedCategory === 'shoulders') return ex.bodyPart === 'shoulders' || ex.target.includes('delts')
        if (selectedCategory === 'arms') return ex.bodyPart === 'upper arms' || ex.bodyPart === 'lower arms'
        return true
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        ex =>
          ex.name.toLowerCase().includes(query) ||
          ex.bodyPart.toLowerCase().includes(query) ||
          ex.equipment.toLowerCase().includes(query) ||
          ex.target.toLowerCase().includes(query)
      )
    }

    setFilteredExercises(filtered)
  }, [exercises, searchQuery, selectedCategory, excludeExercises])

  const validateExercise = async (exercise: Exercise) => {
    if (!enableAIValidation || !userId || !currentWorkoutContext) {
      return null
    }

    try {
      const input: ExerciseAdditionInput = {
        exerciseToAdd: {
          name: exercise.name,
          equipmentVariant: exercise.equipment,
          muscleGroups: {
            primary: exercise.primaryMuscles || [exercise.bodyPart],
            secondary: exercise.secondaryMuscles || [],
          },
          isCompound: exercise.name.toLowerCase().includes('press') ||
                      exercise.name.toLowerCase().includes('squat') ||
                      exercise.name.toLowerCase().includes('row'),
        },
        currentWorkout: {
          workoutType: currentWorkoutType as any,
          existingExercises: currentWorkoutContext.existingExercises,
          totalExercises: currentWorkoutContext.totalExercises,
          totalSets: currentWorkoutContext.totalSets,
          totalVolume: currentWorkoutContext.totalSets * 10, // Rough estimate
        },
        userContext: {
          userId,
          approachId: '', // Will be enriched server-side
        },
      }

      const result = await validateExerciseAdditionAction(userId, input)

      if (result.success && result.validation) {
        return result.validation
      }
    } catch (error) {
      console.error('Error validating exercise:', error)
    }

    return null
  }

  // === 3-Tab Mode Handlers ===

  // Library search handler
  const handleLibrarySearch = async (query: string) => {
    setLibrarySearchQuery(query)

    if (query.length < 2) {
      setLibraryResults([])
      return
    }

    setIsSearchingLibrary(true)
    try {
      const results = await ExerciseDBService.searchExercises(query, 15)
      setLibraryResults(results)
    } catch (err) {
      console.error('Library search failed:', err)
      setLibraryResults([])
    } finally {
      setIsSearchingLibrary(false)
    }
  }

  // Library exercise selection
  const handleLibrarySelect = (libraryExercise: ExerciseDBExercise) => {
    const exercise: Exercise = {
      id: libraryExercise.id,
      name: libraryExercise.name,
      bodyPart: libraryExercise.bodyPart,
      equipment: libraryExercise.equipment,
      target: libraryExercise.target,
      animationUrl: libraryExercise.gifUrl,
      hasAnimation: !!libraryExercise.gifUrl
    }
    // Go to technique step
    setSelectedExerciseForTechnique(exercise)
    setStep('technique')
  }

  // Photo upload handler
  const handlePhotoUpload = async (base64: string) => {
    setUploadedImage(base64)
    setIsExtracting(true)
    setTextValidationResult(null)

    try {
      const result = await extractEquipmentNameFromImageAction(base64)

      if (result.success) {
        setTextInput(result.detectedName)
        // Auto-validate after successful extraction
        await handleValidateTextInput(result.detectedName)
      } else {
        console.error('Failed to extract equipment name:', result.error)
        addToast('Impossibile riconoscere l\'esercizio dalla foto', 'error')
        setUploadedImage(null)
      }
    } catch (error) {
      console.error('Failed to extract equipment name:', error)
      addToast('Errore durante il riconoscimento', 'error')
      setUploadedImage(null)
    } finally {
      setIsExtracting(false)
    }
  }

  // Clear photo
  const handleClearPhoto = () => {
    setUploadedImage(null)
    setTextInput('')
    setTextValidationResult(null)
  }

  // Text input validation handler
  const handleValidateTextInput = async (name: string) => {
    if (!name.trim() || name.length < 3) return

    setIsValidatingText(true)
    setTextValidationResult(null)

    try {
      const input: ExerciseAdditionInput = {
        exerciseToAdd: {
          name: name.trim(),
          equipmentVariant: '',
          muscleGroups: {
            primary: [],
            secondary: [],
          },
          isCompound: name.toLowerCase().includes('press') ||
                      name.toLowerCase().includes('squat') ||
                      name.toLowerCase().includes('row'),
        },
        currentWorkout: currentWorkoutContext ? {
          workoutType: currentWorkoutType as any,
          existingExercises: currentWorkoutContext.existingExercises,
          totalExercises: currentWorkoutContext.totalExercises,
          totalSets: currentWorkoutContext.totalSets,
          totalVolume: currentWorkoutContext.totalSets * 10,
        } : {
          workoutType: currentWorkoutType as any,
          existingExercises: [],
          totalExercises: 0,
          totalSets: 0,
          totalVolume: 0,
        },
        userContext: {
          userId: userId || '',
          approachId: '',
        },
      }

      const result = await validateExerciseAdditionAction(userId || '', input)

      if (result.success && result.validation) {
        setTextValidationResult(result.validation)
      }
    } catch (error) {
      console.error('Error validating text input:', error)
      addToast('Errore durante la validazione', 'error')
    } finally {
      setIsValidatingText(false)
    }
  }

  // Handle confirming text/photo validated exercise
  const handleConfirmTextExercise = () => {
    if (!textValidationResult || !textInput.trim()) return

    const exercise: Exercise = {
      id: `text-${Date.now()}`,
      name: textInput.trim(),
      bodyPart: 'general',
      equipment: '',
      target: '',
      hasAnimation: false
    }

    // Go to technique step
    setSelectedExerciseForTechnique(exercise)
    setStep('technique')
  }

  const handleSelectExercise = async (exercise: Exercise) => {
    setIsSelecting(true)
    try {
      // Validate if AI validation is enabled
      if (enableAIValidation) {
        const validation = await validateExercise(exercise)

        if (validation) {
          setValidationResults(new Map(validationResults).set(exercise.name, validation))

          // If rejected or caution, show modal
          if (validation.validation === 'rejected' || validation.validation === 'caution') {
            setValidationResult(validation)
            setPendingExercise(exercise)
            setShowValidationModal(true)
            setIsSelecting(false)
            return
          }

          // If approved, proceed to technique step
        }
      }

      // Go to technique selection step
      setSelectedExerciseForTechnique(exercise)
      setStep('technique')
    } catch (error) {
      console.error('Error selecting exercise:', error)
      addToast('Failed to add exercise. Please try again.', 'error')
    } finally {
      setIsSelecting(false)
    }
  }

  // Handle confirming exercise with optional technique
  const handleConfirmWithTechnique = async () => {
    if (!selectedExerciseForTechnique) return

    setIsSelecting(true)
    try {
      const exerciseWithTechnique: Exercise = {
        ...selectedExerciseForTechnique,
        advancedTechnique: selectedTechnique || undefined
      }

      await onSelectExercise(exerciseWithTechnique)
      onClose()
    } catch (error) {
      console.error('Error adding exercise with technique:', error)
      addToast('Failed to add exercise. Please try again.', 'error')
    } finally {
      setIsSelecting(false)
    }
  }

  // Handle selecting a technique in the technique step
  const handleTechniqueSelect = (type: TechniqueType) => {
    const config: TechniqueConfig = { ...DEFAULT_TECHNIQUE_CONFIGS[type] }
    const technique: AppliedTechnique = {
      technique: type,
      config,
      rationale: tTechnique('userSelected'),
    }
    setSelectedTechnique(technique)
  }

  // Remove selected technique
  const handleRemoveSelectedTechnique = () => {
    setSelectedTechnique(null)
  }

  const handleProceedWithExercise = async () => {
    if (!pendingExercise) return

    setShowValidationModal(false)

    // Go to technique selection step instead of directly adding
    setSelectedExerciseForTechnique(pendingExercise)
    setStep('technique')
    setPendingExercise(null)
    setValidationResult(null)
  }

  const categories = [
    { id: 'all', label: t('categories.all'), icon: Dumbbell },
    { id: 'chest', label: t('categories.chest'), icon: Target },
    { id: 'back', label: t('categories.back'), icon: Target },
    { id: 'legs', label: t('categories.legs'), icon: Target },
    { id: 'shoulders', label: t('categories.shoulders'), icon: Target },
    { id: 'arms', label: t('categories.arms'), icon: Target },
  ]

  // Technique options (excluding superset/giant set which require other exercises)
  const techniqueOptions: TechniqueType[] = [
    'drop_set',
    'rest_pause',
    'myo_reps',
    'top_set_backoff',
    'cluster_set',
    'pyramid',
  ]

  const techniqueColors: Record<TechniqueType, { bg: string; border: string; text: string }> = {
    drop_set: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    rest_pause: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    superset: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    top_set_backoff: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    myo_reps: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    giant_set: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
    cluster_set: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    pyramid: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'technique' && (
              <button
                onClick={() => {
                  setStep('select')
                  setSelectedExerciseForTechnique(null)
                  setSelectedTechnique(null)
                }}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {step === 'select' ? t('title') : t('techniqueStep.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label={t('closeAriaLabel')}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Exercise Selection Step */}
        {step === 'select' && (
          <>
            {/* 3-Tab Segmented Control */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex gap-1 p-1 bg-gray-800 rounded-lg">
                <button
                  onClick={() => setInputMode('library')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all",
                    inputMode === 'library'
                      ? "bg-gray-700 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  {t('customInput.libraryMode')}
                </button>
                <button
                  onClick={() => setInputMode('photo')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all",
                    inputMode === 'photo'
                      ? "bg-gray-700 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                >
                  <Camera className="w-4 h-4" />
                  {t('customInput.photoMode')}
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all",
                    inputMode === 'text'
                      ? "bg-gray-700 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                >
                  <Type className="w-4 h-4" />
                  {t('customInput.textMode')}
                </button>
              </div>
            </div>

            {/* Library Mode */}
            {inputMode === 'library' && (
              <>
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('library.searchPlaceholder')}
                      value={librarySearchQuery}
                      onChange={(e) => handleLibrarySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    {isSearchingLibrary && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
                    )}
                  </div>
                </div>

                {/* AI Suggestions (if enabled) */}
                {enableAISuggestions && librarySearchQuery.length < 2 && (
                  <div className="p-4 border-b border-gray-800 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-semibold text-blue-400">{t('aiSuggestions.title')}</h3>
                    </div>

                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-sm text-gray-400">{t('aiSuggestions.analyzing')}</span>
                      </div>
                    ) : aiSuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {aiSuggestions.slice(0, 5).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // Search for this exercise in library
                              handleLibrarySearch(suggestion.name)
                            }}
                            disabled={isSelecting}
                            className="w-full flex items-start gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-blue-500/30 hover:border-blue-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-medium text-sm">{suggestion.name}</h4>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    suggestion.priority === 'high'
                                      ? 'bg-green-500/20 text-green-400'
                                      : suggestion.priority === 'medium'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}
                                >
                                  {t(`priority.${suggestion.priority}`)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {suggestion.rationale}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">{t('aiSuggestions.noSuggestions')}</p>
                    )}
                  </div>
                )}

                {/* Library Results */}
                <div className="flex-1 overflow-y-auto p-4">
                  {librarySearchQuery.length < 2 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">{t('library.hint')}</p>
                    </div>
                  ) : isSearchingLibrary ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : libraryResults.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">{t('library.noResults')}</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {libraryResults.map((exercise, idx) => (
                        <button
                          key={exercise.id || `exercise-${idx}`}
                          onClick={() => handleLibrarySelect(exercise)}
                          className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-left"
                        >
                          {exercise.gifUrl && (
                            <img
                              src={exercise.gifUrl}
                              alt={exercise.name}
                              className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-700"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate capitalize">{exercise.name}</h3>
                            <div className="flex gap-2 mt-1 text-xs text-gray-400">
                              <span className="px-2 py-0.5 bg-gray-700 rounded capitalize">{exercise.target}</span>
                              <span className="px-2 py-0.5 bg-gray-700 rounded capitalize">{exercise.equipment}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Photo Mode */}
            {inputMode === 'photo' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-md mx-auto space-y-4">
                  <PhotoUploader
                    onUpload={handlePhotoUpload}
                    onClear={handleClearPhoto}
                    isLoading={isExtracting || isValidatingText}
                  />

                  {isExtracting && (
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-sm text-blue-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('customInput.recognizing')}
                      </p>
                    </div>
                  )}

                  {textInput && !isExtracting && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-sm text-green-400 text-center">
                        <strong>{t('customInput.detected')}:</strong> {textInput}
                      </p>
                    </div>
                  )}

                  {/* Validation Result */}
                  {textValidationResult && (
                    <div className={cn(
                      "p-4 rounded-lg border-2",
                      textValidationResult.validation === 'approved' && "bg-green-500/10 border-green-500",
                      textValidationResult.validation === 'caution' && "bg-yellow-500/10 border-yellow-500",
                      textValidationResult.validation === 'rejected' && "bg-red-500/10 border-red-500"
                    )}>
                      <div className="flex items-start gap-2 mb-3">
                        {textValidationResult.validation === 'approved' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        {textValidationResult.validation === 'caution' && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                        {textValidationResult.validation === 'rejected' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-white">{textInput}</p>
                          <p className="text-sm text-gray-400 mt-1">{textValidationResult.reasoning}</p>
                        </div>
                      </div>
                      {(textValidationResult.validation === 'approved' || textValidationResult.validation === 'caution') && (
                        <Button
                          onClick={handleConfirmTextExercise}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          {t('customInput.addExercise')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Mode */}
            {inputMode === 'text' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={t('customInput.placeholder')}
                      value={textInput}
                      onChange={(e) => {
                        setTextInput(e.target.value)
                        setTextValidationResult(null)
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && textInput.trim().length >= 3) {
                          handleValidateTextInput(textInput)
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleValidateTextInput(textInput)}
                      disabled={!textInput.trim() || textInput.length < 3 || isValidatingText}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isValidatingText ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('customInput.validating')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('customInput.validate')}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">{t('customInput.hint')}</p>
                  </div>

                  {/* Validation Result */}
                  {textValidationResult && (
                    <div className={cn(
                      "p-4 rounded-lg border-2",
                      textValidationResult.validation === 'approved' && "bg-green-500/10 border-green-500",
                      textValidationResult.validation === 'caution' && "bg-yellow-500/10 border-yellow-500",
                      textValidationResult.validation === 'rejected' && "bg-red-500/10 border-red-500"
                    )}>
                      <div className="flex items-start gap-2 mb-3">
                        {textValidationResult.validation === 'approved' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        {textValidationResult.validation === 'caution' && <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                        {textValidationResult.validation === 'rejected' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-white">{textInput}</p>
                          <p className="text-sm text-gray-400 mt-1">{textValidationResult.reasoning}</p>
                        </div>
                      </div>
                      {(textValidationResult.validation === 'approved' || textValidationResult.validation === 'caution') && (
                        <Button
                          onClick={handleConfirmTextExercise}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          {t('customInput.addExercise')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                {t('footer')}
              </p>
            </div>
          </>
        )}

        {/* Technique Selection Step */}
        {step === 'technique' && selectedExerciseForTechnique && (
          <div className="flex-1 overflow-y-auto">
            {/* Selected Exercise Info */}
            <div className="p-4 border-b border-gray-800 bg-gray-800/50">
              <h3 className="text-lg font-semibold text-white">{selectedExerciseForTechnique.name}</h3>
              <div className="flex gap-2 mt-1 text-xs text-gray-400">
                <span className="px-2 py-0.5 bg-gray-700 rounded">
                  {selectedExerciseForTechnique.bodyPart}
                </span>
                <span className="px-2 py-0.5 bg-gray-700 rounded">
                  {selectedExerciseForTechnique.equipment}
                </span>
              </div>
            </div>

            {/* Technique Description */}
            <div className="p-4 border-b border-gray-800">
              <p className="text-sm text-gray-400">{t('techniqueStep.description')}</p>
            </div>

            {/* Selected Technique Badge */}
            {selectedTechnique && (
              <div className="p-4 border-b border-gray-800">
                <div className={cn(
                  "p-3 rounded-lg border",
                  techniqueColors[selectedTechnique.technique].bg,
                  techniqueColors[selectedTechnique.technique].border
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-5 h-5", techniqueColors[selectedTechnique.technique].text)} />
                      <span className="font-medium text-white">
                        {tTechnique(`techniques.${selectedTechnique.technique}.name`)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveSelectedTechnique}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {tTechnique('removeTechnique')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Technique Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {techniqueOptions.map((type) => {
                  const colors = techniqueColors[type]
                  const compatibility = TECHNIQUE_COMPATIBILITY[type]
                  const isSelected = selectedTechnique?.technique === type

                  return (
                    <button
                      key={type}
                      onClick={() => handleTechniqueSelect(type)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        colors.bg,
                        colors.border,
                        isSelected && "ring-2 ring-orange-500",
                        "hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={cn("w-5 h-5", colors.text)} />
                        <span className="font-medium text-white text-sm">
                          {tTechnique(`techniques.${type}.name`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {tTechnique(`techniques.${type}.brief`)}
                      </p>
                      <div className="mt-2">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border",
                            compatibility.minExperience === 'beginner' &&
                              'border-green-500/30 text-green-400 bg-green-500/10',
                            compatibility.minExperience === 'intermediate' &&
                              'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
                            compatibility.minExperience === 'advanced' &&
                              'border-red-500/30 text-red-400 bg-red-500/10'
                          )}
                        >
                          {tTechnique(`levels.${compatibility.minExperience}`)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="p-4 border-t border-gray-800 space-y-2">
              <Button
                onClick={handleConfirmWithTechnique}
                disabled={isSelecting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isSelecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : selectedTechnique ? (
                  <Zap className="w-4 h-4 mr-2" />
                ) : null}
                {selectedTechnique
                  ? t('techniqueStep.addWithTechnique')
                  : t('techniqueStep.addWithoutTechnique')
                }
              </Button>
              <p className="text-xs text-gray-500 text-center">
                {t('techniqueStep.hint')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Validation Modal */}
      {validationResult && pendingExercise && (
        <ExerciseValidationModal
          isOpen={showValidationModal}
          onClose={() => {
            setShowValidationModal(false)
            setPendingExercise(null)
            setValidationResult(null)
          }}
          onProceed={handleProceedWithExercise}
          validation={validationResult}
          exerciseName={pendingExercise.name}
        />
      )}

      {/* Exercise Animation Modal */}
      {animationModalOpen !== null && selectedExerciseForAnimation && (
        <ExerciseAnimationModal
          isOpen={true}
          onClose={() => {
            setAnimationModalOpen(null)
            setSelectedExerciseForAnimation(null)
          }}
          exerciseName={selectedExerciseForAnimation.name}
          animationUrl={selectedExerciseForAnimation.animationUrl || null}
        />
      )}
    </div>
  )
}

// Default exercises fallback (most popular compound movements)
function getDefaultExercises(): Exercise[] {
  return [
    // Chest
    { id: '1', name: 'Barbell Bench Press', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals', hasAnimation: true },
    { id: '2', name: 'Dumbbell Bench Press', bodyPart: 'chest', equipment: 'dumbbell', target: 'pectorals', hasAnimation: true },
    { id: '3', name: 'Incline Barbell Press', bodyPart: 'chest', equipment: 'barbell', target: 'upper pectorals', hasAnimation: true },
    { id: '4', name: 'Cable Fly', bodyPart: 'chest', equipment: 'cable', target: 'pectorals', hasAnimation: false },

    // Back
    { id: '5', name: 'Barbell Row', bodyPart: 'back', equipment: 'barbell', target: 'lats', hasAnimation: true },
    { id: '6', name: 'Pull-up', bodyPart: 'back', equipment: 'bodyweight', target: 'lats', hasAnimation: true },
    { id: '7', name: 'Lat Pulldown', bodyPart: 'back', equipment: 'cable', target: 'lats', hasAnimation: true },
    { id: '8', name: 'Dumbbell Row', bodyPart: 'back', equipment: 'dumbbell', target: 'lats', hasAnimation: true },

    // Legs
    { id: '9', name: 'Barbell Squat', bodyPart: 'legs', equipment: 'barbell', target: 'quadriceps', hasAnimation: true },
    { id: '10', name: 'Romanian Deadlift', bodyPart: 'legs', equipment: 'barbell', target: 'hamstrings', hasAnimation: true },
    { id: '11', name: 'Leg Press', bodyPart: 'legs', equipment: 'machine', target: 'quadriceps', hasAnimation: true },
    { id: '12', name: 'Leg Curl', bodyPart: 'legs', equipment: 'machine', target: 'hamstrings', hasAnimation: false },

    // Shoulders
    { id: '13', name: 'Overhead Press', bodyPart: 'shoulders', equipment: 'barbell', target: 'deltoids', hasAnimation: true },
    { id: '14', name: 'Dumbbell Lateral Raise', bodyPart: 'shoulders', equipment: 'dumbbell', target: 'lateral deltoids', hasAnimation: true },
    { id: '15', name: 'Face Pull', bodyPart: 'shoulders', equipment: 'cable', target: 'rear deltoids', hasAnimation: false },

    // Arms
    { id: '16', name: 'Barbell Curl', bodyPart: 'upper arms', equipment: 'barbell', target: 'biceps', hasAnimation: true },
    { id: '17', name: 'Tricep Pushdown', bodyPart: 'upper arms', equipment: 'cable', target: 'triceps', hasAnimation: true },
    { id: '18', name: 'Dumbbell Hammer Curl', bodyPart: 'upper arms', equipment: 'dumbbell', target: 'biceps', hasAnimation: false },
  ]
}
