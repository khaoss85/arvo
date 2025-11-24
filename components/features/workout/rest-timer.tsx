'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Minus, Plus, SkipForward, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface RestTimerProps {
    restTimeRemaining: number
    originalRestSeconds: number
    onSkip: () => void
    onModify: (delta: number) => void
    defaultRestSeconds: number
}

export function RestTimer({
    restTimeRemaining,
    originalRestSeconds,
    onSkip,
    onModify,
    defaultRestSeconds
}: RestTimerProps) {
    const t = useTranslations('workout.execution.exercise')
    const [progress, setProgress] = useState(100)

    // Calculate progress percentage
    useEffect(() => {
        if (originalRestSeconds > 0) {
            const calculated = (restTimeRemaining / originalRestSeconds) * 100
            setProgress(Math.min(100, Math.max(0, calculated)))
        }
    }, [restTimeRemaining, originalRestSeconds])

    // Circular progress parameters
    const radius = 120
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="relative overflow-hidden bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-wider">{t('restPeriod')}</span>
                    </div>
                    <Button
                        onClick={onSkip}
                        variant="ghost"
                        size="sm"
                        className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10"
                    >
                        <SkipForward className="w-4 h-4 mr-1" />
                        {t('skip')}
                    </Button>
                </div>

                {/* Circular Timer */}
                <div className="relative mb-8">
                    {/* SVG Ring */}
                    <svg className="w-64 h-64 transform -rotate-90">
                        {/* Track */}
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            className="stroke-gray-200 dark:stroke-gray-800"
                            strokeWidth="8"
                            fill="none"
                        />
                        {/* Progress */}
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            className="stroke-amber-500 dark:stroke-amber-400 transition-all duration-1000 ease-linear"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Time Display (Centered) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-6xl font-black text-gray-800 dark:text-white font-mono tracking-tighter">
                            {formatTime(restTimeRemaining)}
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            {t('restSeconds', { seconds: defaultRestSeconds })}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <Button
                        onClick={() => onModify(-15)}
                        disabled={restTimeRemaining <= 15}
                        className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-0 shadow-lg transition-transform active:scale-95"
                    >
                        <Minus className="w-6 h-6" />
                    </Button>

                    <div className="min-w-[80px] text-center">
                        <span className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full",
                            restTimeRemaining !== originalRestSeconds
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                : "text-gray-400"
                        )}>
                            {restTimeRemaining !== originalRestSeconds
                                ? `${restTimeRemaining > originalRestSeconds ? '+' : ''}${restTimeRemaining - originalRestSeconds}s`
                                : t('restTimer.original')}
                        </span>
                    </div>

                    <Button
                        onClick={() => onModify(15)}
                        className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-0 shadow-lg transition-transform active:scale-95"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>

                <p className="text-xs text-gray-400 mt-6 text-center italic max-w-xs">
                    {t('restDescription')}
                </p>
            </div>
        </div>
    )
}
