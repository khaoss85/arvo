export interface HydrationInput {
  // Timing
  workoutDurationMs: number  // Milliseconds since workout started

  // Volume tracking
  totalSetsCompleted: number
  currentSetNumber: number

  // Intensity indicators
  lastSetRIR?: number  // 0-5 scale
  mentalReadiness?: number  // 1-5 scale (1=Drained, 5=Locked In)

  // Exercise context
  exerciseType: 'compound' | 'isolation'
  exerciseName?: string
  muscleGroups: {
    primary: string[]  // e.g., ['Quadriceps', 'Glutes']
    secondary: string[]  // e.g., ['Hamstrings', 'Calves']
  }

  // Rest context
  restSeconds: number  // Current rest period between sets

  // Dismissal tracking (session-based)
  lastDismissedAt?: Date | null  // When user last dismissed hydration reminder
}

export interface HydrationOutput {
  // Core decision
  shouldSuggest: boolean  // Should we show the hydration reminder?

  // Messaging type
  messageType: 'normal' | 'smallSipsOnly'  // 'smallSipsOnly' for compound legs (anti-nausea)

  // Confidence and urgency
  confidence: 'high' | 'medium' | 'low'
  urgency: 'normal' | 'important' | 'critical'

  // User-facing content
  reason: string  // Brief explanation for suggestion (already i18n-aware from AI)
  waterAmount?: string  // e.g., "200-250ml", "Small sips (50-100ml)"

  // Internal tracking
  nextCheckInMinutes?: number  // When to check again (e.g., 10, 15, 20)
}
