import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const y3tApproach = {
  name: 'Y3T (Yoda 3 Training - Neil Hill)',
  creator: 'Neil Hill',
  category: 'bodybuilding',
  recommended_level: 'intermediate',
  level_notes: {
    it: 'Periodizzazione avanzata con 3 settimane di rotazione',
    en: 'Advanced periodization with 3-week rotation'
  },
  philosophy: `Y3T (Yoda 3 Training) is an undulating periodization system built around a 3-week microcycle that rotates training stress weekly to prevent adaptation plateaus and optimize progressive overload. Each week has a distinct character: Week 1 (Heavy Week) uses low reps (6-8) with compound movements and longer rest for maximum mechanical tension and strength; Week 2 (Hybrid Week) uses moderate reps (8-12) with mixed compound and isolation work for balanced hypertrophy; Week 3 (Hell Week) uses high reps (15-30+) with predominantly isolation exercises, short rest, and advanced intensity techniques (drop sets, supersets, rest-pause) for extreme metabolic stress and muscle damage. This systematic variation prevents neural and muscular adaptation, allowing continuous progression without plateaus. The body never fully adapts to any single stimulus because it constantly changes. After 9 weeks (3 complete cycles), exercises are rotated to provide novelty. Y3T was developed by UK coach Neil Hill and famously used by 4x Mr. Olympia winner William "Flex" Wheeler in his comeback, plus numerous IFBB pros. The method balances strength, hypertrophy, and metabolic conditioning in a simple, sustainable structure.`,
  short_philosophy: 'Undulating periodization system rotating training stress across a 3-week microcycle: Heavy Week (6-8 reps, strength focus), Hybrid Week (8-12 reps, balanced hypertrophy), Hell Week (15-30+ reps, metabolic stress). Prevents adaptation plateaus through systematic variation. Used by 4x Mr. Olympia Flex Wheeler.',

  // Core training variables specific to Y3T
  variables: {
    setsPerExercise: {
      // Standard fields for UI compatibility
      working: 3, // Representative value for UI (average across weeks)
      warmup: '1-2 progressive sets on Week 1 heavy work, minimal warm-up on Week 3 hell week',
      // Y3T week-specific metadata
      week1Heavy: '2-4 sets per exercise',
      week2Hybrid: '2-3 sets per exercise',
      week3Hell: '1-2 sets per exercise (but with drop sets / rest-pause extending the set)'
    },
    repRanges: {
      // Standard fields for UI compatibility
      compound: [6, 12], // Representative range spanning the weeks
      isolation: [10, 20], // Representative range
      // Y3T week-specific metadata
      week1Heavy: [6, 8], // Pure strength and mechanical tension
      week2Hybrid: [8, 12], // Traditional hypertrophy range
      week3Hell: [15, 30], // Can go 30-50 reps especially on isolation movements like leg extensions, calf raises
      week3HellNote: 'Week 3 reps can reach 40-50 on certain exercises (leg extensions, calf raises, cable laterals) depending on exercise and intensity technique used'
    },
    rirTarget: {
      // Standard fields for UI compatibility
      normal: 1, // Week 1 & 2: close to failure but controlled
      intense: 0, // Week 3: absolute failure with intensity techniques
      deload: 3, // Deload: well shy of failure
      // Y3T week-specific metadata
      week1Heavy: 1, // Heavy week: 1 RIR for safety and longevity, especially on compounds
      week2Hybrid: 1, // Hybrid: 1 RIR on compounds, 0 RIR on isolations
      week3Hell: 0, // Hell week: absolute failure, then beyond via drop sets / rest-pause
      week3Philosophy: 'Week 3 is about pushing past normal failure using intensity techniques - the set doesn\'t end at failure, it extends through drops/pauses/supersets'
    },
    restPeriods: {
      week1Heavy: [180, 240], // 3-4 minutes for heavy compounds (squats, deadlifts, presses)
      week1HeavyNote: 'Full recovery between heavy sets - prioritize performance over pace',
      week2Hybrid: [90, 120], // 1.5-2 minutes for moderate work
      week2HybridNote: 'Standard bodybuilding rest - enough recovery for quality reps',
      week3Hell: [30, 60], // 30 seconds to 1 minute - keep heart rate elevated
      week3HellNote: 'Short rest amplifies metabolic stress. Drop sets / supersets have 10-20s between techniques. Heart rate stays high throughout workout.',
      week3IntensityTechniques: 'Drop sets: 10-15s rest while stripping weight. Rest-pause: 15-20s rest while holding position. Supersets: 0s rest between exercises.'
    },
    tempo: {
      // Standard fields for UI compatibility (numeric values)
      eccentric: 2, // 2 seconds controlled lowering (average across weeks)
      pauseBottom: 0, // No mandatory pause except Week 1
      concentric: 1, // Explosive but controlled
      pauseTop: 0, // No pause except peak contraction emphasis
      // Y3T week-specific metadata
      week1Heavy: '2-0-1-0', // Controlled eccentric, explosive concentric, no pauses
      week1Note: 'Power and acceleration - drive the weight with maximum force',
      week2Hybrid: '2-1-1-1', // Slower, more controlled, squeeze at top
      week2Note: 'Balance tension and time under tension - feel the muscle',
      week3Hell: '2-2-1-2', // Slow eccentric, pause in stretch, controlled concentric, squeeze at peak
      week3Note: 'Maximum time under tension - every second counts, especially in stretched position'
    },
    frequency: {
      muscleGroupDays: '1',
      weeklyPattern: '4-day original split or 5-day bodybuilding split',
      rationale: 'Y3T uses intense, high-volume approaches especially on Week 3 Hell Week. Each muscle needs 7 days to recover. Attempting higher frequency would compromise the intensity Y3T demands.',
      recovery: 'Week 3 creates significant muscle damage and DOMS. Rest and recovery are critical for the method to work.'
    },
    weeklyVariation: {
      core: 'The 3-week rotation IS the method. Do not skip weeks or rearrange order.',
      week1Heavy: {
        focus: 'Mechanical tension, strength, neural drive',
        feel: 'Heavy, powerful, brief workouts',
        fatigue: 'Moderate - mostly neural fatigue',
        purpose: 'Build strength foundation, allow metabolic recovery from Week 3'
      },
      week2Hybrid: {
        focus: 'Balanced hypertrophy - mechanical + metabolic',
        feel: 'Classic bodybuilding pump',
        fatigue: 'Moderate-high - balanced stress',
        purpose: 'Traditional muscle building, transition week'
      },
      week3Hell: {
        focus: 'Maximum metabolic stress, muscle damage, pump',
        feel: 'Extreme burn, lactic acid, cardiovascular challenge',
        fatigue: 'Very high - systemic exhaustion',
        purpose: 'Create severe overload, force adaptation, test mental toughness',
        warning: 'Most challenging week. Expect severe DOMS, fatigue. Critical to not overtrain by adding extra work.'
      }
    }
  },

  // Progression system for Y3T
  progression: {
    priority: 'cycle_based',
    primaryMetric: 'Ability to progress load or reps within each week\'s specific parameters while maintaining the weekly character. Week 1 = add weight at low reps, Week 2 = add reps then weight at moderate reps, Week 3 = complete more reps/drops/rounds than previous cycle.',

    rules: [
      {
        condition: 'Week 1 Heavy: Complete all sets at top of range (8 reps) with good form',
        action: 'Add 2.5-5kg next Week 1 (in 3 weeks)',
        note: 'Track Week 1 performance separately from other weeks - progressive overload occurs cycle to cycle'
      },
      {
        condition: 'Week 2 Hybrid: Hit 12 reps on all sets',
        action: 'Add weight next Week 2 (in 3 weeks) OR add 1 additional set',
        note: 'Can progress via intensity (weight) or volume (sets) in Week 2'
      },
      {
        condition: 'Week 3 Hell: Complete more total reps, drops, or rounds than previous Week 3',
        action: 'Progress by density - more work in same time, or add weight to starting weight',
        note: 'Week 3 progression is about work capacity - doing MORE (more drops, more reps per set, higher starting weight)'
      },
      {
        condition: 'Stalling on any given week',
        action: 'Maintain weight and focus on execution quality, mind-muscle connection',
        note: 'The variation between weeks provides built-in deload - if Week 1 stalls, Week 3 continues stressing the muscle differently'
      }
    ],

    deloadStrategy: {
      frequency: 'Every 3-4 complete cycles (9-12 weeks)',
      protocol: 'Take a full deload week: 50% normal volume, 70% normal intensity, stop at 3-4 RIR on all sets',
      structure: 'Use Week 2 (Hybrid) parameters but at reduced intensity. No Week 3 Hell techniques.',
      purpose: 'Y3T\'s built-in variation provides auto-regulation (Week 1 is easier than Week 3), but cumulative fatigue still builds. Deload every 9-12 weeks prevents overtraining.'
    },

    weightIncrements: [2.5, 5], // Small jumps especially on Week 1 heavy work

    deloadTriggers: [
      'Performance declining on Week 1 heavy lifts',
      'Unable to complete Week 3 Hell workouts without form breakdown',
      'Persistent joint pain or discomfort',
      'Sleep disruption or chronic fatigue',
      'Illness or excessive DOMS lasting 7+ days',
      'Loss of motivation or mental burnout'
    ],

    autoRegulation: 'Listen to your body across the weekly variation. If Week 1 feels exceptionally hard, reduce weight. If Week 3 feels impossible, reduce volume or simplify intensity techniques. The method is flexible within the structure.',

    cycleTracking: 'Track performance for EACH WEEK separately. Week 1 Cycle 1 vs Week 1 Cycle 2 (3 weeks later). Week 3 Hell Cycle 1 vs Week 3 Hell Cycle 2. Don\'t compare across weeks (Week 1 vs Week 3) - they\'re different stimuli.',

    exerciseRotation: {
      frequency: 'Every 9 weeks (after 3 complete 3-week cycles)',
      rationale: 'The weekly variation prevents adaptation to rep ranges and intensity, but the same exercises for 9 weeks allows progressive overload tracking. After 9 weeks, rotate exercises for novelty.',
      examples: [
        'Barbell bench press → Dumbbell bench press',
        'Barbell rows → T-bar rows',
        'Leg press → Hack squats',
        'Cable lateral raises → Dumbbell lateral raises'
      ],
      note: 'Rotate similar movement patterns - don\'t completely change exercises (e.g., don\'t replace squats with leg extensions)'
    }
  },

  // Exercise selection rules for Y3T
  exerciseSelection: {
    compoundFocus: 'Week 1 is exclusively or predominantly compound movements. Week 2 mixes compounds and isolations. Week 3 is predominantly isolation with some compounds.',
    isolationFocus: 'Week 3 Hell Week emphasizes isolation exercises because they allow safer failure with intensity techniques and superior mind-muscle connection at high reps.',

    principles: [
      'Week 1 Heavy: Choose big compound movements you can load progressively (squats, deadlifts, bench, rows, overhead press)',
      'Week 2 Hybrid: Balance compounds and isolations - start with compounds, finish with isolations',
      'Week 3 Hell: Choose exercises that feel good at high reps (15-30+) - machines, cables, dumbbells preferred',
      'Week 3: Avoid heavy free weight compounds at extreme fatigue - injury risk is high',
      'Exercise selection should allow the weekly theme - Heavy week = strength movements, Hell week = pump movements'
    ],

    weeklyDistribution: {
      week1Heavy: {
        compounds: '100%',
        isolations: '0% (or minimal - e.g., 1 isolation finisher)',
        exercisesPerMuscle: '3-4 exercises, 2-4 sets each',
        totalSets: '8-12 sets per muscle group',
        examples: 'Chest: Barbell bench, Incline dumbbell press, Dips. Back: Deadlifts, Barbell rows, Pull-ups.'
      },
      week2Hybrid: {
        compounds: '60%',
        isolations: '40%',
        exercisesPerMuscle: '4-5 exercises, 2-3 sets each',
        totalSets: '10-14 sets per muscle group',
        examples: 'Chest: Bench press, Incline DB press, Cable flyes, Dumbbell pullovers. Back: Rows, Pulldowns, Cable pullovers, Face pulls.'
      },
      week3Hell: {
        compounds: '20% (optional compound warm-up)',
        isolations: '80%',
        exercisesPerMuscle: '4-6 exercises, 1-2 sets each (extended with techniques)',
        totalSets: '6-10 working sets but each set is extended (drop sets = 3 mini-sets)',
        examples: 'Chest: Pec deck (triple drop), Cable flyes (rest-pause), Incline DB flyes (superset with push-ups). Back: Cable pullovers, Lat pulldowns, Machine rows (all with drops/pauses).'
      }
    },

    priorityRules: [
      'Week 1: Start with heaviest compound, work down in load',
      'Week 2: Compounds first, isolations second',
      'Week 3: Can start with compound for 1-2 warm-up sets, then isolation exercises with intensity techniques'
    ],

    exercisesPerWorkout: {
      min: 3,
      max: 6,
      note: 'Week 1 = fewer exercises, more sets. Week 3 = more exercises, fewer sets (but extended with techniques).'
    },

    muscleGroupOrder: [
      'Train largest muscle first when pairing muscle groups',
      'Week 3 Hell Week especially demanding - train priority muscle first while fresh'
    ],

    substitutionRules: {
      whenToSubstitute: [
        'Exercise doesn\'t suit the weekly theme (e.g., using isolation on Week 1 Heavy)',
        'Joint pain or discomfort',
        'Poor mind-muscle connection',
        'Equipment unavailable'
      ],
      week1Substitution: 'Replace with similar compound - maintain strength-building capacity',
      week2Substitution: 'Replace with similar movement pattern',
      week3Substitution: 'Replace with similar isolation - prioritize pump and safety at high reps',
      loadAdjustment: 'Week 3 uses ~50-60% of your Week 1 weight on the same exercise due to high reps and short rest'
    },

    exerciseExamples: {
      chest: {
        week1Heavy: ['Barbell bench press (6-8 reps)', 'Incline dumbbell press (6-8)', 'Weighted dips (6-8)'],
        week2Hybrid: ['Barbell bench press (8-12)', 'Incline DB press (8-12)', 'Cable flyes (10-12)', 'Dumbbell pullovers (10-12)'],
        week3Hell: ['Pec deck machine (15-20 + triple drop set)', 'Cable crossovers (20-25 + rest-pause)', 'Incline DB flyes (15-20)', 'Push-up burnout (AMRAP)']
      },
      back: {
        week1Heavy: ['Deadlifts (6-8)', 'Barbell rows (6-8)', 'Weighted pull-ups (6-8)', 'T-bar rows (6-8)'],
        week2Hybrid: ['Barbell rows (8-12)', 'Lat pulldowns (8-12)', 'Seated cable rows (10-12)', 'Dumbbell rows (10-12)'],
        week3Hell: ['Straight-arm cable pulldowns (15-20 + drop set)', 'Machine rows (20-25 + rest-pause)', 'Cable pullovers (20-25)', 'Lat pulldown (high rep, constant tension)']
      },
      shoulders: {
        week1Heavy: ['Barbell overhead press (6-8)', 'Dumbbell shoulder press (6-8)', 'Upright rows (8-10)'],
        week2Hybrid: ['Dumbbell shoulder press (8-12)', 'Lateral raises (10-12)', 'Front raises (10-12)', 'Reverse pec deck (10-12)'],
        week3Hell: ['Cable lateral raises (20-25 + drop set)', 'Machine shoulder press (15-20 + rest-pause)', 'Front raises (20-25)', 'Rear delt cable flyes (20-30)']
      },
      quads: {
        week1Heavy: ['Barbell squats (6-8)', 'Front squats (6-8)', 'Leg press (8-10 heavy)'],
        week2Hybrid: ['Squats (8-12)', 'Leg press (10-12)', 'Hack squats (10-12)', 'Leg extensions (12-15)'],
        week3Hell: ['Leg extensions (20-30 + triple drop)', 'Leg press (20-25 + rest-pause)', 'Hack squats (15-20)', 'Sissy squats or Bulgarian split squats (15-20 each leg)']
      },
      hamstrings: {
        week1Heavy: ['Romanian deadlifts (6-8)', 'Stiff-leg deadlifts (8-10)'],
        week2Hybrid: ['Romanian deadlifts (8-12)', 'Lying leg curls (10-12)', 'Seated leg curls (10-12)'],
        week3Hell: ['Lying leg curls (20-30 + drop set)', 'Seated leg curls (20-25 + rest-pause)', 'Single-leg curls (15-20 each)', 'Glute-ham raises (AMRAP)']
      },
      biceps: {
        week1Heavy: ['Barbell curls (6-8)', 'Hammer curls (6-8)'],
        week2Hybrid: ['Barbell curls (8-12)', 'Incline dumbbell curls (10-12)', 'Cable curls (10-12)'],
        week3Hell: ['Cable curls (20-25 + drop set)', 'Dumbbell curls (15-20 + rest-pause)', '21s protocol (7 bottom half + 7 top half + 7 full ROM)', 'Concentration curls (20-25)']
      },
      triceps: {
        week1Heavy: ['Close-grip bench press (6-8)', 'Weighted dips (6-8)'],
        week2Hybrid: ['Close-grip bench (8-12)', 'Overhead dumbbell extension (10-12)', 'Rope pushdowns (10-12)'],
        week3Hell: ['Rope pushdowns (20-30 + drop set)', 'Overhead cable extensions (20-25 + rest-pause)', 'Single-arm cable pushdowns (15-20 each)', 'Diamond push-ups (AMRAP)']
      },
      calves: {
        week1Heavy: ['Standing calf raises (8-10 heavy)', 'Seated calf raises (8-10)'],
        week2Hybrid: ['Standing calf raises (12-15)', 'Seated calf raises (12-15)', 'Calf press (12-15)'],
        week3Hell: ['Calf press on leg press (30-50 + drop set)', 'Standing calf raises (25-30 + rest-pause)', 'Seated calf raises (25-30)', 'Single-leg calf raises (20-25 each)']
      }
    }
  },

  // Exercise selection principles - expanded for AI optimization
  exerciseSelectionPrinciples: {
    movementPatterns: {
      horizontalPush: {
        week1Heavy: ['Barbell bench press', 'Dumbbell bench press', 'Weighted dips', 'Hammer Strength chest press'],
        week2Hybrid: ['Barbell bench press', 'Incline dumbbell press', 'Machine chest press', 'Cable flyes', 'Dumbbell flyes'],
        week3Hell: ['Pec deck machine', 'Cable crossovers (all angles)', 'Machine flyes', 'Incline dumbbell flyes', 'Push-up variations (burnout)']
      },
      verticalPush: {
        week1Heavy: ['Barbell overhead press', 'Dumbbell shoulder press (seated)', 'Push press'],
        week2Hybrid: ['Dumbbell shoulder press', 'Machine shoulder press', 'Landmine press', 'Arnold press'],
        week3Hell: ['Machine shoulder press (high rep)', 'Smith machine press (controlled)', 'Seated dumbbell press (constant tension)']
      },
      horizontalPull: {
        week1Heavy: ['Barbell rows (overhand/underhand)', 'T-bar rows', 'Dumbbell rows', 'Chest-supported rows'],
        week2Hybrid: ['Barbell rows', 'Dumbbell rows', 'Seated cable rows', 'Machine rows (Hammer Strength)', 'T-bar rows'],
        week3Hell: ['Machine rows (rest-pause)', 'Seated cable rows (drop sets)', 'Single-arm cable rows', 'Cable pullovers']
      },
      verticalPull: {
        week1Heavy: ['Weighted pull-ups', 'Weighted chin-ups', 'Lat pulldown (heavy, strict)'],
        week2Hybrid: ['Pull-ups', 'Lat pulldown (wide/close grip)', 'Assisted pull-ups', 'Machine pulldowns'],
        week3Hell: ['Lat pulldown (constant tension, high rep)', 'Straight-arm cable pulldowns (drop sets)', 'Cable pullovers', 'Machine pullovers']
      },
      lateralDeltoid: {
        week1Heavy: ['Upright rows (barbell or EZ-bar)', 'Heavy dumbbell lateral raises (controlled)'],
        week2Hybrid: ['Dumbbell lateral raises', 'Cable lateral raises', 'Machine lateral raises', 'Upright rows'],
        week3Hell: ['Cable lateral raises (drop sets)', 'Machine lateral raises (rest-pause)', 'Dumbbell lateral raises (high rep)', 'Lateral raise variations (front-to-side)']
      },
      squatPattern: {
        week1Heavy: ['Barbell back squats', 'Front squats', 'Safety bar squats', 'Leg press (heavy, low rep)'],
        week2Hybrid: ['Squats (barbell or dumbbell)', 'Leg press', 'Hack squats', 'Goblet squats', 'Smith machine squats'],
        week3Hell: ['Leg press (high rep, rest-pause)', 'Hack squat machine (controlled)', 'Smith machine squats (constant tension)', 'Sissy squats']
      },
      hingePattern: {
        week1Heavy: ['Deadlifts', 'Romanian deadlifts', 'Stiff-leg deadlifts'],
        week2Hybrid: ['Romanian deadlifts', 'Stiff-leg deadlifts', 'Good mornings', 'Hyperextensions'],
        week3Hell: ['Hyperextensions (high rep)', 'Cable pull-throughs', 'Glute-ham raises (bodyweight or light)', 'Good mornings (light, controlled)']
      },
      kneeFlexion: {
        week1Heavy: ['Lying leg curls (heavy)', 'Seated leg curls (heavy)'],
        week2Hybrid: ['Lying leg curls', 'Seated leg curls', 'Single-leg curls', 'Nordic curls'],
        week3Hell: ['Lying leg curls (triple drop)', 'Seated leg curls (rest-pause)', 'Single-leg curls (high rep)', 'Glute-ham raises']
      },
      kneeExtension: {
        week1Heavy: ['Squats and leg press (no isolated extensions in Week 1)'],
        week2Hybrid: ['Leg extensions (moderate weight, controlled)', 'Sissy squats'],
        week3Hell: ['Leg extensions (triple drop - SIGNATURE Week 3 exercise)', 'Leg extensions (rest-pause)', 'Single-leg extensions']
      },
      elbowFlexion: {
        week1Heavy: ['Barbell curls', 'Hammer curls (heavy dumbbells)', 'EZ-bar curls'],
        week2Hybrid: ['Barbell curls', 'Dumbbell curls (alternating or simultaneous)', 'Incline dumbbell curls', 'Cable curls', 'Preacher curls'],
        week3Hell: ['Cable curls (drop sets)', 'Machine preacher curls (rest-pause)', '21s protocol', 'Dumbbell curls (high rep)', 'Concentration curls']
      },
      elbowExtension: {
        week1Heavy: ['Close-grip bench press', 'Weighted dips', 'Barbell skull crushers'],
        week2Hybrid: ['Close-grip bench', 'Dips', 'Overhead dumbbell extension', 'Rope pushdowns', 'EZ-bar extensions'],
        week3Hell: ['Rope pushdowns (triple drop)', 'Overhead cable extensions (rest-pause)', 'Single-arm cable pushdowns', 'Machine dips (high rep)', 'Diamond push-ups (burnout)']
      }
    },

    unilateralRequirements: {
      minPerWorkout: 0,
      week1Applicability: 'Generally avoid unilateral work in Week 1 Heavy - bilateral movements allow maximum load',
      week2Applicability: 'Optional in Week 2 Hybrid - single-leg RDLs, Bulgarian splits, single-arm rows acceptable',
      week3Applicability: 'EXCELLENT for Week 3 Hell - single-leg extensions, single-leg curls, single-arm cable work provides superior pump and isolation',
      rationale: 'Unilateral exercises are lower-fatigue and allow intense focus on one limb. Perfect for Week 3 Hell Week metabolic work.',
      examples: ['Single-leg extensions (Week 3)', 'Single-leg curls (Week 3)', 'Single-arm cable curls (Week 3)', 'Single-arm cable lateral raises (Week 3)']
    },

    compoundToIsolationRatio: {
      compound: 40, // Average across 3 weeks
      isolation: 60,
      week1Heavy: { compound: 100, isolation: 0, note: 'Exclusively or almost exclusively compounds' },
      week2Hybrid: { compound: 60, isolation: 40, note: 'Balanced - compounds first, isolations second' },
      week3Hell: { compound: 20, isolation: 80, note: 'Predominantly isolation with optional compound warm-up' },
      rationale: 'Weekly rotation systematically varies compound/isolation ratio to prevent adaptation and optimize stimulus. Week 1 builds strength, Week 2 is balanced, Week 3 maximizes metabolic stress through isolation.',
      implementation: 'Week 1: 4 compounds x 3 sets = 12 sets. Week 2: 3 compounds x 3 sets + 2 isolations x 3 sets = 15 sets. Week 3: 1 compound x 2 sets (optional) + 5 isolations x 2 sets = 12 sets (extended with techniques = 18-20 effective).'
    },

    equipmentVariations: [
      'Week 1 Heavy: BARBELLS preferred - allow maximum progressive overload on compounds (squats, bench, deadlifts, rows, overhead press)',
      'Week 1: Heavy dumbbells acceptable for presses and rows',
      'Week 1: Machines acceptable if free weights unavailable (Hammer Strength, leg press, Smith machine)',
      'Week 2 Hybrid: MIX of barbells, dumbbells, machines, and cables - variety prevents boredom',
      'Week 2: Compounds use barbells/dumbbells, isolations use cables/machines',
      'Week 3 Hell: MACHINES AND CABLES STRONGLY PREFERRED - safe failure, constant tension, pin-loaded for quick drop sets',
      'Week 3: Pin-loaded machines are IDEAL for triple drop sets (leg extensions, leg curls, lat pulldowns, cable stations)',
      'Week 3: Avoid heavy barbell compounds (squats, deadlifts, heavy bench) - injury risk at extreme fatigue and high reps',
      'Week 3: Dumbbells acceptable for isolation (flyes, lateral raises, curls) but pre-place lighter dumbbells for drop sets',
      'Smith machine useful for Week 3 squatting movements - guided bar path allows high-rep safety'
    ],

    safetyPrinciples: [
      'Week 1 Heavy: Use safety bars, spotter arms, or power rack for heavy squats and bench presses',
      'Week 1: Stop at 1 RIR (not absolute failure) on heavy compounds - preserve joints and CNS',
      'Week 2 Hybrid: Standard safety - use spotter for heavy dumbbell presses, avoid ego lifting',
      'Week 3 Hell: CRITICAL - choose exercises where failure is SAFE without spotter',
      'Week 3: Never use heavy free weight compounds - fatigue + high reps + metabolic stress = injury risk',
      'Week 3: Drop sets and rest-pause require equipment setup beforehand - have pins ready, weights accessible',
      'Week 3: If form breaks down during drop sets, END THE SET immediately',
      'Week 3: Have water, towel, and seat nearby - nausea and lightheadedness are common especially on leg exercises',
      'Week 3: Training partner helpful but not required - machines allow safe solo training to failure'
    ],

    weeklyPrioritization: {
      week1Heavy: 'Prioritize exercises you can progressively overload - track weights meticulously. Choose exercises you\'re strong at and can push safely.',
      week2Hybrid: 'Balanced selection - mix exercises you\'re strong at with exercises for lagging muscles. Variety is acceptable.',
      week3Hell: 'Prioritize exercises that give you the best PUMP and mind-muscle connection. Choose movements you "feel" working. Safety and pump quality trump weight.'
    }
  },

  // Rationales - explaining the WHY behind Y3T
  rationales: {
    why_three_weeks: 'Three weeks is the optimal microcycle length because it balances variation with consistency. Each week provides a distinct stimulus (mechanical, balanced, metabolic) without allowing full adaptation. The body starts adapting to a stimulus around week 2-3, so rotating weekly keeps it off-balance. Three weeks is long enough to track progress cycle-to-cycle but short enough to prevent plateau. Longer cycles (4-6 weeks) risk staleness; shorter (1-2 weeks) prevent sufficient overload accumulation.',

    why_weekly_rotation: 'Weekly rotation (not daily or bi-weekly) provides the right dose-response. One heavy week builds strength and allows metabolic recovery. One hybrid week provides balanced stimulus. One hell week creates severe overload then you rotate before overtraining. If you did Hell Week for 2-3 weeks straight, you\'d overtrain. If you did Heavy Week for 3+ weeks, you\'d stagnate. The rotation is perfectly timed.',

    why_week1_heavy: 'Week 1 Heavy (6-8 reps, long rest, compounds) serves multiple purposes: (1) Builds foundational strength that carries over to other weeks; (2) Provides neural and metabolic recovery from Week 3 Hell; (3) Prevents the muscle from adapting to high-rep work only; (4) Maintains testosterone and CNS drive; (5) Teaches progressive overload with trackable loads. Without heavy work, you lose strength and the ability to overload in later weeks.',

    why_week2_hybrid: 'Week 2 Hybrid (8-12 reps) is classic hypertrophy training - balanced mechanical tension and metabolic stress. It serves as a transition week, bridging the neural focus of Week 1 and metabolic chaos of Week 3. It allows continued overload without the neural demand of heavy lifting or metabolic brutality of Hell Week. It\'s sustainable, effective, and provides active recovery while still training hard.',

    why_week3_hell: 'Week 3 Hell is where the magic happens. High reps (15-30+), short rest, drop sets, rest-pause, and supersets create maximum metabolic stress, muscle damage, lactate accumulation, and growth hormone release. The extreme pump stretches the fascia and triggers cellular swelling signals. The mental and physical suffering forces the body to adapt. Hell Week creates overreaching - controlled short-term overtraining that supercompensates during the next cycle. It tests and builds mental toughness. Phil Heath said "the weeks you want to quit are the weeks you grow." Hell Week is that week.',

    why_low_volume_week3: 'Week 3 uses fewer straight sets (1-2 per exercise) because intensity techniques (drop sets, rest-pause) extend the set significantly. A single drop set (work set → drop 30% → drop 30% again) is effectively 3 mini-sets with 10-15s rest. A rest-pause set (failure → 15s → failure → 15s → failure) is 3 sets\' worth of fatigue. The volume is NOT low - it\'s condensed. Doing 3-4 straight sets PLUS drops would be massive overtraining.',

    why_exercise_rotation: 'After 9 weeks (3 complete cycles), you rotate exercises to provide novelty and prevent staleness. The weekly rep/intensity variation prevents adaptation to the load, but the same exercises allow progressive overload tracking. Nine weeks is long enough to see measurable strength gains (comparing Week 1 Cycle 1 to Week 1 Cycle 3) but not so long that you plateau or lose motivation. Rotate to similar movements (bench press → dumbbell press) to maintain carryover.',

    why_once_per_week_frequency: 'Y3T demands 1x/week per muscle frequency because Week 3 Hell creates severe muscle damage and DOMS. Attempting 2x/week would mean training the muscle again before recovery, compromising performance and risking injury. The high intensity across all three weeks (heavy loads, high volume, then metabolic hell) requires a full 7 days. Higher frequency would dilute the weekly character and prevent the overreaching necessary for adaptation.',

    why_no_failure_week1: 'Week 1 Heavy stops at 1 RIR (not absolute failure) for several reasons: (1) Preserves CNS and joints for long-term progression; (2) Heavy loads (6-8 reps) at failure increase injury risk dramatically; (3) The goal is strength and tension, not metabolic fatigue - failure is unnecessary; (4) Allows progressive overload week to week without burning out; (5) You WILL hit failure plenty in Week 3 - no need to do it in Week 1.',

    why_intensity_techniques_week3: 'Drop sets, rest-pause, supersets, and other intensity techniques are mandatory in Week 3 because they allow you to push past normal failure and create extreme metabolic overload. A straight set to failure leaves growth on the table - the muscle can still contract with lighter weight (drop set) or after brief rest (rest-pause). These techniques create the metabolic environment (lactate, hydrogen ions, cell swelling, growth hormone spike) that drives hypertrophy. Week 3 without intensity techniques is just high-rep training - adding the techniques makes it HELL.',

    mechanical_vs_metabolic_balance: 'Y3T perfectly balances the three hypertrophy mechanisms: mechanical tension (Week 1 Heavy), muscle damage (peaks in Week 3), and metabolic stress (Week 3). Traditional programs emphasize one or two mechanisms. Y3T systematically rotates through all three, ensuring complete stimulus coverage. No adaptation, no weak points, continuous progress.',

    autoregulation_through_variation: 'Y3T provides built-in autoregulation. If you overtrain on Week 3, Week 1\'s lower volume and metabolic demand allow recovery while still training. If you undertrain on Week 1, Week 3 provides the overload. The variation prevents the need for reactive deloads every 4-5 weeks like linear programs require. The system IS the deload and the overload, cycling weekly.',

    psychology_of_variation: 'Mental freshness is underrated. Doing the same rep ranges and intensity week after week is boring and demotivating. Y3T keeps training interesting - you\'re always looking forward to or dreading the next week type. Week 1 feels strong and powerful. Week 2 feels like classic bodybuilding. Week 3 is a mental and physical challenge you survive and feel accomplished. The variation keeps motivation high for months.',

    progressive_overload_clarity: 'Y3T makes progressive overload crystal clear. Week 1: add weight or reps at 6-8 reps. Week 2: add weight or reps at 8-12 reps. Week 3: complete more total reps/drops/rounds. Each week has its own progression metric. Compare Week 1 Cycle 1 to Week 1 Cycle 2 (3 weeks later). Linear progression is maintained despite the variation because you\'re progressing within each week type separately.'
  },

  // ROM emphasis - varies by week to match training intensity
  romEmphasis: {
    lengthened: 35, // Y3T emphasizes stretch position especially in Week 3
    shortened: 40,  // Peak contraction critical in Week 3 Hell
    fullRange: 25,  // Week 1 and 2 use full ROM

    principles: [
      'Week 1 Heavy: FULL ROM on all compound movements - no compromise, maximum load through complete range',
      'Week 1: Explosive concentric out of the bottom (stretch position), controlled eccentric',
      'Week 2 Hybrid: Balanced full ROM with mind-muscle connection emphasis',
      'Week 2: Controlled tempo throughout, feel the muscle working at all joint angles',
      'Week 3 Hell: PEAK CONTRACTION at shortened position is CRITICAL - squeeze hard for 1-2 seconds',
      'Week 3: Emphasize stretch position on isolation exercises (deep leg extensions, cable flyes, dumbbell flyes)',
      'Week 3: Constant tension - never let muscle fully rest during the set',
      'Week 3: Burn at peak contraction and stretch position drives metabolic stress',
      'Drop sets in Week 3 maintain tension across 3 weight drops - muscles under continuous stress',
      'Time under tension increases from Week 1 (30-40s per set) to Week 3 (60-90s per extended set)'
    ],

    weeklyDetails: {
      week1Heavy: {
        focus: 'Full ROM for maximum mechanical tension',
        lengthened: 40, // Strong eccentric in stretched position
        shortened: 35,  // Drive out of bottom explosively
        fullRange: 25,
        tempoEmphasis: 'Explosive concentric (1 sec), controlled eccentric (2 sec)',
        rationale: 'Heavy loads require full ROM to maximize mechanical tension and strength development'
      },
      week2Hybrid: {
        focus: 'Balanced ROM with mind-muscle connection',
        lengthened: 35,
        shortened: 35,
        fullRange: 30,
        tempoEmphasis: 'Controlled throughout (2-1-1-1), squeeze at peak',
        rationale: 'Classic hypertrophy training emphasizes controlled tempo at all points in ROM'
      },
      week3Hell: {
        focus: 'Maximum time under tension, peak contraction and stretch position',
        lengthened: 35, // Intense stretch on isolation (flyes, extensions)
        shortened: 50,  // CRITICAL - squeeze at peak drives metabolic burn
        fullRange: 15,
        tempoEmphasis: 'Slow eccentric (2 sec), LONG squeeze at peak (2 sec), constant tension',
        rationale: 'High-rep metabolic work maximizes stimulus by emphasizing contracted and stretched positions, never allowing muscle to rest'
      }
    },

    techniqueNotes: {
      compounds: 'Week 1 and 2: Maintain strict full ROM on all compounds. These build strength foundation and work capacity.',
      isolations: 'Week 2 and especially Week 3: Focus on stretch position (bottom of flyes, deep leg extensions) and peak contraction (squeeze at top). Constant tension is key - never let weight stack touch between reps.',
      dropSets: 'Week 3 drop sets maintain tension across weight reductions. Total time under tension = 60-90 seconds for one extended set.',
      restPause: 'Week 3 rest-pause: Brief rest (15-20s) but maintain position/tension. Resume with same emphasis on peak contraction and stretch.'
    }
  },

  // Stimulus to Fatigue optimization
  stimulusToFatigue: {
    philosophy: 'Y3T optimizes stimulus-to-fatigue ratio through systematic weekly rotation. Week 1 accepts high mechanical fatigue for strength adaptation. Week 3 maximizes metabolic stimulus while minimizing systemic fatigue through isolation exercise selection. The rotation prevents long-term fatigue accumulation while providing continuous growth stimulus.',

    principles: [
      'Week 1 Heavy creates HIGH fatigue from heavy compounds - necessary for strength but requires recovery',
      'Week 2 Hybrid balances moderate stimulus with moderate fatigue - sustainable middle ground',
      'Week 3 Hell maximizes metabolic stimulus with LOWER systemic fatigue than Week 1 despite extreme local muscle fatigue',
      'Key insight: Isolation exercises (Week 3) create muscle failure without CNS/joint/systemic fatigue of heavy compounds',
      'Drop sets and rest-pause (Week 3) extend sets locally without additional systemic cost',
      'Weekly rotation IS the fatigue management strategy - Week 1 recovers metabolically from Week 3, Week 3 recovers mechanically from Week 1',
      'Machines and cables (Week 3) have superior S:F ratios compared to free weights for high-rep metabolic work',
      'Strategic exercise selection allows extreme intensity without overtraining'
    ],

    highStimulusLowFatigue: [
      // Week 3 Hell exercises - PRIORITIZE THESE
      'Leg extensions (machine)', 'Leg curls (lying or seated)', 'Calf press on leg press', 'Seated calf raises',
      'Pec deck machine', 'Cable flyes (all angles)', 'Cable crossovers', 'Machine flyes',
      'Lat pulldown (controlled)', 'Straight-arm cable pulldowns', 'Cable pullovers', 'Machine rows',
      'Cable lateral raises', 'Machine lateral raises', 'Reverse pec deck (rear delts)',
      'Cable bicep curls', 'Machine preacher curls', 'Concentration curls',
      'Cable tricep pushdowns (rope or V-bar)', 'Overhead cable extensions', 'Machine tricep extensions',
      'Leg press (moderate weight, high rep)', 'Hack squat machine (controlled)', 'Smith machine squats',
      'Cable pull-throughs', 'Hyperextensions (bodyweight)', 'Glute-ham raises',
      'Face pulls', 'Band pull-aparts', 'Cable rear delt flyes'
    ],

    moderateStimulusFatigue: [
      // Week 2 Hybrid exercises - balanced selection
      'Dumbbell bench press', 'Incline dumbbell press', 'Dumbbell shoulder press',
      'Dumbbell rows', 'Chest-supported rows', 'T-bar rows (moderate weight)',
      'Goblet squats', 'Bulgarian split squats', 'Walking lunges',
      'Romanian deadlifts (moderate weight)', 'Stiff-leg deadlifts',
      'Dumbbell curls', 'Incline dumbbell curls', 'Hammer curls',
      'Dumbbell overhead extensions', 'Dumbbell skull crushers',
      'Dumbbell lateral raises', 'Dumbbell front raises', 'Dumbbell flyes',
      'Leg press (heavy-ish)', 'Hack squats', 'Smith machine variations',
      'Landmine press', 'Arnold press', 'Upright rows'
    ],

    lowStimulusHighFatigue: [
      // Week 1 Heavy exercises - use strategically, low volume
      'Heavy barbell back squats', 'Heavy front squats',
      'Heavy deadlifts (conventional)', 'Heavy Romanian deadlifts',
      'Heavy barbell bench press', 'Heavy barbell overhead press',
      'Heavy barbell rows', 'Heavy T-bar rows',
      'Weighted pull-ups (heavy)', 'Weighted dips (heavy)',
      'Heavy close-grip bench press', 'Heavy barbell curls',
      'Push press', 'Power cleans (if applicable)'
    ],

    weeklyApplication: {
      week1Heavy: {
        strategy: 'Accept low S:F ratio from heavy compounds - NECESSARY for strength and neural adaptation',
        volume: 'Keep volume LOW (2-4 sets per exercise) to manage fatigue despite low S:F ratio',
        recovery: 'Long rest periods (3-4 min) and stopping at 1 RIR minimize unnecessary fatigue',
        rationale: 'Heavy mechanical loading requires systemic fatigue investment. Limit volume to what\'s needed for strength stimulus.'
      },
      week2Hybrid: {
        strategy: 'Use moderate S:F exercises - balanced approach',
        volume: 'Moderate volume (2-3 sets per exercise, 10-14 total sets)',
        recovery: 'Standard rest (90-120s), training close to failure',
        rationale: 'Classic hypertrophy training. Neither optimized for S:F nor deliberately high-fatigue.'
      },
      week3Hell: {
        strategy: 'EXCLUSIVELY high S:F exercises - maximize stimulus, minimize systemic fatigue',
        volume: 'Moderate straight set volume (1-2 sets per exercise) but extended with intensity techniques = high effective volume',
        recovery: 'Short rest (30-60s) creates metabolic stress without systemic fatigue accumulation',
        rationale: 'Isolation + machines + cables + drop sets = extreme local muscle stimulus with manageable systemic cost. This allows Week 3\'s extreme intensity without overtraining.',
        critical: 'NEVER use low S:F exercises in Week 3 (heavy barbell squats, deadlifts, heavy pressing). The combination of high reps + heavy load + compound movements = injury and overtraining.'
      }
    },

    exerciseSelectionGuidelines: {
      week1: 'Choose from lowStimulusHighFatigue and moderateStimulusFatigue categories. Accept the fatigue cost for strength gains. Minimize volume to 2-4 sets per exercise.',
      week2: 'Choose from moderateStimulusFatigue category with some highStimulusLowFatigue isolations at the end. Balanced selection.',
      week3: 'EXCLUSIVELY choose from highStimulusLowFatigue category. Machines and cables only. Pin-loaded equipment ideal for drop sets. Safety and pump quality are paramount.'
    },

    overallStrategy: 'Y3T\'s genius is the weekly S:F rotation. Week 1 invests in high-fatigue exercises for strength (recovered from by Week 2-3\'s lower CNS demand). Week 3 maximizes growth stimulus through high S:F isolation work (recovered from mechanically by Week 1\'s lower metabolic demand). No single week overtaxes the system, but every week provides growth stimulus. This prevents plateau and overtraining simultaneously.'
  },

  // Volume landmarks adapted for Y3T's weekly variation
  volumeLandmarks: {
    note: 'Y3T volume varies dramatically by week. Week 1 = lower volume, higher intensity. Week 2 = moderate volume. Week 3 = moderate straight set volume but intensity techniques multiply effective volume. These landmarks represent AVERAGE per week.',

    muscleGroups: {
      chest: {
        mev: 8,
        mav: 12,
        mrv: 16,
        weeklyBreakdown: 'Week 1: 8-10 sets (4 exercises x 2-3 sets). Week 2: 12-14 sets (4-5 exercises x 2-3 sets). Week 3: 8-10 straight sets but extended with drops/pauses = ~15-18 effective sets.'
      },
      back: {
        mev: 10,
        mav: 14,
        mrv: 20,
        weeklyBreakdown: 'Week 1: 10-12 sets. Week 2: 14-16 sets. Week 3: 10-12 straight sets = ~18-20 effective sets with techniques.'
      },
      shoulders: {
        mev: 8,
        mav: 12,
        mrv: 16,
        weeklyBreakdown: 'Week 1: 8-10 sets (pressing focus). Week 2: 12-14 sets (pressing + lateral work). Week 3: 10-12 straight sets (lateral/isolation focus) = ~15-18 effective.'
      },
      quads: {
        mev: 8,
        mav: 12,
        mrv: 18,
        weeklyBreakdown: 'Week 1: 8-10 sets (squats, leg press heavy). Week 2: 12-14 sets (squats + extensions). Week 3: 8-10 straight sets (extensions, leg press high rep) = ~16-20 effective. Week 3 leg extensions with drop sets are BRUTAL.'
      },
      hamstrings: {
        mev: 6,
        mav: 10,
        mrv: 14,
        weeklyBreakdown: 'Week 1: 6-8 sets (deadlift variations). Week 2: 10-12 sets (RDLs + curls). Week 3: 8-10 straight sets (curls with techniques) = ~14-16 effective.'
      },
      glutes: {
        mev: 6,
        mav: 10,
        mrv: 14,
        weeklyBreakdown: 'Often trained with quads/hams. Week 1: hip thrusts heavy. Week 2: thrusts + kickbacks. Week 3: cable kickbacks, glute-focused leg press high rep.'
      },
      biceps: {
        mev: 6,
        mav: 10,
        mrv: 14,
        weeklyBreakdown: 'Week 1: 6-8 sets (barbell, hammer curls heavy). Week 2: 10-12 sets (barbell + DB + cable). Week 3: 8-10 straight sets (cable curls, 21s) = ~14-16 effective.'
      },
      triceps: {
        mev: 6,
        mav: 10,
        mrv: 14,
        weeklyBreakdown: 'Week 1: 6-8 sets (close-grip bench, dips). Week 2: 10-12 sets (pressing + extensions). Week 3: 8-10 straight sets (pushdowns, overhead) = ~14-16 effective.'
      },
      calves: {
        mev: 8,
        mav: 12,
        mrv: 18,
        weeklyBreakdown: 'Week 1: 6-8 sets heavy. Week 2: 10-12 sets moderate. Week 3: 12-15 straight sets ultra-high rep (30-50) = ~18-20 effective. Calves respond to volume and Week 3 destroys them.'
      },
      forearms: {
        mev: 4,
        mav: 8,
        mrv: 12,
        weeklyBreakdown: 'Often trained with back/arms. Week 1: wrist curls heavy. Week 2: wrist curls + reverse curls. Week 3: high rep wrist curls, farmer walks.'
      },
      abs: {
        mev: 0,
        mav: 10,
        mrv: 20,
        weeklyBreakdown: 'Can be trained 2-3x/week. Week 1: weighted ab exercises (cable crunches 6-8 reps). Week 2: moderate rep ab work. Week 3: high rep ab circuits, planks for time.'
      }
    }
  },

  // Frequency guidelines
  frequencyGuidelines: {
    recommendedFrequency: '1x per week per muscle group',
    rationale: 'Y3T intensity demands full recovery. Week 3 Hell creates significant damage. Training muscle twice per week would compromise the weekly character and risk overtraining.',

    muscleGroups: {
      chest: '1x per week',
      back: '1x per week',
      shoulders: '1x per week',
      quads: '1x per week',
      hamstrings: '1x per week',
      glutes: '1x per week (often with quads or hamstrings)',
      biceps: '1x per week',
      triceps: '1x per week',
      calves: '1-2x per week (optional second session light work)',
      forearms: '1-2x per week (optional - often get worked with back/arms)',
      abs: '2-3x per week (can be trained more frequently - low systemic fatigue)'
    },

    notes: [
      'Calves and abs can be trained 2x/week because they recover faster',
      'All other muscles: strictly 1x/week due to Y3T intensity',
      'Do NOT add extra "light" sessions for muscles - it disrupts the cycle',
      'If training a muscle feels fresh and strong, the program is working. If it feels constantly fatigued, reduce volume.'
    ]
  },

  // Advanced techniques - critical for Week 3
  advancedTechniques: {
    note: 'Advanced techniques are MANDATORY in Week 3 Hell Week. They are the distinguishing feature of Hell Week. Without them, Week 3 is just high-rep training.',

    tripleDropSets: {
      name: 'Triple Drop Sets',
      when: 'Week 3 Hell - primary intensity technique',
      how: 'Take a working set to failure. Immediately reduce weight by 25-30% and continue to failure. Reduce weight again by 25-30% and continue to failure. That\'s one extended set.',

      protocol: 'Example: Leg extensions - 100kg x 15 to failure → 70kg x 12 to failure → 50kg x 15+ to failure. Rest 10-15 seconds between drops to strip weight.',

      suitableExercises: [
        'Leg extensions (drop pin)',
        'Leg curls (drop pin)',
        'Lat pulldowns (drop pin)',
        'Cable lateral raises (drop pin)',
        'Pec deck (drop pin)',
        'Machine rows (drop pin)',
        'Cable curls (drop pin)',
        'Rope pushdowns (drop pin)',
        'Leg press (strip plates quickly)',
        'Dumbbell exercises (pre-place three sets of dumbbells)'
      ],

      executionDetails: [
        'Set up equipment beforehand - have pins ready to drop or dumbbells pre-placed',
        'Work set: 15-20 reps to failure',
        'Drop 1: Reduce 25-30%, continue to failure (usually 10-15 reps)',
        'Drop 2: Reduce another 25-30%, continue to absolute failure (usually 12-20 reps)',
        'Rest 10-15 seconds max between drops',
        'Total time under tension: 60-90 seconds for the extended set',
        'Form must stay strict - if form breaks, stop the drop set'
      ],

      purpose: 'Creates extreme metabolic stress, lactate accumulation, and muscle damage. The muscle is forced to continue working despite exhaustion. Recruits high-threshold motor units as fatigue builds.',

      cautions: [
        'Nausea and lightheadedness are common, especially on legs',
        'Have a seat or bench nearby during leg exercises',
        'Don\'t use on heavy compound movements (squats, deadlifts) - injury risk',
        'Partner or quick-change equipment essential for efficiency',
        'The burn is intense - mental preparation required'
      ],

      priority: 'THE signature Week 3 Hell Week technique. Non-negotiable.'
    },

    restPauseSets: {
      name: 'Rest-Pause Sets',
      when: 'Week 3 Hell - alternative or addition to drop sets',
      how: 'Take a set to failure. Rest 15-20 seconds while maintaining position or holding the weight. Continue for more reps to failure. Repeat 2-3 times.',

      protocol: 'Example: Cable curls - 20kg x 20 to failure → rest 15s → 8 more reps to failure → rest 15s → 5 more reps to failure. One extended set = 33 total reps.',

      suitableExercises: [
        'Cable curls',
        'Rope pushdowns',
        'Cable lateral raises',
        'Cable flyes',
        'Leg extensions',
        'Leg curls',
        'Machine presses',
        'Machine rows'
      ],

      executionDetails: [
        'Work set to failure (15-20 reps)',
        'Rest 15-20 seconds (hold position or nearby)',
        'Continue to failure (usually 6-10 reps)',
        'Rest 15-20 seconds',
        'Continue to failure (usually 4-6 reps)',
        'Optional 4th mini-set if able',
        'Total reps: 30-50 depending on exercise and load'
      ],

      purpose: 'Extends the set beyond normal failure without changing weight. Creates severe metabolic stress and teaches mental toughness. The muscle is forced to recruit all available fibers.',

      cautions: [
        'Extremely demanding - CNS and metabolic fatigue is high',
        'Breathing and cardiovascular stress increase rapidly',
        'Form may degrade on final mini-sets - stop if so',
        'Not suitable for heavy free weight movements'
      ],

      integration: 'Use on 2-3 exercises per Week 3 workout. Can alternate with drop sets (one exercise drop sets, next exercise rest-pause).',

      priority: 'Core Week 3 technique, interchangeable with drop sets'
    },

    supersets: {
      name: 'Supersets (Antagonist or Same Muscle)',
      when: 'Week 3 Hell - for time efficiency and increased density',
      how: 'Perform one exercise to failure, immediately (0-10s rest) perform a second exercise to failure. Rest 60-90s, repeat.',

      types: 'ANTAGONIST: Pairing opposing muscles (chest + back, biceps + triceps, quads + hamstrings)\n\nSAME MUSCLE: Pairing two exercises for the same muscle (pec deck + cable flyes, leg extensions + leg press)',

      protocol: 'ANTAGONIST EXAMPLE: Cable flyes x 15-20 → immediately Cable rows x 15-20 → rest 60s → repeat\n\nSAME MUSCLE EXAMPLE: Leg extensions x 20 → immediately Leg press x 20 → rest 90s → repeat',

      suitableExercises: [
        'Antagonist: Pec deck + Cable rows',
        'Antagonist: Cable curls + Rope pushdowns',
        'Antagonist: Leg extensions + Leg curls',
        'Same muscle: Cable flyes + Dumbbell flyes',
        'Same muscle: Lateral raises + Front raises',
        'Same muscle: Leg extensions + Sissy squats'
      ],

      executionDetails: [
        'Exercise 1: 15-20 reps to failure',
        '0-10 seconds transition to Exercise 2',
        'Exercise 2: 15-20 reps to failure',
        'Rest 60-90 seconds',
        'Repeat for 2-3 total rounds',
        'Antagonist supersets allow active recovery (blood flows to opposing muscle)',
        'Same-muscle supersets compound fatigue - use shorter rest'
      ],

      purpose: 'Increases training density (more work in less time). Same-muscle supersets create extreme pump and metabolic stress. Antagonist supersets allow higher quality reps due to active recovery effect.',

      priority: 'Optional Week 3 technique - use when time is limited or for variety'
    },

    giantSets: {
      name: 'Giant Sets (3-4 Exercises Back-to-Back)',
      when: 'Week 3 Hell - advanced, for experienced trainees or specialization',
      how: 'Perform 3-4 exercises for the same muscle group back-to-back with minimal rest (0-15s), then rest 90-120s before repeating.',

      protocol: 'Example Shoulder Giant Set: Cable lateral raises x 20 → Front raises x 15 → Reverse pec deck x 20 → Machine press x 12 → rest 2 minutes → repeat',

      suitableExercises: [
        'Shoulders: Lateral raises + Front raises + Rear delt flyes + Press',
        'Arms: Curls + Hammer curls + Cable curls + Rope pushdowns + Overhead extensions',
        'Chest: Pec deck + Cable flyes + Incline flyes + Push-ups',
        'Back: Pullovers + Pulldowns + Cable rows + Straight-arm pushdowns',
        'Legs: Leg extensions + Leg press + Hack squats + Walking lunges'
      ],

      executionDetails: [
        'Choose 3-4 exercises targeting the same muscle or muscle group',
        'Perform each to near-failure (not absolute failure until last exercise)',
        '0-15s rest between exercises within the giant set',
        'Rest 90-120s after completing all exercises',
        'Repeat for 2-3 total rounds',
        'Total time per round: 3-4 minutes including rest',
        'Heart rate will be very elevated - cardiovascular fitness required'
      ],

      purpose: 'Maximum training density and metabolic stress. Creates extreme pump and mental challenge. Used for lagging muscle specialization or time efficiency.',

      cautions: [
        'VERY advanced technique - requires excellent conditioning',
        'High risk of nausea, especially on leg giant sets',
        'Form degradation is common - stop if technique fails',
        'Not sustainable for multiple muscle groups in one workout',
        'Use for priority muscle only'
      ],

      priority: 'Advanced optional Week 3 technique for specialization'
    },

    twentyOnes: {
      name: '21s (7-7-7 Protocol)',
      when: 'Week 3 Hell - specifically for biceps, occasionally other muscles',
      how: 'Perform 7 reps in bottom half of ROM, immediately 7 reps in top half of ROM, immediately 7 full ROM reps. That\'s one extended set of 21 total reps.',

      protocol: 'Barbell curls: 7 reps from full extension to 90° (bottom half) → 7 reps from 90° to full contraction (top half) → 7 reps full ROM. No rest between segments.',

      suitableExercises: [
        'Barbell curls (classic)',
        'Cable curls',
        'Leg extensions (bottom half, top half, full)',
        'Lateral raises (bottom third, top third, full)',
        'Leg curls',
        'Cable flyes'
      ],

      executionDetails: [
        'Select weight you can handle for 12-15 full ROM reps (lighter than normal)',
        'Bottom half: 7 reps in stretched position range',
        'Top half: 7 reps in contracted position range (will be harder)',
        'Full ROM: 7 reps complete range (will be very difficult)',
        'No rest between the three segments',
        'Burn will be extreme by rep 15+',
        'Total time under tension: 40-60 seconds'
      ],

      purpose: 'Emphasizes different strength curves and creates constant tension. Targets different portions of the muscle fiber length. Creates extreme pump and metabolic stress.',

      cautions: [
        'Use lighter weight than normal (60-70% of working weight)',
        'Form breakdown is common on final full ROM reps',
        'Severe bicep pump can temporarily reduce ROM',
        'Not suitable for heavy compound movements'
      ],

      priority: 'Optional Week 3 technique, excellent for biceps specialization'
    },

    forcedReps: {
      name: 'Forced Reps (Partner-Assisted)',
      when: 'Week 3 Hell - optional if training partner available',
      how: 'Perform a set to failure. Training partner provides minimal assistance (just enough to keep bar moving) for 2-4 additional reps beyond failure.',

      protocol: 'Leg press example: Solo reps to failure at rep 18 → partner provides assistance for reps 19, 20, 21 → set ends.',

      suitableExercises: [
        'Leg press (partner pushes on sled)',
        'Chest press machines (partner assists bar)',
        'Leg extensions (partner lifts pad slightly)',
        'Lateral raises (partner lifts elbows slightly)',
        'Cable exercises (partner assists cable)'
      ],

      executionDetails: [
        'Perform set to absolute failure solo',
        'Partner provides MINIMAL assistance - just enough to complete rep',
        'Perform 2-4 forced reps beyond failure',
        'Maintain proper form - partner stops if form breaks',
        'Eccentric phase should still be controlled by lifter'
      ],

      purpose: 'Extends the set beyond failure without weight reduction. Creates additional mechanical tension and metabolic stress. Psychologically demanding.',

      cautions: [
        'Requires competent, attentive training partner',
        'High risk of injury if partner gives too much assistance',
        'Not suitable for heavy free weight compounds (squats, bench without spotter)',
        'Severe fatigue increases injury risk'
      ],

      priority: 'Optional Week 3 technique if partner available, not essential'
    },

    partialRepsExtended: {
      name: 'Partial Reps (Beyond Failure)',
      when: 'Week 3 Hell - for extending sets without partner or equipment change',
      how: 'Take set to failure with full ROM. Continue with partial reps (usually bottom half or mid-range) for 8-12 additional reps.',

      protocol: 'Leg extensions: Full ROM to failure at rep 20 → Partial reps (bottom 50% of ROM) for 10 more reps → set ends.',

      suitableExercises: [
        'Leg extensions (bottom half partials)',
        'Leg curls (bottom half partials)',
        'Cable flyes (stretched position partials)',
        'Lateral raises (bottom half partials)',
        'Leg press (partial ROM)',
        'Cable curls (bottom half partials)'
      ],

      executionDetails: [
        'Perform full ROM reps to failure',
        'Immediately continue with partial reps in stretched or mid-range position',
        'Perform 8-12 partial reps or until unable to move weight',
        'Focus on eccentric control even on partials',
        'Total time under tension extends to 60-90 seconds'
      ],

      purpose: 'Simple way to extend set without equipment change or partner. Maintains tension despite inability to complete full ROM. Severe metabolic stress.',

      priority: 'Optional Week 3 technique when other methods unavailable'
    }
  },

  // Split variations
  splitVariations: {
    variationStrategy: 'Y3T rotates weekly training stress (Heavy/Hybrid/Hell) but keeps exercise selection and split structure consistent for 9 weeks (3 complete cycles) to allow progressive overload tracking. The split is repeated weekly with different intensities. After 9 weeks, exercises can be rotated for novelty.',

    splitOptions: [
      {
        name: 'Original Y3T 4-Day Split (Neil Hill)',
        description: 'Neil Hill\'s original Y3T split. Four training days with rest days strategically placed. Simple, sustainable, effective.',

        schedule: {
          monday: 'Legs (Quads + Hamstrings + Glutes)',
          tuesday: 'OFF',
          wednesday: 'Chest + Triceps',
          thursday: 'OFF',
          friday: 'Back + Biceps',
          saturday: 'Shoulders + Calves',
          sunday: 'OFF'
        },

        workoutStructure: {
          legs: 'Week 1: Squats 3x6-8, Leg press 3x6-8, RDL 3x8. Week 2: Squats 3x8-12, Leg press 3x10-12, Leg extensions 3x12, RDL 3x10, Leg curls 3x12. Week 3: Leg extensions (triple drop) 2 sets, Leg press 2x20-25 (rest-pause), Leg curls (triple drop) 2 sets, Walking lunges 2x15 each leg.',
          chestTriceps: 'Week 1: Bench press 4x6-8, Incline DB press 3x6-8, Dips 3x8. Week 2: Bench 3x8-12, Incline DB 3x10-12, Cable flyes 3x12, CG bench 3x8-10, Rope pushdowns 3x12. Week 3: Pec deck (triple drop) 2 sets, Cable flyes 2x20 (rest-pause), Rope pushdowns (drop set) 2 sets, Overhead cable extension 2x20.',
          backBiceps: 'Week 1: Deadlifts 3x6-8, Barbell rows 3x6-8, Pull-ups 3xAMRAP. Week 2: Barbell rows 3x8-12, Lat pulldown 3x10-12, Seated cable row 3x12, Barbell curls 3x8-10, Incline curls 3x12. Week 3: Straight-arm pulldowns (drop set) 2 sets, Machine rows 2x20 (rest-pause), Cable pullovers 2x20, Cable curls (drop set) 2 sets, 21s 2 sets.',
          shouldersCalves: 'Week 1: Barbell OHP 4x6-8, Upright rows 3x8-10, Standing calf raises 4x8-10. Week 2: DB shoulder press 3x8-12, Lateral raises 3x12, Front raises 3x12, Reverse pec deck 3x12, Calf raises 4x15. Week 3: Cable lateral raises (drop set) 2 sets, Machine press 2x15-20, Front raises 2x20, Rear delt cable flyes 2x20, Calf press (drop set) 3x30-50.'
        },

        advantages: [
          'Plenty of rest between muscle groups (7 days)',
          'Strategic rest days allow recovery for Hell Week',
          'Clear structure - easy to follow and track',
          'Only 4 gym days per week',
          'Pairing smaller muscles (triceps with chest, biceps with back) is efficient',
          'Shoulders isolated on their own day for full attention'
        ],

        considerations: [
          'Lower frequency (1x/week) - not ideal for naturals who prefer 2x/week frequency',
          'Missing a workout means that muscle isn\'t trained that week',
          'Leg day is long and demanding, especially Week 3',
          'Only 4 training days - some prefer higher frequency'
        ],

        bestFor: 'The default Y3T split. Works for beginners to advanced. Sustainable long-term. Neil Hill\'s athletes use this split successfully.'
      },

      {
        name: '5-Day Y3T Bodybuilding Split',
        description: 'Classic bodybuilding split with dedicated days for each major muscle group. More volume per muscle, longer workouts.',

        schedule: {
          monday: 'Chest',
          tuesday: 'Back',
          wednesday: 'OFF',
          thursday: 'Shoulders',
          friday: 'Arms (Biceps + Triceps)',
          saturday: 'Legs (Quads + Hamstrings + Calves)',
          sunday: 'OFF'
        },

        workoutStructure: {
          chest: 'Week 1: Barbell bench 4x6-8, Incline DB 3x6-8, Dips 3x8, DB pullovers 3x10. Week 2: Bench 3x8-12, Incline 3x10-12, Decline 3x10-12, Cable flyes 3x12, Pullovers 3x12. Week 3: Pec deck (triple drop) 2 sets, Cable flyes 2x20 (rest-pause), Incline DB flyes 2x15-20, Push-ups AMRAP 2 sets.',
          back: 'Week 1: Deadlifts 3x6, Barbell rows 4x6-8, Pull-ups 3x8, T-bar rows 3x8. Week 2: Barbell rows 3x8-12, Pulldowns 3x10-12, Seated rows 3x12, DB rows 3x12, Pullovers 3x12. Week 3: Straight-arm pulldowns (drop) 2 sets, Machine rows (rest-pause) 2x20, Cable pullovers 2x20, Lat pulldowns 2x15-20.',
          shoulders: 'Week 1: Barbell OHP 4x6-8, DB press 3x8, Upright rows 3x10. Week 2: DB press 3x8-12, Lateral raises 4x12-15, Front raises 3x12, Reverse pec deck 3x12. Week 3: Cable lateral raises (drop) 3 sets, Machine press (rest-pause) 2x15-20, Front raises 2x20, Rear delt flyes 2x25.',
          arms: 'Week 1: CG bench 3x6-8, Barbell curls 3x6-8, Dips 3x8, Hammer curls 3x8. Week 2: CG bench 3x8-10, Rope pushdowns 3x12, Overhead ext 3x12, Barbell curls 3x10, Incline curls 3x12, Cable curls 3x12. Week 3: Rope pushdowns (drop) 2 sets, Overhead cable ext (rest-pause) 2x20, Cable curls (drop) 2 sets, 21s 2 sets, Concentration curls 2x20.',
          legs: 'Week 1: Squats 4x6-8, Front squats or leg press 3x8, RDL 3x6-8, SLDL 3x10, Calf raises 4x8-10. Week 2: Squats 3x8-12, Leg press 3x12, Leg ext 3x15, RDL 3x10, Leg curls 3x12, Seated curls 3x12, Calves 4x15. Week 3: Leg ext (triple drop) 3 sets, Leg press (rest-pause) 2x20-25, Leg curls (drop) 3 sets, Seated curls 2x20, Calf press (drop) 3x30-50.'
        },

        advantages: [
          'Maximum focus and volume for each muscle',
          'Clear specialization - priority muscle gets full attention',
          'Chest, back, legs get dedicated training day',
          'Arms get their own day for complete development',
          'Easy to track progress muscle by muscle'
        ],

        considerations: [
          'Requires 5 gym days per week',
          'Longer workouts (60-90 minutes)',
          'More time commitment',
          'Lower frequency may not be optimal for naturals'
        ],

        bestFor: 'Advanced bodybuilders, those with time and recovery capacity, competition prep, specialization phases'
      },

      {
        name: 'Upper/Lower Y3T 4-Day',
        description: 'Simple upper/lower split allowing 2x/week frequency per muscle while maintaining Y3T intensity variation.',

        schedule: {
          pattern: 'Upper / Lower / OFF / Upper / Lower / OFF / OFF',
          monday: 'Upper A (Chest + Back focus)',
          tuesday: 'Lower A (Quad + Hamstring focus)',
          wednesday: 'OFF',
          thursday: 'Upper B (Shoulders + Arms focus)',
          friday: 'Lower B (Glute + Calf focus)',
          saturday: 'OFF',
          sunday: 'OFF'
        },

        workoutStructure: {
          upperA: 'Week 1: Bench 4x6-8, Barbell rows 4x6-8, Incline DB 3x8. Week 2: Bench 3x8-12, Rows 3x10-12, Incline DB 3x10-12, Lat pulldown 3x12, Cable flyes 3x12. Week 3: Pec deck (drop) 2 sets, Cable rows (rest-pause) 2x20, Cable flyes 2x20, Pulldowns 2x15.',
          lowerA: 'Week 1: Squats 4x6-8, RDL 3x6-8. Week 2: Squats 3x8-12, Leg press 3x12, Leg ext 3x15, RDL 3x10, Leg curls 3x12. Week 3: Leg ext (triple drop) 2 sets, Leg press 2x20-25, Leg curls (drop) 2 sets.',
          upperB: 'Week 1: OHP 4x6-8, CG bench 3x6-8, Barbell curls 3x8. Week 2: DB press 3x8-12, Lateral raises 3x12, CG bench 3x10, Pushdowns 3x12, Curls 3x10-12. Week 3: Cable laterals (drop) 2 sets, Pushdowns (drop) 2 sets, Cable curls (drop) 2 sets, 21s 1 set.',
          lowerB: 'Week 1: Deadlifts 3x6, Hip thrusts 3x8, Calf raises 4x8-10. Week 2: Hip thrusts 3x10, Bulgarian splits 3x10 each, Leg curls 3x12, Calves 4x15. Week 3: Hip thrusts (rest-pause) 2x15-20, Leg curls 2x20, Calf press (drop) 3x30-50.'
        },

        advantages: [
          'Higher frequency (2x/week per muscle) better for naturals',
          'Shorter workouts',
          'Only 4 gym days per week',
          'Simple structure',
          'Flexibility in exercise selection'
        ],

        considerations: [
          'Less specialization per muscle',
          'Must manage fatigue carefully across multiple muscles per session',
          'Week 3 Hell upper/lower days are extremely demanding systemically'
        ],

        bestFor: 'Natural lifters preferring higher frequency, beginners to Y3T, time-efficient training, sustainable long-term'
      },

      {
        name: 'Push/Pull/Legs Y3T',
        description: 'Popular 6-day split training each muscle 2x/week. High frequency, high volume, demanding.',

        schedule: {
          pattern: 'Push / Pull / Legs / OFF / Push / Pull / Legs / OFF (8-day cycle) OR Push / Pull / Legs / Push / Pull / Legs / OFF',
          day1: 'Push (Chest + Shoulders + Triceps)',
          day2: 'Pull (Back + Biceps)',
          day3: 'Legs (Quads + Hamstrings + Calves)',
          day4: 'OFF (or repeat)',
          day5: 'Push',
          day6: 'Pull',
          day7: 'Legs',
          day8: 'OFF'
        },

        workoutStructure: {
          push: 'Week 1: Bench 4x6-8, OHP 3x6-8, Incline DB 3x8, Dips 3x8. Week 2: Bench 3x8-12, OHP 3x8-12, Incline 3x10-12, Lateral raises 3x12, Pushdowns 3x12. Week 3: Pec deck (drop) 2 sets, Cable laterals (drop) 2 sets, Cable flyes 2x20, Pushdowns (drop) 2 sets.',
          pull: 'Week 1: Deadlifts 3x6, Barbell rows 4x6-8, Pull-ups 3x8, Barbell curls 3x8. Week 2: Rows 3x8-12, Pulldowns 3x10-12, Cable rows 3x12, DB curls 3x10-12, Cable curls 3x12. Week 3: Straight-arm pulldowns (drop) 2 sets, Machine rows (rest-pause) 2x20, Cable curls (drop) 2 sets, 21s 1 set.',
          legs: 'Week 1: Squats 4x6-8, RDL 3x6-8, Calf raises 4x8-10. Week 2: Squats 3x8-12, Leg press 3x12, Leg ext 3x15, Leg curls 3x12, Calves 4x15. Week 3: Leg ext (triple drop) 2 sets, Leg press 2x20, Leg curls (drop) 2 sets, Calf press (drop) 3x30-50.'
        },

        advantages: [
          'Highest frequency (2x/week per muscle)',
          'Can train 6 days per week for maximum engagement',
          'Balanced stimulus across all muscles',
          'Flexible rest day placement'
        ],

        considerations: [
          'Very high training frequency and volume',
          'Week 3 Hell on this split is BRUTAL - systemic fatigue is extreme',
          'Recovery must be pristine (sleep, nutrition)',
          'Risk of overtraining if not managed carefully',
          'Requires deload every 6-8 weeks'
        ],

        bestFor: 'Advanced trainees with excellent recovery, those who love training 6 days/week, younger lifters with high work capacity'
      }
    ],

    variationLabels: [], // Y3T doesn't use A/B workout variations - same exercises weekly with intensity rotation

    rotationLogic: 'Y3T does NOT rotate exercises week to week. The same exercises are used for all 3 weeks (Heavy/Hybrid/Hell) to allow progressive overload tracking. You compare Week 1 Cycle 1 to Week 1 Cycle 2 (3 weeks later) - same exercises, same rep range, more weight or reps. After 9 weeks (3 complete cycles), you can rotate exercise selection for novelty (e.g., switch barbell bench to dumbbell bench) while maintaining the weekly intensity variation structure.',

    weeklyIntensityApplication: {
      week1Heavy: 'All muscle groups trained with heavy loads (6-8 reps), long rest, compounds',
      week2Hybrid: 'All muscle groups trained with moderate loads (8-12 reps), moderate rest, balanced exercises',
      week3Hell: 'All muscle groups trained with high reps (15-30+), short rest, intensity techniques'
    },

    frequencyManagement: 'In 2x/week frequency splits (Upper/Lower, PPL), you still rotate Heavy/Hybrid/Hell WEEKLY, not per session. Example: Week 1 Heavy, both Upper A and Upper B are Heavy. Week 2 Hybrid, both are Hybrid. Week 3 Hell, both sessions are Hell. Do NOT alternate intensities within the same week - it defeats the Y3T principle of weekly stress rotation.'
  },

  // Periodization
  periodization: {
    mesocycleLength: 9,
    model: 'Undulating Weekly Periodization',
    cycleDuration: '3-week microcycles within 9-week mesocycles',

    phases: {
      week1Heavy: {
        name: 'Heavy Week',
        description: 'Strength focus with 6-8 reps, compound movements, 3-4 min rest',
        duration: 'Week 1 of each 3-week cycle',
        characteristics: ['High load', 'Low volume', 'Maximum mechanical tension', 'Neural drive focus']
      },
      week2Hybrid: {
        name: 'Hybrid Week',
        description: 'Balanced hypertrophy with 8-12 reps, mixed exercises, 90-120s rest',
        duration: 'Week 2 of each 3-week cycle',
        characteristics: ['Moderate load', 'Moderate volume', 'Mechanical + metabolic stress', 'Classic bodybuilding']
      },
      week3Hell: {
        name: 'Hell Week',
        description: 'Maximum metabolic stress with 15-30+ reps, isolation focus, 30-60s rest',
        duration: 'Week 3 of each 3-week cycle',
        characteristics: ['Light load', 'High volume', 'Intensity techniques', 'Drop sets', 'Rest-pause', 'Extreme pump']
      }
    },

    philosophy: 'Y3T periodization is undulating within the 3-week microcycle (Heavy → Hybrid → Hell) and linear across multiple cycles (progressive overload cycle to cycle). A mesocycle is 9 weeks (3 complete microcycles). After 9 weeks, take a deload week, then rotate exercises and begin a new mesocycle. The weekly variation provides built-in autoregulation - no need for traditional accumulation/intensification phases.',

    microcycle: {
      name: '3-Week Microcycle',
      length: 3,
      structure: 'Week 1 Heavy → Week 2 Hybrid → Week 3 Hell',

      week1Heavy: {
        focus: 'Strength, mechanical tension, neural drive',
        reps: '6-8',
        rest: '3-4 minutes',
        intensity: 'High load, low volume',
        exercises: 'Compounds only',
        progression: 'Add weight when hitting 8 reps on all sets',
        recovery: 'Low metabolic fatigue, high neural fatigue',
        purpose: 'Build strength base, recover from Week 3 metabolic damage'
      },

      week2Hybrid: {
        focus: 'Balanced hypertrophy - mechanical + metabolic',
        reps: '8-12',
        rest: '90-120 seconds',
        intensity: 'Moderate load, moderate volume',
        exercises: 'Mix of compounds and isolations',
        progression: 'Add reps then weight, or add sets',
        recovery: 'Balanced fatigue',
        purpose: 'Classic muscle building, transition week'
      },

      week3Hell: {
        focus: 'Maximum metabolic stress, muscle damage, work capacity',
        reps: '15-30+',
        rest: '30-60 seconds',
        intensity: 'Light load, high volume + intensity techniques',
        exercises: 'Predominantly isolations',
        progression: 'More reps, more drops, higher starting weight',
        recovery: 'Very high metabolic and systemic fatigue',
        purpose: 'Create overreaching, force adaptation, test limits',
        warning: 'Most demanding week. Expect severe DOMS, fatigue, potential nausea. This is the growth week.'
      }
    },

    mesocycle: {
      name: '9-Week Mesocycle (3 Microcycles)',
      length: 9,
      structure: 'Cycle 1 (weeks 1-3) → Cycle 2 (weeks 4-6) → Cycle 3 (weeks 7-9) → Deload → New mesocycle with exercise rotation',

      cycle1: {
        name: 'Baseline Cycle',
        weeks: '1-3',
        goal: 'Establish baseline performance for each week type, adapt to Y3T demands',
        approach: 'Conservative - focus on learning the intensity variations, perfecting form, gauging work capacity'
      },

      cycle2: {
        name: 'Progression Cycle',
        weeks: '4-6',
        goal: 'Increase loads and reps compared to Cycle 1. This is where linear progression occurs.',
        approach: 'Aggressive progression - add weight on Week 1 Heavy, add reps/sets on Week 2, push intensity techniques harder on Week 3'
      },

      cycle3: {
        name: 'Peak Cycle',
        weeks: '7-9',
        goal: 'Peak performance on all three week types. Achieve PRs and maximum adaptation.',
        approach: 'Maximum effort - push limits on Week 1 strength, maximize volume on Week 2, survive and conquer Week 3 Hell'
      },

      postMesocycle: {
        name: 'Deload & Exercise Rotation',
        weeks: '10 (deload)',
        goal: 'Full recovery, resensitization, prepare for new mesocycle',
        approach: 'Deload week (50% volume, 70% intensity), then rotate exercises and start new 9-week mesocycle'
      }
    },

    deloadPhase: {
      name: 'Deload Week',
      frequency: 'Every 9-12 weeks (after completing a mesocycle)',
      weeks: 1,
      volumeReduction: 50,
      intensityReduction: '70% of working weights',

      protocol: 'Use Week 2 (Hybrid) structure but at reduced intensity. 3 sets per exercise, 8-12 reps, 70% of normal weight, stop at 3 RIR. No Week 3 Hell techniques. No Week 1 Heavy grinding.',

      implementation: [
        'All exercises: 3 sets x 8-12 reps at 70% working weight',
        'Rest 2-3 minutes between all sets',
        'Stop at 3 RIR (very conservative)',
        'No intensity techniques (no drops, rest-pause, supersets)',
        'Can reduce training frequency (5 days → 3-4 days)',
        'Focus on movement quality, mind-muscle connection, recovery'
      ],

      goals: [
        'Full recovery of CNS, joints, connective tissue',
        'Clear accumulated fatigue from 9 weeks of Y3T',
        'Heal minor strains or inflammation',
        'Psychological break from intense training',
        'Resensitize muscles to training stimulus',
        'Prepare for new mesocycle with fresh exercises'
      ],

      rationale: 'Y3T is demanding. Week 3 Hell creates significant damage. Even with good recovery, 9 weeks of progressive intensity builds fatigue. Deload allows supercompensation - you come back stronger. The 9-week structure provides enough time to progress without needing frequent deloads.',

      duration: '1 week (7 days). Can extend to 10 days if very fatigued or traveling.',

      exerciseRotation: 'After deload, rotate exercises for the new mesocycle. Replace barbell bench with dumbbell bench, barbell rows with T-bar rows, etc. Maintain movement patterns but provide novelty.'
    },

    cycleProgression: {
      cycle1to2: 'Week 1 Heavy: Add 2.5-5kg or 1-2 reps. Week 2 Hybrid: Add 1 set or 2.5kg. Week 3 Hell: Complete more drops or higher starting weight.',
      cycle2to3: 'Week 1 Heavy: Add another 2.5-5kg or hit 8 reps where you had 6-7. Week 2 Hybrid: Add weight and/or another set. Week 3 Hell: Push techniques harder - more rounds, more drops, less rest.',
      cycle3toNew: 'After cycle 3, deload, rotate exercises, start fresh mesocycle at slightly higher baseline than first mesocycle.'
    },

    annualStructure: {
      description: 'Macro view of Y3T training year',

      offSeason: '3-4 mesocycles (9 weeks each) with 1-week deloads between. Focus on progressive overload and muscle gain. Nutrition in surplus.',

      preContest: '2-3 mesocycles with potential weekly cardio adjustments. Y3T structure maintained but may reduce volume slightly in caloric deficit. Week 3 Hell is harder in deficit - manage fatigue carefully.',

      postContest: '1-2 weeks complete break from training, then 1 mesocycle at reduced intensity to restore baseline and reverse diet.',

      offSeasonReturn: 'Return to full Y3T intensity with new exercise selection and fresh motivation.'
    },

    autoregulationBuiltIn: 'Y3T\'s weekly variation provides autoregulation. If you overtrain on Week 3, Week 1 has lower metabolic demand allowing recovery. If you undertrain on Week 1, Week 3 provides the overload. The system balances itself. Listen to your body within the structure - reduce weight if needed, but maintain the weekly character.'
  }
}

