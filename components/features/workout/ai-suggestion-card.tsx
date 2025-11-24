'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProgressionOutput } from '@/lib/types/progression'

interface AISuggestionCardProps {
    suggestion: ProgressionOutput
    setNumber: number
    onExplain: () => void
    isLoadingExplanation: boolean
    explanation?: string
    showExplanation: boolean
}

export function AISuggestionCard({
    suggestion,
    setNumber,
    onExplain,
    isLoadingExplanation,
    explanation,
    showExplanation
}: AISuggestionCardProps) {
    const t = useTranslations('workout.execution.exercise')
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-md border border-blue-100 dark:border-blue-500/30 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50">
            {/* Decorative Sparkle */}
            <div className="absolute top-0 right-0 p-3 opacity-10 dark:opacity-20">
                <Sparkles className="w-24 h-24 text-blue-500" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            {t('aiSuggestion', { number: setNumber })}
                        </span>
                    </div>

                    <button
                        onClick={onExplain}
                        disabled={isLoadingExplanation}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                        {isLoadingExplanation ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HelpCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{t('whyThisProgression')}</span>
                    </button>
                </div>

                {/* Main Stats */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                            {suggestion.suggestion.weight}<span className="text-lg font-medium text-gray-500 ml-0.5">kg</span>
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('weight')}</span>
                    </div>

                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />

                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                            {suggestion.suggestion.reps}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('reps')}</span>
                    </div>

                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />

                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                            {suggestion.suggestion.rirTarget}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RIR</span>
                    </div>
                </div>

                {/* Rationale */}
                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {suggestion.rationale}
                    </p>
                </div>

                {/* Detailed Explanation (Collapsible) */}
                {showExplanation && explanation && (
                    <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800/30 animate-in slide-in-from-top-2 fade-in">
                        <div className="flex items-start gap-2">
                            <div className="mt-1 min-w-[3px] h-full bg-blue-400 rounded-full" />
                            <p className="text-xs text-blue-800 dark:text-blue-200 italic leading-relaxed">
                                {explanation}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
