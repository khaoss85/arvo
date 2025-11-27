import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rtsDupApproach = {
  name: 'RTS/DUP Autoregulated',
  creator: 'Mike Tuchscherer',
  category: 'powerlifting',
  recommended_level: 'intermediate',
  level_notes: {
    it: 'RPE autoregolato ideale per coaching, richiede capacità di auto-valutazione',
    en: 'Autoregulated RPE ideal for coaching, requires self-assessment ability'
  },
  philosophy: 'Train based on how you feel, not arbitrary percentages. The RPE (Rate of Perceived Exertion) system allows daily autoregulation while Daily Undulating Periodization (DUP) varies intensity and volume within each week. Modern, data-driven approach to strength training.',
  short_philosophy: 'Autoregulated training using RPE instead of percentages. Vary intensity daily (DUP). Let your body guide the load. Train smarter, not just harder.',

  variables: {
    setsPerExercise: {
      working: 4, // UI compatibility (average of 3-5)
      primary: '3-5 sets',
      secondary: '2-4 sets',
      accessories: '2-3 sets'
    },
    repRanges: {
      compound: [1, 5], // UI compatibility
      strength: [1, 5],
      hypertrophy: [6, 10],
      technique: [3, 6]
    },
    rirTarget: {
      normal: 2, // UI compatibility - RPE 8
      intense: 1, // RPE 9
      volume: 3, // RPE 7
      context: 'RPE drives load selection. 10 = max effort, 8 = 2 reps left'
    },
    rpeScale: {
      description: 'Rate of Perceived Exertion - how many reps left in tank',
      values: {
        10: 'Maximal effort - no reps left',
        9.5: 'Could maybe do 1 more',
        9: 'Could definitely do 1 more',
        8.5: 'Could do 1-2 more',
        8: 'Could do 2 more',
        7.5: 'Could do 2-3 more',
        7: 'Could do 3 more',
        6: 'Could do 4+ more (speed work)'
      }
    },
    restPeriods: {
      heavy: [180, 300],
      moderate: [120, 180],
      light: [90, 120]
    },
    frequency: {
      muscleGroupDays: 3,
      weeklyPattern: '3-5 days, DUP structure'
    }
  },

  progression_rules: {
    priority: 'rpe_based_load_selection',
    rules: {
      loadSelection: 'Select weight that matches target RPE for prescribed reps',
      repeatSets: 'Use fatigue percentage to calculate repeat set weights',
      fatiguePercentage: 'Typically 3-5% drop per set (e.g., after @8, next set same weight might be @8.5)',
      overloadTrigger: 'When same weight feels easier (lower RPE), increase load'
    },
    setProgression: {
      strategy: 'rpe_driven_autoregulation',
      conditions: 'Hit target RPE, adjust weight based on feel'
    },
    fatigueManagement: {
      stopSets: 'Stop additional sets when RPE exceeds target by 1+',
      backoffSets: 'Calculate weight for backoff sets using e1RM formula',
      pivotWeeks: 'Reduce volume, maintain intensity to shed fatigue'
    }
  },

  exercise_rules: {
    primaryMovements: ['squat', 'bench_press', 'deadlift'],
    secondaryMovements: {
      squat: ['Front squat', 'Pause squat', 'Pin squat', 'SSB squat'],
      bench: ['Close grip bench', 'Pause bench', 'Spoto press', 'Incline'],
      deadlift: ['Deficit deadlift', 'Block pull', 'Pause deadlift', 'RDL']
    },
    exercisesPerWorkout: {
      min: 3,
      max: 6,
      distribution: '1-2 primary lifts + 1-2 secondary + 1-2 accessories'
    },
    slotSystem: {
      description: 'Exercises organized into slots for progression tracking',
      slots: {
        competition: 'Main competition lift',
        supplemental: 'Close variation of competition lift',
        accessory: 'Supportive movements'
      }
    }
  },

  rationales: {
    'why_rpe': 'Percentages ignore daily readiness. RPE accounts for sleep, stress, recovery.',
    'why_dup': 'Varying rep ranges within week provides multiple stimuli and prevents staleness',
    'why_autoregulation': 'Better performance = more load. Bad day = appropriate reduction. Always optimal.',
    'why_fatigue_management': 'Accumulated fatigue masks fitness. Pivot blocks reveal true strength.'
  },

  periodization: {
    model: 'Daily Undulating Periodization (DUP) with Block Structure',
    cycleDuration: '4-6 weeks per development block',
    phases: {
      volumeDevelopment: {
        weeks: '4-6',
        description: 'Higher volume, moderate intensity',
        typicalRPE: [7, 8],
        repsPerSet: [5, 8],
        setsPerExercise: [4, 6],
        focus: 'Build work capacity and muscle'
      },
      intensityDevelopment: {
        weeks: '4-6',
        description: 'Moderate volume, higher intensity',
        typicalRPE: [8, 9],
        repsPerSet: [3, 5],
        setsPerExercise: [3, 5],
        focus: 'Convert muscle to strength'
      },
      peaking: {
        weeks: '2-4',
        description: 'Low volume, high intensity',
        typicalRPE: [9, 10],
        repsPerSet: [1, 3],
        setsPerExercise: [2, 4],
        focus: 'Express maximal strength'
      },
      pivot: {
        weeks: 1,
        description: 'Fatigue dissipation week',
        typicalRPE: [6, 7],
        focus: 'Reduce volume 40-60%, maintain intensity, let fatigue clear'
      }
    },
    weeklyStructure: {
      day1: { type: 'Heavy', reps: [3, 5], rpe: [8, 9] },
      day2: { type: 'Light/Speed', reps: [3, 6], rpe: [6, 7] },
      day3: { type: 'Moderate', reps: [5, 8], rpe: [7, 8] }
    }
  },

  split_variations: {
    variationStrategy: 'Frequency based on recovery and goals',
    options: {
      '3day': {
        description: 'Full body, 3x/week',
        structure: 'SBD each day at varying intensities',
        suitedFor: 'Intermediate lifters, those with limited time'
      },
      '4day': {
        description: 'Upper/Lower or Squat/Bench focus',
        structure: 'Day 1: Squat+DL, Day 2: Bench+OHP, Day 3: DL+Squat, Day 4: Bench+accessories',
        suitedFor: 'Advanced lifters seeking more frequency'
      },
      '5day': {
        description: 'High frequency, each lift 2x/week',
        structure: 'Dedicated days for each lift with varied intensities',
        suitedFor: 'Elite lifters with good recovery'
      }
    }
  },

  advanced_techniques: {
    fatigueDrops: {
      when: 'After top set to accumulate volume',
      protocol: 'Drop 5-10% and do additional sets at same target RPE',
      example: '3x5@8, then 3x5 at -5% (fatigue sets)'
    },
    singlesAtRPE8: {
      when: 'Gauge daily readiness or practice competition lift',
      protocol: 'Work up to single @8 before working sets',
      benefit: 'Calibrates daily strength without excessive fatigue'
    },
    loadDrops: {
      when: 'Accumulated fatigue too high',
      protocol: 'Reduce working weight 5-10% for a session',
      trigger: 'When prescribed RPE consistently overshoots by 1+'
    },
    e1RM: {
      description: 'Estimated 1RM from RPE and reps',
      formula: 'Weight / (1 - (0.0333 * reps * (10 - RPE)))',
      use: 'Track progress without maxing, calculate backoff weights'
    }
  },

  volume_landmarks: {
    muscleGroups: {
      quads: { mev: 8, mav: 15, mrv: 22, note: 'Squat primary driver' },
      chest: { mev: 8, mav: 14, mrv: 20, note: 'Bench + variations' },
      back: { mev: 10, mav: 18, mrv: 25, note: 'Deadlift + rows' },
      triceps: { mev: 6, mav: 12, mrv: 18, note: 'Pressing volume' },
      posterior_chain: { mev: 8, mav: 15, mrv: 22, note: 'Deadlift + accessories' }
    },
    weeklySetRanges: {
      competition_lifts: { min: 8, optimal: 12, max: 18 },
      supplemental: { min: 4, optimal: 8, max: 12 },
      accessories: { min: 4, optimal: 8, max: 14 }
    }
  },

  stimulus_to_fatigue: {
    principles: [
      'RPE 8 provides great stimulus with manageable fatigue',
      'RPE 9-10 work is highly fatiguing - use sparingly',
      'Volume at RPE 7 builds base with low fatigue cost',
      'Fatigue accumulates - track and manage with pivot weeks'
    ],
    fatigueIndicators: [
      'RPE creeping up for same weight',
      'Bar speed decreasing',
      'Motivation dropping',
      'Minor aches and pains increasing'
    ],
    solutions: {
      mildFatigue: 'Single pivot week',
      moderateFatigue: 'Reduce volume 30% for 1-2 weeks',
      severeFatigue: 'Full deload week, reassess program'
    }
  }
}

async function seed() {
  console.log('Seeding RTS/DUP Autoregulated approach...')

  try {
    const { data: existing } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'RTS/DUP Autoregulated')
      .single()

    let data, error

    if (existing) {
      console.log('RTS/DUP Autoregulated already exists with ID:', existing.id)
      console.log('Updating existing approach with latest data...')

      const result = await supabase
        .from('training_approaches')
        .update(rtsDupApproach)
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('training_approaches')
        .insert(rtsDupApproach)
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error seeding RTS/DUP approach:', error)
      process.exit(1)
    }

    console.log('RTS/DUP Autoregulated approach seeded successfully!')
    console.log('Approach ID:', data.id)
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seed()
