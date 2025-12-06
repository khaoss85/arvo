"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Clock, Calendar, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// =====================================================
// Types
// =====================================================

export interface AISlotSuggestion {
  dayOfWeek: number
  dayName: string
  time: string
  confidence: number
  reason: string
}

interface AISuggestionsPanelProps {
  suggestions: AISlotSuggestion[]
  onConfirm: (slots: AISlotSuggestion[]) => Promise<void>
  onSavePackageOnly: () => void
  isLoading?: boolean
}

// =====================================================
// Component
// =====================================================

export function AISuggestionsPanel({
  suggestions,
  onConfirm,
  onSavePackageOnly,
  isLoading = false
}: AISuggestionsPanelProps) {
  const t = useTranslations('coach.packages')
  const [selectedSlots, setSelectedSlots] = useState<AISlotSuggestion[]>(suggestions)
  const [confirming, setConfirming] = useState(false)

  const toggleSlot = (slot: AISlotSuggestion) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.dayOfWeek === slot.dayOfWeek && s.time === slot.time)
      if (exists) {
        return prev.filter(s => !(s.dayOfWeek === slot.dayOfWeek && s.time === slot.time))
      }
      return [...prev, slot]
    })
  }

  const isSelected = (slot: AISlotSuggestion) => {
    return selectedSlots.some(s => s.dayOfWeek === slot.dayOfWeek && s.time === slot.time)
  }

  const handleConfirm = async () => {
    if (selectedSlots.length === 0) return
    setConfirming(true)
    try {
      await onConfirm(selectedSlots)
    } finally {
      setConfirming(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
    return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-sm text-purple-700 dark:text-purple-300">
            Analyzing availability patterns...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h4 className="font-medium text-purple-900 dark:text-purple-100">
          {t('suggestedSlots')}
        </h4>
      </div>

      {/* Suggestions List */}
      <div className="space-y-2">
        {suggestions.map((slot, index) => (
          <button
            key={`${slot.dayOfWeek}-${slot.time}`}
            onClick={() => toggleSlot(slot)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
              isSelected(slot)
                ? "bg-purple-100 dark:bg-purple-900/40 border-purple-500"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300"
            )}
          >
            <div className="flex items-center gap-3">
              {/* Selection indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected(slot)
                  ? "bg-purple-500 border-purple-500"
                  : "border-gray-300 dark:border-gray-600"
              )}>
                {isSelected(slot) && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Day and time */}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {slot.dayName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {slot.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence and reason */}
            <div className="text-right">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                getConfidenceColor(slot.confidence)
              )}>
                {slot.confidence}%
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[150px]">
                {slot.reason}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSavePackageOnly}
          disabled={confirming}
          className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {t('savePackageOnly')}
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedSlots.length === 0 || confirming}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {confirming && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('confirmAndCreate')}
        </button>
      </div>

      {/* Selected count */}
      {selectedSlots.length > 0 && (
        <p className="text-xs text-center text-purple-600 dark:text-purple-400">
          {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
