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

const westsideApproach = {
  name: 'Westside/Conjugate',
  creator: 'Louie Simmons',
  category: 'powerlifting',
  recommended_level: 'advanced',
  level_notes: {
    it: 'Per atleti equipped con esperienza, richiede conoscenza di bande/catene',
    en: 'For equipped athletes with experience, requires bands/chains knowledge'
  },
  philosophy: 'Train multiple qualities simultaneously through Max Effort and Dynamic Effort methods. Rotate exercises frequently to avoid accommodation and continuously break PRs. The system develops maximal strength, explosive power, and work capacity concurrently.',
  short_philosophy: 'Max Effort + Dynamic Effort method. Rotate main exercises weekly to avoid staleness. Train speed and strength separately. Built for breaking PRs year-round.',

  variables: {
    setsPerExercise: {
      working: 3, // UI compatibility (average)
      maxEffort: '1-3 (work up to max)',
      dynamicEffort: '8-12 sets of 2-3 reps',
      accessory: '3-5 sets'
    },
    repRanges: {
      compound: [1, 3], // UI compatibility
      maxEffort: [1, 3],
      dynamicEffort: [2, 3],
      accessory: [6, 20]
    },
    rirTarget: {
      normal: 0, // UI compatibility (ME is max effort)
      maxEffort: 0, // True max effort (no reps left in tank)
      dynamicEffort: 2, // Speed focus, not grinding
      accessory: 2,
      context: 'ME days are true maxes, DE days focus on bar speed not grinding'
    },
    restPeriods: {
      maxEffort: [180, 300],
      dynamicEffort: [45, 60], // Short rest for speed work
      accessory: [60, 120]
    },
    intensity: {
      maxEffort: {
        description: 'Work up to 1-3RM',
        percentages: [90, 100], // Or PR attempt
        method: 'Singles, doubles, or triples to max'
      },
      dynamicEffort: {
        squat: { sets: 12, reps: 2, percentage: [50, 60], rest: '45-60s' },
        bench: { sets: 9, reps: 3, percentage: [50, 60], rest: '30-45s' },
        accommodatingResistance: 'Add 25% band/chain tension at top'
      }
    },
    frequency: {
      muscleGroupDays: 2, // Upper 2x, Lower 2x
      weeklyPattern: '4 days: ME Lower, ME Upper, DE Lower, DE Upper'
    }
  },

  progression_rules: {
    priority: 'exercise_rotation',
    rules: {
      exerciseRotation: 'Change main ME exercise every 1-3 weeks',
      waveProgression: 'DE percentages wave over 3-week cycles (50-55-60%)',
      prTracking: 'Track PR for each exercise variation',
      accommodatingResistance: 'Increase band/chain tension, not bar weight on DE'
    },
    setProgression: {
      strategy: 'wave_with_rotation',
      conditions: 'If you miss a weight twice, rotate to new exercise'
    }
  },

  exercise_rules: {
    maxEffortVariations: {
      squat: [
        'Box squat', 'Safety bar squat', 'Front squat', 'Pause squat',
        'Cambered bar squat', 'Chain squat', 'Band squat', 'Zercher squat'
      ],
      bench: [
        'Floor press', 'Board press (2/3/4 board)', 'Close grip bench',
        'Incline press', 'Swiss bar press', 'Reverse band bench', 'Chain bench'
      ],
      deadlift: [
        'Deficit deadlift', 'Block pull', 'Sumo deadlift', 'Conventional deadlift',
        'Good morning', 'Stiff leg deadlift', 'Trap bar deadlift'
      ]
    },
    exercisesPerWorkout: {
      min: 4,
      max: 7,
      distribution: '1 main lift + 3-6 accessory exercises'
    },
    accessoryPriorities: {
      lower: ['Hamstrings', 'Glutes', 'Lower back', 'Abs'],
      upper: ['Triceps', 'Lats', 'Upper back', 'Shoulders', 'Biceps']
    }
  },

  rationales: {
    'why_max_effort': 'Training at 90%+ develops maximal strength and neural efficiency',
    'why_dynamic_effort': 'Speed training develops rate of force development and starting strength',
    'why_rotation': 'Prevents accommodation - the body adapts to exercises in 2-3 weeks',
    'why_accommodating_resistance': 'Bands/chains match strength curve and develop lockout power'
  },

  periodization: {
    model: 'Conjugate/Concurrent Periodization',
    cycleDuration: 'Ongoing with weekly variation',
    phases: {
      weekly: {
        day1: { name: 'Max Effort Lower', focus: 'Squat/DL variation to max' },
        day2: { name: 'Max Effort Upper', focus: 'Bench variation to max' },
        day3: { name: 'Dynamic Effort Lower', focus: 'Speed squats + accessories' },
        day4: { name: 'Dynamic Effort Upper', focus: 'Speed bench + accessories' }
      },
      deWave: {
        week1: { percentage: 50, bands: 'Light' },
        week2: { percentage: 55, bands: 'Medium' },
        week3: { percentage: 60, bands: 'Heavy' }
      }
    },
    deload: {
      frequency: 'As needed based on feel',
      method: 'Reduce ME to 90%, reduce DE sets'
    }
  },

  split_variations: {
    variationStrategy: 'Fixed 4-day split with rotating exercise selection',
    variationLabels: ['ME Lower', 'ME Upper', 'DE Lower', 'DE Upper'],
    rotationLogic: 'Same day structure each week, different main exercise each week',
    popularSchedules: {
      standard: 'Mon: ME Squat, Wed: ME Bench, Fri: DE Squat, Sat: DE Bench',
      alternative: 'Sun: ME Lower, Mon: ME Upper, Thu: DE Lower, Fri: DE Upper'
    }
  },

  advanced_techniques: {
    bands: {
      when: 'Dynamic Effort days and some Max Effort work',
      protocol: 'Add 25% of bar weight in band tension at top',
      benefits: 'Accommodates strength curve, develops lockout'
    },
    chains: {
      when: 'Both ME and DE days',
      protocol: '10-15% of bar weight in chains',
      benefits: 'Progressive overload through ROM'
    },
    specialExercises: {
      reverseHyper: 'Essential for posterior chain and spinal health',
      gluteHamRaise: 'Primary hamstring developer',
      boxSquat: 'Develops hip power and teaches proper squat depth'
    }
  },

  volume_landmarks: {
    muscleGroups: {
      posterior_chain: { mev: 12, mav: 20, mrv: 30, note: 'Hamstrings, glutes, lower back combined' },
      triceps: { mev: 8, mav: 16, mrv: 24, note: 'Critical for bench lockout' },
      lats: { mev: 8, mav: 16, mrv: 24, note: 'Essential for bench stability and deadlift' },
      upper_back: { mev: 8, mav: 18, mrv: 26, note: 'Face pulls, rows, rear delts' },
      abs: { mev: 6, mav: 12, mrv: 20, note: 'Core stability for all lifts' }
    }
  },

  stimulus_to_fatigue: {
    principles: [
      'ME work is highly fatiguing - limit to one max attempt per session',
      'DE work should leave you fresh - focus on speed, not grinding',
      'GPP (General Physical Preparedness) builds work capacity',
      'Sled work, weighted carries, and conditioning are essential'
    ],
    recommendations: {
      me_frequency: '2x per week (1 upper, 1 lower)',
      de_frequency: '2x per week (1 upper, 1 lower)',
      gpp: '3-5x per week light conditioning'
    }
  }
}

async function seed() {
  console.log('Seeding Westside/Conjugate approach...')

  try {
    const { data: existing } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'Westside/Conjugate')
      .single()

    let data, error

    if (existing) {
      console.log('Westside/Conjugate already exists with ID:', existing.id)
      console.log('Updating existing approach with latest data...')

      const result = await supabase
        .from('training_approaches')
        .update(westsideApproach)
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('training_approaches')
        .insert(westsideApproach)
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error seeding Westside/Conjugate approach:', error)
      process.exit(1)
    }

    console.log('Westside/Conjugate approach seeded successfully!')
    console.log('Approach ID:', data.id)
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seed()
