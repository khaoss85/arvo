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

const sheikoApproach = {
  name: 'Sheiko',
  creator: 'Boris Sheiko',
  category: 'powerlifting',
  recommended_level: 'intermediate',
  level_notes: {
    it: 'Alto volume tecnico, richiede tempo e buona base di movimento',
    en: 'High technical volume, requires time commitment and solid movement base'
  },
  philosophy: 'Technical mastery through high frequency and moderate intensity. Perfect practice makes perfect. The Russian system emphasizes volume accumulation at submaximal weights, training the competitive lifts multiple times per week with impeccable form. Strength is a skill that must be practiced.',
  short_philosophy: 'High volume, moderate intensity, technical perfection. Train the big 3 multiple times per week. Never miss reps. Build strength through accumulated quality work.',

  variables: {
    setsPerExercise: {
      working: 5, // UI compatibility (average of 4-8)
      competition_lifts: '4-8 sets',
      accessories: '3-5 sets',
      context: 'Multiple lifts per session, lower sets per exercise'
    },
    repRanges: {
      compound: [1, 5], // UI compatibility
      competition_lifts: [1, 5],
      accessories: [4, 10]
    },
    rirTarget: {
      normal: 2, // UI compatibility - Never grind
      intense: 1,
      deload: 3,
      context: 'Every rep should be technically perfect. Stop before form breaks down.'
    },
    restPeriods: {
      heavy_singles: [180, 300],
      work_sets: [120, 180],
      accessories: [60, 120]
    },
    intensity: {
      averageIntensity: {
        percentage: [68, 72],
        description: 'Average intensity across all lifts'
      },
      typicalSession: {
        light: '60-70%',
        medium: '70-80%',
        heavy: '80-90%',
        maxEffort: '90%+ (rare, competition prep only)'
      }
    },
    volume: {
      monthlyLifts: '400-600 total lifts on big 3',
      weeklyBreakdown: {
        squat: '50-80 lifts',
        bench: '70-100 lifts',
        deadlift: '30-50 lifts'
      }
    },
    frequency: {
      muscleGroupDays: 4, // Each lift 3-4x per week
      weeklyPattern: '3-4 days, multiple lifts per session'
    }
  },

  progression_rules: {
    priority: 'volume_accumulation',
    rules: {
      volumeProgression: 'Gradually increase total monthly lifts',
      intensityProgression: 'Increase average intensity as competition approaches',
      noMissedReps: 'If you miss a rep, weight is too heavy',
      techniqueFocus: 'Every rep looks the same - competition standard'
    },
    setProgression: {
      strategy: 'block_periodization',
      conditions: 'Progress through prep blocks towards competition'
    }
  },

  exercise_rules: {
    competitionLifts: ['squat', 'bench_press', 'deadlift'],
    variations: {
      squat: ['Pause squat', 'Pin squat', 'Box squat', 'Tempo squat'],
      bench: ['Pause bench', 'Close grip', 'Feet up bench', 'Tempo bench'],
      deadlift: ['Deficit deadlift', 'Block pull', 'Pause deadlift', 'Snatch grip DL']
    },
    accessories: {
      squat: ['Good mornings', 'Leg press', 'Lunges', 'Back extensions'],
      bench: ['Dumbbell press', 'Dips', 'Tricep extensions', 'Rows'],
      deadlift: ['Romanian DL', 'Back extensions', 'Rows', 'Lat pulldown']
    },
    exercisesPerWorkout: {
      min: 4,
      max: 7,
      distribution: '2-3 competition lifts + 2-4 accessories per session'
    }
  },

  rationales: {
    'why_high_frequency': 'Strength is a skill - more practice = better technique',
    'why_submaximal': 'Training at 70% for 1000 reps builds more strength than 95% for 100 reps',
    'why_no_failure': 'Missed reps create bad motor patterns. Always succeed.',
    'why_volume': 'Total work done over time is the primary driver of strength'
  },

  periodization: {
    model: 'Block Periodization',
    cycleDuration: '12-16 weeks to competition',
    phases: {
      prep1: {
        weeks: 4,
        description: 'Accumulation - High volume, moderate intensity',
        averageIntensity: 68,
        focus: 'Build base, perfect technique, increase work capacity',
        characteristics: ['Higher rep sets (3-5)', 'More accessory work', 'Lower peak intensity']
      },
      prep2: {
        weeks: 4,
        description: 'Transmutation - Moderate volume, increasing intensity',
        averageIntensity: 72,
        focus: 'Transition to heavier weights, maintain volume',
        characteristics: ['More doubles and triples', 'Introduce singles', 'Peak intensity increases']
      },
      competition: {
        weeks: 4,
        description: 'Realization - Reduce volume, peak intensity',
        averageIntensity: 78,
        focus: 'Sharpen for competition, hit openers',
        characteristics: ['Singles and doubles', 'Reduced accessory', 'Max attempts last 2 weeks']
      },
      taper: {
        weeks: '1-2',
        description: 'Taper before competition',
        focus: 'Rest and recovery, maintain neural sharpness'
      }
    }
  },

  split_variations: {
    variationStrategy: 'Multiple lifts per session, rotating primary focus',
    variationLabels: ['A', 'B', 'C'],
    programs: {
      '#29': {
        level: 'Class III/II (Intermediate)',
        sessions: 3,
        description: 'Foundation program for intermediate lifters'
      },
      '#30': {
        level: 'Class I (Advanced)',
        sessions: 3,
        description: 'Higher volume for advanced lifters'
      },
      '#31': {
        level: 'CMS/MS (Elite)',
        sessions: 4,
        description: 'Elite program with very high volume'
      },
      '#32': {
        level: 'Universal',
        sessions: 4,
        description: 'Competition prep cycle'
      }
    },
    typicalWeek: {
      day1: 'Squat + Bench',
      day2: 'Deadlift + Bench accessories',
      day3: 'Squat + Bench',
      day4: 'Deadlift (optional)'
    }
  },

  advanced_techniques: {
    pauseWork: {
      when: 'Regular training - builds strength off chest/in hole',
      protocol: '2-3 second pauses at sticking point',
      exercises: ['Pause squat', 'Pause bench', 'Pause deadlift']
    },
    tempoWork: {
      when: 'Technique refinement phases',
      protocol: '3-5 second eccentric, controlled concentric',
      benefit: 'Builds muscle awareness and control'
    },
    chainVariations: {
      when: 'Assistance work',
      protocol: 'Band or chain work for variety',
      note: 'Less common than Westside, used sparingly'
    }
  },

  volume_landmarks: {
    muscleGroups: {
      quads: { mev: 12, mav: 20, mrv: 30, note: 'High squat frequency' },
      chest: { mev: 15, mav: 25, mrv: 35, note: 'Highest bench frequency' },
      back: { mev: 12, mav: 20, mrv: 28, note: 'Deadlift + rowing' },
      triceps: { mev: 10, mav: 18, mrv: 26, note: 'Bench + accessories' },
      posterior_chain: { mev: 10, mav: 18, mrv: 26, note: 'Deadlift + good mornings' }
    },
    weeklyLifts: {
      squat: { min: 50, optimal: 70, max: 90 },
      bench: { min: 70, optimal: 90, max: 120 },
      deadlift: { min: 30, optimal: 40, max: 60 }
    }
  },

  stimulus_to_fatigue: {
    principles: [
      'High frequency allows lower per-session volume',
      'Submaximal weights dont accumulate as much fatigue',
      'Technique work is relatively low fatigue',
      'Deadlift trained less frequently due to high fatigue cost'
    ],
    recommendations: {
      squat_frequency: '3-4x per week',
      bench_frequency: '3-4x per week',
      deadlift_frequency: '1-2x per week',
      accessory_volume: 'Moderate - dont interfere with main lifts'
    }
  }
}

async function seed() {
  console.log('Seeding Sheiko approach...')

  try {
    const { data: existing } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'Sheiko')
      .single()

    let data, error

    if (existing) {
      console.log('Sheiko already exists with ID:', existing.id)
      console.log('Updating existing approach with latest data...')

      const result = await supabase
        .from('training_approaches')
        .update(sheikoApproach)
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('training_approaches')
        .insert(sheikoApproach)
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error seeding Sheiko approach:', error)
      process.exit(1)
    }

    console.log('Sheiko approach seeded successfully!')
    console.log('Approach ID:', data.id)
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seed()
