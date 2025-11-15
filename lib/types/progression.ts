export interface ProgressionInput {
  lastSet: {
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number  // 1-5 scale (1=Drained, 5=Locked In)
  }
  setNumber: number
  exerciseType: 'compound' | 'isolation'
  approachId: string
  // User demographics for personalized progression
  experienceYears?: number | null
  userAge?: number | null
  // Periodization context
  mesocycleWeek?: number | null
  mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition' | null
  // Exercise context for insight filtering
  exerciseName?: string
  // Active insights (NEW - for pain/injury awareness)
  activeInsights?: Array<{
    id: string
    exerciseName?: string
    type: string
    severity: string
    userNote: string
  }>
  // Multi-turn CoT persistence (GPT-5.1 optimization)
  // Pass response ID from previous set for +4.3% accuracy, -30-50% CoT tokens
  previousResponseId?: string
}

export interface ProgressionOutput {
  suggestion: {
    weight: number
    reps: number
    rirTarget: number
  }
  rationale: string
  alternatives: Array<{
    weight: number
    reps: number
    focus: 'volume' | 'intensity' | 'pump'
    explanation: string
  }>
  advancedTechniqueSuggestion?: {
    technique: string  // e.g., "myoreps", "drop set", "rest-pause"
    when: string  // When to apply (e.g., "on last set", "if plateau")
    protocol: string  // How to execute
  }
  tempoReminder?: string  // Reminder about tempo requirement (e.g., "Maintain 3-1-1-1 tempo")
  restReminder?: string  // Reminder about rest period (e.g., "Rest 150-180s before next set")
  // Insight warnings (NEW - safety alerts)
  insightWarnings?: Array<{
    insightId: string
    warning: string
    suggestion: string
  }>
  // Response ID for multi-turn CoT persistence (return to caller for next set)
  responseId?: string
}
