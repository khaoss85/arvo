import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import type { TrainingApproach } from '@/lib/knowledge/types'

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

/**
 * Seed Mike Mentzer's Heavy Duty Training Approach
 *
 * This approach is FUNDAMENTALLY different from Kuba:
 * - Low frequency (1x/week per muscle) vs Kuba's 2-4x/week
 * - Low volume (1-2 sets to failure) vs Kuba's volume landmarks
 * - High intensity (beyond failure) vs Kuba's RIR management
 * - NO workout variations vs Kuba's A/B splits
 *
 * This tests the approach-agnostic design of the system.
 */
async function seedMentzerApproach() {

  const mentzerApproach: any = {
    name: 'Heavy Duty (Mike Mentzer)',
    creator: 'Mike Mentzer',
    philosophy: `Heavy Duty training is based on high-intensity, low-volume principles.
The core belief is that muscle growth is stimulated by brief, infrequent, high-intensity workouts.
Training beyond momentary muscular failure is essential for maximum growth stimulus.
More is NOT better - adequate recovery between workouts is crucial for growth.`,

    variables: {
      sets: {
        range: [1, 2],
        description: 'Heavy Duty uses minimal sets (1-2 per exercise) taken to absolute failure and beyond',
        progressionNotes: 'Never add more sets - increase intensity instead'
      },
      reps: {
        range: [6, 10],
        description: 'Moderate rep range to allow maximum intensity while maintaining form',
        progressionNotes: 'Progress by adding weight, not reps beyond 10'
      },
      rest: {
        betweenSets: [180, 300],
        betweenExercises: [180, 300],
        description: 'Long rest periods (3-5 minutes) to ensure full recovery for maximum intensity',
        rationale: 'ATP replenishment and nervous system recovery for true maximum effort'
      },
      rir: {
        typical: -1, // BEYOND failure
        description: 'Train to momentary muscular failure and beyond using intensity techniques',
        context: 'Failure is the starting point, not the endpoint'
      }
    },

    progression: {
      primaryMetric: 'weight',
      rules: [
        'When you can complete 10 reps with strict form, increase weight by 5-10%',
        'NEVER increase volume (sets) - only intensity (weight)',
        'If you cannot beat your previous performance, take extra rest days',
        'Strength plateaus indicate need for MORE rest, not more volume'
      ],
      deloadStrategy: 'Take a full week off training every 6-8 weeks to allow complete recovery',
      priorityOrder: ['intensity', 'weight', 'form']
    },

    exerciseSelection: {
      compoundFocus: 90,
      isolationFocus: 10,
      principles: [
        'Prioritize basic compound movements - they provide maximum stimulus',
        'Minimize isolation exercises - only use for specific weak points',
        'Select exercises that allow maximum intensity with minimal injury risk',
        'Avoid exercises that cause systemic fatigue before muscular failure'
      ],
      muscleGroupOrder: [
        'Largest muscle groups first (legs, back)',
        'Then pushing muscles (chest, shoulders)',
        'Finally arms if energy permits'
      ]
    },

    rationales: {
      lowVolume: 'More sets dilute intensity and impair recovery. One all-out set is superior to multiple submax sets.',
      lowFrequency: 'Muscle growth occurs during rest, not training. Training too frequently prevents full recovery and growth.',
      highIntensity: 'Only training beyond failure provides sufficient stimulus for adaptation. Anything less is wasted effort.',
      noVariations: 'Exercise variation is unnecessary. Progressive overload on the same movements is what drives growth.',
      longRest: 'Maximum intensity requires full ATP and nervous system recovery. Short rest = submaximal performance.'
    },

    // === METHODOLOGY-SPECIFIC FIELDS (all optional) ===

    // Volume Landmarks - Mentzer rejects this concept entirely
    volumeLandmarks: {
      muscleGroups: {
        chest: { mev: 1, mav: 2, mrv: 2 },
        back: { mev: 1, mav: 2, mrv: 2 },
        shoulders: { mev: 1, mav: 2, mrv: 2 },
        biceps: { mev: 1, mav: 1, mrv: 1 },
        triceps: { mev: 1, mav: 1, mrv: 1 },
        quads: { mev: 1, mav: 2, mrv: 2 },
        hamstrings: { mev: 1, mav: 2, mrv: 2 },
        calves: { mev: 1, mav: 2, mrv: 2 }
      }
      // Note: For Mentzer, MEV = MAV = MRV (minimal effective = maximum recoverable)
    },

    // Frequency Guidelines - Very different from Kuba
    frequencyGuidelines: {
      minPerWeek: 1,
      maxPerWeek: 1,
      optimalRange: [1, 1],
      muscleSpecific: {
        chest: { min: 1, max: 1, optimal: [1, 1] },
        back: { min: 1, max: 1, optimal: [1, 1] },
        legs: { min: 1, max: 1, optimal: [1, 1] },
        shoulders: { min: 1, max: 1, optimal: [1, 1] },
        arms: { min: 1, max: 1, optimal: [1, 1] }
      }
      // Mentzer: Train each muscle once every 5-7 days, sometimes even less
    },

    // ROM Emphasis - Full range with controlled negatives
    romEmphasis: {
      lengthened: 30,
      shortened: 20,
      fullRange: 50,
      principles: [
        'Emphasize controlled eccentric (negative) phase - 3-4 seconds',
        'Pause briefly at stretched position for maximum fiber recruitment',
        'Explosive concentric (positive) phase while maintaining control',
        'Full ROM on all exercises unless injury prevents it'
      ]
    },

    // Exercise Selection Principles
    exerciseSelectionPrinciples: {
      movementPatterns: [
        'horizontal_push',
        'horizontal_pull',
        'vertical_pull',
        'squat',
        'hinge',
        'vertical_push'
      ],
      unilateralRequirements: {
        minPerWorkout: 0,
        targetMuscles: [],
        rationale: 'Bilateral exercises allow maximum loading and intensity. Unilateral work is inefficient for Heavy Duty.'
      },
      compoundToIsolationRatio: {
        compound: 90,
        isolation: 10,
        rationale: 'Compound movements provide maximum muscle fiber recruitment and growth stimulus per unit of recovery cost.'
      }
    },

    // Stimulus-to-Fatigue - Critical concept in Heavy Duty
    stimulusToFatigue: {
      principles: [
        'Select exercises with highest muscle stimulus relative to systemic fatigue',
        'Avoid exercises that exhaust the nervous system before muscles reach failure',
        'Pre-exhaust technique: isolation before compound to ensure muscle failure, not systemic failure',
        'Machine exercises often superior to free weights for targeting muscles without systemic fatigue'
      ],
      applicationGuidelines: 'If an exercise leaves you exhausted but muscles not fully fatigued, replace it with a more direct movement'
    },

    // Advanced Techniques - Mentzer's intensity techniques
    advancedTechniques: {
      forcedReps: {
        when: 'After reaching concentric failure',
        how: 'Training partner assists just enough to complete 1-2 additional reps',
        protocol: 'Use on final set of compound movements only'
      },
      negatives: {
        when: 'After forced reps are no longer possible',
        how: 'Partner lifts weight, you lower it over 8-10 seconds',
        protocol: '1-2 negative reps maximum to prevent overtraining'
      },
      staticHolds: {
        when: 'When negatives are no longer controllable',
        how: 'Hold weight at mid-range position until muscles give out',
        protocol: 'Final technique in progression - signals complete muscular failure'
      },
      restPause: {
        when: 'For very advanced trainees only',
        how: 'Reach failure, rest 10-15 seconds, perform 2-3 more reps',
        protocol: 'Use sparingly - extremely demanding on recovery'
      },
      preExhaust: {
        when: 'When systemic fatigue limits muscle failure on compounds',
        how: 'Isolation exercise immediately before compound (e.g., flyes before bench press)',
        protocol: 'No rest between pre-exhaust and compound movement'
      }
    },

    // Split Variations - Mentzer uses NO variations
    splitVariations: {
      variationStrategy: 'Heavy Duty does NOT use workout variations. Repeat the EXACT same workout each cycle for progressive overload tracking.',
      variationLabels: [],
      rotationLogic: 'Same exercises, same order, every workout. Only weights and reps change as you progress.'
    },

    // Periodization - Linear progression with deloads
    periodization: {
      model: 'Linear Progression with Extended Deloads',
      phases: [
        {
          name: 'Accumulation',
          duration: '6-8 weeks',
          focus: 'Progressive overload on same exercises',
          volumeAdjustment: 'No volume changes - only weight increases',
          intensityAdjustment: 'Increase weight when you hit 10 reps'
        },
        {
          name: 'Deload',
          duration: '7 days',
          focus: 'Complete rest - no training',
          volumeAdjustment: 'Zero training',
          intensityAdjustment: 'Zero training'
        }
      ],
      cycleDuration: '7-8 weeks including deload',
      autoregulation: 'If you fail to match previous workout performance, take 2-3 extra rest days before next session'
    }
  }

  // Check if Mentzer approach already exists
  const { data: existing } = await supabase
    .from('training_approaches')
    .select('id')
    .eq('name', mentzerApproach.name)
    .single()

  if (existing) {
    console.log('Mentzer Heavy Duty approach already exists. Updating...')
    const { error } = await supabase
      .from('training_approaches')
      .update({
        creator: mentzerApproach.creator,
        philosophy: mentzerApproach.philosophy,
        variables: mentzerApproach.variables as any,
        progression_rules: mentzerApproach.progression as any,
        exercise_rules: mentzerApproach.exerciseSelection as any,
        rationales: mentzerApproach.rationales as any,
        volume_landmarks: mentzerApproach.volumeLandmarks as any,
        frequency_guidelines: mentzerApproach.frequencyGuidelines as any,
        rom_emphasis: mentzerApproach.romEmphasis as any,
        exercise_selection_principles: mentzerApproach.exerciseSelectionPrinciples as any,
        stimulus_to_fatigue: mentzerApproach.stimulusToFatigue as any,
        advanced_techniques: mentzerApproach.advancedTechniques as any,
        split_variations: mentzerApproach.splitVariations as any,
        periodization: mentzerApproach.periodization as any,
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating Mentzer approach:', error)
      throw error
    }

    console.log('✅ Mentzer Heavy Duty approach updated successfully')
  } else {
    console.log('Creating new Mentzer Heavy Duty approach...')
    const { error } = await supabase
      .from('training_approaches')
      .insert({
        name: mentzerApproach.name,
        creator: mentzerApproach.creator,
        philosophy: mentzerApproach.philosophy,
        variables: mentzerApproach.variables as any,
        progression_rules: mentzerApproach.progression as any,
        exercise_rules: mentzerApproach.exerciseSelection as any,
        rationales: mentzerApproach.rationales as any,
        volume_landmarks: mentzerApproach.volumeLandmarks as any,
        frequency_guidelines: mentzerApproach.frequencyGuidelines as any,
        rom_emphasis: mentzerApproach.romEmphasis as any,
        exercise_selection_principles: mentzerApproach.exerciseSelectionPrinciples as any,
        stimulus_to_fatigue: mentzerApproach.stimulusToFatigue as any,
        advanced_techniques: mentzerApproach.advancedTechniques as any,
        split_variations: mentzerApproach.splitVariations as any,
        periodization: mentzerApproach.periodization as any,
      })

    if (error) {
      console.error('Error creating Mentzer approach:', error)
      throw error
    }

    console.log('✅ Mentzer Heavy Duty approach created successfully')
  }

  console.log('\n📊 Mentzer Heavy Duty vs Kuba Comparison:')
  console.log('┌─────────────────────┬──────────────────┬──────────────────┐')
  console.log('│ Dimension           │ Mentzer          │ Kuba             │')
  console.log('├─────────────────────┼──────────────────┼──────────────────┤')
  console.log('│ Frequency           │ 1x/week          │ 2-4x/week        │')
  console.log('│ Sets per muscle     │ 1-2 (to failure) │ 12-20 (RIR 1-3)  │')
  console.log('│ Volume              │ Minimal          │ High             │')
  console.log('│ Intensity           │ Beyond failure   │ Near failure     │')
  console.log('│ Variations          │ None             │ A/B splits       │')
  console.log('│ Exercise focus      │ 90% compound     │ 70% compound     │')
  console.log('│ Rest periods        │ 3-5 minutes      │ 2-3 minutes      │')
  console.log('└─────────────────────┴──────────────────┴──────────────────┘')
  console.log('\n✅ System supports BOTH approaches without schema changes!')
}

// Run the seed function
seedMentzerApproach()
  .then(() => {
    console.log('\n🎉 Mentzer seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Mentzer seed failed:', error)
    process.exit(1)
  })
