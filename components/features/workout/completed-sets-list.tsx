'use client'

import { useTranslations } from 'next-intl'
import { Pencil, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface CompletedSet {
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number | null
}

interface CompletedSetsListProps {
    sets: CompletedSet[]
    remainingWarmupSets: number
    targetSets: number
    onEditSet: (index: number) => void
}

export function CompletedSetsList({
    sets,
    remainingWarmupSets,
    targetSets,
    onEditSet
}: CompletedSetsListProps) {
    const t = useTranslations('workout.execution')
    const tExercise = useTranslations('workout.execution.exercise')

    if (sets.length === 0) return null

    // Mental readiness emoji mapping
    const getMentalReadinessEmoji = (value: number): { emoji: string; label: string } => {
        const emojis: Record<number, string> = {
            1: '😫',
            2: '😕',
            3: '😐',
            4: '🙂',
            5: '🔥',
        }
        const labels: Record<number, string> = {
            1: t('mentalReadiness.drained'),
            2: t('mentalReadiness.struggling'),
            3: t('mentalReadiness.neutral'),
            4: t('mentalReadiness.engaged'),
            5: t('mentalReadiness.lockedIn'),
        }
        return { emoji: emojis[value], label: labels[value] }
    }

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tExercise('completedSets')}
                </h3>
            </div>

            <div className="space-y-2">
                {sets.map((set, idx) => {
                    const mentalReadiness = set.mentalReadiness ? getMentalReadinessEmoji(set.mentalReadiness) : null
                    const isWarmup = idx + 1 <= remainingWarmupSets

                    return (
                        <div
                            key={idx}
                            className="group relative overflow-hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl p-4 transition-all hover:bg-white/60 dark:hover:bg-gray-800/60"
                        >
                            <div className="flex items-center justify-between">
                                {/* Left: Set Info */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                                            isWarmup
                                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        )}>
                                            {isWarmup
                                                ? t('setLogger.warmup', { current: idx + 1, total: remainingWarmupSets })
                                                : t('setLogger.workingSet', { current: idx + 1 - remainingWarmupSets, total: targetSets })
                                            }
                                        </span>
                                        {mentalReadiness && (
                                            <span
                                                className="text-sm grayscale-[0.3]"
                                                title={tExercise('mentalStateLabel', { state: mentalReadiness.label })}
                                            >
                                                {mentalReadiness.emoji}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            {set.weight}
                                            <span className="text-xs font-medium text-gray-500 ml-0.5">kg</span>
                                        </span>
                                        <span className="text-gray-400 mx-1">×</span>
                                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            {set.reps}
                                            <span className="text-xs font-medium text-gray-500 ml-0.5">reps</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Right: RIR & Edit */}
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">RIR</span>
                                        <span className={cn(
                                            "text-lg font-bold",
                                            set.rir <= 1 ? "text-red-500 dark:text-red-400" :
                                                set.rir <= 3 ? "text-amber-500 dark:text-amber-400" :
                                                    "text-green-500 dark:text-green-400"
                                        )}>
                                            {set.rir}
                                        </span>
                                    </div>

                                    <Button
                                        onClick={() => onEditSet(idx)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
