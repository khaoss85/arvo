/**
 * AI Metrics Tracking System
 *
 * Tracks success rates, retry counts, and failure reasons for AI generation tasks.
 * Used to measure the impact of prompt optimizations and identify bottlenecks.
 */

export type AIMetricEvent = {
  agentName: string
  operationType: 'workout_generation' | 'split_planning' | 'equipment_validation' | 'exercise_suggestion' | 'other'
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
  model?: string  // e.g., 'gpt-5-mini', 'gpt-5.1'
  attemptNumber: number
  maxAttempts: number
  success: boolean
  latencyMs: number
  failureReason?: string
  validationErrors?: string[]
  timestamp: string
}

export type AIMetricsSummary = {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageAttempts: number
  averageLatencyMs: number
  failureReasons: Record<string, number>
  byReasoningEffort: Record<string, {
    requests: number
    successRate: number
    avgLatency: number
    avgAttempts: number
  }>
}

class AIMetricsCollector {
  private events: AIMetricEvent[] = []
  private enabled: boolean = true

  /**
   * Enable or disable metrics collection
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * Track an AI generation attempt
   */
  track(event: AIMetricEvent) {
    if (!this.enabled) return

    this.events.push(event)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = event.success ? '✅' : '❌'
      const modelInfo = event.model ? ` | ${event.model}` : ''
      console.log(`${emoji} [AI_METRICS] ${event.agentName} | Attempt ${event.attemptNumber}/${event.maxAttempts} | ${event.latencyMs}ms | ${event.reasoningEffort}${modelInfo}`, {
        success: event.success,
        failureReason: event.failureReason,
        validationErrors: event.validationErrors
      })
    }

    // Keep only last 1000 events in memory to avoid memory leak
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  /**
   * Get summary statistics for a specific time window
   * @param minutesAgo - Number of minutes to look back (default: all time)
   */
  getSummary(minutesAgo?: number): AIMetricsSummary {
    let filteredEvents = this.events

    if (minutesAgo) {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
      filteredEvents = this.events.filter(e => e.timestamp >= cutoffTime)
    }

    if (filteredEvents.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 0,
        averageAttempts: 0,
        averageLatencyMs: 0,
        failureReasons: {},
        byReasoningEffort: {}
      }
    }

    // Group events by unique request (based on agent + timestamp proximity)
    const requestGroups: AIMetricEvent[][] = []
    let currentGroup: AIMetricEvent[] = []

    for (const event of filteredEvents) {
      if (event.attemptNumber === 1) {
        if (currentGroup.length > 0) {
          requestGroups.push(currentGroup)
        }
        currentGroup = [event]
      } else {
        currentGroup.push(event)
      }
    }
    if (currentGroup.length > 0) {
      requestGroups.push(currentGroup)
    }

    // Calculate metrics
    const totalRequests = requestGroups.length
    const successfulRequests = requestGroups.filter(group =>
      group.some(e => e.success)
    ).length
    const failedRequests = totalRequests - successfulRequests

    const totalAttempts = filteredEvents.length
    const totalLatency = filteredEvents.reduce((sum, e) => sum + e.latencyMs, 0)

    // Collect failure reasons
    const failureReasons: Record<string, number> = {}
    filteredEvents.filter(e => !e.success && e.failureReason).forEach(e => {
      const reason = e.failureReason!
      failureReasons[reason] = (failureReasons[reason] || 0) + 1
    })

    // Group by reasoning effort
    const byReasoningEffort: Record<string, {
      requests: number
      successRate: number
      avgLatency: number
      avgAttempts: number
    }> = {}

    for (const effort of ['minimal', 'low', 'medium', 'high'] as const) {
      const effortGroups = requestGroups.filter(group =>
        group[0].reasoningEffort === effort
      )

      if (effortGroups.length === 0) continue

      const effortEvents = filteredEvents.filter(e => e.reasoningEffort === effort)
      const effortSuccesses = effortGroups.filter(group =>
        group.some(e => e.success)
      ).length

      byReasoningEffort[effort] = {
        requests: effortGroups.length,
        successRate: effortSuccesses / effortGroups.length,
        avgLatency: effortEvents.reduce((sum, e) => sum + e.latencyMs, 0) / effortEvents.length,
        avgAttempts: effortEvents.length / effortGroups.length
      }
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: successfulRequests / totalRequests,
      averageAttempts: totalAttempts / totalRequests,
      averageLatencyMs: totalLatency / totalAttempts,
      failureReasons,
      byReasoningEffort
    }
  }

  /**
   * Get detailed breakdown of first-attempt success rate
   * This is the key metric for measuring prompt quality
   */
  getFirstAttemptSuccessRate(minutesAgo?: number): {
    firstAttemptSuccessRate: number
    totalFirstAttempts: number
    successfulFirstAttempts: number
    byReasoningEffort: Record<string, number>
  } {
    let filteredEvents = this.events.filter(e => e.attemptNumber === 1)

    if (minutesAgo) {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
      filteredEvents = filteredEvents.filter(e => e.timestamp >= cutoffTime)
    }

    const totalFirstAttempts = filteredEvents.length
    const successfulFirstAttempts = filteredEvents.filter(e => e.success).length

    const byReasoningEffort: Record<string, number> = {}
    for (const effort of ['minimal', 'low', 'medium', 'high'] as const) {
      const effortEvents = filteredEvents.filter(e => e.reasoningEffort === effort)
      const effortSuccesses = effortEvents.filter(e => e.success).length
      byReasoningEffort[effort] = effortEvents.length > 0
        ? effortSuccesses / effortEvents.length
        : 0
    }

    return {
      firstAttemptSuccessRate: totalFirstAttempts > 0
        ? successfulFirstAttempts / totalFirstAttempts
        : 0,
      totalFirstAttempts,
      successfulFirstAttempts,
      byReasoningEffort
    }
  }

  /**
   * Clear all metrics (useful for testing or resetting baseline)
   */
  clear() {
    this.events = []
  }

  /**
   * Export metrics to JSON for analysis
   */
  export(): AIMetricEvent[] {
    return [...this.events]
  }
}

// Singleton instance
export const aiMetrics = new AIMetricsCollector()

/**
 * Helper to determine operation type from agent name
 */
export function getOperationType(agentName: string): AIMetricEvent['operationType'] {
  if (agentName.includes('ExerciseSelector')) return 'workout_generation'
  if (agentName.includes('SplitPlanner')) return 'split_planning'
  if (agentName.includes('EquipmentValidator')) return 'equipment_validation'
  if (agentName.includes('ExerciseSuggester')) return 'exercise_suggestion'
  return 'other'
}