async function seedY3T() {
  console.log('🌱 Seeding Y3T (Yoda 3 Training - Neil Hill) training approach...\n')

  try {
    // Check if Y3T already exists
    const { data: existing, error: checkError } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', y3tApproach.name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    let result

    if (existing) {
      console.log('⚠️  Y3T approach already exists in database. Updating...')
      console.log('   ID:', existing.id)

      const { data: updated, error: updateError } = await supabase
        .from('training_approaches')
        .update({
          creator: y3tApproach.creator,
          category: y3tApproach.category,
          recommended_level: y3tApproach.recommended_level,
          level_notes: y3tApproach.level_notes,
          philosophy: y3tApproach.philosophy,
          short_philosophy: y3tApproach.short_philosophy,
          variables: y3tApproach.variables,
          progression_rules: y3tApproach.progression,
          exercise_rules: y3tApproach.exerciseSelection,
          exercise_selection_principles: y3tApproach.exerciseSelectionPrinciples,
          rationales: y3tApproach.rationales,
          rom_emphasis: y3tApproach.romEmphasis,
          stimulus_to_fatigue: y3tApproach.stimulusToFatigue,
          volume_landmarks: y3tApproach.volumeLandmarks,
          frequency_guidelines: y3tApproach.frequencyGuidelines,
          advanced_techniques: y3tApproach.advancedTechniques,
          split_variations: y3tApproach.splitVariations,
          periodization: y3tApproach.periodization
        })
        .eq('id', existing.id)
        .select()

      if (updateError) {
        throw updateError
      }
      result = updated
    } else {
      // Insert Y3T approach
      console.log('📝 Inserting Y3T training approach...')
      const { data: inserted, error: insertError } = await supabase
        .from('training_approaches')
        .insert([{
          name: y3tApproach.name,
          creator: y3tApproach.creator,
          category: y3tApproach.category,
          recommended_level: y3tApproach.recommended_level,
          level_notes: y3tApproach.level_notes,
          philosophy: y3tApproach.philosophy,
          short_philosophy: y3tApproach.short_philosophy,
          variables: y3tApproach.variables,
          progression_rules: y3tApproach.progression,
          exercise_rules: y3tApproach.exerciseSelection,
          exercise_selection_principles: y3tApproach.exerciseSelectionPrinciples,
          rationales: y3tApproach.rationales,
          rom_emphasis: y3tApproach.romEmphasis,
          stimulus_to_fatigue: y3tApproach.stimulusToFatigue,
          volume_landmarks: y3tApproach.volumeLandmarks,
          frequency_guidelines: y3tApproach.frequencyGuidelines,
          advanced_techniques: y3tApproach.advancedTechniques,
          split_variations: y3tApproach.splitVariations,
          periodization: y3tApproach.periodization
        }])
        .select()

      if (insertError) {
        throw insertError
      }
      result = inserted
    }

    console.log('✅ Y3T training approach seeded successfully!\n')
    console.log('   ID:', result[0].id)
    console.log('   Name:', result[0].name)
    console.log('   Creator:', result[0].creator)
    console.log('\n🎯 Y3T Key Features:')
    console.log('   • 3-week microcycle: Heavy (6-8 reps) → Hybrid (8-12 reps) → Hell (15-30+ reps)')
    console.log('   • Weekly intensity rotation prevents adaptation plateaus')
    console.log('   • Week 3 Hell: Triple drop sets, rest-pause, supersets')
    console.log('   • 9-week mesocycles (3 complete microcycles) then exercise rotation')
    console.log('   • 1x/week frequency per muscle group')
    console.log('   • Used by 4x Mr. Olympia William "Flex" Wheeler and numerous IFBB pros')
    console.log('\n💪 Y3T is ready to use in the application!\n')

  } catch (error) {
    console.error('❌ Error seeding Y3T approach:', error)
    throw error
  }
}

// Run the seed function
seedY3T()
  .then(() => {
    console.log('🌟 Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
