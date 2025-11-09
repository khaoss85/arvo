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
