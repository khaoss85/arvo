import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { TrainingApproach } from '@/lib/knowledge/types'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
    category: 'bodybuilding',
    recommended_level: 'advanced',
    level_notes: {
      it: 'Intensità estrema oltre il cedimento, richiede esperienza e recupero ottimale',
      en: 'Extreme intensity beyond failure, requires experience and optimal recovery'
    },
    philosophy: `Heavy Duty training is based on high-intensity, low-volume principles.
The core belief is that muscle growth is stimulated by brief, infrequent, high-intensity workouts.
Training beyond momentary muscular failure is essential for maximum growth stimulus.
More is NOT better - adequate recovery between workouts is crucial for growth.`,
    short_philosophy: 'High-intensity, low-volume training based on brief, infrequent workouts pushed to momentary muscular failure. The philosophy: maximum growth stimulus comes from intense effort, not volume. Recovery between workouts is crucial. More training is NOT better—quality and intensity trump quantity every time.',

    variables: {
      // Standardized fields matching other approaches
      setsPerExercise: {
        working: 2, // Maximum for Heavy Duty (1-2 sets to absolute failure)
        warmup: '0-1 light',
        notes: 'Heavy Duty uses minimal sets taken to absolute failure and beyond. Never add more sets - increase intensity instead.'
      },
      repRanges: {
        compound: [6, 10],
        isolation: [6, 10], // Same range for Heavy Duty
        notes: 'Moderate rep range to allow maximum intensity while maintaining form. Progress by adding weight, not reps beyond 10.'
      },
      rirTarget: {
        normal: -1,   // BEYOND failure - use intensity techniques
        intense: -1,  // Always beyond failure in Heavy Duty
        deload: 3,    // During deload week
        notes: 'Train to momentary muscular failure and beyond using intensity techniques. Failure is the starting point, not the endpoint.'
      },
      // Heavy Duty-specific additional fields
      restPeriods: {
        compound: [180, 300],
        isolation: [180, 300],
        autoRegulation: 'Long rest periods (3-5 minutes) to ensure full recovery for maximum intensity. ATP replenishment and nervous system recovery for true maximum effort.'
      },
      tempo: {
        eccentric: 4,
        pauseBottom: 0,
        concentric: 2,
        pauseTop: 0,
        description: 'Slow controlled eccentric (4 seconds) and explosive concentric (2 seconds) to maximize time under tension and fiber recruitment',
        rationale: 'Slow negatives eliminate momentum and increase mechanical stress; explosive positives maximize motor unit recruitment'
      },
      sessionDuration: {
        typical: [30, 45],
        description: 'Heavy Duty workouts are brief but brutally intense - 30 to 45 minutes maximum',
        totalSets: [6, 8],
        rationale: 'After 6-8 all-out sets to failure, nervous system is exhausted. More work becomes counterproductive.'
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
        'Emphasize controlled eccentric (negative) phase - exactly 4 seconds',
        'Brief pause at stretched position for maximum fiber recruitment',
        'Explosive concentric (positive) phase - approximately 2 seconds while maintaining control',
        'Full ROM on all exercises unless injury prevents it',
        'Eliminate momentum completely - every rep must be strict and controlled'
      ]
    },

    // Exercise Selection Principles
    exerciseSelectionPrinciples: {
      movementPatterns: {
        horizontalPush: [
          'barbell bench press',
          'incline barbell bench press',
          'hammer strength chest press',
          'machine chest press',
          'decline barbell bench press',
          'chest press machine (plate-loaded)'
        ],
        verticalPush: [
          'barbell overhead press',
          'dumbbell shoulder press',
          'hammer strength shoulder press',
          'machine shoulder press',
          'smith machine overhead press'
        ],
        horizontalPull: [
          'barbell row',
          'hammer strength row',
          'chest-supported row machine',
          'seated cable row',
          'machine row',
          'pendlay row',
          't-bar row'
        ],
        verticalPull: [
          'weighted chin-ups',
          'weighted pull-ups',
          'lat pulldown',
          'machine pulldown',
          'hammer strength pulldown',
          'close-grip pulldown'
        ],
        squatPattern: [
          'leg press',
          'hack squat machine',
          'smith machine squat',
          'leg press (45-degree)',
          'vertical leg press',
          'barbell squat (occasionally)'
        ],
        hingePattern: [
          'leg curl machine',
          'lying leg curls',
          'seated leg curls',
          'back extension',
          'reverse hyperextension',
          'romanian deadlift (sparingly)',
          'stiff-leg deadlift (machine)'
        ],
        lungePattern: [], // Not emphasized in Heavy Duty
        isolation: {
          chest: ['pec deck', 'cable crossovers', 'dumbbell flyes'],
          shoulders: ['lateral raise machine', 'rear delt machine', 'cable lateral raises'],
          back: ['straight-arm pulldown', 'pullover machine'],
          biceps: ['barbell curl', 'cable curl', 'preacher curl machine', 'hammer curl'],
          triceps: ['cable pushdown', 'overhead extension', 'dip machine', 'close-grip bench'],
          quads: ['leg extension'],
          hamstrings: ['leg curl variations'],
          calves: ['calf raise machine', 'seated calf raise', 'leg press calf raise']
        }
      },
      unilateralRequirements: {
        minPerWorkout: 0,
        targetMuscles: [],
        rationale: 'Bilateral exercises allow maximum loading and intensity. Unilateral work is inefficient for Heavy Duty - it divides effort and extends workout duration unnecessarily.'
      },
      compoundToIsolationRatio: {
        compound: 90,
        isolation: 10,
        rationale: 'Compound movements provide maximum muscle fiber recruitment and growth stimulus per unit of recovery cost. Isolation used only for pre-exhaust or specific weak points.'
      },
      equipmentVariations: [
        'Machines are STRONGLY PREFERRED in Heavy Duty - they allow pure muscular failure without stabilization fatigue',
        'Free weights (barbells) are acceptable for primary compounds: bench press, overhead press, row',
        'Cables excellent for isolation exercises as they provide constant tension throughout ROM',
        'Dumbbells can be used but require spotter for maximum safety when training beyond failure',
        'Smith machines acceptable for pressing movements - reduce stabilizer fatigue',
        'AVOID: Unstable surfaces, balance-based exercises, TRX, bosu balls - they limit maximum intensity',
        'Machine selection priority: Hammer Strength > Nautilus > Cybex > generic plate-loaded > cable'
      ]
    },

    // Stimulus-to-Fatigue - Critical concept in Heavy Duty
    stimulusToFatigue: {
      principles: [
        'Select exercises with highest muscle stimulus relative to systemic fatigue',
        'Avoid exercises that exhaust the nervous system before muscles reach failure',
        'Pre-exhaust technique: isolation before compound to ensure muscle failure, not systemic failure',
        'Machine exercises often superior to free weights for targeting muscles without systemic fatigue',
        'The goal: muscles fail before CNS fails - this maximizes hypertrophy while minimizing recovery debt'
      ],
      highStimulusLowFatigue: [
        'leg press (all variations)',
        'leg curl machine',
        'leg extension',
        'calf press machine',
        'lat pulldown machine',
        'machine row (all types)',
        'hammer strength chest press',
        'machine chest press',
        'pec deck / chest fly machine',
        'machine shoulder press',
        'lateral raise machine',
        'rear delt machine',
        'cable curls',
        'cable pushdowns',
        'preacher curl machine',
        'tricep extension machine',
        'back extension machine',
        'pullover machine'
      ],
      moderateStimulusFatigue: [
        'barbell bench press',
        'incline barbell bench press',
        'barbell overhead press',
        'barbell row',
        't-bar row',
        'weighted chin-ups',
        'weighted dips',
        'dumbbell bench press',
        'dumbbell shoulder press',
        'dumbbell rows',
        'hack squat machine',
        'smith machine squat',
        'barbell curl',
        'close-grip bench press'
      ],
      lowStimulusHighFatigue: [
        'heavy conventional deadlift (avoid unless specific goal)',
        'heavy low-bar squat (prefer leg press)',
        'standing barbell row with maximum weight (prefer machine)',
        'olympic lifts (clean, snatch - NOT recommended for Heavy Duty)',
        'heavy farmer carries',
        'yoke walks',
        'any exercise requiring significant balance/stabilization under maximal load'
      ],
      applicationGuidelines: 'Prioritize high S:F exercises (machines) to allow training to true muscular failure without systemic fatigue limiting you. Use moderate S:F exercises for primary compounds if machine not available. AVOID low S:F exercises - they exhaust CNS before muscles fully fail, defeating the purpose of Heavy Duty.'
    },

    // Advanced Techniques - Mentzer's intensity techniques
    advancedTechniques: {
      forced_reps: {
        when: 'After reaching concentric failure on the working set',
        how: 'Training partner assists just enough to complete 1-2 additional reps beyond failure',
        protocol: 'Use on final set of compound movements only. Partner provides minimal assistance - just enough to keep bar moving.',
        frequency: 'Not every workout - use when feeling strong and well-recovered',
        suitableExercises: ['barbell bench press', 'machine chest press', 'leg press', 'shoulder press', 'lat pulldown'],
        cautions: 'Requires reliable training partner. Do not use on exercises where failure is dangerous (squat without safety).'
      },
      negatives: {
        when: 'After forced reps are no longer possible, or as standalone technique',
        how: 'Partner lifts weight to top position, you control the eccentric (lowering) phase over 8-10 seconds',
        protocol: '3-4 negative reps maximum after concentric failure. Use 105-110% of your 1RM if doing negatives only.',
        frequency: 'Once every 2-3 workouts for a given muscle group',
        suitableExercises: ['lat pulldown', 'machine chest press', 'leg curl', 'leg press', 'cable movements'],
        cautions: 'Extremely demanding on recovery. Causes significant muscle damage. Reduce frequency if experiencing excessive soreness.'
      },
      staticHolds: {
        when: 'When negatives are no longer controllable - absolute final technique',
        how: 'Hold weight at mid-range position (strongest leverage) until muscles give out completely',
        protocol: 'Hold for 15-30 seconds or until position cannot be maintained. Signals complete muscular exhaustion.',
        frequency: 'Rarely - only on exercises where safe to fail (machines, exercises with safety catches)',
        suitableExercises: ['machine exercises', 'leg press', 'smith machine movements', 'cable exercises'],
        cautions: 'Only use on machines or with safety equipment. Do not attempt on free weight exercises where dropping weight is dangerous.'
      },
      rest_pause: {
        when: 'For very advanced trainees only - alternative to forced reps when training alone',
        how: 'Reach failure, rest 15-20 seconds while staying in position, perform 2-3 more reps to failure again',
        protocol: 'Can repeat 2-3 times maximum. Total rest-pause set should not exceed 90 seconds total time.',
        frequency: 'Use sparingly - 1-2 exercises per workout maximum, not every session',
        suitableExercises: ['machine exercises', 'cable movements', 'exercises where you can safely rack/set down weight'],
        cautions: 'Extremely demanding on CNS and recovery. May require extra rest day before next workout. Not for beginners.'
      },
      pre_exhaust: {
        when: 'When systemic fatigue limits muscle failure on compounds (e.g., lower back gives out before lats on rows)',
        how: 'Isolation exercise immediately before compound with NO REST between exercises',
        protocol: 'Isolation to failure (6-10 reps), immediately perform compound to failure (6-10 reps). Counts as ONE working set for that muscle.',
        frequency: 'Can be used every workout as primary technique for stubborn muscle groups',
        suitableExercises: [
          'Pec deck → Bench press (chest)',
          'Flyes → Dips (chest)',
          'Leg extension → Leg press (quads)',
          'Leg curl → Leg press (hamstrings)',
          'Lateral raises → Overhead press (shoulders)',
          'Pullover → Lat pulldown (lats)',
          'Leg extension → Squat (quads)'
        ],
        cautions: 'Expect significant strength reduction on compound (30-40% less weight). This is normal and desired - muscle fails before systemic fatigue.',
        rationale: 'Pre-exhaust ensures the target muscle, not stabilizers or synergists, is the limiting factor. Allows true muscular failure on compounds.'
      }
    },

    // Split Variations - Mentzer's classic split options
    splitVariations: {
      variationStrategy: 'Heavy Duty offers two primary split structures, but within each split there are NO workout variations (no A/B alternation). You perform the EXACT same workout each time that body part is trained.',
      splitOptions: [
        {
          name: '3-Day Split (Classic Heavy Duty)',
          description: 'Train 3 times per week with full recovery days between sessions',
          schedule: 'Mon/Wed/Fri or Tue/Thu/Sat pattern with rest days between',
          workouts: [
            {
              name: 'Workout 1: Chest & Back',
              muscleGroups: ['chest', 'back'],
              exercises: '2-3 exercises total (1 for chest, 1-2 for back)',
              example: 'Incline Barbell Press (1 set), Lat Pulldown (1 set), Machine Row (1 set)'
            },
            {
              name: 'Workout 2: Legs',
              muscleGroups: ['quads', 'hamstrings', 'calves'],
              exercises: '3-4 exercises total',
              example: 'Leg Press (1 set), Leg Extension (1 set), Leg Curl (1 set), Calf Press (1 set)'
            },
            {
              name: 'Workout 3: Shoulders & Arms',
              muscleGroups: ['shoulders', 'biceps', 'triceps'],
              exercises: '3-4 exercises total',
              example: 'Machine Shoulder Press (1 set), Lateral Raise Machine (1 set), Barbell Curl (1 set), Cable Pushdown (1 set)'
            }
          ],
          frequency: 'Each muscle trained once every 7 days',
          rationale: 'Allows maximum recovery between sessions. Each muscle gets full week to grow.'
        },
        {
          name: '2-Day Full-Body (Advanced Heavy Duty)',
          description: 'Two full-body sessions per week, alternating workouts A and B',
          schedule: 'Mon/Thu or Tue/Fri pattern with 2-3 days rest between sessions',
          workouts: [
            {
              name: 'Workout A: Primary Compounds',
              muscleGroups: ['chest', 'back', 'legs', 'abs'],
              exercises: '4-5 exercises covering all major muscle groups',
              example: 'Leg Press (1 set), Barbell Bench Press (1 set), Lat Pulldown (1 set), Calf Raise (1 set), Crunch (1 set)'
            },
            {
              name: 'Workout B: Secondary Compounds + Arms',
              muscleGroups: ['shoulders', 'back', 'legs', 'arms'],
              exercises: '4-5 exercises covering all major muscle groups',
              example: 'Leg Curl (1 set), Overhead Press (1 set), Machine Row (1 set), Barbell Curl (1 set), Tricep Extension (1 set)'
            }
          ],
          frequency: 'Each muscle trained once every 7-10 days (alternating patterns)',
          rationale: 'Distributes systemic fatigue across two shorter sessions. Still maintains low frequency per muscle.'
        }
      ],
      variationLabels: [], // NO A/B variations within each split - same workout repeated each time
      rotationLogic: 'Within each split option, you perform the EXACT same workout every time (same exercises, same order). Only weights and reps progress. The split structure determines which muscles are trained together, but there is no workout-to-workout variation.'
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
        category: mentzerApproach.category,
        recommended_level: mentzerApproach.recommended_level,
        level_notes: mentzerApproach.level_notes,
        philosophy: mentzerApproach.philosophy,
        short_philosophy: mentzerApproach.short_philosophy,
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
        short_philosophy: mentzerApproach.short_philosophy,
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
