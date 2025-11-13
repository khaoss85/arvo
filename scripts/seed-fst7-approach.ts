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

const fst7Approach = {
  name: 'FST-7 (Hany Rambod)',
  creator: 'Hany Rambod',
  philosophy: `Fascia Stretch Training - Seven (FST-7) is a training system designed to maximize muscle hypertrophy through extreme muscle pumping and fascia stretching. The core principle is that the fascia (connective tissue surrounding muscles) can limit muscle growth in individuals with naturally thick, rigid fascia. By performing 7 consecutive sets with short rest periods (30-45 seconds) on the final exercise for each muscle group, FST-7 creates an intense intramuscular pump that stretches the fascia from within, potentially creating more space for muscle growth. This method combines traditional heavy compound work for strength and density with high-volume pump work for fullness and roundness. The extreme metabolic stress and blood flow create a "napalm" effect on the target muscle, recruiting even the most stubborn muscle fibers. Used by multiple Mr. Olympia champions including Phil Heath, Jay Cutler, and Chris Bumstead.`,
  short_philosophy: 'Fascia Stretch Training uses 7 consecutive sets with short rest on the final exercise per muscle group to create an extreme pump that stretches the fascia. Combines heavy compound work for strength with high-volume pump work for fullness. Used by multiple Mr. Olympia champions.',

  // Core training variables specific to FST-7
  variables: {
    setsPerExercise: {
      // Standard fields for UI compatibility
      working: 4, // Representative value: 3-4 standard sets + FST-7 finisher
      warmup: '2 progressive sets to activate muscle and establish mind-muscle connection',
      // FST-7 specific metadata
      fst7Exercise: 7, // Signature FST-7: exactly 7 sets on final exercise
      compoundExercises: '3-4', // Standard sets for compound movements
      isolationExercises: '2-3' // Standard sets for isolation pre-FST-7
    },
    repRanges: {
      // Standard fields for UI compatibility
      compound: [8, 12], // Representative range for UI display
      isolation: [8, 12], // Standard isolation work
      // FST-7 specific metadata
      compoundHeavy: [6, 8], // Initial heavy compounds for strength/density
      compoundModerate: [8, 12], // Secondary compounds for volume
      fst7Sets: [8, 12], // FST-7 sets: 10-12 reps typical, can go to 15 for stubborn muscles like calves/quads
      firstSetGuideline: 'If you can only do 8 reps on first FST-7 set, weight is too heavy. If you can do 15+ easily, too light.'
    },
    rirTarget: {
      // Standard fields for UI compatibility
      normal: 1, // Standard compound exercises: close to failure but safe
      intense: 0, // FST-7 sets: absolute failure, pump is king
      deload: 3, // Deload week: well shy of failure
      // FST-7 specific metadata
      compoundHeavy: 1, // Heavy compounds: close to failure but safe
      compoundModerate: 1, // Moderate compounds: 1 RIR
      fst7Sets: 0 // FST-7 sets: absolute failure, pump is king
    },
    restPeriods: {
      compoundHeavy: [120, 180], // 2-3 minutes for heavy basic movements
      compoundModerate: [90, 120], // 1.5-2 minutes for secondary compounds
      isolation: [60, 90], // 1-1.5 minutes for standard isolation
      fst7Sets: [30, 45], // CRITICAL: 30-45 seconds only - maintains metabolic stress and pump
      fst7Philosophy: 'Short rest is the key - blood stays trapped in muscle, pump compounds with each set like inflating a balloon that slightly leaks air'
    },
    tempo: {
      // Standard fields for UI compatibility (numeric values)
      eccentric: 2, // 2 seconds controlled lowering
      pauseBottom: 1, // 1 second pause in stretched position
      concentric: 1, // 1 second lifting (explosive but controlled)
      pauseTop: 1, // 1 second squeeze at peak contraction
      // FST-7 specific metadata
      compound: '2-0-1-0', // Controlled eccentric, explosive concentric
      fst7Sets: '2-1-1-1', // Slower, more controlled - focus on contraction and stretch
      emphasis: 'FST-7 sets prioritize time under tension and peak contraction over pure weight'
    },
    frequency: {
      largeMuscleFst7: '1x per week', // Chest, back, quads - FST-7 once weekly due to extreme stress
      smallMuscleFst7: '1-2x per week', // Arms, calves - can tolerate FST-7 twice weekly
      typicalSplit: '5-day bodybuilding split or Push/Pull/Legs',
      recoveryNote: 'Phil Heath reported 4 days of soreness after FST-7 back workout - recovery is critical'
    },
    hydration: {
      criticality: 'ABSOLUTELY ESSENTIAL - hydration directly impacts pump capacity',
      protocol: 'Sip water or electrolyte drink between EVERY FST-7 set',
      rationale: 'Blood is mostly water - dehydration prevents optimal pump. Drinking during 30-45s rest maintains blood volume and muscle fullness.',
      recommendation: 'Have water bottle at station, take 2-3 sips between each of the 7 sets'
    },
    interSetActivity: {
      posing: 'Contract target muscle in bodybuilding pose for 5-10 seconds during rest',
      purpose: 'Forces more blood into congested muscle, amplifies pump despite discomfort',
      examples: [
        'Chest FST-7: Most Muscular or Pec squeeze pose',
        'Biceps FST-7: Double biceps front pose',
        'Back FST-7: Lat spread or rear lat spread',
        'Shoulders FST-7: Front/side delt pose'
      ],
      optional: 'Light stretching of muscle (alternate with posing) to externally stretch fascia while internal pump expands it'
    }
  },

  // Progression system for FST-7
  progression: {
    priority: 'reps_first',
    primaryMetric: 'Ability to complete all 7 FST-7 sets with target reps while maintaining 30-45s rest',

    rules: [
      {
        condition: 'Complete all 7 FST-7 sets at top of rep range (12 reps) with proper form',
        action: 'Increase weight by 2.5-5kg next session',
        note: 'Conservative increases - preserving pump quality > ego lifting'
      },
      {
        condition: 'Hitting only 8-10 reps by set 5-7 of FST-7',
        action: 'Maintain weight, work on completing all 7 sets at higher reps',
        note: 'Metabolic conditioning improves over time'
      },
      {
        condition: 'Cannot complete 8 reps by set 4-5',
        action: 'Reduce weight immediately (drop set style) to stay in rep range',
        note: 'Completing all 7 sets with pump > maintaining heavy weight'
      },
      {
        condition: 'Compound exercises progressing',
        action: 'Add 2.5-5kg when hitting top of rep range with 1 RIR',
        note: 'Standard progressive overload on non-FST-7 exercises'
      }
    ],

    deloadStrategy: {
      frequency: 'Every 6-8 weeks or when performance declines',
      protocol: 'Eliminate FST-7 sets entirely for 1 week, reduce volume to 3-4 sets per exercise max',
      intensityAdjustment: 'Reduce loads to 70% of working weight, stop at 3 RIR',
      purpose: 'FST-7 creates extreme metabolic damage and fatigue - deload crucial for long-term progress'
    },

    weightIncrements: [2.5, 5], // Small jumps to preserve pump quality

    deloadTriggers: [
      'Unable to complete 7 FST-7 sets with minimum 8 reps per set',
      'Severe DOMS lasting 5+ days preventing next workout',
      'Loss of pump sensation or mind-muscle connection',
      'Joint pain or discomfort during FST-7 sets',
      'Chronic fatigue or sleep disruption',
      'Performance declining on compound exercises'
    ],

    autoRegulation: 'Listen to pump quality - if pump is weak, check hydration, reduce weight, or take extra rest day. Pump is the primary indicator of effective FST-7.'
  },

  // Exercise selection rules - critical for FST-7 safety and effectiveness
  exerciseSelection: {
    compoundFocus: 'Start every muscle group workout with 2-3 compound movements using moderate-heavy loads',
    isolationFocus: 'FST-7 method applied EXCLUSIVELY to isolation or machine exercises for safety and maximum pump',

    principles: [
      'FST-7 exercise must be FINAL exercise for that muscle group',
      'Choose exercises allowing maximum isolation without systemic fatigue',
      'Machines and cables PREFERRED over free weights for FST-7 sets',
      'Never use heavy compound movements (squats, deadlifts, heavy bench) for FST-7',
      'Exercise should allow safe failure without spotter',
      'Select movements that maintain tension in shortened (contracted) and lengthened positions',
      'Mind-muscle connection is paramount - choose exercises you "feel" best'
    ],

    priorityRules: [
      'Heavy compound first (3-4 sets of 6-8 reps) - build strength foundation',
      'Secondary compound or isolation (2-3 sets of 8-12 reps) - accumulate volume',
      'Additional isolation if needed (2-3 sets of 8-12 reps) - pre-fatigue target muscle',
      'FST-7 finisher (7 sets of 8-12 reps, 30-45s rest) - extreme pump and fascia stretch'
    ],

    exercisesPerWorkout: {
      min: 4,
      max: 6,
      distribution: '2-3 compounds (3-4 sets each) + 1-2 isolations (2-3 sets) + 1 FST-7 finisher (7 sets)',
      totalSets: 'Approximately 15-20 total sets per muscle group including FST-7'
    },

    muscleGroupOrder: [
      'Large muscles first when training multiple groups',
      'Apply FST-7 to priority muscle or lagging body part',
      'Can do FST-7 for both muscles in a pairing (e.g., chest FST-7 + triceps FST-7) if recovery allows'
    ],

    substitutionRules: {
      whenToSubstitute: [
        'Equipment unavailable',
        'Joint discomfort or pain in specific exercise',
        'Inability to achieve pump (poor mind-muscle connection)',
        'Exercise feels awkward or unsafe at high fatigue'
      ],
      howToAdjustLoad: 'FST-7 exercise typically uses 60-70% of weight you would use for 3-4 sets of same exercise',
      substitutionPrinciples: 'Replace with similar movement pattern on machine or cable - maintain isolation quality'
    },

    exerciseExamples: {
      chest: {
        compounds: ['Barbell bench press', 'Incline dumbbell press', 'Hammer Strength chest press'],
        fst7Options: ['Pec deck machine', 'Cable flyes (crossovers)', 'Dumbbell flyes on flat bench']
      },
      back: {
        compounds: ['Pull-ups/Chin-ups', 'Barbell rows', 'T-bar rows', 'Lat pulldown'],
        fst7Options: ['Cable pullovers', 'Straight-arm pulldowns', 'Machine rows (Hammer Strength)', 'Single-arm cable rows']
      },
      shoulders: {
        compounds: ['Dumbbell shoulder press', 'Barbell military press'],
        fst7Options: ['Cable lateral raises', 'Machine lateral raises', 'Dumbbell lateral raises', 'Reverse pec deck (rear delts)']
      },
      quads: {
        compounds: ['Barbell squats', 'Front squats', 'Hack squats', 'Leg press (heavy)'],
        fst7Options: ['Leg extensions', 'Leg press (moderate weight, high reps)', 'Hack squat machine']
      },
      hamstrings: {
        compounds: ['Romanian deadlifts', 'Stiff-leg deadlifts'],
        fst7Options: ['Lying leg curls', 'Seated leg curls', 'Cable pull-throughs']
      },
      biceps: {
        compounds: ['Barbell curls', 'Dumbbell alternating curls'],
        fst7Options: ['Cable curls (EZ-bar or rope)', 'Machine preacher curls', 'EZ-bar curls (strict form)']
      },
      triceps: {
        compounds: ['Close-grip bench press', 'Dips'],
        fst7Options: ['Cable pushdowns (rope or V-bar)', 'Overhead cable extensions', 'Machine tricep extensions']
      },
      calves: {
        compounds: ['Standing calf raises (heavy)'],
        fst7Options: ['Calf press on leg press machine', 'Seated calf raises', 'Standing calf raises (moderate weight)']
      }
    }
  },

  // Rationales - explaining the WHY behind FST-7
  rationales: {
    why_seven_sets: 'Seven sets is the optimal number discovered through trial and error to create maximal pump without excessive systemic fatigue. Fewer sets (4-5) don\'t create enough metabolic stress; more sets (9-10) lead to form breakdown and incomplete activation. Seven sets with short rest creates the perfect storm of blood accumulation, lactate buildup, and cellular swelling that triggers hypertrophy signaling and fascia expansion.',

    why_short_rest: 'The 30-45 second rest interval is crucial because it prevents the muscle from fully recovering or the pump from dissipating. Blood remains trapped in the muscle, metabolic byproducts (lactate, hydrogen ions, inorganic phosphate) accumulate, and each subsequent set adds more blood volume to an already congested muscle. This creates progressive overload of metabolic stress rather than mechanical tension. Longer rest would allow recovery and pump loss; shorter rest risks cardiovascular failure before muscle failure.',

    why_final_exercise: 'Applying FST-7 at the end of the workout serves multiple purposes: (1) The muscle is pre-fatigued, allowing lighter weights to create maximum stimulus; (2) Strength for heavy compounds isn\'t compromised; (3) Pre-fatigue enhances mind-muscle connection for superior pump; (4) Glycogen depletion from earlier work makes the muscle more responsive to pump mechanisms; (5) Safety - performing FST-7 fresh could lead to weight selection too heavy for the later sets.',

    why_isolation_exercises: 'Isolation and machine exercises are mandated for FST-7 because: (1) Safety - form must remain perfect through extreme fatigue; machines guide the movement; (2) Isolation ensures the target muscle reaches complete failure, not secondary muscles; (3) No spotter needed when reaching failure on machines; (4) Reduced CNS fatigue compared to heavy compound movements; (5) Easier to maintain the critical mind-muscle connection; (6) Biomechanical advantage allows maximum pump without joint stress.',

    why_hydration: 'Water intake during FST-7 is non-negotiable because blood plasma is 90% water. The extreme pump demands increased blood volume delivery to the working muscle. Dehydration reduces plasma volume, limiting the pump potential and nutrient delivery. Sipping water between sets maintains hydration status and provides brief mental reset. The water also supports the cell swelling mechanism - muscle cells absorbing water and nutrients create mechanical stress on the cell membrane, triggering anabolic signaling.',

    fascia_theory: 'The fascia stretch theory proposes that dense, thick fascia physically restricts muscle expansion, acting like a tight shirt on a growing body. Genetics determine fascia thickness - some bodybuilders have naturally thin fascia allowing easy muscle roundness (Phil Heath, Ronnie Coleman), others have thick fascia requiring extreme work to expand (Jay Cutler). The extreme intramuscular pressure from FST-7 pump stretches the fascia from within, potentially creating microtears and remodeling that allow more space for muscle growth over time. While direct scientific evidence is limited, the anecdotal success of countless elite bodybuilders supports the practical validity.',

    metabolic_stress_mechanism: 'FST-7 maximizes one of the three primary hypertrophy mechanisms: metabolic stress (alongside mechanical tension and muscle damage). The short-rest, high-rep, continuous pump protocol creates massive accumulation of metabolites, cell swelling from blood and fluid accumulation, increased growth factor production, and potential enhanced satellite cell activation. This metabolic stimulus is complementary to the mechanical tension from the heavy compounds earlier in the workout, providing a complete growth stimulus.',

    why_once_per_week: 'Large muscle groups (chest, back, quads) require 5-7 days recovery after FST-7 due to the extreme metabolic damage and inflammation created. The pump-induced damage is different from mechanical damage but equally requires recovery time. DOMS from FST-7 is notoriously severe. Phil Heath reported 4 days of soreness after FST-7 back training. Attempting FST-7 on the same muscle twice in a week will likely lead to overtraining, reduced performance, and blunted growth. Smaller muscles (biceps, triceps, calves) have less total volume and faster recovery, allowing potential 2x/week FST-7 for advanced trainees.',

    progression_patience: 'FST-7 demands patience with weight progression. The goal is PUMP, not weight moved. Adding weight too quickly compromises the ability to complete all 7 sets with proper reps and rest intervals, defeating the method\'s purpose. Progress happens through: (1) Completing all 7 sets with higher reps; (2) Maintaining weight with shorter rest periods; (3) Better pump quality and mind-muscle connection; (4) Only then adding weight. This is anti-ego training - checking your ego and focusing on the metabolic work is what builds the physique.',

    pre_fatigue_advantage: 'Pre-fatiguing the muscle with compounds before FST-7 is strategic: the muscle is glycogen-depleted, already pumped, and neurologically primed. This means you can use relatively light weight on the FST-7 exercise but still achieve complete muscle fiber recruitment and failure. A fresh muscle might require dangerously heavy weight to reach the same level of stimulation. Pre-fatigue also prevents the FST-7 exercise from being limited by grip, stabilizers, or technique breakdown - the target muscle is already at its limit.',

    pump_as_indicator: 'The pump sensation is the primary biofeedback mechanism in FST-7. A massive, almost painful pump indicates successful fascia stretching and metabolic stress. Weak pump indicates: insufficient intensity, poor exercise selection, dehydration, inadequate nutrition (especially carbs), or need for rest. Advanced practitioners can sense pump quality and adjust weight/rest/exercise on the fly. The pump is not just cosmetic - it represents the physiological conditions (cell swelling, metabolite accumulation, increased blood flow) that trigger growth adaptations.'
  },

  // Volume landmarks adapted for FST-7's high-metabolic-stress approach
  volumeLandmarks: {
    note: 'FST-7 volume is deceptively high due to the 7-set finisher. Total set count is moderate but metabolic stress is extreme. These landmarks account for the combined mechanical and metabolic volume.',

    muscleGroups: {
      chest: {
        mev: 10,
        mav: 16,
        mrv: 20,
        fst7Note: 'Typical workout: 3-4 sets bench press + 3 sets incline press + 3 sets dumbbell flyes + 7 FST-7 pec deck = 16-17 sets (at upper MAV)'
      },
      back: {
        mev: 12,
        mav: 18,
        mrv: 24,
        fst7Note: 'Back tolerates higher volume. Example: 3 sets pull-ups + 3 sets barbell rows + 3 sets lat pulldown + 3 sets cable rows + 7 FST-7 pullovers = 19 sets'
      },
      shoulders: {
        mev: 12,
        mav: 16,
        mrv: 20,
        fst7Note: 'Example: 4 sets overhead press + 3 sets front raises + 3 sets side laterals + 7 FST-7 cable laterals = 17 sets. Rear delts can be trained separately or with back.'
      },
      quads: {
        mev: 10,
        mav: 16,
        mrv: 20,
        fst7Note: 'FST-7 leg extensions extremely demanding. Example: 4 sets squats + 3 sets hack squats + 3 sets leg press + 7 FST-7 leg extensions = 17 sets (near MRV)'
      },
      hamstrings: {
        mev: 8,
        mav: 12,
        mrv: 16,
        fst7Note: 'Can be combined with quad day or separate. Example: 3 sets RDL + 3 sets stiff-leg deadlift + 7 FST-7 lying leg curls = 13 sets'
      },
      glutes: {
        mev: 8,
        mav: 12,
        mrv: 16,
        fst7Note: 'Often trained with quads/hams. FST-7 option: hip thrusts or glute-focused leg press'
      },
      biceps: {
        mev: 8,
        mav: 14,
        mrv: 18,
        fst7Note: 'Small muscle, recovers fast. Example: 3 sets barbell curls + 3 sets incline curls + 7 FST-7 cable curls = 13 sets'
      },
      triceps: {
        mev: 8,
        mav: 14,
        mrv: 18,
        fst7Note: 'Example: 3 sets close-grip bench + 3 sets dips + 7 FST-7 rope pushdowns = 13 sets. Pre-fatigued from chest pressing.'
      },
      calves: {
        mev: 10,
        mav: 16,
        mrv: 22,
        fst7Note: 'Stubborn muscle, responds to high volume and frequency. FST-7 ideal: 3 sets standing calf raises + 7 FST-7 calf press. Can train 2x/week.'
      },
      abs: {
        mev: 8,
        mav: 16,
        mrv: 24,
        fst7Note: 'FST-7 applicable to abs. High recovery capacity. Example: cable crunches 7x12-15 with 45s rest creates intense burn.'
      }
    }
  },

  // Frequency guidelines for FST-7
  frequencyGuidelines: {
    philosophy: 'FST-7 creates extreme metabolic damage requiring longer recovery than traditional training. Frequency must account for the 7-set finisher\'s recovery demands.',

    minPerWeek: 1,
    maxPerWeek: 2,
    optimalRange: [1, 1],

    muscleSpecific: {
      chest: {
        min: 1,
        max: 1,
        optimal: [1, 1],
        note: 'Once per week with FST-7 finisher. Large muscle mass + high metabolic stress = 6-7 days recovery needed.'
      },
      back: {
        min: 1,
        max: 2,
        optimal: [1, 1],
        note: 'Once per week optimal with FST-7. Advanced can split into two sessions (width day + thickness day) but only one FST-7 session.'
      },
      shoulders: {
        min: 1,
        max: 2,
        optimal: [1, 1],
        note: 'Once per week with FST-7. Can add rear delt work on back day without FST-7.'
      },
      quads: {
        min: 1,
        max: 1,
        optimal: [1, 1],
        note: 'Strictly once per week. FST-7 leg extensions create severe DOMS. Phil Heath needed 4+ days recovery.'
      },
      hamstrings: {
        min: 1,
        max: 2,
        optimal: [1, 1],
        note: 'Once per week with FST-7 leg curls. Can do light RDLs on quad day for additional frequency without FST-7.'
      },
      glutes: {
        min: 1,
        max: 2,
        optimal: [1, 2],
        note: 'Can train 1-2x per week. If doing FST-7, limit to once weekly.'
      },
      biceps: {
        min: 1,
        max: 2,
        optimal: [1, 2],
        note: 'Small muscle, faster recovery. Advanced can do FST-7 twice weekly (e.g., Monday and Friday). Beginners stick to once.'
      },
      triceps: {
        min: 1,
        max: 2,
        optimal: [1, 2],
        note: 'Similar to biceps. Already worked during chest/shoulder pressing. FST-7 once weekly, optional second lighter session.'
      },
      calves: {
        min: 2,
        max: 3,
        optimal: [2, 3],
        note: 'Stubborn muscle benefits from higher frequency. Can do FST-7 on two separate days (e.g., leg day + shoulder day).'
      },
      abs: {
        min: 2,
        max: 5,
        optimal: [3, 4],
        note: 'Fast recovery. Can do FST-7 abs 2-3x per week on different training days.'
      }
    },

    splitRecommendations: [
      {
        name: 'Classic 5-Day FST-7 Split',
        schedule: {
          monday: 'Chest',
          tuesday: 'Back',
          wednesday: 'OFF',
          thursday: 'Shoulders',
          friday: 'Arms (Biceps + Triceps)',
          saturday: 'Legs',
          sunday: 'OFF'
        },
        note: 'Each muscle group hit once per week with FST-7 finisher. Phil Heath\'s preferred split.'
      },
      {
        name: 'Push/Pull/Legs FST-7',
        schedule: {
          pattern: 'Push / Pull / Legs / OFF / repeat',
          push: 'Chest + Shoulders + Triceps (FST-7 on chest OR shoulders)',
          pull: 'Back + Biceps (FST-7 on back OR biceps)',
          legs: 'Quads + Hamstrings + Calves (FST-7 on quads OR hamstrings)'
        },
        note: 'Higher frequency split. Only apply FST-7 to 1 muscle per session to manage fatigue.'
      },
      {
        name: 'Arnold Split with FST-7',
        schedule: {
          pattern: 'Chest+Back / Shoulders+Arms / Legs / OFF / repeat',
          day1: 'Chest + Back (FST-7 on chest OR back)',
          day2: 'Shoulders + Arms (FST-7 on delts OR biceps OR triceps)',
          day3: 'Legs (FST-7 on quads OR hamstrings)'
        },
        note: 'Antagonistic pairing. Apply FST-7 to priority muscle in each session.'
      }
    ]
  },

  // ROM emphasis and execution principles
  romEmphasis: {
    lengthened: 30,
    shortened: 50, // FST-7 emphasizes shortened/contracted position for pump
    fullRange: 20,

    principles: [
      'Full ROM on all compound exercises - no compromise on basic movements',
      'FST-7 sets emphasize PEAK CONTRACTION at the shortened position - squeeze hard for 1-2 seconds',
      'Control the eccentric (2 seconds) to maintain tension and prevent momentum',
      'Pause briefly in the stretched position to enhance fascia stretching',
      'Mind-muscle connection is CRITICAL - visualize the muscle filling with blood',
      'Quality of contraction trumps weight or speed - this is metabolic work, not strength work',
      'On cable exercises, maintain constant tension - don\'t let the weight stack touch between reps',
      'Focus on "pumping blood into the muscle" rather than "lifting weight"',
      'The burn and pump should be almost unbearable by sets 5-7 - that\'s the target stimulus'
    ],

    techniqueNotes: {
      compound: 'Maintain strict form with full ROM. These build the foundation.',
      fst7: 'Controlled tempo (2-1-1-1), emphasize peak contraction, maintain constant tension, never let muscle "rest" during the set'
    }
  },

  // Exercise selection principles expanded
  exerciseSelectionPrinciples: {
    movementPatterns: {
      horizontalPush: {
        compounds: ['Barbell bench press', 'Incline barbell press', 'Dumbbell bench press', 'Incline dumbbell press', 'Hammer Strength chest press'],
        fst7Finishers: ['Pec deck machine', 'Cable flyes (middle, low, high)', 'Dumbbell flyes (flat or incline)', 'Machine flyes']
      },
      verticalPush: {
        compounds: ['Barbell overhead press', 'Dumbbell shoulder press', 'Arnold press', 'Smith machine shoulder press'],
        fst7Finishers: ['Cable lateral raises', 'Machine lateral raises', 'Dumbbell lateral raises (strict)', 'Reverse pec deck (rear delts)', 'Cable face pulls']
      },
      horizontalPull: {
        compounds: ['Barbell rows (overhand/underhand)', 'T-bar rows', 'Dumbbell rows', 'Chest-supported rows', 'Hammer Strength rows'],
        fst7Finishers: ['Seated cable rows', 'Machine rows (Hammer Strength)', 'Single-arm cable rows', 'Cable pullovers']
      },
      verticalPull: {
        compounds: ['Pull-ups', 'Chin-ups', 'Lat pulldown (wide grip)', 'Close-grip pulldown'],
        fst7Finishers: ['Straight-arm pulldowns', 'Cable pullovers', 'Machine pullovers', 'Single-arm lat pulldowns']
      },
      squatPattern: {
        compounds: ['Barbell back squat', 'Front squat', 'Safety bar squat', 'Hack squat machine', 'Leg press (heavy, low reps)'],
        fst7Finishers: ['Leg extensions', 'Leg press (moderate weight, high reps)', 'Hack squat machine (moderate weight)', 'Smith machine squats (controlled)']
      },
      hingePattern: {
        compounds: ['Romanian deadlifts', 'Stiff-leg deadlifts', 'Conventional deadlifts', 'Good mornings'],
        fst7Finishers: ['Lying leg curls', 'Seated leg curls', 'Cable pull-throughs', 'Single-leg curls']
      },
      lungePattern: {
        compounds: ['Walking lunges', 'Bulgarian split squats', 'Reverse lunges', 'Forward lunges'],
        fst7Application: 'Generally not used for FST-7 due to balance requirements and bilateral fatigue management. Stick to isolations for FST-7.'
      }
    },

    unilateralRequirements: {
      minPerWorkout: 0,
      applicability: 'Optional - unilateral work not required but beneficial for imbalances',
      fst7Unilateral: 'FST-7 can be done unilaterally (e.g., single-arm cable curls 7x12 each arm). Doubles the time but maximizes focus. Hany Rambod occasionally uses this for arms.',
      targetMuscles: ['Arms (biceps, triceps)', 'Shoulders (single-arm lateral raises)', 'Legs (single-leg extensions/curls)'],
      rationale: 'Unilateral FST-7 allows absolute focus on one limb at a time, preventing the stronger side from compensating'
    },

    compoundToIsolationRatio: {
      compound: 50,
      isolation: 50,
      rationale: 'FST-7 balances mechanical tension (compounds) with metabolic stress (isolations). Roughly 50% of working sets are compounds for strength/density, 50% are isolation work for pump and shape. The 7-set FST-7 finisher accounts for a large portion of isolation volume.',
      implementation: 'Typical workout: 6-10 sets of compounds + 3-5 sets of isolations + 7 sets FST-7 = ~40% compound, 60% isolation by set count'
    },

    equipmentVariations: [
      'MACHINES are KING for FST-7 sets - provide guided motion at extreme fatigue',
      'CABLES are excellent for FST-7 - constant tension throughout ROM, safe to failure',
      'DUMBBELLS can work for FST-7 with strict form - require more stabilization',
      'BARBELLS generally avoided for FST-7 (exception: strict EZ-bar curls, light barbell curls)',
      'SMITH MACHINE acceptable for FST-7 squat-pattern movements (hack squat, squats)',
      'Free weight compound movements reserved for strength work (first exercises)',
      'Hammer Strength machines ideal - combine free weight feel with machine safety'
    ],

    safetyPrinciples: [
      'Never do FST-7 on exercises requiring spotter (heavy bench, squats)',
      'Avoid FST-7 on exercises that stress lower back when fatigued (deadlifts, heavy rows)',
      'Choose exercises where failure is safe (machine/cable)',
      'Pre-fatigue prevents dangerously heavy weight selection',
      'Form must remain perfect through all 7 sets - if form breaks, reduce weight immediately',
      'Have water bottle and towel at station - no walking around between FST-7 sets'
    ]
  },

  // Stimulus to Fatigue optimization
  stimulusToFatigue: {
    philosophy: 'FST-7 maximizes hypertrophy stimulus while managing systemic fatigue through strategic exercise selection. Compounds create mechanical tension with some fatigue; isolation FST-7 creates metabolic stress with manageable fatigue.',

    principles: [
      'FST-7 creates HIGH stimulus through metabolic stress rather than purely mechanical tension',
      'Choosing the right FST-7 exercise (high S:F) allows maximum pump with manageable systemic fatigue',
      'Machines and cables have better S:F ratios than free weights for metabolic work',
      'Pre-fatigue from compounds allows lighter FST-7 weights, further improving S:F ratio',
      'Isolation exercises eliminate limiting factors (grip, stabilizers), ensuring target muscle fails first',
      'Strategic exercise order: fatigue-inducing compounds first, high-stimulus isolations last'
    ],

    highStimulusLowFatigue: [
      'Pec deck machine',
      'Cable flyes (all angles)',
      'Leg extensions',
      'Lying leg curls',
      'Seated leg curls',
      'Cable lateral raises',
      'Machine lateral raises',
      'Cable bicep curls',
      'Cable tricep pushdowns',
      'Overhead cable extensions',
      'Seated cable rows',
      'Machine pulldowns',
      'Straight-arm cable pulldowns',
      'Cable pullovers',
      'Calf press on leg press',
      'Seated calf raises'
    ],

    moderateStimulusFatigue: [
      'Leg press (moderate weight)',
      'Hack squat machine (moderate weight)',
      'Hammer Strength chest press',
      'Hammer Strength rows',
      'Dumbbell flyes',
      'Dumbbell lateral raises',
      'Preacher curls (machine or dumbbell)',
      'Dumbbell rows',
      'Smith machine squats'
    ],

    lowStimulusHighFatigue: [
      'Heavy barbell squats',
      'Heavy deadlifts',
      'Heavy barbell bench press',
      'Heavy barbell overhead press',
      'Heavy barbell rows',
      'Heavy T-bar rows'
    ],

    applicationGuidelines: 'Use low-S:F movements sparingly at start of workout for strength foundation (1-2 exercises max). Use moderate S:F for secondary compounds (1-2 exercises). Apply FST-7 exclusively to high S:F exercises to maximize pump without destroying CNS or joints.',

    fst7ExerciseSelection: 'The FST-7 exercise should be from the "high stimulus, low fatigue" category. This allows you to push to absolute failure across 7 sets while maintaining form and without excessive joint stress or systemic fatigue that would impair recovery.'
  },

  // Advanced techniques
  advancedTechniques: {
    fst7CoreProtocol: {
      name: 'FST-7 Protocol (Core Technique)',
      protocol: 'Exactly 7 sets of 8-12 repetitions with precisely 30-45 seconds rest between sets',
      when: 'Applied to the final exercise for each muscle group in every workout for that muscle',
      how: 'Select an isolation or machine exercise. Perform 7 consecutive sets with short rest. Focus on pump, stretch, and peak contraction. Sip water between every set. Contract/pose muscle during rest periods. Do not walk away from the station. Maintain strict form through all sets.',
      frequency: 'Once per muscle group per week (large muscles), up to twice for small muscles (arms, calves)',

      suitableExercises: [
        'Pec deck or cable flyes (chest)',
        'Straight-arm pulldowns or cable pullovers (back)',
        'Cable or machine lateral raises (shoulders)',
        'Cable pushdowns with rope (triceps)',
        'Overhead cable extensions (triceps)',
        'Cable curls with EZ-bar or rope (biceps)',
        'Leg extensions (quadriceps)',
        'Lying or seated leg curls (hamstrings)',
        'Calf press on leg press or seated calf raises (calves)',
        'Seated cable rows (back thickness)',
        'Machine preacher curls (biceps)',
        'Reverse pec deck (rear delts)'
      ],

      executionDetails: [
        'Set 1: Should be able to complete 10-12 reps with strict form',
        'Sets 2-4: Rep count may stay consistent or drop slightly (10-11 reps)',
        'Sets 5-6: Fatigue increases, reps may drop to 8-10, maintain form',
        'Set 7: Final set, push to absolute failure within rep range',
        'If reps drop below 8 before set 7, reduce weight 10-20% immediately',
        'Rest: Exactly 30-45 seconds measured (use timer on phone or gym clock)',
        'Between sets: 2-3 sips of water, contract muscle in pose for 5-10 seconds',
        'Mental focus: Visualize blood filling the muscle, embrace the burn',
        'Pump should be extreme by set 5-6, almost painful by set 7'
      ],

      cautions: [
        'Extremely demanding - ensure proper hydration before starting',
        'May cause severe DOMS for 3-5 days, especially initially',
        'Not suitable for compound barbell exercises (squats, deadlifts, heavy bench)',
        'Requires strict rest period discipline - no phone browsing, no conversations',
        'Can cause nausea or lightheadedness on legs - have seat nearby',
        'Do not attempt on exercises you don\'t "feel" well - mind-muscle connection essential',
        'If pump is weak, check hydration, carbohydrate intake, and sleep quality'
      ],

      progression: 'Progress by: (1) Maintaining weight and increasing reps across all sets, (2) Maintaining weight and reducing rest time slightly (45s → 40s → 35s → 30s), (3) Only when all sets hit 12 reps with 30-45s rest, increase weight by 2.5-5kg',

      priority: 'THE signature technique of this methodology - non-negotiable component of every workout'
    },

    interSetPosing: {
      name: 'Inter-Set Posing',
      when: 'During the 30-45 second rest between FST-7 sets',
      how: 'Contract the target muscle in a bodybuilding pose for 5-10 seconds of the rest period',

      protocol: {
        chest: 'Most muscular, crab most muscular, or pec squeeze - contract pecs as hard as possible',
        back: 'Lat spread (front or rear), or rear lat spread with hand on hip',
        shoulders: 'Front or side delt pose - arms raised to shoulder height, flex delts',
        biceps: 'Double biceps front or single bicep pose - squeeze peak contraction',
        triceps: 'Triceps extension pose or overhead tricep flex',
        quads: 'Front thigh pose - contract and squeeze quads while standing',
        hamstrings: 'Leg curl pose or back leg biceps pose',
        calves: 'Calf flex - stand on toes and squeeze'
      },

      purpose: 'Forces additional blood into already congested muscle, amplifies pump despite discomfort and fatigue',
      intensity: 'Should be uncomfortable - posing a pumped muscle intensifies the burn significantly',

      alternateApproach: 'Can alternate posing and light stretching - e.g., pose after sets 1, 3, 5, 7 and stretch after sets 2, 4, 6',

      optionalStretchComponent: 'Light static stretch of the muscle (10-15 seconds) - e.g., doorway stretch for chest, overhead stretch for triceps, pulling knee up for quads. Stretches the fascia externally while pump stretches internally.',

      application: 'Hany Rambod uses this with all his athletes. Phil Heath, Jay Cutler, Chris Bumstead all pose between FST-7 sets. Non-negotiable for maximum pump.',

      cautions: [
        'Posing will increase the burn and discomfort significantly',
        'Don\'t pose so hard that you induce cramping',
        'Keep breathing during the pose - no breath holding',
        'If dizziness occurs, skip posing and focus on breathing and hydration'
      ]
    },

    dropSetsOnFinalFst7: {
      name: 'Drop Set on Final FST-7 Set',
      when: 'Occasionally, on the 7th (final) FST-7 set to push beyond normal failure',
      how: 'Complete the 7th set to failure, immediately reduce weight by 20-30%, continue to failure again',
      protocol: 'After reaching failure at ~8-10 reps on set 7, drop the weight by 20-30% (have pins ready or use quick-adjust machines/dumbbells), immediately continue for another 8-12 reps to failure',

      frequency: 'Use sparingly - once every 2-3 weeks or for plateau-busting',
      application: 'Best on machine or cable exercises where weight can be changed quickly (drop pin, grab lighter dumbbells, reduce cable stack)',

      suitableExercises: [
        'Leg extensions (drop pin)',
        'Leg curls (drop pin)',
        'Cable lateral raises (drop pin)',
        'Cable pushdowns (drop pin)',
        'Cable curls (drop pin)',
        'Pec deck (drop pin)',
        'Machine rows (drop pin)',
        'Dumbbell exercises (pre-place lighter dumbbells)'
      ],

      cautions: [
        'FST-7 is already extreme - drop sets are EXTRA extreme',
        'Only for advanced trainees with excellent recovery',
        'Can significantly increase DOMS and recovery time',
        'Don\'t use every workout - will lead to overtraining',
        'Have training partner to assist or ensure easy weight changes'
      ],

      integration: 'Reserve for lagging muscle groups or end of training cycle before deload. Not a regular component.'
    },

    preExhaust: {
      name: 'Pre-Exhaust',
      when: 'Optional technique used before heavy compound movements for stubborn muscles',
      how: 'Perform isolation exercise to near failure (1 RIR) immediately before compound movement',

      protocol: 'Single set of isolation for 10-15 reps, then immediately perform compound movement. Example: leg extensions (1 set) → squats, or cable flyes → bench press',

      application: 'Use when mind-muscle connection is poor on compounds or target muscle is not limiting factor',

      examples: [
        'Leg extensions → Squats (pre-exhaust quads so they fail before lower back/glutes)',
        'Cable flyes → Bench press (pre-exhaust pecs so they fail before triceps)',
        'Lateral raises → Overhead press (pre-exhaust delts)',
        'Leg curls → Romanian deadlifts (pre-exhaust hamstrings)',
        'Straight-arm pulldowns → Rows (pre-exhaust lats before biceps fatigue)'
      ],

      cautions: [
        'Pre-exhaust will reduce weight you can use on the compound - this is intentional',
        'Purpose is to ensure target muscle is the limiting factor',
        'Don\'t use on every compound or you\'ll lose strength stimulus',
        'Best for secondary compounds, not primary heavy movements'
      ],

      fst7Integration: 'Pre-exhaust is NOT the FST-7 set. It\'s a technique used earlier in workout. FST-7 still comes at the very end.',

      priority: 'Optional technique for intermediate/advanced. Not required for FST-7 effectiveness.'
    },

    restPauseOnFst7: {
      name: 'Rest-Pause on FST-7 Sets',
      when: 'Advanced technique to extend sets 5-7 when reps are dropping too low',
      how: 'When reaching failure at low reps (6-7), rest 10-15 seconds, then continue for 2-4 more reps',

      protocol: 'If on sets 5, 6, or 7 you hit failure at only 6-7 reps (below target range), rest 10-15 seconds while holding the weight or maintaining position, then push out 2-4 more reps to reach the 8-10 rep minimum',

      application: 'Allows completion of all 7 FST-7 sets within rep range without dropping weight',

      cautions: [
        'Only for advanced trainees - requires excellent form maintenance',
        'Don\'t use if form is breaking down',
        'Better to reduce weight than to use rest-pause with poor form',
        'Creates even more metabolic stress - ensure recovery capacity'
      ],

      integration: 'Use occasionally when weight selection was slightly too heavy but you want to complete the full 7 sets. Not a regular technique.',

      priority: 'Advanced option, not required'
    },

    extendedSets: {
      name: 'Extended Sets (Lengthened Partials)',
      when: 'When reaching failure, perform additional partial reps in the stretched/lengthened position',
      how: 'After reaching full ROM failure, continue with partial reps in the bottom half of the movement for 5-10 reps',

      protocol: 'Complete reps to failure, then immediately perform partial reps in the stretched position (bottom half of ROM) until you cannot move the weight at all',

      suitableExercises: [
        'Leg extensions (bottom half partials)',
        'Cable flyes (stretched position partials)',
        'Cable curls (bottom half partials)',
        'Leg curls (stretched position partials)',
        'Lateral raises (bottom third of movement)'
      ],

      application: 'Can be applied to final 1-2 FST-7 sets (sets 6-7) to push beyond normal failure',

      cautions: [
        'Very advanced technique',
        'Creates significant muscle damage - recovery impact is high',
        'Use very sparingly (once every few weeks)',
        'Risk of injury increases - maintain control'
      ],

      priority: 'Optional advanced technique for experienced trainees'
    },

    bloodFlowRestriction: {
      name: 'Blood Flow Restriction (BFR) with FST-7',
      when: 'Advanced method to amplify the pump mechanism',
      how: 'Apply BFR cuffs/wraps to proximal limbs during FST-7 sets to restrict venous return',

      protocol: 'Apply BFR bands at 40-50% occlusion to upper arms (for arm exercises) or upper thighs (for leg exercises) before starting the 7 sets. Perform FST-7 as normal. Remove bands after completion.',

      rationale: 'BFR traps blood in the muscle even more effectively than FST-7 alone, potentially amplifying the cell swelling and metabolic stress signals',

      cautions: [
        'ADVANCED only - requires proper BFR education and equipment',
        'Improper occlusion pressure can be dangerous',
        'Dramatically increases difficulty and discomfort',
        'Not necessary for FST-7 effectiveness - pure optimization',
        'Consult with qualified professional before attempting'
      ],

      application: 'Hany Rambod does not traditionally include BFR in FST-7, but some modern practitioners experiment with it',

      priority: 'Optional, advanced, experimental'
    }
  },

  // Split variations
  splitVariations: {
    variationStrategy: 'FST-7 is traditionally implemented with bodybuilding-style splits that hit each muscle group once per week with one FST-7 finisher per muscle group. No A/B workout variations - same workout is repeated weekly with progressive overload on weights/reps. The split can be organized different ways (5-day, PPL, Arnold) but the principle remains: each muscle gets one dedicated FST-7 session per week.',

    splitOptions: [
      {
        name: 'Classic 5-Day FST-7 Bro Split',
        description: 'The most popular FST-7 split. Each muscle gets its own day with undivided attention and one FST-7 finisher.',

        schedule: {
          monday: 'Chest',
          tuesday: 'Back',
          wednesday: 'OFF or Cardio/Abs',
          thursday: 'Shoulders',
          friday: 'Arms (Biceps + Triceps)',
          saturday: 'Legs (Quads + Hamstrings + Calves)',
          sunday: 'OFF'
        },

        workoutStructure: {
          chest: 'Bench press 4x8-10, Incline DB press 3x8-12, Dumbbell flyes 3x10-12, Pec deck FST-7 7x10-12 (30-45s rest)',
          back: 'Pull-ups 3x AMRAP, Barbell rows 4x8-10, Lat pulldown 3x10-12, Straight-arm pulldowns FST-7 7x10-12',
          shoulders: 'DB shoulder press 4x8-10, Front raises 3x10-12, Side laterals 3x10-12, Cable lateral raises FST-7 7x10-12',
          arms: 'Close-grip bench 3x8-10, Dips 3x8-12, Rope pushdowns FST-7 7x10-12 | Barbell curls 3x8-10, Incline curls 3x10-12, Cable curls FST-7 7x10-12',
          legs: 'Squats 4x8-10, Hack squats 3x10-12, Leg extensions FST-7 7x12-15 | RDLs 3x8-10, Lying leg curls FST-7 7x12-15 | Calf raises 3x12-15'
        },

        advantages: [
          'Maximum focus on one muscle per day',
          'Plenty of recovery time (7 days between same muscle)',
          'Can push FST-7 to absolute limit without systemic fatigue concern',
          'Clear progression tracking (same workout weekly)',
          'Fits well with 9-5 work schedule'
        ],

        considerations: [
          'Lower frequency may not be optimal for natural lifters (debate exists)',
          'Requires 5 gym days per week',
          'If you miss a day, that muscle won\'t be trained that week',
          'Smaller muscles (arms) might not need full dedicated day for naturals'
        ],

        bestFor: 'Advanced bodybuilders, those with great recovery, preparing for competitions, Phil Heath approach'
      },

      {
        name: 'Push/Pull/Legs FST-7',
        description: 'Higher frequency option training each muscle 2x per week, but FST-7 applied only once per muscle.',

        schedule: {
          pattern: 'Push / Pull / Legs / OFF / Push / Pull / Legs / OFF (8-day cycle)',
          alternative: 'Push / Pull / Legs / Push / Pull / Legs / OFF (7-day, true 2x/week)'
        },

        workoutStructure: {
          push1: 'Chest focus: Bench press 4x6-8, Incline DB 3x8-10, DB overhead press 3x8-10, Lateral raises 3x10-12, Pec deck FST-7 7x10-12, Tricep pushdowns 3x10-12',
          push2: 'Shoulder focus: DB shoulder press 4x6-8, Incline bench 3x8-10, Cable flyes 3x10-12, Cable lateral raises FST-7 7x10-12, Rope pushdowns 3x10-12',
          pull1: 'Width focus: Pull-ups 4xAMRAP, Lat pulldown 3x8-10, Barbell rows 3x8-10, Straight-arm pulldowns FST-7 7x10-12, DB curls 3x10-12',
          pull2: 'Thickness focus: Barbell rows 4x6-8, T-bar rows 3x8-10, Lat pulldown 3x10-12, Seated cable row FST-7 7x10-12, Cable curls FST-7 7x10-12',
          legs1: 'Quad focus: Squats 4x6-8, Leg press 3x10-12, Leg extensions FST-7 7x12-15, RDL 3x8-10, Leg curls 3x10-12',
          legs2: 'Ham/glute focus: RDL 4x6-8, Leg press 3x10-12, Walking lunges 3x12, Leg curls FST-7 7x12-15, Calves 3x15-20'
        },

        advantages: [
          'Higher frequency (2x/week) better for naturals and protein synthesis',
          'Shorter workouts (multiple muscles per session)',
          'Flexible - can do 6 days or with rest days as needed',
          'Can vary which muscle gets FST-7 each week based on priority'
        ],

        considerations: [
          'Must manage FST-7 application carefully - only 1 FST-7 per session max',
          'More systemic fatigue (training multiple large muscles per day)',
          'Requires strategic deloads (every 4-6 weeks)',
          'Chest/shoulders/triceps pre-fatigue each other - manage exercise order'
        ],

        bestFor: 'Intermediate/advanced naturals, those who respond to higher frequency, time-efficient training'
      },

      {
        name: 'Arnold Split with FST-7',
        description: 'Antagonistic pairing of muscle groups - chest/back, shoulders/arms, legs. Classic old-school approach.',

        schedule: {
          pattern: 'Chest+Back / OFF / Shoulders+Arms / OFF / Legs / OFF / repeat (or 3 on, 1 off)',
          day1: 'Chest + Back',
          day2: 'OFF or Cardio/Abs',
          day3: 'Shoulders + Arms',
          day4: 'OFF or Cardio/Abs',
          day5: 'Legs',
          day6: 'OFF',
          day7: 'Repeat'
        },

        workoutStructure: {
          chestBack: 'Bench press 4x8, Barbell rows 4x8, Incline DB 3x10, Lat pulldown 3x10, Cable flyes 3x12, Pec deck FST-7 7x10-12 (chest focus) OR Straight-arm pulldowns FST-7 7x10-12 (back focus)',
          shouldersArms: 'DB press 4x8, Barbell curls 3x8-10, Lateral raises 3x10-12, Rope pushdowns 3x10, Cable lateral raises FST-7 7x10-12 OR Cable curls FST-7 7x10-12',
          legs: 'Squats 4x8, Leg press 3x10, RDL 3x8-10, Leg extensions FST-7 7x12-15 OR Leg curls FST-7 7x12-15, Calves 4x15'
        },

        advantages: [
          'Antagonistic pairing allows mini-active recovery (blood flow to opposing muscle)',
          'Efficient - complete upper body in two sessions',
          'Flexibility in FST-7 application (pick priority muscle each session)',
          'High pump and muscle fullness from pairing',
          '3-4 gym days per week'
        ],

        considerations: [
          'Long workouts (training two major groups)',
          'Requires excellent conditioning to maintain intensity',
          'Can only do FST-7 on one muscle per session (fatigue management)',
          'Not ideal for pure specialization on one muscle'
        ],

        bestFor: 'Intermediate lifters, those with limited gym days per week, Arnold fans'
      },

      {
        name: 'Upper/Lower FST-7',
        description: 'Simple split alternating upper and lower body. Good for beginners to FST-7.',

        schedule: {
          pattern: 'Upper / Lower / OFF / Upper / Lower / OFF / OFF',
          week1Upper: 'Chest + Back focus',
          week1Lower: 'Quad + Hamstring focus',
          week2Upper: 'Shoulders + Arms focus',
          week2Lower: 'Glute + Calf focus'
        },

        workoutStructure: {
          upper1: 'Bench 4x8, Rows 4x8, Incline DB 3x10, Pulldowns 3x10, Lateral raises 3x12, Pec deck FST-7 7x10-12, Curls 3x10, Pushdowns 3x10',
          lower1: 'Squats 4x8, RDL 3x8-10, Leg press 3x10-12, Leg extensions FST-7 7x12-15, Calves 3x15',
          upper2: 'Overhead press 4x8, Pull-ups 3xAMRAP, DB press 3x10, Cable rows 3x10, Cable lateral raises FST-7 7x10-12, Barbell curls 3x10, Rope pushdowns FST-7 7x10-12',
          lower2: 'Deadlifts 4x6, Bulgarian split squats 3x10, Leg press 3x12, Leg curls FST-7 7x12-15, Hip thrusts 3x12, Calf raises 4x15'
        },

        advantages: [
          'Simple structure, easy to follow',
          'Each muscle hit 2x per week',
          '4 gym days per week',
          'Good for beginners to FST-7 methodology'
        ],

        considerations: [
          'Less specialization per muscle',
          'Must choose which muscles get FST-7 carefully (max 1-2 per session)',
          'Systemic fatigue from training entire upper or lower body'
        ],

        bestFor: 'Beginners to FST-7, naturals, those with 4 days per week available'
      }
    ],

    variationLabels: [], // No A/B variations - same workout repeated weekly with progression

    rotationLogic: 'FST-7 does not typically use A/B workout variations. The same workout is performed each week for a given muscle group, with progressive overload applied through adding reps and/or weight. The consistent stimulus allows for better tracking of the pump effect and FST-7 adaptation. After 6-8 weeks, you can change exercise selection (e.g., switch from pec deck to cable flyes for chest FST-7) to provide novelty, but the FST-7 structure remains constant.',

    fst7ApplicationPerSplit: {
      '5DayBroSplit': 'One FST-7 finisher per workout (per muscle group). Example: Pec deck FST-7 every chest day.',
      'PushPullLegs': 'One FST-7 finisher per workout, rotate priority muscle. Week 1: chest FST-7 on push, back FST-7 on pull, quads FST-7 on legs. Week 2: shoulders FST-7 on push, biceps FST-7 on pull, hams FST-7 on legs.',
      'ArnoldSplit': 'One FST-7 per workout. Choose priority muscle in each pairing. Chest OR back FST-7 (rotate weekly), shoulders OR arms FST-7 (rotate), quads OR hams FST-7.',
      'UpperLower': 'Max 1-2 FST-7 per workout. Upper days: chest OR back OR shoulders OR arms FST-7. Lower days: quads OR hams FST-7.'
    },

    frequencyManagement: 'CRITICAL: Each muscle group receives FST-7 only ONCE per week (large muscles) or maximum TWICE (small muscles like arms/calves). Even in 2x/week frequency splits (PPL, Upper/Lower), FST-7 is applied only once per week per muscle. The second session for that muscle uses traditional training without the 7-set finisher.'
  },

  // Periodization
  periodization: {
    mesocycleLength: 8,
    philosophy: 'FST-7 is inherently high intensity and high metabolic stress. Periodization focuses on building capacity for the FST-7 protocol, then intensifying it, followed by mandatory deload. Cycles are shorter (6-8 weeks) than traditional periodization due to the demanding nature of FST-7.',

    accumulationPhase: {
      name: 'Capacity Building Phase',
      weeks: 4,
      volumeMultiplier: 0.9,
      intensityMultiplier: 0.85,

      focus: 'Build work capacity and conditioning for FST-7 protocol. Perfect technique on pump exercises. Develop mind-muscle connection. Adapt to the metabolic demands.',

      implementation: [
        'Start with 5-6 sets instead of 7 for FST-7 finisher (build up)',
        'Use rest periods on the higher end (45-50 seconds)',
        'Focus on form and pump quality over weight',
        'Compound exercises at 85% intensity (leave 2 RIR)',
        'Add 1 set to FST-7 each week if tolerating well (week 1: 5 sets, week 2: 6 sets, week 3-4: 7 sets)'
      ],

      goals: [
        'Establish baseline weights for FST-7 exercises',
        'Develop hydration and inter-set routine habits',
        'Build metabolic conditioning to tolerate short rest',
        'Minimize excessive DOMS while adapting',
        'Practice posing/contraction between sets'
      ],

      progressionEmphasis: 'Focus on completing all sets within rep range rather than adding weight. Learn what pump "should" feel like.'
    },

    intensificationPhase: {
      name: 'Peak Pump Phase',
      weeks: 3,
      volumeMultiplier: 1.0,
      intensityMultiplier: 1.0,

      focus: 'Push FST-7 weights to maximum while maintaining all 7 sets. Achieve peak metabolic stress and pump. Break through plateaus. This is the "money" phase where growth happens.',

      implementation: [
        'Full 7 sets on all FST-7 finishers',
        'Rest periods at minimum (30-35 seconds)',
        'Push weight progressions aggressively while maintaining rep ranges',
        'Compound exercises at true working intensity (1 RIR or less)',
        'Consider adding advanced techniques (drop sets on set 7, rest-pause, etc.)'
      ],

      goals: [
        'Achieve personal bests on FST-7 exercise weights',
        'Experience maximum pump and fascia stretch',
        'Push each muscle to its growth limits',
        'Create significant overreaching (controlled)'
      ],

      techniquesIntroduced: [
        'Drop sets on final (7th) FST-7 set',
        'Rest-pause on sets 5-7 if needed to maintain reps',
        'Extended sets (lengthened partials after failure)',
        'Potentially reduce rest to 30 seconds flat for final week'
      ],

      progressionEmphasis: 'Aggressive weight increases when hitting top of rep range. Accept that recovery will be challenging - this is peak stress phase.',

      monitoringImportant: 'Watch for signs of overtraining: persistent fatigue, sleep issues, joint pain, loss of pump. If detected, move to deload immediately.'
    },

    deloadPhase: {
      name: 'Recovery & Resensitization Phase',
      frequency: 'Every 6-8 weeks (after intensification phase)',
      weeks: 1,
      volumeReduction: 50,
      intensityMaintenance: '70% of working weights',

      protocol: 'ELIMINATE FST-7 sets entirely for the deload week. Reduce all exercises to 3-4 sets maximum. Use 70% of working weights. Stop all sets at 3-4 RIR. Focus on movement quality and recovery.',

      implementation: [
        'No FST-7 finishers - completely remove the 7-set protocol',
        'All exercises: 3 sets x 10-12 reps at 70% of working weight',
        'Increase rest periods to 2-3 minutes on all exercises',
        'No advanced techniques (no drop sets, rest-pause, etc.)',
        'Reduce training frequency (4-5 days down to 3-4 days)',
        'Can replace 1-2 gym sessions with active recovery (swimming, yoga, walking)'
      ],

      goals: [
        'Allow connective tissue, joints, CNS to fully recover',
        'Reduce inflammation and clear accumulated fatigue',
        'Restore hormone balance (cortisol, testosterone)',
        'Heal any minor strains or irritations',
        'Psychological break from intense FST-7 grind',
        'Resensitize muscles to high-intensity stimulus'
      ],

      rationale: 'FST-7 creates extreme metabolic damage and systemic stress. Even with perfect nutrition and sleep, the body needs periodic breaks. Deload allows supercompensation - you come back stronger. Skipping deloads leads to diminishing returns, overtraining, and injury risk.',

      duration: '1 week (7 days). Can extend to 10 days if very fatigued.',

      nutritionNote: 'Maintain protein intake but can reduce calories slightly. Good time for diet break if in caloric deficit.'
    },

    cycleProgression: {
      cycle1: 'Focus FST-7 on chest + back (lagging upper body)',
      cycle2: 'Focus FST-7 on shoulders + arms (detail work)',
      cycle3: 'Focus FST-7 on quads + hamstrings (leg specialization)',
      cycle4: 'Full-body FST-7 (all muscles receive FST-7 finisher)',

      rationale: 'Rotating FST-7 focus allows prioritization of lagging body parts while giving other muscles active recovery from the extreme FST-7 protocol. Advanced approach: full-body FST-7 for competition prep.'
    },

    annualStructure: {
      description: 'Macro view of FST-7 training year',

      offSeasonMass: '3-4 FST-7 mesocycles (6-8 weeks each) with 1-week deloads between. Focus on progressive overload and weight gain.',

      preContestIntensification: '2-3 FST-7 mesocycles with full-body FST-7 application (all muscles get FST-7 finisher). Shorter deloads (4-5 days). Maximize muscle fullness and detail during caloric deficit.',

      postContestRecovery: '2-4 weeks complete break from FST-7. Traditional moderate-volume training. Restore baseline.',

      offSeasonReturn: 'Restart with capacity-building phase. Gradually reintroduce FST-7.'
    }
  }
}

