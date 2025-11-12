'use client'

import { useState, useEffect } from 'react'
import { X, Search, Dumbbell, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: Exercise) => Promise<void>
  currentWorkoutType?: string
  excludeExercises?: string[] // Exercise names to exclude (already in workout)
}

/**
 * Modal for selecting an exercise to add to the workout
 *
 * Phase 1: Basic search and selection
 * Phase 2: Will add AI suggestions at the top
 */
export function AddExerciseModal({
  isOpen,
  onClose,
  onSelectExercise,
  currentWorkoutType = 'push',
  excludeExercises = [],
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  const handleSelectExercise = async (exercise: Exercise) => {
    setIsSelecting(true)
    try {
      await onSelectExercise(exercise)
      onClose()
    } catch (error) {
      console.error('Error selecting exercise:', error)
      alert('Failed to add exercise. Please try again.')
    } finally {
      setIsSelecting(false)
    }
  }

  const categories = [
    { id: 'all', label: 'All', icon: Dumbbell },
    { id: 'chest', label: 'Chest', icon: Target },
    { id: 'back', label: 'Back', icon: Target },
    { id: 'legs', label: 'Legs', icon: Target },
    { id: 'shoulders', label: 'Shoulders', icon: Target },
    { id: 'arms', label: 'Arms', icon: Target },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Exercise</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No exercises found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or category</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  disabled={isSelecting}
                  className="flex items-start gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{exercise.name}</h3>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-700 rounded">
                        {exercise.bodyPart || 'General'}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded">
                        {exercise.equipment || 'Any'}
                      </span>
                      {exercise.target && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          {exercise.target}
                        </span>
                      )}
                    </div>
                  </div>
                  {exercise.hasAnimation && (
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Animation
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            ESC to close • Select an exercise to add it to your workout
          </p>
        </div>
      </div>
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
