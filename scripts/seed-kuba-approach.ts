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

    if (existing) {
      console.log('⚠️  Kuba Method already exists with ID:', existing.id)
      console.log('Skipping insert to avoid duplicates.')
      return
    }

    // Insert new approach
    const { data, error } = await supabase
      .from('training_approaches')
      .insert(kubaApproach)
      .select()
      .single()

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