async function seedFST7() {
  console.log('🌱 Seeding FST-7 (Hany Rambod) training approach...\n')

  try {
    // Check if FST-7 already exists
    const { data: existing, error: checkError } = await supabase
      .from('training_approaches')
      .select('id, name')
      .eq('name', 'FST-7 (Hany Rambod)')
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking for existing FST-7:', checkError)
      process.exit(1)
    }

    let result

    if (existing) {
      console.log('⚠️  FST-7 approach already exists. Updating...\n')

      result = await supabase
        .from('training_approaches')
        .update({
          creator: fst7Approach.creator,
          philosophy: fst7Approach.philosophy,
          short_philosophy: fst7Approach.short_philosophy,
          variables: fst7Approach.variables,
          progression_rules: fst7Approach.progression,
          exercise_rules: fst7Approach.exerciseSelection,
          rationales: fst7Approach.rationales,
          volume_landmarks: fst7Approach.volumeLandmarks,
          frequency_guidelines: fst7Approach.frequencyGuidelines,
          rom_emphasis: fst7Approach.romEmphasis,
          exercise_selection_principles: fst7Approach.exerciseSelectionPrinciples,
          stimulus_to_fatigue: fst7Approach.stimulusToFatigue,
          advanced_techniques: fst7Approach.advancedTechniques,
          split_variations: fst7Approach.splitVariations,
          periodization: fst7Approach.periodization,
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      console.log('✨ Creating new FST-7 approach...\n')

      result = await supabase
        .from('training_approaches')
        .insert({
          name: fst7Approach.name,
          creator: fst7Approach.creator,
          philosophy: fst7Approach.philosophy,
          short_philosophy: fst7Approach.short_philosophy,
          variables: fst7Approach.variables,
          progression_rules: fst7Approach.progression,
          exercise_rules: fst7Approach.exerciseSelection,
          rationales: fst7Approach.rationales,
          volume_landmarks: fst7Approach.volumeLandmarks,
          frequency_guidelines: fst7Approach.frequencyGuidelines,
          rom_emphasis: fst7Approach.romEmphasis,
          exercise_selection_principles: fst7Approach.exerciseSelectionPrinciples,
          stimulus_to_fatigue: fst7Approach.stimulusToFatigue,
          advanced_techniques: fst7Approach.advancedTechniques,
          split_variations: fst7Approach.splitVariations,
          periodization: fst7Approach.periodization,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('❌ Error seeding FST-7:', result.error)
      console.error('Error details:', JSON.stringify(result.error, null, 2))
      process.exit(1)
    }

    console.log('✅ FST-7 approach seeded successfully!')
    console.log('📋 Approach Details:')
    console.log('   ID:', result.data.id)
    console.log('   Name:', result.data.name)
    console.log('   Creator:', result.data.creator)
    console.log('\n🔥 Key FST-7 Features Configured:')
    console.log('   ✓ 7-set finisher protocol with 30-45s rest')
    console.log('   ✓ Comprehensive exercise selection guidelines')
    console.log('   ✓ Fascia stretching methodology')
    console.log('   ✓ Inter-set posing and hydration protocols')
    console.log('   ✓ Multiple split variations (5-day, PPL, Arnold, Upper/Lower)')
    console.log('   ✓ Advanced techniques (drop sets, rest-pause, extended sets)')
    console.log('   ✓ Periodization with accumulation/intensification phases')
    console.log('   ✓ Volume landmarks for all major muscle groups')
    console.log('\n💪 Used by champions: Phil Heath, Jay Cutler, Chris Bumstead')
  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error)
    process.exit(1)
  }
}

// Execute the seed function
seedFST7()
  .then(() => {
    console.log('\n🎉 FST-7 seed completed successfully!')
    console.log('👉 Ready to use in workout generation system\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error)
    process.exit(1)
  })
