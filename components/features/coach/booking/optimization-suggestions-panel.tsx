'use client'

/**
 * Optimization Suggestions Panel
 * Displays AI-driven calendar optimization suggestions (Anti-buchi feature)
 * Coach can accept or reject suggestions to consolidate bookings
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { format, parseISO } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import {
  X,
  Sparkles,
  Clock,
  ArrowRight,
  Check,
  XIcon,
  Loader2,
  RefreshCw,
  TrendingUp,
  User,
} from 'lucide-react'
import {
  getOptimizationSuggestionsAction,
  acceptSuggestionAction,
  rejectSuggestionAction,
  applyOptimizationAction,
  generateOptimizationsAction,
} from '@/app/actions/calendar-optimization-actions'
import type { CalendarOptimizationSuggestion, GapDetails } from '@/lib/types/schemas'

interface OptimizationSuggestionsPanelProps {
  coachId: string
  weekStartDate: string
  onClose: () => void
  onApplied: () => void
  locale?: typeof it | typeof enUS
}

export function OptimizationSuggestionsPanel({
  coachId,
  weekStartDate,
  onClose,
  onApplied,
  locale = it,
}: OptimizationSuggestionsPanelProps) {
  const t = useTranslations('coach.calendar')

  const [suggestions, setSuggestions] = useState<CalendarOptimizationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getOptimizationSuggestionsAction(coachId)

    if (result.error) {
      setError(result.error)
    } else {
      setSuggestions(result.suggestions)
    }

    setIsLoading(false)
  }, [coachId])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    const result = await generateOptimizationsAction(coachId, weekStartDate)

    if (result.error) {
      setError(result.error)
    } else if (result.suggestionsCount > 0) {
      await loadSuggestions()
    }

    setIsGenerating(false)
  }

  const handleAccept = async (suggestionId: string) => {
    setProcessingId(suggestionId)

    // First accept the suggestion
    const acceptResult = await acceptSuggestionAction(suggestionId)
    if (!acceptResult.success) {
      setError(acceptResult.error || 'Failed to accept suggestion')
      setProcessingId(null)
      return
    }

    // Then apply it (reschedule the booking)
    const applyResult = await applyOptimizationAction(suggestionId)
    if (!applyResult.success) {
      setError(applyResult.error || 'Failed to apply optimization')
    } else {
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      onApplied()
    }

    setProcessingId(null)
  }

  const handleReject = async (suggestionId: string) => {
    setProcessingId(suggestionId)

    const result = await rejectSuggestionAction(suggestionId)
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    } else {
      setError(result.error || 'Failed to reject suggestion')
    }

    setProcessingId(null)
  }

  const formatTimeChange = (suggestion: CalendarOptimizationSuggestion) => {
    const gapDetails = suggestion.gap_details as GapDetails
    const originalTime = gapDetails.originalStartTime?.slice(0, 5) || '??:??'
    const newTime = suggestion.proposed_start_time.slice(0, 5)
    return `${originalTime} → ${newTime}`
  }

  const getBenefitLabel = (score: number): string => {
    if (score >= 70) return t('optimization.highBenefit')
    if (score >= 40) return t('optimization.mediumBenefit')
    return t('optimization.lowBenefit')
  }

  const getBenefitColor = (score: number): string => {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-gray-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('optimization.suggestionsTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('optimization.description')}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : suggestions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('optimization.noSuggestions')}
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('optimization.generating')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t('optimization.analyze')}
                </>
              )}
            </button>
          </div>
        ) : (
          /* Suggestions List */
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Suggestion Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {suggestion.reason_short}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(parseISO(suggestion.proposed_date), 'EEEE d MMMM', { locale })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${getBenefitColor(suggestion.benefit_score || 50)}`}>
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {suggestion.benefit_score || 50}%
                    </span>
                  </div>
                </div>

                {/* Time Change */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-white dark:bg-gray-900 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatTimeChange(suggestion)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{(suggestion.gap_details as GapDetails).freedMinutes || 0} min
                  </span>
                </div>

                {/* Client Preference Score */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>
                    {t('optimization.clientPreference')}: {suggestion.client_preference_score || 50}%
                  </span>
                </div>

                {/* Detailed Reason */}
                {suggestion.reason_detailed && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {suggestion.reason_detailed}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(suggestion.id)}
                    disabled={processingId === suggestion.id}
                    className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  >
                    {processingId === suggestion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XIcon className="h-4 w-4" />
                        {t('optimization.reject')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAccept(suggestion.id)}
                    disabled={processingId === suggestion.id}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  >
                    {processingId === suggestion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t('optimization.accept')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with regenerate button (when suggestions exist) */}
        {!isLoading && suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('optimization.generating')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t('optimization.regenerate')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
