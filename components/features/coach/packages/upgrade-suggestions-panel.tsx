'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Loader2, X, MessageSquare, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  getPendingUpgradeSuggestionsAction,
  dismissUpgradeSuggestionAction,
  markSuggestionSentAction,
} from '@/app/actions/package-upgrade-actions'
import type { UpgradeSuggestionWithDetails } from '@/lib/types/schemas'
import { cn } from '@/lib/utils/cn'

interface UpgradeSuggestionsPanelProps {
  className?: string
  onCountChange?: (count: number) => void
}

export function UpgradeSuggestionsPanel({ className, onCountChange }: UpgradeSuggestionsPanelProps) {
  const t = useTranslations('packages.upgrade')
  const { user } = useAuthStore()

  const [suggestions, setSuggestions] = useState<UpgradeSuggestionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadSuggestions = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getPendingUpgradeSuggestionsAction()
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions)
        onCountChange?.(result.suggestions.length)
      }
    } catch (error) {
      console.error('[UpgradeSuggestionsPanel] Error loading suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, onCountChange])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const handleDismiss = async (suggestionId: string) => {
    setProcessingId(suggestionId)
    try {
      const result = await dismissUpgradeSuggestionAction(suggestionId)
      if (result.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        onCountChange?.(suggestions.length - 1)
      }
    } catch (error) {
      console.error('[UpgradeSuggestionsPanel] Error dismissing suggestion:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSendMessage = async (suggestionId: string) => {
    setProcessingId(suggestionId)
    try {
      const result = await markSuggestionSentAction(suggestionId)
      if (result.success) {
        // Update the suggestion status in the list
        setSuggestions(prev =>
          prev.map(s =>
            s.id === suggestionId ? { ...s, status: 'sent' as const } : s
          )
        )
      }
    } catch (error) {
      console.error('[UpgradeSuggestionsPanel] Error marking suggestion as sent:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t('noPending')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">{t('title')}</h3>
          </div>
          <Badge variant="outline">{suggestions.length}</Badge>
        </div>

        {/* Suggestions List */}
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const isProcessing = processingId === suggestion.id

            return (
              <div
                key={suggestion.id}
                className="border rounded-lg p-4 space-y-3 bg-background"
              >
                {/* Suggestion Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{suggestion.client_name}</span>
                      {suggestion.status === 'sent' && (
                        <Badge variant="secondary" className="text-xs">
                          {t('sent')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('completedFast', {
                        sessions: suggestion.current_sessions,
                        days: suggestion.days_to_complete,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-lg font-bold">{suggestion.suggested_sessions}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('suggestedSessions')}</p>
                  </div>
                </div>

                {/* Suggestion Info */}
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-sm">
                    {t('suggest', { sessions: suggestion.suggested_sessions })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        {t('dismiss')}
                      </>
                    )}
                  </Button>
                  {suggestion.status !== 'sent' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendMessage(suggestion.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {t('sendMessage')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
