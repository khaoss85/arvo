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

  // === OPTIONAL METHODOLOGY-SPECIFIC FIELDS (approach-agnostic) ===
  // These fields support diverse training methodologies (Kuba, Mentzer, FST-7, etc.)
  // All fields are optional to allow flexibility

  volumeLandmarks?: {
    // MEV (Minimum Effective Volume), MAV (Maximum Adaptive Volume), MRV (Maximum Recoverable Volume)
    muscleGroups: Record<
      string,
      {
        mev: number // sets per week
        mav: number // optimal target
        mrv: number // maximum before overtraining
      }
    >
  }

  frequencyGuidelines?: {
    // Optimal training frequency per muscle group
    minPerWeek: number // minimum for maintenance
    maxPerWeek: number // maximum recoverable
    optimalRange: [number, number] // sweet spot
    muscleSpecific?: Record<string, { min: number; max: number; optimal: [number, number] }>
  }

  romEmphasis?: {
    // Percentage distribution of exercise ROM emphasis
    lengthened: number // % of exercises emphasizing lengthened position (e.g., 60)
    shortened: number // % emphasizing shortened position (e.g., 20)
    fullRange: number // % neutral full ROM (e.g., 20)
    principles: string[] // guidelines for ROM selection
  }

  exerciseSelectionPrinciples?: {
    movementPatterns?: {
      // Categories with examples for AI generation
      horizontalPush?: string[] // e.g., ["bench press", "dumbbell press", "push-ups"]
      verticalPush?: string[] // e.g., ["overhead press", "arnold press", "pike push-ups"]
      horizontalPull?: string[] // e.g., ["barbell row", "seated cable row", "chest-supported row"]
      verticalPull?: string[] // e.g., ["pull-ups", "lat pulldown", "chin-ups"]
      squatPattern?: string[] // e.g., ["back squat", "front squat", "leg press"]
      hingePattern?: string[] // e.g., ["deadlift", "RDL", "good mornings"]
      lungePattern?: string[] // e.g., ["walking lunges", "bulgarian split squat", "step-ups"]
    }
    unilateralRequirements?: {
      minPerWorkout: number // minimum unilateral exercises
      targetMuscles: string[] // which muscles benefit most from unilateral work
      rationale: string
    }
    compoundToIsolationRatio?: {
      compound: number // percentage
      isolation: number // percentage
      rationale: string
    }
    equipmentVariations?: string[] // guidelines for equipment selection
  }

  stimulusToFatigue?: {
    principles: string[] // how to categorize exercises by S:F ratio
    highStimulusLowFatigue?: string[] // examples of exercises with great S:F ratio
    moderateStimulusFatigue?: string[] // balanced exercises
    lowStimulusHighFatigue?: string[] // systemically fatiguing exercises
    applicationGuidelines?: string // when to prioritize high S:F exercises
  }

  advancedTechniques?: Record<
    string,
    {
      when?: string // conditions for using this technique
      how?: string // execution protocol
      protocol?: string // detailed execution
      frequency?: string // how often to use
      application?: string // which exercises/muscle groups
      suitableExercises?: string[] // which exercises work best
      cautions?: string[] // warnings
      priority?: string // which muscles benefit most
      exercises?: string[] // examples
      integration?: string // how to program
    }
  >

  splitVariations?: {
    // Principles for A/B workout variations (approach-agnostic)
    variationStrategy?: string // how to differentiate workout variations
    variationLabels?: string[] // e.g., ["A", "B"] or ["Heavy", "Light", "Medium"] or ["Strength", "Hypertrophy"]
    rotationLogic?: string // how to alternate variations
  }

  periodization?: {
    mesocycleLength?: number // typical block length in weeks
    accumulationPhase?: {
      weeks: number
      volumeMultiplier: number // relative to baseline
      intensityMultiplier: number
      focus: string
    }
    intensificationPhase?: {
      weeks: number
      volumeMultiplier: number
      intensityMultiplier: number
      focus: string
      techniquesIntroduced?: string[] // rest-pause, drop sets, etc.
    }
    deloadPhase?: {
      frequency: string // "every 4-6 weeks"
      volumeReduction: number // percentage
      intensityMaintenance: string
      duration: string
    }
  }
}
