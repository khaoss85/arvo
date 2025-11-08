export interface ProgressionInput {
  lastSet: {
    weight: number
    reps: number
    rir: number
  }
  setNumber: number
  exerciseType: 'compound' | 'isolation'
  approachId: string
  // User demographics for personalized progression
  experienceYears?: number | null
  userAge?: number | null
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
}
