import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'

interface SuggestionParams {
  step: string
  userData: {
    experienceLevel?: string
    age?: number
    gender?: string
    trainingObjective?: string
    splitType?: string
    weeklyFrequency?: number
  }
  enabled?: boolean // Allow disabling the suggestion for certain cases
}

interface SuggestionResult {
  suggestion: string | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Simple in-memory cache to avoid repeated calls for same params
const cache = new Map<string, string>()

function getCacheKey(params: SuggestionParams, locale: string): string {
  return JSON.stringify({
    step: params.step,
    locale,
    experienceLevel: params.userData.experienceLevel,
    age: params.userData.age,
    gender: params.userData.gender,
    trainingObjective: params.userData.trainingObjective
  })
}

export function useAIOnboardingSuggestion(params: SuggestionParams): SuggestionResult {
  const locale = useLocale()
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { enabled = true } = params

  const fetchSuggestion = useCallback(async () => {
    if (!enabled) {
      setSuggestion(null)
      return
    }

    // Check cache first
    const cacheKey = getCacheKey(params, locale)
    const cached = cache.get(cacheKey)
    if (cached) {
      setSuggestion(cached)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step: params.step,
          userData: params.userData,
          locale
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestion: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.suggestion) {
        cache.set(cacheKey, data.suggestion)
        setSuggestion(data.suggestion)
      } else {
        setSuggestion(null)
      }
    } catch (err) {
      console.error('[useAIOnboardingSuggestion] Error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setSuggestion(null)
    } finally {
      setIsLoading(false)
    }
  }, [params, enabled, locale])

  useEffect(() => {
    fetchSuggestion()
  }, [fetchSuggestion])

  return {
    suggestion,
    isLoading,
    error,
    refetch: fetchSuggestion
  }
}
