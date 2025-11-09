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
}
