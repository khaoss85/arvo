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

const kubaApproach = {
  name: 'Kuba Method',
  creator: 'Jakub Sylvester-Cielen',
  philosophy: 'Quality over quantity, controlled eccentric, autoregulated rest',
  short_philosophy: 'Quality-focused training emphasizing controlled eccentric movements and autoregulated rest periods. Built around a systematic 3-days-on, 1-day-off cycle with moderate volume. Prioritizes technical execution and mind-muscle connection over ego lifting. Designed for sustainable progression through meticulous form and intelligent recovery management.',
  variables: {
    setsPerExercise: {
      working: 2,
      warmup: '2-3 gradual'
    },
    repRanges: {
      compound: [6, 10],
      isolation: [10, 15]
    },
    rirTarget: {
      normal: 1,
      intense: 0,
      deload: 3
    },
    restPeriods: {
      compound: [150, 180],
      isolation: [90, 120],
      autoRegulation: 'Rest until breathing normalizes and you feel ready'
    },
    tempo: {
      eccentric: 3,
      pauseBottom: 1,
      concentric: 1,
      pauseTop: 1
    },
    frequency: {
      muscleGroupDays: 4,
      weeklyPattern: '3 on 1 off rotating'
    }
  },
  progression_rules: {
    priority: 'reps_first',
    rules: {
      whenToAddWeight: 'When hitting upper rep range for 2 consecutive sessions',
      weightIncrements: [1.25, 2.5, 5],
      deloadTriggers: ['3 sessions without progress', 'technique breakdown', 'excessive fatigue']
    },
    setProgression: {
      strategy: 'maintain_weight_add_reps',
      conditions: 'If RIR > 1 on set 1, maintain weight and try for more reps on set 2'
    }
  },
  exercise_rules: {
    priorityRules: [
      'Compounds first',
      'Weak points when fresh',
      'Higher stability exercises early'
    ],
    exercisesPerWorkout: {
      min: 4,
      max: 6,
      distribution: '2 compound, 2-3 isolation, 1 optional finisher'
    },
    substitutionRules: {
      whenToSubstitute: ['Equipment busy', 'Joint discomfort', 'Staleness'],
      howToAdjustLoad: 'Use 0.8x multiplier for machines, 0.7x for cables vs free weights'
    }
  },
  rationales: {
    'why_two_sets': 'Two quality sets at RIR 0-1 provide sufficient stimulus without excessive fatigue',
    'why_slow_eccentric': '3-second eccentric increases time under tension and mechanical damage',
    'why_autoregulated_rest': 'Individual recovery varies by exercise and fatigue state'
  },

  // === KUBA METHODOLOGY ENHANCEMENTS ===

  volume_landmarks: {
    muscleGroups: {
      chest: { mev: 10, mav: 18, mrv: 22 },
      back: { mev: 12, mav: 20, mrv: 25 },
      shoulders: { mev: 12, mav: 20, mrv: 24 },
      biceps: { mev: 6, mav: 14, mrv: 20 },
      triceps: { mev: 6, mav: 14, mrv: 18 },
      quads: { mev: 8, mav: 16, mrv: 20 },
      hamstrings: { mev: 6, mav: 12, mrv: 16 },
      glutes: { mev: 6, mav: 12, mrv: 16 },
      calves: { mev: 8, mav: 16, mrv: 20 },
      abs: { mev: 6, mav: 16, mrv: 25 }
    }
  },

  frequency_guidelines: {
    minPerWeek: 2,
    maxPerWeek: 4,
    optimalRange: [2, 3],
    muscleSpecific: {
      chest: { min: 2, max: 4, optimal: [2, 3] },
      back: { min: 2, max: 4, optimal: [2, 3] },
      shoulders: { min: 2, max: 4, optimal: [3, 4] },
      arms: { min: 2, max: 4, optimal: [2, 3] },
      legs: { min: 2, max: 3, optimal: [2, 2] }
    }
  },

  rom_emphasis: {
    lengthened: 60,
    shortened: 20,
    fullRange: 20,
    principles: [
      'Prioritize lengthened-biased exercises for superior hypertrophy stimulus',
      'Full range of motion is non-negotiable - brag about your ROM',
      'Deficit variations (RDL, push-ups) increase stretch and muscle damage',
      'Loaded stretch positions generate maximum tension',
      'Control eccentric to maximize time in lengthened position'
    ]
  },

  exercise_selection_principles: {
    movementPatterns: {
      horizontalPush: [
        'flat barbell bench press',
        'flat dumbbell bench press',
        'incline dumbbell press',
        'machine chest press',
        'dips (chest-focused)',
        'push-ups (deficit)',
        'cable flyes',
        'pec deck machine'
      ],
      verticalPush: [
        'standing overhead press',
        'seated dumbbell shoulder press',
        'cable overhead press',
        'arnold press',
        'pike push-ups',
        'machine shoulder press',
        'landmine press'
      ],
      horizontalPull: [
        'barbell row',
        'chest-supported row',
        'seated cable row',
        't-bar row',
        'single-arm dumbbell row',
        'plate-loaded row',
        'machine row'
      ],
      verticalPull: [
        'pull-ups',
        'chin-ups',
        'lat pulldown',
        'single-arm pulldown',
        'close-grip pulldown',
        'machine pulldown',
        'straight-arm pulldown'
      ],
      squatPattern: [
        'back squat',
        'front squat',
        'safety bar squat',
        'leg press',
        'hack squat',
        'goblet squat',
        'belt squat'
      ],
      hingePattern: [
        'conventional deadlift',
        'romanian deadlift (deficit)',
        'stiff-leg deadlift',
        'good mornings',
        'single-leg rdl',
        '45-degree back extension',
        'glute-ham raise'
      ],
      lungePattern: [
        'walking lunges',
        'reverse lunges',
        'bulgarian split squats',
        'step-ups',
        'single-leg press',
        'split squats',
        'skater squats'
      ]
    },
    unilateralRequirements: {
      minPerWorkout: 1,
      targetMuscles: ['legs', 'back', 'shoulders'],
      rationale: 'Unilateral work allows greater ROM, identifies and corrects imbalances, improves mind-muscle connection, and reduces compensations'
    },
    compoundToIsolationRatio: {
      compound: 40,
      isolation: 60,
      rationale: 'Bodybuilding focus requires more isolation than powerlifting, but compounds provide foundation of mass and strength'
    },
    equipmentVariations: [
      'Machines provide constant tension and are less fatiguing',
      'Cables offer variable resistance curves ideal for isolation',
      'Free weights require stabilization and allow natural movement paths',
      'Unilateral variations (single-arm, single-leg) maximize ROM and correct imbalances'
    ]
  },

  stimulus_to_fatigue: {
    principles: [
      'Not all volume is equal - distinguish effective sets from junk volume',
      'High S:F exercises provide maximal stimulus with manageable fatigue',
      'Prioritize high S:F exercises in later weeks of mesocycle',
      'Systemically fatiguing exercises (heavy deadlifts, squats) should be limited',
      'Machines and cables generally have higher S:F than barbell compounds'
    ],
    highStimulusLowFatigue: [
      'machine chest press',
      'leg extensions',
      'leg curls',
      'cable flyes',
      'machine lateral raises',
      'preacher curls',
      'cable tricep extensions',
      'machine rows',
      'calf press'
    ],
    moderateStimulusFatigue: [
      'dumbbell presses',
      'dumbbell rows',
      'romanian deadlifts',
      'leg press',
      'pull-ups',
      'dips',
      'bulgarian split squats',
      'overhead press'
    ],
    lowStimulusHighFatigue: [
      'heavy conventional deadlifts',
      'heavy back squats (low bar)',
      'heavy barbell rows (standing)',
      'clean and jerk',
      'snatch',
      'farmers walks (heavy)'
    ],
    applicationGuidelines: 'In accumulation phases and later weeks of mesocycle, favor high S:F exercises. Early in block with fresh state, moderate S:F exercises are fine. Reserve low S:F for specific strength goals or periodically.'
  },

  advanced_techniques: {
    myoreps: {
      when: 'During intensification phase or when plateau occurs in isolation exercises',
      how: 'Perform activation set to near failure, rest 5 deep breaths (15 sec), perform mini-sets of 3-5 reps until cannot reach target, accumulate total reps',
      suitableExercises: ['leg extensions', 'leg curls', 'cable flyes', 'lateral raises', 'bicep curls', 'tricep extensions']
    },
    dropSets: {
      frequency: 'End of mesocycle (weeks 5-6) on 1-2 exercises per workout',
      application: 'Best for isolation exercises with quick weight changes (machines, cables, dumbbells)',
      protocol: 'Take final set to failure, reduce weight 20-30%, continue to failure again, optionally repeat once more'
    },
    restPause: {
      when: 'Final 1-2 weeks of intensification block to break plateaus',
      protocol: 'Take set to failure, rest 10-15 seconds, continue for more reps, repeat 2-3 times total',
      cautions: ['Systemically fatiguing', 'Not sustainable long-term', 'Use sparingly', 'Monitor recovery carefully']
    },
    lengthenedPartials: {
      priority: 'Hamstrings, triceps, biceps, chest - muscles that benefit from stretch-mediated hypertrophy',
      exercises: ['RDL (deficit)', 'overhead tricep extensions', 'incline curls', 'dumbbell flyes', 'overhead press (bottom half)'],
      integration: 'Use as finisher after full ROM sets, or as dedicated stretch-focused variation in B workouts'
    }
  },

  split_variations: {
    variationStrategy: 'Alternate A and B workouts for each muscle group to provide varied stimulus, prevent staleness, and balance development. A workouts focus on volume with moderate load, B workouts emphasize heavier tension.',
    variationLabels: ['A', 'B'],
    rotationLogic: 'In 8-day microcycle (3 on, 1 off, repeat), rotate Push A → Pull A → Legs A → Rest → Push B → Pull B → Legs B → Rest. Each muscle group trained every 4 days (2x per cycle).'
  },

  periodization: {
    model: 'Linear Periodization with Mesocycles',
    cycleDuration: '6 weeks',
    mesocycleLength: 6,
    phases: {
      accumulation: {
        description: 'Build volume tolerance, perfect technique, emphasize high stimulus-to-fatigue exercises, progress reps before adding weight',
        weeks: 4,
        volumeMultiplier: 1.0,
        intensityMultiplier: 0.85,
        focus: 'Volume and technique mastery'
      },
      intensification: {
        description: 'Push intensity, introduce advanced techniques (rest-pause sets, drop sets, myoreps on isolation), peak performance',
        weeks: 2,
        volumeMultiplier: 0.9,
        intensityMultiplier: 1.0,
        focus: 'Intensity and advanced techniques',
        techniquesIntroduced: ['rest-pause sets', 'drop sets', 'myoreps on isolation']
      },
      deload: {
        description: 'Every 6 weeks after intensification. Reduce volume by 50%, keep weights similar but reduce sets by half, maintain RIR at 3-4',
        frequency: 'Every 6 weeks (after intensification)',
        volumeReduction: 50,
        intensityMaintenance: 'Keep weights similar but reduce sets by half, maintain RIR at 3-4',
        duration: '1 week'
      }
    },
    // Legacy fields for backward compatibility
    accumulationPhase: {
      weeks: 4,
      volumeMultiplier: 1.0,
      intensityMultiplier: 0.85,
      focus: 'Build volume tolerance, perfect technique, emphasize high stimulus-to-fatigue exercises, progress reps before adding weight'
    },
    intensificationPhase: {
      weeks: 2,
      volumeMultiplier: 0.9,
      intensityMultiplier: 1.0,
      focus: 'Push intensity, introduce advanced techniques, peak performance',
      techniquesIntroduced: ['rest-pause sets', 'drop sets', 'myoreps on isolation']
    },
    deloadPhase: {
      frequency: 'Every 6 weeks (after intensification)',
      volumeReduction: 50,
      intensityMaintenance: 'Keep weights similar but reduce sets by half, maintain RIR at 3-4',
      duration: '1 week'
    }
  }
}

async function seed() {
  console.log('🌱 Seeding Kuba Method approach...')

  try {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'Kuba Method')
      .single()

    let data, error

    if (existing) {
      console.log('⚠️  Kuba Method already exists with ID:', existing.id)
      console.log('Updating existing approach with latest data...')

      // Update existing approach
      const result = await supabase
        .from('training_approaches')
        .update(kubaApproach)
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // Insert new approach
      const result = await supabase
        .from('training_approaches')
        .insert(kubaApproach)
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ Error seeding Kuba approach:', error)
      process.exit(1)
    }

    console.log('✅ Kuba Method approach seeded successfully!')
    console.log('Approach ID:', data.id)
    console.log('\nYou can now use this approach in your user profile.')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

seed()
