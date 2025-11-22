'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface AISuggestionCardProps {
  suggestion: string | null
  isLoading: boolean
  className?: string
}

export function AISuggestionCard({ suggestion, isLoading, className }: AISuggestionCardProps) {
  // Don't render if no suggestion and not loading
  if (!isLoading && !suggestion) {
    return null
  }

  return (
    <Card
      className={cn(
        'border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800',
        'animate-in fade-in-50 slide-in-from-top-2 duration-500',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* AI Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5">
              AI Coach Suggestion
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-full" />
                <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-5/6" />
                <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-4/6" />
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {suggestion}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
