'use client'

import { X, BookOpen, TrendingUp, Users, CheckCircle } from 'lucide-react'
import type { TrainingApproach } from '@/lib/types/schemas'
import { Button } from '@/components/ui/button'

interface ApproachDetailsProps {
  approach: TrainingApproach
  onClose: () => void
}

export function ApproachDetails({ approach, onClose }: ApproachDetailsProps) {
  const variables = approach.variables as any
  const progression = approach.progression_rules as any
  const rationales = approach.rationales as any || {}

  // Determine experience level based on approach characteristics
  const getExperienceLevel = () => {
    const name = approach.name.toLowerCase()
    if (name.includes('beginner') || name.includes('starting')) {
      return { level: 'Beginner-Friendly', color: 'green', description: 'Perfect for those new to structured training' }
    } else if (name.includes('advanced') || name.includes('powerlifting')) {
      return { level: 'Advanced', color: 'red', description: 'Best suited for experienced lifters' }
    }
    return { level: 'All Levels', color: 'blue', description: 'Suitable for beginners to advanced athletes' }
  }

  const experienceLevel = getExperienceLevel()

  // Extract "perfect for" criteria
  const getPerfectForCriteria = () => {
    const criteria = []
    const name = approach.name.toLowerCase()
    const philosophy = approach.philosophy?.toLowerCase() || ''

    if (philosophy.includes('hypertrophy') || name.includes('hypertrophy')) {
      criteria.push('Building muscle mass and size')
    }
    if (philosophy.includes('strength') || name.includes('strength')) {
      criteria.push('Increasing maximal strength')
    }
    if (philosophy.includes('volume')) {
      criteria.push('Those who can handle high training volumes')
    }
    if (philosophy.includes('recovery') || philosophy.includes('sustainable')) {
      criteria.push('Sustainable long-term progress')
    }
    if (philosophy.includes('powerlifting') || name.includes('powerlifting')) {
      criteria.push('Powerlifting-specific goals')
    }
    if (philosophy.includes('general') || name.includes('balanced')) {
      criteria.push('Balanced, well-rounded development')
    }

    // Default criteria if none detected
    if (criteria.length === 0) {
      criteria.push('Structured progressive training')
      criteria.push('Evidence-based programming')
    }

    return criteria
  }

  const perfectForCriteria = getPerfectForCriteria()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {approach.name}
            </h2>
            {approach.creator && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                by {approach.creator}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Experience Level Badge */}
          <div className="flex items-center gap-2">
            <Users className={`w-5 h-5 text-${experienceLevel.color}-500`} />
            <div>
              <span className={`font-semibold text-${experienceLevel.color}-600 dark:text-${experienceLevel.color}-400`}>
                {experienceLevel.level}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {experienceLevel.description}
              </p>
            </div>
          </div>

          {/* Philosophy */}
          {approach.philosophy && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">Philosophy</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 ml-7">
                {approach.philosophy}
              </p>
            </div>
          )}

          {/* Training Variables */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Training Variables</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 ml-7">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Working Sets</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {variables?.setsPerExercise?.working || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">RIR Target</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {variables?.rirTarget?.normal || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compound Reps</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {variables?.repRanges?.compound?.join('-') || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Isolation Reps</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {variables?.repRanges?.isolation?.join('-') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Progression Strategy */}
          {progression && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                Progression Strategy
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Priority: </span>
                <span className="capitalize">{progression?.priority?.replace('_', ' ') || 'N/A'}</span>
              </p>
              {progression?.weightIncrement && (
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium">Weight Increment: </span>
                  {progression.weightIncrement.default}kg
                </p>
              )}
            </div>
          )}

          {/* Perfect For You If... */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-300">
                Perfect For You If...
              </h3>
            </div>
            <ul className="space-y-2">
              {perfectForCriteria.map((criterion, idx) => (
                <li key={idx} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  )
}
