export interface TrainingApproach {
  id: string
  name: string // "Kuba Method"
  creator: string
  philosophy: string

  variables: {
    setsPerExercise: {
      working: number // 2 for Kuba
      warmup: string // "2-3 gradual"
    }
    repRanges: {
      compound: [number, number] // [6, 10]
      isolation: [number, number] // [10, 15]
    }
    rirTarget: {
      normal: number // 1
      intense: number // 0
      deload: number // 3
    }
    restPeriods: {
      compound: [number, number] // [150, 180] seconds
      isolation: [number, number] // [90, 120]
      autoRegulation: string // "based on breathing normalization"
    }
    tempo: {
      eccentric: number // 3
      pauseBottom: number // 1
      concentric: number // 1
      pauseTop: number // 1
    }
    frequency: {
      muscleGroupDays: number // 4
      weeklyPattern: string // "3 on 1 off rotating"
    }
  }

  progression: {
    priority: 'reps_first' | 'load_first' | 'density_first'
    rules: {
      whenToAddWeight: string
      weightIncrements: number[]
      deloadTriggers: string[]
    }
    setProgression: {
      strategy: 'maintain_weight_add_reps' | 'increase_weight' | 'drop_weight_add_reps'
      conditions: string
    }
  }

  exerciseSelection: {
    priorityRules: string[]
    exercisesPerWorkout: {
      min: number
      max: number
      distribution: string
    }
    substitutionRules: {
      whenToSubstitute: string[]
      howToAdjustLoad: string
    }
  }

  rationales: Record<string, string>
}
