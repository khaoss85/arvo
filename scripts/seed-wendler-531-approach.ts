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

const wendler531Approach = {
  name: 'Wendler 5/3/1',
  creator: 'Jim Wendler',
  category: 'powerlifting',
  recommended_level: 'all_levels',
  level_notes: {
    it: 'Default sicuro per tutti, progressione lenta ma sostenibile a lungo termine',
    en: 'Safe default for everyone, slow but sustainable long-term progression'
  },
  philosophy: 'Slow and steady wins the race. Progress is measured in months and years, not days and weeks. The program is built on submaximal training using a Training Max (TM) set at 90% of your true 1RM, ensuring you never miss reps and build sustainable strength.',
  short_philosophy: 'Simple, effective strength program using 4-week wave cycles. Train submaximal, hit AMRAPs, and add weight slowly. Built for long-term progress with minimal complexity.',

  variables: {
    setsPerExercise: {
      working: 3,
      warmup: '3 progressive (40%, 50%, 60%)'
    },
    repRanges: {
      compound: [1, 5], // UI compatibility
      main_lift: [1, 5],
      assistance: [8, 15]
    },
    rirTarget: {
      normal: 0, // AMRAP on final set
      intense: 0,
      deload: 3,
      context: 'Final set is always AMRAP (As Many Reps As Possible)'
    },
    restPeriods: {
      main_lifts: [180, 300],
      assistance: [60, 120],
      autoRegulation: 'Rest as needed for main lifts, shorter for assistance'
    },
    intensity: {
      week1: { sets: '5/5/5+', percentages: [65, 75, 85], reps: [5, 5, '5+'] },
      week2: { sets: '3/3/3+', percentages: [70, 80, 90], reps: [3, 3, '3+'] },
      week3: { sets: '5/3/1+', percentages: [75, 85, 95], reps: [5, 3, '1+'] },
      week4: { sets: 'Deload', percentages: [40, 50, 60], reps: [5, 5, 5] }
    },
    trainingMax: {
      percentage: 90,
      description: 'Training Max is 90% of true 1RM. All percentages are calculated from TM, not actual max.'
    },
    frequency: {
      muscleGroupDays: 1,
      weeklyPattern: '4 days per week, one main lift per day'
    }
  },

  progression_rules: {
    priority: 'training_max_increase',
    rules: {
      upperBodyIncrement: 2.5, // kg per cycle
      lowerBodyIncrement: 5,  // kg per cycle
      trainingMaxPercentage: 90,
      deloadFrequency: 'Every 4th week',
      resetProtocol: 'If you fail to hit 5 reps on 5+ week or 3 on 3+ week, reduce TM by 10%'
    },
    setProgression: {
      strategy: 'fixed_percentages_with_amrap',
      conditions: 'Hit minimum reps on all sets, then push AMRAP on final set'
    }
  },

  exercise_rules: {
    mainLifts: ['squat', 'bench_press', 'deadlift', 'overhead_press'],
    assistanceCategories: {
      push: {
        description: 'Dips, pushups, DB press, tricep work',
        volume: '50-100 total reps per workout'
      },
      pull: {
        description: 'Rows, pullups, chin-ups, curls, face pulls',
        volume: '50-100 total reps per workout'
      },
      singleLegCore: {
        description: 'Lunges, leg raises, ab wheel, back extensions',
        volume: '50-100 total reps per workout'
      }
    },
    exercisesPerWorkout: {
      min: 3,
      max: 5,
      distribution: '1 main lift + 2-4 assistance exercises'
    }
  },

  rationales: {
    'why_training_max': 'Using 90% ensures you never grind reps and can progress for years without stalling',
    'why_amrap': 'The AMRAP set allows autoregulation - good days you hit more, bad days you hit minimum',
    'why_slow_progression': 'Adding 5-10 lbs per cycle compounds to 60-120 lbs per year - massive long-term gains',
    'why_simple': 'The best program is one you can stick with. Complexity kills consistency.'
  },

  periodization: {
    model: '4-Week Wave Periodization',
    cycleDuration: '4 weeks',
    phases: {
      week1: {
        description: '5s Week - Volume Focus',
        intensity: 0.85,
        sets: '5/5/5+',
        focus: 'Build base with moderate weight, high quality reps'
      },
      week2: {
        description: '3s Week - Intensity Focus',
        intensity: 0.90,
        sets: '3/3/3+',
        focus: 'Heavier weight, lower volume, build towards peak'
      },
      week3: {
        description: '5/3/1 Week - Peak',
        intensity: 0.95,
        sets: '5/3/1+',
        focus: 'Test strength, hit PR on AMRAP'
      },
      week4: {
        description: 'Deload',
        intensity: 0.60,
        sets: '5/5/5',
        focus: 'Recovery, technique work, prepare for next cycle'
      }
    }
  },

  split_variations: {
    variationStrategy: 'Each main lift gets its own day. Rotate through the 4 lifts in a fixed order.',
    variationLabels: ['Squat Day', 'Bench Day', 'Deadlift Day', 'OHP Day'],
    popularTemplates: {
      original: {
        days: 4,
        schedule: 'Mon: Squat, Tue: Bench, Thu: Deadlift, Fri: OHP'
      },
      bbb: {
        name: 'Boring But Big',
        description: 'After main work, do 5x10 of same lift at 50-60%',
        supplemental: '5x10 @ 50-60% TM'
      },
      fsl: {
        name: 'First Set Last',
        description: 'After main work, do 3-5x5-8 at first set weight',
        supplemental: '3-5 sets at week 1 percentage'
      },
      triumvirate: {
        name: 'Triumvirate',
        description: 'Main lift + 2 assistance exercises, 5x10 each',
        supplemental: '2 exercises, 5x10'
      }
    }
  },

  advanced_techniques: {
    jokerSets: {
      when: 'After AMRAP if feeling exceptionally good',
      how: 'Add 5-10% and do singles or doubles',
      caution: 'Use sparingly, not every session'
    },
    pyramidDown: {
      when: 'After main work for extra volume',
      how: 'Work back down in weight for additional sets',
      caution: 'Only on good days, dont overdo it'
    }
  },

  volume_landmarks: {
    muscleGroups: {
      chest: { mev: 6, mav: 12, mrv: 18, note: 'Bench press + assistance' },
      back: { mev: 8, mav: 15, mrv: 22, note: 'Deadlift + rows/pullups' },
      shoulders: { mev: 6, mav: 12, mrv: 18, note: 'OHP + face pulls' },
      quads: { mev: 6, mav: 12, mrv: 18, note: 'Squat + lunges' },
      hamstrings: { mev: 6, mav: 10, mrv: 16, note: 'Deadlift + leg curls' },
      triceps: { mev: 4, mav: 10, mrv: 16, note: 'Pressing + dips' },
      biceps: { mev: 4, mav: 10, mrv: 16, note: 'Pulling + curls' }
    }
  }
}

async function seed() {
  console.log('Seeding Wendler 5/3/1 approach...')

  try {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'Wendler 5/3/1')
      .single()

    let data, error

    if (existing) {
      console.log('Wendler 5/3/1 already exists with ID:', existing.id)
      console.log('Updating existing approach with latest data...')

      const result = await supabase
        .from('training_approaches')
        .update(wendler531Approach)
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('training_approaches')
        .insert(wendler531Approach)
        .select()
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error seeding Wendler 5/3/1 approach:', error)
      process.exit(1)
    }

    console.log('Wendler 5/3/1 approach seeded successfully!')
    console.log('Approach ID:', data.id)
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seed()
