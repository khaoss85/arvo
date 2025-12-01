export interface ProgressionInput {
  lastSet: {
    weight: number
    reps: number
    rir: number
    mentalReadiness?: number  // 1-5 scale (1=Drained, 5=Locked In)
    rpe?: number  // 1-10 scale for powerlifting (alternative to RIR)
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
  // Caloric phase context
  caloricPhase?: 'bulk' | 'cut' | 'maintenance' | null
  // Cycle fatigue context
  currentCycleFatigue?: {
    avgMentalReadiness: number | null  // Average mental readiness for current cycle
    workoutsCompleted: number  // Number of workouts completed in current cycle
  }
  // Exercise context for insight filtering
  exerciseName?: string
  // Active insights (for pain/injury awareness)
  activeInsights?: Array<{
    id: string
    exerciseName?: string
    type: string
    severity: string
    userNote: string
  }>
  // Multi-turn CoT persistence (GPT-5.1 optimization)
  previousResponseId?: string

  // Language for AI response
  locale?: 'en' | 'it'

  // === POWERLIFTING-SPECIFIC FIELDS ===
  // Training Max for percentage-based programs (Wendler, Sheiko)
  trainingMax?: number | null
  // Target RPE for RTS/DUP style training
  targetRpe?: number | null
  // Session type for Westside/Conjugate
  sessionType?: 'max_effort' | 'dynamic_effort' | 'accessory' | null
  // Current week in powerlifting cycle (1-4 for Wendler)
  cycleWeek?: 1 | 2 | 3 | 4 | null
}

export interface ProgressionOutput {
  suggestion: {
    weight: number
    reps: number
    rirTarget: number
    rpeTarget?: number  // For powerlifting RPE-based programs
    percentage?: number  // For percentage-based programs (Wendler, Sheiko)
    isAmrap?: boolean  // If this set should be AMRAP (As Many Reps As Possible)
  }
  rationale: string
  alternatives: Array<{
    weight: number
    reps: number
    focus: 'volume' | 'intensity' | 'pump' | 'speed' | 'technique'  // Added powerlifting focuses
    explanation: string
  }>
  advancedTechniqueSuggestion?: {
    technique: string  // e.g., "myoreps", "drop set", "rest-pause", "pause reps", "tempo work"
    when: string  // When to apply (e.g., "on last set", "if plateau")
    protocol: string  // How to execute
  }
  tempoReminder?: string  // Reminder about tempo requirement
  restReminder?: string  // Reminder about rest period
  insightWarnings?: Array<{
    insightId: string
    warning: string
    suggestion: string
  }>
  responseId?: string

  // === POWERLIFTING-SPECIFIC OUTPUT ===
  // For Wendler: suggest TM update after AMRAP performance
  trainingMaxSuggestion?: {
    currentTM: number
    suggestedTM: number
    reason: string  // e.g., "Hit 8 reps on 1+ set, increase TM by 5kg"
  }
}
