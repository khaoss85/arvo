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
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const mountainDogApproach = {
  name: 'Mountain Dog Training (John Meadows)',
  creator: 'John Meadows',
  category: 'bodybuilding',
  recommended_level: 'intermediate',
  level_notes: {
    it: 'Volume elevato, richiede esperienza e buona capacità di recupero',
    en: 'High volume, requires experience and good recovery capacity'
  },
  philosophy: `Mountain Dog Training is a multi-faceted hypertrophy approach that combines scientific principles with practical intensity techniques. Created by legendary bodybuilding coach John Meadows, this system is built around a unique 4-phase workout structure designed to maximize muscle growth through systematic progression of stimulus.

KEY PHILOSOPHICAL PILLARS:

1. **4-Phase Workout Architecture**
Each training session follows a deliberate sequence:
- Phase 1: Pre-Activation (joint preparation, blood flow, mind-muscle connection)
- Phase 2: Explosive Work (CNS activation, fast-twitch recruitment with chains/bands)
- Phase 3: Supramax Pump (maximum metabolic stress, extreme volume)
- Phase 4: Loaded Stretching (mechanotransduction, passive tension under load)

2. **Accommodating Resistance Philosophy**
Chains and bands are NOT optional accessories - they are fundamental tools that match resistance to strength curves, ensuring maximum tension throughout the entire ROM. This creates a "variable resistance" that prevents strength leakage at lockout positions.

3. **Anti-Deload Stance**
Unlike periodized models, Mountain Dog Training advocates for NO programmed deloads for 6-12 weeks in advanced trainees. Recovery is managed through exercise rotation, intensity technique variation, and strategic volume manipulation - NOT through blanket deload weeks.

4. **Loaded Stretching as Hypertrophy Driver**
The final phase isn't "cooldown" - it's a critical growth stimulus. Holding a stretched position under moderate load (30-60 seconds) creates mechanical tension in lengthened muscle positions, triggering mTOR activation and satellite cell proliferation.

5. **Extreme Metabolic Stress**
Phase 3 (Supramax Pump) uses drop sets, rest-pause, and giant sets to accumulate massive metabolic byproducts (lactate, H+ ions, inorganic phosphate). This metabolic stress is a primary hypertrophy mechanism separate from mechanical tension.

6. **Exercise Rotation for Sustained Progress**
Exercises change every 3-4 weeks to prevent adaptation plateaus, but movement patterns remain consistent. This provides novelty without sacrificing technical mastery.

SCIENTIFIC FOUNDATION:
- Mechanotransduction via loaded stretching (Schoenfeld, 2010)
- Variable resistance for strength curve optimization (Simmons, 2007)
- Metabolic stress as independent hypertrophy pathway (Goto et al., 2005)
- High-frequency training for enhanced protein synthesis (Schoenfeld et al., 2016)

TARGET POPULATION:
Intermediate to advanced bodybuilders seeking maximum hypertrophy through structured variety and aggressive intensity techniques. Requires excellent exercise technique, strong work capacity, and ability to push beyond typical failure points.`,
  short_philosophy: 'Multi-faceted hypertrophy system using a 4-phase workout structure: pre-activation, explosive work with chains/bands, supramax pump sets, and loaded stretching. Combines extreme metabolic stress with mechanical tension. Exercise rotation every 3-4 weeks prevents plateaus. Requires strong work capacity and ability to push beyond typical failure points.',

  variables: {
    setsPerExercise: {
      working: 4, // Standard for UI display
      warmup: '1-2 progressive sets before Phase 2',
      phase1PreActivation: '2-3 sets',
      phase2Explosive: '3-6 sets',
      phase3SupramaxPump: '3-5 sets (plus intensity techniques)',
      phase4LoadedStretching: '1-2 sets per muscle group'
    },

    repRanges: {
      compound: [4, 12],
      isolation: [8, 20],
      phase1PreActivation: [8, 12],
      phase2Explosive: [3, 6],
      phase3SupramaxPump: [8, 15],
      phase4LoadedStretching: [1, 1] // Single hold, 30-60s duration
    },

    rirTarget: {
      normal: 2, // Phase 2 (Explosive): RPE 7-8, explosive but not grinding
      intense: 0, // Phase 3 (Supramax Pump): RPE 9-10, absolute failure with techniques
      deload: 3, // Deload: well shy of failure
      phase1PreActivation: 4, // RPE 5-6 (easy, activation only)
      phase2Explosive: 2, // RPE 7-8 (explosive, not grinding)
      phase3SupramaxPump: 0, // RPE 9-10 (maximum effort with techniques)
      phase4LoadedStretching: null // N/A (hold to time, not effort-based)
    },

    restPeriods: {
      compound: [120, 180],
      isolation: [60, 90],
      phase1PreActivation: [45, 60],
      phase2Explosive: [180, 240],
      phase3SupramaxPump: [30, 60],
      phase4LoadedStretching: [0, 0] // No rest, end of workout
    },

    intensityTechniques: {
      primary: ['Chains', 'Bands', 'Loaded Stretching', 'Drop Sets', 'Rest-Pause'],
      phase1Techniques: ['Slow eccentrics', 'Pause reps', 'Partial reps'],
      phase2Techniques: ['Chains', 'Bands', 'Speed work'],
      phase3Techniques: ['Drop sets', 'Rest-pause', 'Giant sets', 'Mechanical drop sets'],
      phase4Techniques: ['Loaded stretching (30-60s holds)']
    },

    phaseStructure: {
      description: 'Each workout follows a 4-phase architecture designed to maximize different hypertrophy mechanisms',
      phases: [
        {
          order: 1,
          name: 'Pre-Activation',
          purpose: 'Joint preparation, blood flow, establish mind-muscle connection',
          sets: '2-3',
          reps: '8-12',
          load: '40-50% 1RM',
          techniques: ['Slow eccentrics', 'Pause at stretch'],
          restPeriods: '45-60s',
          exercises: [
            'Single-joint movements',
            'Machine-based isolation',
            'Cable exercises for constant tension',
            'Unilateral work for activation'
          ],
          criticalNotes: [
            'NOT a warmup - this is growth stimulus',
            'Focus on FEEL, not load',
            'Establish neural pathways for Phase 3',
            'Prime target muscle for subsequent phases'
          ]
        },
        {
          order: 2,
          name: 'Explosive Work',
          purpose: 'CNS activation, fast-twitch recruitment, accommodating resistance',
          sets: '3-6',
          reps: '3-6',
          load: '70-85% 1RM + chains/bands',
          techniques: ['Chains for ascending resistance', 'Bands for overspeed eccentrics'],
          restPeriods: '180-240s',
          exercises: [
            'Barbell compound movements',
            'Chain bench press',
            'Band deadlifts',
            'Chain squats',
            'Band rows'
          ],
          criticalNotes: [
            'Chains/bands are MANDATORY for this phase',
            'Focus on SPEED and POWER',
            'Variable resistance matches strength curve',
            'Prevents strength leakage at lockout',
            'Do NOT grind reps - maintain bar speed'
          ]
        },
        {
          order: 3,
          name: 'Supramax Pump',
          purpose: 'Maximum metabolic stress, extreme cell swelling, lactate accumulation',
          sets: '3-5 (plus drops/rest-pause)',
          reps: '8-15',
          load: '50-70% 1RM',
          techniques: ['Drop sets', 'Rest-pause', 'Giant sets', 'Mechanical drop sets'],
          restPeriods: '30-60s (or less for techniques)',
          exercises: [
            'Machine exercises for safety during extreme fatigue',
            'Cable movements for constant tension',
            'Isolation exercises',
            'Exercises allowing quick weight changes for drops'
          ],
          criticalNotes: [
            'This is where you ACCUMULATE DAMAGE',
            'Push beyond normal failure points',
            'Prioritize metabolic stress over mechanical tension',
            'Use techniques to extend sets past failure',
            'Target 30-90s time under tension per set'
          ]
        },
        {
          order: 4,
          name: 'Loaded Stretching',
          purpose: 'Mechanotransduction, hyperplasia stimulus, passive mechanical tension',
          sets: '1-2 per muscle group',
          reps: '1 (hold for 30-60s)',
          load: '20-30% 1RM',
          techniques: ['Isometric holds in stretched position'],
          restPeriods: 'None - end of workout',
          exercises: [
            'Dumbbell flyes (chest stretch)',
            'Overhead dumbbell extensions (triceps stretch)',
            'Incline dumbbell curls (biceps stretch)',
            'Romanian deadlift holds (hamstring stretch)',
            'Pec deck stretch (chest)',
            'Behind-neck lat pulldown (lat stretch)'
          ],
          criticalNotes: [
            'Hold stretched position for 30-60 seconds',
            'Use MODERATE load - NOT max weight',
            'Focus on DEEP stretch and relaxation',
            'This triggers mTOR via mechanical signaling',
            'May contribute to hyperplasia (muscle fiber splitting)',
            'Critical for fascia stretching and growth potential'
          ]
        }
      ]
    },

    accommodatingResistance: {
      philosophy: 'Chains and bands create variable resistance that matches natural strength curves, ensuring maximum tension throughout the entire range of motion',

      chains: {
        purpose: 'Ascending resistance - weight increases as you lift (more chain links leave ground)',
        bestFor: ['Bench press', 'Squats', 'Deadlifts', 'Overhead press'],
        setup: 'Chain weight should be 10-20% of bar weight at lockout, decreasing to 0% at bottom position',
        benefits: [
          'Matches ascending strength curve',
          'Maximizes tension at lockout (strongest position)',
          'Reduces joint stress at bottom position',
          'Teaches explosive acceleration through sticking points'
        ],
        programming: 'Use in Phase 2 (Explosive Work) for 3-6 reps at 70-85% 1RM + chains'
      },

      bands: {
        purpose: 'Overspeed eccentrics and variable resistance throughout ROM',
        bestFor: ['Bench press', 'Squats', 'Rows', 'Deadlifts'],
        setup: 'Band tension should add 20-30% resistance at lockout, minimal tension at bottom',
        benefits: [
          'Accelerates eccentric (increases stretch reflex)',
          'Forces explosive concentric',
          'Increases time under tension',
          'Teaches rate of force development'
        ],
        programming: 'Use in Phase 2 (Explosive Work) for 3-6 reps, focus on controlling eccentric speed'
      },

      implementationGuidelines: [
        'NEVER use chains/bands in Phase 3 (Supramax Pump) - too dangerous when fatigued',
        'Reserve accommodating resistance for Phase 2 only',
        'If no chains/bands available, use pause reps or tempo variations in Phase 2',
        'Chains are preferred for pressing, bands for pulling',
        'Start conservative - add 10% accommodating resistance, increase gradually'
      ]
    },

    loadedStretchingProtocol: {
      philosophy: 'Loaded stretching creates mechanical tension in the lengthened muscle position, triggering growth pathways independent of concentric lifting',

      execution: {
        load: '20-30% of working weight from Phase 3',
        duration: '30-60 seconds per hold',
        position: 'Deepest stretched position possible while maintaining safety',
        breathing: 'Steady, controlled breathing - do NOT hold breath',
        mindset: 'Focus on relaxing INTO the stretch, not fighting it'
      },

      exercisesByMuscleGroup: {
        chest: {
          exercise: 'Dumbbell Flyes (low incline)',
          position: 'Arms fully extended to sides, dumbbells below chest level',
          cues: ['Deep breath', 'Let dumbbells sink', 'Feel pec stretch across sternum'],
          load: '15-25 lb dumbbells (regardless of working weight)'
        },

        back: {
          exercise: 'Behind-Neck Lat Pulldown (wide grip)',
          position: 'Full hang with bar behind neck, lats fully stretched',
          cues: ['Relax shoulders', 'Sink into stretch', 'Feel lats lengthen'],
          load: '30-40% of working weight'
        },

        shoulders: {
          exercise: 'Cable Lateral Raise Hold',
          position: 'Arm across body, delt fully stretched',
          cues: ['Relax trap', 'Let arm sink across body', 'Feel rear/side delt stretch'],
          load: '10-20 lbs per arm'
        },

        biceps: {
          exercise: 'Incline Dumbbell Curl (stretched position)',
          position: 'Arms fully extended behind body on incline bench',
          cues: ['Full elbow extension', 'Feel biceps stretch at insertion', 'Relax grip slightly'],
          load: '15-25 lb dumbbells'
        },

        triceps: {
          exercise: 'Overhead Dumbbell Extension (bottom position)',
          position: 'Elbows fully bent, dumbbell behind head',
          cues: ['Deep elbow bend', 'Feel long head stretch', 'Keep elbows stable'],
          load: '20-40 lbs'
        },

        quadriceps: {
          exercise: 'Sissy Squat Hold (bottom position)',
          position: 'Knees maximally flexed, torso leaned back',
          cues: ['Full knee flexion', 'Feel rectus femoris stretch', 'Hold stable position'],
          load: 'Bodyweight or light plate (10-25 lbs)'
        },

        hamstrings: {
          exercise: 'Romanian Deadlift (bottom position hold)',
          position: 'Barbell at mid-shin, hips pushed back, knees slightly bent',
          cues: ['Feel hamstring stretch', 'Neutral spine', 'Push hips back'],
          load: '95-135 lbs (light barbell)'
        },

        calves: {
          exercise: 'Calf Raise (bottom stretch position)',
          position: 'Heels maximally dropped below toes on platform',
          cues: ['Deep ankle dorsiflexion', 'Feel gastrocnemius/soleus stretch', 'Relax into it'],
          load: 'Bodyweight or light weight (25-50 lbs)'
        }
      },

      scientificRationale: [
        'Mechanical tension in lengthened position triggers mTOR signaling',
        'May induce sarcomerogenesis (addition of sarcomeres in series)',
        'Possible hyperplasia (muscle fiber splitting) under chronic stretch',
        'Stretches muscle fascia, potentially increasing growth capacity',
        'Increases passive range of motion for better muscle development',
        'Enhances satellite cell activation at muscle insertions'
      ],

      safetyGuidelines: [
        'NEVER use heavy weight - this is NOT a strength exercise',
        'Stop immediately if sharp pain occurs',
        'Avoid loaded stretching if muscle is injured or inflamed',
        'Breathe continuously - do NOT hold breath',
        'Start with 30s holds, progress to 60s over weeks',
        'This is uncomfortable but should not be painful'
      ]
    }
  },

  progression: {
    priority: 'phase_based_progression',
    model: 'Multi-Phase Periodization with Exercise Rotation',
    timeline: '12-week blocks divided into 3 phases of 4 weeks each',

    phases: [
      {
        weeks: [1, 2, 3, 4],
        name: 'Accumulation Phase',
        focus: 'Volume accumulation, metabolic stress, technique mastery',
        phase2Load: '70-75% 1RM + chains/bands',
        phase3Volume: '4-5 sets per exercise with intensity techniques',
        exerciseRotation: 'Establish baseline exercises, master 4-phase sequence',
        progressionMethod: 'Add reps within rep ranges, add sets to Phase 3',
        deloadPolicy: 'NO deload - maintain intensity throughout 4 weeks'
      },
      {
        weeks: [5, 6, 7, 8],
        name: 'Intensification Phase',
        focus: 'Load progression, strength gains, higher mechanical tension',
        phase2Load: '75-85% 1RM + chains/bands',
        phase3Volume: '3-4 sets per exercise (reduce volume, increase load)',
        exerciseRotation: 'Change exercises to prevent adaptation, maintain movement patterns',
        progressionMethod: 'Increase loads in Phase 2, use heavier weights in Phase 3',
        deloadPolicy: 'NO deload - exercise rotation provides novel stimulus'
      },
      {
        weeks: [9, 10, 11, 12],
        name: 'Realization Phase',
        focus: 'Peak performance, maximum intensity techniques, metabolic overload',
        phase2Load: '80-85% 1RM + chains/bands',
        phase3Volume: '5-6 sets per exercise (maximum volume with techniques)',
        exerciseRotation: 'Introduce new exercise variations, maintain core movements',
        progressionMethod: 'Maximum intensity techniques in Phase 3 (triple drops, rest-pause to failure)',
        deloadPolicy: 'Optional deload after week 12 before starting new 12-week block'
      }
    ],

    weeklyProgression: {
      week1: {
        phase2: '70-75% 1RM, 3-4 sets of 5-6 reps',
        phase3: '4 sets, single drop set on final set',
        phase4: '30-45s loaded stretching holds'
      },
      week2: {
        phase2: '72-77% 1RM, 4 sets of 4-6 reps',
        phase3: '4-5 sets, double drop set on final set',
        phase4: '40-50s loaded stretching holds'
      },
      week3: {
        phase2: '75-80% 1RM, 4-5 sets of 3-5 reps',
        phase3: '5 sets, rest-pause on final 2 sets',
        phase4: '45-55s loaded stretching holds'
      },
      week4: {
        phase2: '75-82% 1RM, 5-6 sets of 3-6 reps',
        phase3: '5 sets, giant sets or mechanical drop sets',
        phase4: '50-60s loaded stretching holds (maximum duration)'
      }
    },

    exerciseRotationSchedule: {
      frequency: 'Every 3-4 weeks',
      rationale: 'Prevents adaptation, maintains training novelty, reduces overuse injury risk',
      rotationRules: [
        'Maintain movement patterns (horizontal push → horizontal push)',
        'Change equipment or angle (barbell bench → dumbbell bench → machine press)',
        'Keep Phase 2 explosive work familiar - master technique before rotating',
        'Rotate Phase 3 exercises more frequently for metabolic variety',
        'Phase 4 loaded stretching exercises remain consistent'
      ],
      examples: {
        chestHorizontalPush: {
          weeks1to4: 'Barbell bench press with chains',
          weeks5to8: 'Dumbbell bench press with bands',
          weeks9to12: 'Machine chest press with rest-pause'
        },
        backVerticalPull: {
          weeks1to4: 'Weighted pull-ups',
          weeks5to8: 'Lat pulldown (underhand grip)',
          weeks9to12: 'Assisted pull-ups (rest-pause style)'
        }
      }
    },

    deloadPhilosophy: {
      stance: 'ANTI-DELOAD for 6-12 weeks in advanced trainees',
      rationale: [
        'Exercise rotation provides novel stimulus without systemic fatigue',
        'Phase structure allows auto-regulation (Phase 2 performance indicates readiness)',
        'High-frequency training maintains protein synthesis without excessive damage',
        'Deloads interrupt momentum and metabolic adaptations'
      ],
      whenToDeload: [
        'After 12-week block completion (optional)',
        'If sleep quality deteriorates for 7+ consecutive days',
        'If Phase 2 explosive performance drops 10%+ for 2 consecutive weeks',
        'If injury/pain occurs',
        'NOT on a fixed schedule - only when indicators demand it'
      ],
      deloadImplementation: {
        duration: '3-5 days',
        method: 'Reduce volume by 50%, maintain loads, remove intensity techniques',
        phaseAdjustments: {
          phase1: 'Keep as normal - low stress',
          phase2: 'Reduce to 3 sets, maintain loads',
          phase3: 'Cut volume in half, NO intensity techniques',
          phase4: 'Reduce holds to 30s maximum'
        }
      }
    },

    autoRegulation: {
      phase2PerformanceIndicator: 'If bar speed on Phase 2 decreases, reduce Phase 3 volume',
      RPETargets: {
        phase1: 'RPE 5-6 (easy, activation only)',
        phase2: 'RPE 7-8 (explosive, not grinding)',
        phase3: 'RPE 9-10 (maximum effort with techniques)',
        phase4: 'N/A (hold to time, not effort)'
      },
      adjustmentRules: [
        'If Phase 2 feels heavy (RPE 9+), reduce Phase 3 sets by 1-2',
        'If sleep was poor (<6 hours), skip intensity techniques in Phase 3',
        'If joint pain present, replace Phase 2 with Phase 1-style activation work',
        'If bar speed is explosive, consider adding set to Phase 2'
      ]
    }
  },

  exerciseSelection: {
    principles: [
      '4-phase structure determines exercise selection MORE than muscle groups',
      'Phase 1: Isolation, machines, cables - FEEL over load',
      'Phase 2: Compound barbell movements suitable for chains/bands',
      'Phase 3: Machines, cables, dumbbells - safety during extreme fatigue',
      'Phase 4: Exercises allowing deep stretch under moderate load',
      'Exercise rotation every 3-4 weeks maintains novelty'
    ],

    phaseSpecificGuidelines: {
      phase1PreActivation: {
        criteria: [
          'Single-joint movements',
          'Constant tension (cables preferred)',
          'Easy to establish mind-muscle connection',
          'Low injury risk',
          'Can perform with controlled tempo'
        ],
        examples: {
          chest: ['Cable flyes', 'Pec deck', 'Machine flyes'],
          back: ['Cable pullovers', 'Machine rows (light)', 'Face pulls'],
          shoulders: ['Cable lateral raises', 'Reverse pec deck', 'Band pull-aparts'],
          arms: ['Cable curls', 'Cable pushdowns', 'Machine curls'],
          legs: ['Leg extensions', 'Leg curls', 'Calf raises']
        }
      },

      phase2Explosive: {
        criteria: [
          'Compound multi-joint movements',
          'Compatible with chains or bands',
          'Allows explosive concentric',
          'Stable bar path',
          'Movements you can perform with excellent technique under fatigue'
        ],
        examples: {
          chest: ['Barbell bench press + chains', 'Dumbbell bench press + bands', 'Incline barbell press + chains'],
          back: ['Barbell rows + chains', 'Rack pulls + chains', 'Weighted pull-ups + bands'],
          shoulders: ['Barbell overhead press + chains', 'Viking press + bands', 'Landmine press'],
          legs: ['Barbell squats + chains', 'Safety bar squats + bands', 'Deadlifts + chains']
        },
        accommodatingResistanceSetup: {
          chains: 'Hang chains so 50% of links are on ground at bottom, 0% at lockout',
          bands: 'Anchor bands to create 20-30% additional resistance at lockout',
          alternative: 'If no chains/bands: use pause reps (2s pause at bottom) or tempo variations (3-1-1-0)'
        }
      },

      phase3SupramaxPump: {
        criteria: [
          'Safe to perform in extreme fatigue',
          'Allows quick weight changes (for drop sets)',
          'Constant tension throughout ROM',
          'Machine or cable-based preferred',
          'Can perform to absolute failure safely'
        ],
        examples: {
          chest: ['Hammer strength chest press', 'Cable flyes', 'Pec deck', 'Smith machine press'],
          back: ['Hammer strength row', 'Cable rows', 'Lat pulldown machine', 'T-bar row machine'],
          shoulders: ['Machine shoulder press', 'Cable lateral raises', 'Machine reverse flyes', 'Dumbbell lateral raises'],
          arms: ['Cable curls', 'Machine curls', 'Cable pushdowns', 'Overhead cable extensions'],
          legs: ['Leg press', 'Hack squat machine', 'Leg extensions', 'Lying leg curls', 'Seated calf raises']
        },
        intensityTechniqueRecommendations: {
          dropSets: 'Reduce weight by 30-40% after failure, continue to failure again (2-3 drops)',
          restPause: 'To failure, rest 15s, continue to failure, rest 15s, final set to failure',
          giantSets: '3-4 exercises back-to-back with no rest, targeting same muscle group',
          mechanicalDropSets: 'Change exercise variation to easier version (decline press → flat → incline)'
        }
      },

      phase4LoadedStretching: {
        criteria: [
          'Allows deep muscle stretch in bottom position',
          'Can hold isometrically for 30-60s safely',
          'Moderate load (20-30% of working weight)',
          'Stretch position is stable and maintainable',
          'Targets muscle at insertion points'
        ],
        exercises: {
          chest: 'Dumbbell flyes (low incline, arms wide)',
          lats: 'Behind-neck lat pulldown (full hang)',
          shoulders: 'Cable lateral raise hold (across body)',
          biceps: 'Incline dumbbell curl (bottom position, arms behind torso)',
          triceps: 'Overhead dumbbell extension (bottom position)',
          quads: 'Sissy squat hold (bottom position)',
          hamstrings: 'Romanian deadlift (bottom position)',
          calves: 'Calf raise (bottom stretch)'
        }
      }
    },

    movementPatternsByPhase: {
      chestDay: {
        phase1: 'Cable flyes (pre-activation)',
        phase2: 'Barbell bench press + chains (explosive)',
        phase3: 'Machine chest press (supramax pump with drop sets)',
        phase4: 'Dumbbell flyes hold (loaded stretching)'
      },

      backDay: {
        phase1: 'Cable pullovers (pre-activation)',
        phase2: 'Barbell rows + chains (explosive)',
        phase3: 'Hammer strength row (supramax pump with rest-pause)',
        phase4: 'Behind-neck lat pulldown hold (loaded stretching)'
      },

      shoulderDay: {
        phase1: 'Cable lateral raises (pre-activation)',
        phase2: 'Barbell overhead press + chains (explosive)',
        phase3: 'Machine shoulder press (supramax pump with giant set)',
        phase4: 'Cable lateral raise stretch hold (loaded stretching)'
      },

      legDay: {
        phase1: 'Leg extensions (pre-activation)',
        phase2: 'Barbell squats + chains (explosive)',
        phase3: 'Leg press (supramax pump with rest-pause)',
        phase4: 'Sissy squat hold + Romanian deadlift hold (loaded stretching)'
      },

      armDay: {
        phase1: 'Cable curls + cable pushdowns (pre-activation)',
        phase2: 'Close-grip bench press + barbell curls (explosive, NO chains on arms)',
        phase3: 'Cable curls + cable pushdowns (supramax pump with drop sets)',
        phase4: 'Incline curl hold + overhead extension hold (loaded stretching)'
      }
    }
  },

  rationales: {
    volumeLandmarks: `Mountain Dog Training uses PHASE-BASED volume distribution rather than traditional set counting. Total volume is HIGH (12-20+ sets per muscle per week for advanced), but it's intelligently distributed across the 4-phase structure to maximize different growth mechanisms while managing fatigue.

VOLUME DISTRIBUTION BY PHASE:
- Phase 1 (Pre-Activation): 6-9 sets per muscle per week (LOW intensity, activation only)
- Phase 2 (Explosive): 9-15 sets per muscle per week (HIGH intensity, moderate volume)
- Phase 3 (Supramax Pump): 9-18 sets per muscle per week (MAXIMUM volume with techniques)
- Phase 4 (Loaded Stretching): 2-4 holds per muscle per week (time-based, not set-based)

TOTAL WEEKLY VOLUME: 26-46 "hard sets" per muscle group for advanced trainees
(This includes extended sets via drops, rest-pause, etc.)

RATIONALE FOR HIGH VOLUME:
1. Metabolic stress (Phase 3) requires high volume to accumulate damage
2. Exercise variation prevents repetitive stress injuries despite high volume
3. Different phases target different hypertrophy mechanisms (mechanical, metabolic, passive tension)
4. NO deload philosophy requires sustainable volume distribution

BEGINNER VS ADVANCED:
- Beginners: 12-15 total sets per muscle per week (reduce Phase 3 volume)
- Intermediate: 15-20 total sets per muscle per week
- Advanced: 20-30+ total sets per muscle per week (includes extended sets from techniques)`,

    frequencyGuidelines: `Mountain Dog Training uses MODERATE to HIGH frequency (each muscle 2x per week) to maintain elevated protein synthesis while allowing recovery between sessions. The 4-phase structure is fatigue-managed, enabling higher frequency than traditional high-volume approaches.

RECOMMENDED FREQUENCY:
- Major muscle groups (chest, back, legs): 2x per week
- Smaller muscle groups (shoulders, arms): 2-3x per week
- Each session uses the full 4-phase structure

SAMPLE WEEKLY SPLIT (6 days/week):
Day 1: Chest + Triceps
Day 2: Back + Biceps
Day 3: Legs (Quad focus)
Day 4: Shoulders + Rear Delts
Day 5: Chest + Back (different exercises)
Day 6: Legs (Hamstring/Glute focus) + Arms
Day 7: OFF

RATIONALE FOR 2X FREQUENCY:
1. Protein synthesis returns to baseline after 48-72 hours
2. Exercise rotation every session prevents repetitive stress
3. Phase structure allows high volume without excessive systemic fatigue
4. More frequent stimulus = more growth opportunities per week

FREQUENCY ADJUSTMENT BY TRAINING AGE:
- Beginners: 1-2x per muscle per week (focus on mastering 4-phase technique)
- Intermediate: 2x per muscle per week (standard Mountain Dog approach)
- Advanced: 2-3x per muscle per week (add "mini-sessions" with Phases 1+4 only)

RECOVERY INDICATORS:
- If Phase 2 bar speed decreases, reduce frequency to 1-2x per week temporarily
- If sleep quality suffers, reduce to 5 days/week instead of 6
- If joint pain emerges, reduce frequency and increase exercise rotation`,

    advancedTechniques: `Mountain Dog Training is DEFINED by advanced intensity techniques - they are not optional add-ons but core components of the methodology. Each phase has designated techniques that align with its physiological purpose.

PHASE-SPECIFIC TECHNIQUES:

PHASE 1 (Pre-Activation):
- Slow Eccentrics (3-4 second lowering)
- Pause Reps (2-3 second pause at stretch)
- Partial Reps (bottom half ROM for maximum stretch)
- Purpose: Establish mind-muscle connection, activate target muscle

PHASE 2 (Explosive):
- Chains (ascending resistance matching strength curve)
- Bands (overspeed eccentrics, elastic assistance)
- Pause Reps at Bottom (eliminate stretch reflex, pure concentric power)
- Speed Work (50-60% 1RM, maximum bar speed)
- Purpose: CNS activation, rate of force development, fast-twitch recruitment

PHASE 3 (Supramax Pump):
- Drop Sets (2-3 drops, reduce weight 30-40% each drop)
- Rest-Pause (to failure, rest 15s, repeat 2-3 times)
- Giant Sets (3-4 exercises back-to-back, same muscle)
- Mechanical Drop Sets (change exercise to easier variation)
- Loaded Carries Between Sets (weighted holds during rest periods)
- Purpose: Maximum metabolic stress, cell swelling, lactate accumulation

PHASE 4 (Loaded Stretching):
- Isometric Holds in Stretched Position (30-60s)
- Weighted Stretches (moderate load, deep ROM)
- Purpose: Mechanotransduction, fascia stretching, satellite cell activation

TECHNIQUE PROGRESSION:
Week 1: Single drop sets in Phase 3
Week 2: Double drop sets in Phase 3
Week 3: Rest-pause sets in Phase 3
Week 4: Giant sets or mechanical drop sets in Phase 3

CRITICAL SAFETY RULES:
- NEVER use chains/bands in Phase 3 (too dangerous when fatigued)
- NEVER use heavy loads in Phase 4 (moderate weight only)
- Stop technique immediately if form breaks down
- Advanced techniques are for Phase 3 only (except chains/bands in Phase 2)`,

    splitVariations: `Mountain Dog Training is highly flexible in split structure but ALWAYS maintains the 4-phase workout architecture. The split can be adjusted based on training frequency, recovery capacity, and individual goals.

RECOMMENDED SPLITS:

OPTION 1: CLASSIC PUSH/PULL/LEGS (6 days/week)
Day 1: Push (Chest/Shoulders/Triceps)
Day 2: Pull (Back/Biceps/Rear Delts)
Day 3: Legs (Quads/Hamstrings/Calves)
Day 4: Push (different exercises)
Day 5: Pull (different exercises)
Day 6: Legs (different emphasis)
Day 7: OFF
- Best for: Advanced trainees, high recovery capacity
- Frequency: Each muscle 2x per week

OPTION 2: UPPER/LOWER (4 days/week)
Day 1: Upper A (Chest/Back focus)
Day 2: Lower A (Quad/Glute focus)
Day 3: OFF
Day 4: Upper B (Shoulders/Arms focus)
Day 5: Lower B (Hamstring/Calf focus)
Day 6: OFF
Day 7: OFF
- Best for: Intermediate trainees, limited training time
- Frequency: Each muscle 2x per week

OPTION 3: BODY PART SPLIT (5-6 days/week)
Day 1: Chest + Triceps
Day 2: Back + Biceps
Day 3: OFF
Day 4: Shoulders + Rear Delts
Day 5: Legs
Day 6: Arms (Biceps/Triceps)
Day 7: OFF
- Best for: Bodybuilders, focus on weak points
- Frequency: Each muscle 1-2x per week

OPTION 4: HIGH-FREQUENCY (6 days/week)
Each muscle 3x per week using abbreviated 4-phase sessions
- Session 1: Full 4-phase workout
- Session 2: Phases 1+3 only (pump work)
- Session 3: Phases 2+4 only (strength + stretch)
- Best for: Advanced trainees with excellent recovery

SPLIT SELECTION CRITERIA:
- Training age: Beginners need less frequency (3-4 days), advanced can handle more (5-6 days)
- Recovery capacity: Poor sleep/high stress = lower frequency splits
- Time availability: Limited time = upper/lower split
- Goals: Hypertrophy focus = body part split, strength + hypertrophy = push/pull/legs`,

    periodization: `Mountain Dog Training uses NON-LINEAR PERIODIZATION within a 12-week block structure. Unlike traditional linear periodization (progress from high volume/low intensity → low volume/high intensity), Mountain Dog maintains HIGH intensity throughout but varies volume, exercise selection, and technique application.

12-WEEK BLOCK STRUCTURE:

WEEKS 1-4: ACCUMULATION PHASE
- Focus: Volume accumulation, technique mastery, baseline establishment
- Phase 2 Load: 70-75% 1RM + chains/bands
- Phase 3 Volume: 4-5 sets with single drop sets
- Exercise Rotation: Establish baseline exercises
- Deload: NONE

WEEKS 5-8: INTENSIFICATION PHASE
- Focus: Load progression, strength gains, exercise rotation
- Phase 2 Load: 75-85% 1RM + chains/bands (increase loads)
- Phase 3 Volume: 3-4 sets (reduce volume, increase load on pumping exercises)
- Exercise Rotation: NEW exercises to prevent adaptation
- Deload: NONE

WEEKS 9-12: REALIZATION PHASE
- Focus: Maximum intensity techniques, metabolic overload
- Phase 2 Load: 80-85% 1RM + chains/bands (peak loads)
- Phase 3 Volume: 5-6 sets with triple drops, rest-pause, giant sets (maximum volume + techniques)
- Exercise Rotation: Introduce advanced exercise variations
- Deload: Optional after Week 12 before starting new block

DAILY UNDULATION (within each workout):
- Phase 1: LOW intensity (RPE 5-6)
- Phase 2: HIGH intensity (RPE 7-8)
- Phase 3: MAXIMUM intensity (RPE 9-10)
- Phase 4: MODERATE intensity (time-based)

This creates a "wave" of intensity within each session, managing fatigue while maximizing stimulus.

EXERCISE ROTATION PERIODIZATION:
- Weeks 1-4: Master baseline exercises
- Weeks 5-8: Rotate to new variations (barbell → dumbbell → machine)
- Weeks 9-12: Advanced variations requiring high skill

DELOAD PHILOSOPHY:
- Mountain Dog Training OPPOSES scheduled deloads
- Recovery managed through exercise rotation, NOT volume reduction
- Deload ONLY when performance indicators decline (Phase 2 bar speed, sleep quality, joint pain)
- If deload needed: 3-5 days of 50% volume, maintain loads, remove intensity techniques`
  },

  volumeLandmarks: {
    beginner: {
      setsPerMusclePerWeek: [10, 15],
      totalWeeklySets: '10-15 hard sets per muscle group',
      phaseDistribution: {
        phase1: '2 sets per session',
        phase2: '3-4 sets per session',
        phase3: '3 sets per session (minimal intensity techniques)',
        phase4: '1 hold per muscle per session (30s duration)'
      },
      workoutFrequency: '4 days/week',
      recommendedSplit: 'Upper/Lower',
      notes: [
        'Focus on mastering 4-phase structure',
        'Use only single drop sets in Phase 3',
        'Avoid rest-pause and giant sets until intermediate',
        'Prioritize technique over load in Phase 2'
      ]
    },

    intermediate: {
      setsPerMusclePerWeek: [15, 22],
      totalWeeklySets: '15-22 hard sets per muscle group',
      phaseDistribution: {
        phase1: '2-3 sets per session',
        phase2: '4-5 sets per session',
        phase3: '4 sets per session (double drop sets)',
        phase4: '1-2 holds per muscle per session (45s duration)'
      },
      workoutFrequency: '5 days/week',
      recommendedSplit: 'Push/Pull/Legs or Body Part Split',
      notes: [
        'Introduce rest-pause sets in Phase 3',
        'Begin using chains/bands in Phase 2',
        'Exercise rotation every 3-4 weeks',
        'Monitor Phase 2 bar speed for fatigue'
      ]
    },

    advanced: {
      setsPerMusclePerWeek: [20, 30],
      totalWeeklySets: '20-30+ hard sets per muscle group (includes extended sets)',
      phaseDistribution: {
        phase1: '3 sets per session',
        phase2: '5-6 sets per session',
        phase3: '5-6 sets per session (triple drops, rest-pause, giant sets)',
        phase4: '2 holds per muscle per session (60s duration)'
      },
      workoutFrequency: '6 days/week',
      recommendedSplit: 'Push/Pull/Legs (2x per week) or High-Frequency Body Part',
      notes: [
        'Maximum intensity techniques in Phase 3',
        'Chains/bands mandatory in Phase 2',
        'Exercise rotation every 2-3 weeks',
        'NO deload for 8-12 weeks',
        'Auto-regulate Phase 3 volume based on Phase 2 performance'
      ]
    },

    muscleGroups: {
      chest: {
        mev: 10,
        mav: 18,
        mrv: 28
      },
      back: {
        mev: 12,
        mav: 20,
        mrv: 32
      },
      shoulders: {
        mev: 8,
        mav: 14,
        mrv: 24
      },
      biceps: {
        mev: 8,
        mav: 15,
        mrv: 28
      },
      triceps: {
        mev: 8,
        mav: 15,
        mrv: 28
      },
      quads: {
        mev: 10,
        mav: 20,
        mrv: 36
      },
      hamstrings: {
        mev: 10,
        mav: 20,
        mrv: 36
      },
      glutes: {
        mev: 8,
        mav: 16,
        mrv: 30
      },
      calves: {
        mev: 6,
        mav: 12,
        mrv: 20
      }
    },

    muscleGroupSpecific: {
      chest: {
        beginner: '10-12 sets/week',
        intermediate: '16-20 sets/week',
        advanced: '22-28 sets/week',
        notes: 'Includes pre-activation, explosive, pump, and loaded stretching sets'
      },
      back: {
        beginner: '12-15 sets/week',
        intermediate: '18-22 sets/week',
        advanced: '24-32 sets/week',
        notes: 'Back can handle higher volume due to multiple muscle groups (lats, traps, rhomboids)'
      },
      shoulders: {
        beginner: '8-10 sets/week',
        intermediate: '12-16 sets/week',
        advanced: '18-24 sets/week',
        notes: 'Lower volume due to involvement in chest/back training'
      },
      arms: {
        beginner: '8-12 sets/week per muscle',
        intermediate: '12-18 sets/week per muscle',
        advanced: '20-28 sets/week per muscle',
        notes: 'Arms recover quickly, can handle high frequency'
      },
      legs: {
        beginner: '10-14 sets/week per muscle',
        intermediate: '16-24 sets/week per muscle',
        advanced: '24-36 sets/week per muscle',
        notes: 'Legs require and can tolerate highest volume'
      }
    }
  },

  frequencyGuidelines: {
    minimumEffective: {
      frequency: '2x per muscle per week',
      rationale: 'Protein synthesis returns to baseline after 48-72 hours; 2x frequency maintains elevated MPS throughout the week',
      splitExample: 'Push/Pull/Legs repeated twice per week (6 training days)'
    },

    optimal: {
      frequency: '2x per muscle per week with varied exercise selection',
      rationale: 'Allows exercise rotation within the same week, maximizing stimulus variety while managing fatigue',
      splitExample: 'Day 1: Chest/Tri (Barbell focus), Day 4: Chest/Tri (Dumbbell/Machine focus)'
    },

    maximum: {
      frequency: '3x per muscle per week for advanced trainees only',
      rationale: 'One full 4-phase session + two abbreviated sessions (Phases 1+3 or 2+4 only)',
      splitExample: 'Full chest workout Mon, Mini pump session Wed (Phases 1+3), Strength+stretch Fri (Phases 2+4)',
      warning: 'Requires excellent recovery, advanced technique, NOT recommended for most trainees'
    },

    sessionSpacing: {
      minimum: '48 hours between training same muscle',
      optimal: '72-96 hours between full 4-phase sessions for same muscle',
      rationale: 'Phase 3 (Supramax Pump) creates significant muscle damage requiring 3-4 days full recovery'
    },

    frequencyByMuscleGroup: {
      chest: '2x per week (separated by 3-4 days)',
      back: '2x per week (can handle higher frequency due to multiple muscle groups)',
      shoulders: '2-3x per week (involved in chest/back training, respond well to frequency)',
      arms: '2-3x per week (small muscles, recover quickly)',
      legs: '2x per week (require more recovery time due to high systemic fatigue)',
      calves: '3-4x per week (high frequency, moderate volume per session)'
    },

    autoregulationGuidelines: [
      'If Phase 2 bar speed is slow, reduce frequency temporarily (skip one session)',
      'If joint pain emerges, reduce frequency and increase recovery days',
      'If sleep quality is poor (<6 hours for 3+ nights), reduce to minimum effective frequency',
      'If strength is increasing in Phase 2, frequency is appropriate',
      'If Phase 3 performance suffers (cannot complete intensity techniques), extend recovery between sessions'
    ]
  },

  advancedTechniques: {
    chains: {
      description: 'Chains create ascending resistance - weight increases as you lift (more chain links leave the ground)',
      when: 'Phase 2 (Explosive Work)',
      protocol: '70-85% 1RM + chains, 3-6 reps, 3-6 sets',
      frequency: 'Use in every Phase 2 workout',
      bestPhase: 'Phase 2 (Explosive Work)',
      exercises: ['Bench press', 'Squats', 'Deadlifts', 'Overhead press', 'Rows'],
      setup: 'Chain weight should be 10-20% of bar weight at lockout, decreasing to 0% at bottom position',
      programming: '70-85% 1RM + chains, 3-6 reps, 3-6 sets',
      benefits: [
        'Matches natural strength curve',
        'Maximum tension at strongest position (lockout)',
        'Reduces joint stress at weakest position (bottom)',
        'Teaches explosive acceleration'
      ]
    },

    bands: {
      description: 'Elastic bands create variable resistance and overspeed eccentrics',
      when: 'Phase 2 (Explosive Work)',
      protocol: '70-85% 1RM + bands, 3-6 reps, 3-6 sets',
      frequency: 'Use in every Phase 2 workout',
      bestPhase: 'Phase 2 (Explosive Work)',
      exercises: ['Bench press', 'Squats', 'Deadlifts', 'Rows'],
      setup: 'Band tension should add 20-30% resistance at lockout',
      programming: '70-85% 1RM + bands, 3-6 reps, 3-6 sets',
      benefits: [
        'Accelerates eccentric phase',
        'Forces explosive concentric',
        'Increases rate of force development',
        'Teaches speed under tension'
      ]
    },

    drop_set: {
      description: 'Reduce weight after reaching failure, continue to failure again (2-3 drops)',
      when: 'Phase 3 (Supramax Pump)',
      protocol: 'Initial set to failure, reduce weight 30-40%, continue to failure, repeat',
      frequency: 'Use on final 1-2 sets of Phase 3 exercises',
      bestPhase: 'Phase 3 (Supramax Pump)',
      exercises: 'Machine and cable exercises where weight changes are quick',
      setup: 'Initial set to failure, reduce weight 30-40%, continue to failure, repeat',
      programming: 'Final 1-2 sets of Phase 3 exercises',
      benefits: [
        'Extends time under tension',
        'Massive metabolic stress',
        'Complete muscle fiber recruitment',
        'Cell swelling and lactate accumulation'
      ],
      variations: {
        double: 'Initial set + 2 drops (3 total failure points)',
        triple: 'Initial set + 3 drops (4 total failure points) - advanced only',
        running: '6-10 small drops (10% each) performed rapidly'
      }
    },

    rest_pause: {
      description: 'Set to failure, rest 15 seconds, continue to failure, repeat 2-3 times',
      when: 'Phase 3 (Supramax Pump)',
      protocol: 'Initial set to failure (8-12 reps), rest 15s, max reps (3-5), rest 15s, max reps (1-3)',
      frequency: 'Use on final set of Phase 3 exercises',
      bestPhase: 'Phase 3 (Supramax Pump)',
      exercises: 'Any exercise, but safer on machines during extreme fatigue',
      setup: 'Initial set to failure (8-12 reps), rest 15s, max reps (3-5), rest 15s, max reps (1-3)',
      programming: 'Final set of Phase 3 exercises',
      benefits: [
        'Accumulates metabolic byproducts',
        'Maintains high mechanical tension',
        'Exceeds normal volume capacity',
        'Maximum muscle fiber recruitment'
      ]
    },

    giant_set: {
      description: '3-4 exercises for same muscle group performed back-to-back with no rest',
      when: 'Phase 3 (Supramax Pump)',
      protocol: 'Exercise 1 to failure → immediately Exercise 2 to failure → Exercise 3 → Exercise 4, then rest',
      frequency: 'Use in Week 4 of each phase as peak metabolic stress',
      bestPhase: 'Phase 3 (Supramax Pump)',
      exercises: 'Combination of compound + isolation, different angles',
      setup: 'Exercise 1 to failure → immediately Exercise 2 to failure → Exercise 3 → Exercise 4, then rest',
      programming: 'Used in Week 4 of each phase as peak metabolic stress',
      benefits: [
        'Extreme metabolic stress',
        'Complete muscle fiber recruitment from multiple angles',
        'Massive cell swelling',
        'Time-efficient volume accumulation'
      ],
      example: {
        chest: 'Hammer strength press → Cable flyes → Pec deck → Push-ups to failure',
        back: 'Lat pulldown → Cable row → Straight-arm pulldown → Band pull-aparts'
      }
    },

    mechanical_drop_set: {
      description: 'Change to an easier exercise variation when reaching failure (same weight)',
      when: 'Phase 3 (Supramax Pump)',
      protocol: 'Start with hardest variation to failure, immediately switch to easier variation, continue to failure',
      frequency: 'Use on final set of Phase 3 exercises',
      bestPhase: 'Phase 3 (Supramax Pump)',
      exercises: 'Exercises with clear biomechanical advantage progressions',
      setup: 'Start with hardest variation to failure, immediately switch to easier variation, continue to failure',
      programming: 'Final set of Phase 3 exercises',
      examples: {
        chest: 'Decline press (hardest) → Flat press → Incline press (easiest)',
        shoulders: 'Behind-neck press → Front press → Push press',
        rows: 'Overhand barbell row → Underhand row → Chest-supported row'
      }
    },

    loaded_stretching: {
      description: 'Hold stretched position under moderate load for 30-60 seconds',
      when: 'Phase 4 (Loaded Stretching) - MANDATORY in every workout',
      protocol: '20-30% of working weight, hold deepest stretched position for 30-60 seconds',
      frequency: 'EVERY workout, final phase, 1-2 holds per muscle trained',
      bestPhase: 'Phase 4 (Loaded Stretching) - MANDATORY, not optional',
      exercises: 'Exercises allowing deep stretch: flyes, pullovers, curls, extensions, RDLs',
      setup: '20-30% of working weight, hold deepest stretched position for time',
      programming: 'EVERY workout, final phase, 1-2 holds per muscle trained',
      benefits: [
        'Mechanotransduction (mTOR activation)',
        'Potential hyperplasia (fiber splitting)',
        'Fascia stretching',
        'Satellite cell activation',
        'Increased sarcomere length'
      ],
      criticalNotes: [
        'NOT optional - this is a core Mountain Dog principle',
        'Use LIGHT weight - focus on stretch, not load',
        'Breathe continuously, relax into stretch',
        '30s minimum, 60s maximum hold duration',
        'Stop if sharp pain occurs'
      ]
    },

    tempoVariations: {
      description: 'Manipulate rep tempo to increase time under tension',
      when: 'Phase 1 (Pre-Activation) or Phase 3 (Supramax Pump)',
      protocol: 'Slow eccentric (4-5s lowering) or pause reps (2-3s pause at stretch)',
      frequency: 'Use in Phase 1 for activation or Phase 3 for metabolic stress',
      bestPhase: 'Phase 1 (Pre-Activation) or Phase 3 (Supramax Pump)',
      tempos: {
        slowEccentric: '4-5 second lowering, normal concentric (4-1-1-0)',
        pauseReps: 'Normal tempo with 2-3 second pause at stretch (2-3-1-0)',
        superSlow: '5 second eccentric, 5 second concentric (5-0-5-0)'
      },
      programming: 'Phase 1 for activation, Phase 3 for metabolic stress',
      benefits: [
        'Enhanced mind-muscle connection',
        'Increased time under tension',
        'Greater metabolic stress',
        'Improved control and technique'
      ]
    }
  },

  splitVariations: [
    {
      name: 'Classic Push/Pull/Legs (6 days)',
      schedule: {
        day1: { focus: 'Push A', muscles: ['Chest', 'Shoulders', 'Triceps'], phases: 'All 4 phases' },
        day2: { focus: 'Pull A', muscles: ['Back', 'Biceps', 'Rear Delts'], phases: 'All 4 phases' },
        day3: { focus: 'Legs A', muscles: ['Quads', 'Hamstrings', 'Calves'], phases: 'All 4 phases' },
        day4: { focus: 'Push B', muscles: ['Chest', 'Shoulders', 'Triceps'], phases: 'All 4 phases (different exercises)' },
        day5: { focus: 'Pull B', muscles: ['Back', 'Biceps', 'Rear Delts'], phases: 'All 4 phases (different exercises)' },
        day6: { focus: 'Legs B', muscles: ['Quads', 'Hamstrings', 'Calves'], phases: 'All 4 phases (different exercises)' },
        day7: { focus: 'Rest', muscles: [], phases: '' }
      },
      frequency: 'Each muscle 2x per week',
      bestFor: 'Advanced trainees with high recovery capacity',
      pros: ['Maximum frequency', 'Optimal protein synthesis', 'Exercise variety'],
      cons: ['Requires 6 training days', 'High systemic fatigue', 'Demands excellent recovery']
    },
    {
      name: 'Upper/Lower (4 days)',
      schedule: {
        day1: { focus: 'Upper A', muscles: ['Chest', 'Back'], phases: 'All 4 phases' },
        day2: { focus: 'Lower A', muscles: ['Quads', 'Glutes', 'Calves'], phases: 'All 4 phases' },
        day3: { focus: 'Rest', muscles: [], phases: '' },
        day4: { focus: 'Upper B', muscles: ['Shoulders', 'Arms'], phases: 'All 4 phases' },
        day5: { focus: 'Lower B', muscles: ['Hamstrings', 'Glutes', 'Calves'], phases: 'All 4 phases' },
        day6: { focus: 'Rest', muscles: [], phases: '' },
        day7: { focus: 'Rest', muscles: [], phases: '' }
      },
      frequency: 'Each muscle 2x per week',
      bestFor: 'Intermediate trainees or those with time constraints',
      pros: ['Only 4 training days', 'Adequate frequency', 'More recovery days'],
      cons: ['Long sessions', 'Less exercise variety per muscle', 'Lower weekly volume ceiling']
    },
    {
      name: 'Body Part Split (5-6 days)',
      schedule: {
        day1: { focus: 'Chest + Triceps', muscles: ['Chest', 'Triceps'], phases: 'All 4 phases' },
        day2: { focus: 'Back + Biceps', muscles: ['Back', 'Biceps'], phases: 'All 4 phases' },
        day3: { focus: 'Rest', muscles: [], phases: '' },
        day4: { focus: 'Shoulders + Rear Delts', muscles: ['Shoulders', 'Rear Delts'], phases: 'All 4 phases' },
        day5: { focus: 'Legs', muscles: ['Quads', 'Hamstrings', 'Calves'], phases: 'All 4 phases' },
        day6: { focus: 'Arms', muscles: ['Biceps', 'Triceps'], phases: 'All 4 phases' },
        day7: { focus: 'Rest or Repeat', muscles: [], phases: '' }
      },
      frequency: 'Each muscle 1-2x per week',
      bestFor: 'Bodybuilders focused on muscle group specialization',
      pros: ['Maximum focus per muscle', 'High volume per session', 'Can target weak points'],
      cons: ['Lower frequency', 'Requires 5-6 days', 'Less optimal for strength']
    },
    {
      name: 'High-Frequency (6 days)',
      schedule: {
        day1: { focus: 'Chest Full', muscles: ['Chest'], phases: 'All 4 phases' },
        day2: { focus: 'Back Full', muscles: ['Back'], phases: 'All 4 phases' },
        day3: { focus: 'Legs Full', muscles: ['Legs'], phases: 'All 4 phases' },
        day4: { focus: 'Chest Mini', muscles: ['Chest'], phases: 'Phases 1+3 only (pump)' },
        day5: { focus: 'Back Mini', muscles: ['Back'], phases: 'Phases 1+3 only (pump)' },
        day6: { focus: 'Arms + Shoulders', muscles: ['Arms', 'Shoulders'], phases: 'All 4 phases' },
        day7: { focus: 'Rest', muscles: [], phases: '' }
      },
      frequency: 'Major muscles 2-3x per week',
      bestFor: 'Advanced trainees with excellent recovery and technique mastery',
      pros: ['Maximum frequency', 'Constant protein synthesis elevation', 'Volume distributed across week'],
      cons: ['Very demanding', 'Requires auto-regulation', 'Easy to overtrain', 'NOT for beginners/intermediates']
    }
  ],

  periodization: {
    model: 'Non-Linear Block Periodization with Exercise Rotation',
    blockLength: '12 weeks',

    phases: [
      {
        name: 'Accumulation',
        weeks: [1, 2, 3, 4],
        focus: 'Volume accumulation, technique mastery, baseline establishment',
        phase2Load: '70-75% 1RM + chains/bands',
        phase2Sets: '3-4 sets',
        phase3Volume: '4-5 sets per exercise',
        phase3Techniques: 'Single drop sets only',
        phase4Duration: '30-45s holds',
        exerciseRotation: 'Establish baseline exercises, master 4-phase execution',
        deload: 'NONE',
        weeklyProgression: {
          week1: 'Establish baselines, focus on technique',
          week2: 'Add 1 set to Phase 3, increase loads 5%',
          week3: 'Introduce double drop sets in Phase 3',
          week4: 'Peak volume for this block, maximize pump work'
        }
      },
      {
        name: 'Intensification',
        weeks: [5, 6, 7, 8],
        focus: 'Load progression, strength development, exercise rotation',
        phase2Load: '75-85% 1RM + chains/bands',
        phase2Sets: '4-5 sets',
        phase3Volume: '3-4 sets per exercise (reduce volume, increase load)',
        phase3Techniques: 'Rest-pause sets',
        phase4Duration: '45-55s holds',
        exerciseRotation: 'NEW exercises every 3-4 weeks to prevent adaptation',
        deload: 'NONE (exercise rotation provides recovery)',
        weeklyProgression: {
          week5: 'Rotate exercises, reduce Phase 3 volume, increase loads',
          week6: 'Add sets to Phase 2, maintain higher loads',
          week7: 'Introduce rest-pause in Phase 3',
          week8: 'Peak loads in Phase 2 for this block'
        }
      },
      {
        name: 'Realization',
        weeks: [9, 10, 11, 12],
        focus: 'Maximum intensity techniques, metabolic overload, peak performance',
        phase2Load: '80-85% 1RM + chains/bands',
        phase2Sets: '5-6 sets',
        phase3Volume: '5-6 sets per exercise (maximum volume + techniques)',
        phase3Techniques: 'Triple drop sets, rest-pause, giant sets',
        phase4Duration: '50-60s holds (maximum)',
        exerciseRotation: 'Advanced exercise variations',
        deload: 'OPTIONAL after week 12 before new block',
        weeklyProgression: {
          week9: 'Maintain high loads, increase Phase 3 volume',
          week10: 'Introduce giant sets in Phase 3',
          week11: 'Maximum intensity techniques (triple drops, rest-pause)',
          week12: 'Peak week - maximum loads, volume, techniques'
        }
      }
    ],

    exerciseRotationSchedule: {
      frequency: 'Every 3-4 weeks',
      rationale: 'Prevents adaptation plateaus, reduces overuse injury risk, maintains training novelty',
      rotationStrategy: {
        maintainPatterns: 'Keep movement patterns (horizontal push stays horizontal push)',
        changeImplementation: 'Rotate equipment/angle (barbell → dumbbell → machine)',
        exampleChest: {
          weeks1to4: 'Barbell bench press + chains',
          weeks5to8: 'Dumbbell bench press + bands',
          weeks9to12: 'Machine chest press (high load, rest-pause)'
        }
      }
    },

    deloadStrategy: {
      stance: 'ANTI-DELOAD - NO scheduled deloads for 6-12 weeks',
      rationale: [
        'Exercise rotation provides novel stimulus without fatigue accumulation',
        'Phase structure auto-regulates intensity (Phase 2 performance indicates readiness)',
        'High-frequency approach prevents excessive damage from any single session',
        'Deloads interrupt metabolic adaptations and momentum'
      ],
      whenToDeload: [
        'After 12-week block completion (optional 3-5 day deload)',
        'Sleep quality deteriorates for 7+ consecutive days',
        'Phase 2 bar speed drops 10%+ for 2 consecutive weeks',
        'Joint pain or injury emerges',
        'Life stress is extremely high (work, family, etc.)'
      ],
      deloadImplementation: {
        duration: '3-5 days',
        method: 'Reduce volume by 50%, maintain loads, remove all intensity techniques',
        phaseAdjustments: {
          phase1: 'Keep normal (already low stress)',
          phase2: 'Reduce to 3 sets, keep loads',
          phase3: 'Cut volume in half, NO drops/rest-pause/giant sets',
          phase4: 'Reduce to 30s holds maximum'
        }
      }
    },

    autoRegulationProtocol: {
      primaryIndicator: 'Phase 2 bar speed',
      monitoringApproach: 'If explosive work feels slow/heavy, reduce Phase 3 volume that day',
      rpeTargets: {
        phase1: 'RPE 5-6 (easy, activation work)',
        phase2: 'RPE 7-8 (explosive, NOT grinding reps)',
        phase3: 'RPE 9-10 (maximum effort with techniques)',
        phase4: 'N/A (time-based holds, not RPE)'
      },
      adjustmentRules: [
        'If Phase 2 feels heavy (RPE 9+): reduce Phase 3 sets by 1-2',
        'If sleep was poor (<6 hours): skip intensity techniques in Phase 3',
        'If joint pain present: replace Phase 2 with Phase 1-style work',
        'If bar speed is explosive and fast: consider adding set to Phase 2 or Phase 3',
        'If mentally fatigued: reduce workout to Phases 1+4 only (activation + stretch)'
      ]
    }
  },

  romEmphasis: {
    lengthened: 45,
    shortened: 30,
    fullRange: 25,

    principles: [
      'Phase 1 (Pre-Activation): FULL ROM with emphasis on stretched position - establish muscle activation',
      'Phase 2 (Explosive): FULL ROM but focus on accelerating through sticking point, NOT lockout grinding',
      'Phase 3 (Supramax Pump): VARIES - use mechanical drop sets to manipulate ROM (start with hardest ROM position)',
      'Phase 4 (Loaded Stretching): MAXIMUM lengthened ROM - hold deepest stretch possible for 30-60s'
    ],

    phaseSpecificDetails: {
      phase1PreActivation: {
        focus: 'Full ROM with controlled tempo, pause at stretched position',
        romDistribution: { lengthened: 50, shortened: 20, fullRange: 30 },
        technique: 'Slow eccentric (3-4s), pause at stretch (2s), controlled concentric',
        purpose: 'Establish mind-muscle connection in lengthened position where most growth occurs',
        examples: [
          'Cable flyes: Full stretch at bottom, pause, squeeze at top',
          'Leg extensions: Full stretch at bottom, pause, controlled contraction'
        ]
      },

      phase2Explosive: {
        focus: 'Full ROM with explosive concentric, controlled eccentric',
        romDistribution: { lengthened: 40, shortened: 20, fullRange: 40 },
        technique: 'Controlled eccentric (2-3s), explosive concentric (1s), NO grinding at lockout',
        purpose: 'Maximize mechanical tension through full range while maintaining bar speed',
        examples: [
          'Bench press + chains: Full descent to chest, explosive drive to lockout',
          'Squats + bands: Deep squat with stretch reflex, explosive drive up'
        ]
      },

      phase3SupramaxPump: {
        focus: 'Variable ROM using mechanical drop sets and partial reps',
        romDistribution: { lengthened: 40, shortened: 40, fullRange: 20 },
        technique: 'Start with hardest ROM position (lengthened), progress to easier positions as fatigue sets in',
        purpose: 'Maximize time under tension and metabolic stress by manipulating leverage',
        examples: [
          'Decline press (lengthened) → Flat press → Incline press (shortened)',
          'Bottom-half squats → Full ROM squats → Top-half squats (mechanical drop set)'
        ]
      },

      phase4LoadedStretching: {
        focus: 'MAXIMUM lengthened ROM - deepest stretch possible',
        romDistribution: { lengthened: 100, shortened: 0, fullRange: 0 },
        technique: 'Hold deepest stretched position for 30-60 seconds, focus on relaxing into stretch',
        purpose: 'Mechanotransduction, fascia stretching, satellite cell activation at muscle insertions',
        examples: [
          'Dumbbell flyes: Arms fully extended wide, dumbbells below chest level - HOLD',
          'Incline dumbbell curls: Arms fully extended behind torso - HOLD',
          'RDL: Barbell at mid-shin, hips back, hamstrings fully stretched - HOLD'
        ]
      }
    },

    lengthBiasedExercises: [
      'Romanian deadlifts (hamstrings)',
      'Incline dumbbell curls (biceps)',
      'Overhead triceps extensions (triceps long head)',
      'Pec deck / Dumbbell flyes (chest)',
      'Pullovers (lats)',
      'Deficit deadlifts (hamstrings, glutes)',
      'Sissy squats (quadriceps)'
    ],

    shortenedBiasedExercises: [
      'Leg extensions (quadriceps)',
      'Leg curls (hamstrings)',
      'Cable crossovers (chest - shortened at contraction)',
      'Concentration curls (biceps)',
      'Overhead cable triceps extensions (peak contraction)',
      'Cable lateral raises (delts - top position)'
    ]
  },

  exerciseSelectionPrinciples: {
    overarchingPhilosophy: 'Exercise selection is PHASE-DEPENDENT, not just muscle-dependent. The same muscle group uses different exercise types across the 4 phases to maximize distinct hypertrophy mechanisms.',

    movementPatterns: {
      horizontalPush: {
        phase1: ['Cable flyes', 'Pec deck'],
        phase2: ['Barbell bench press + chains', 'Dumbbell bench press + bands'],
        phase3: ['Machine chest press', 'Hammer strength press', 'Smith machine press'],
        phase4: ['Dumbbell flyes hold (low incline)']
      },

      verticalPush: {
        phase1: ['Cable lateral raises', 'Machine lateral raises'],
        phase2: ['Barbell overhead press + chains', 'Dumbbell overhead press'],
        phase3: ['Machine shoulder press', 'Smith machine overhead press'],
        phase4: ['Cable lateral raise hold (stretched position)']
      },

      horizontalPull: {
        phase1: ['Cable rows (light)', 'Face pulls'],
        phase2: ['Barbell rows + chains', 'Dumbbell rows', 'T-bar rows'],
        phase3: ['Hammer strength row', 'Cable rows (heavy)', 'Machine rows'],
        phase4: ['Cable row hold (stretched position)']
      },

      verticalPull: {
        phase1: ['Cable pullovers', 'Lat prayers'],
        phase2: ['Weighted pull-ups', 'Pull-ups + bands'],
        phase3: ['Lat pulldown machine', 'Hammer strength pulldown'],
        phase4: ['Behind-neck lat pulldown hold (full stretch)']
      },

      kneeDominant: {
        phase1: ['Leg extensions', 'Goblet squats (light)'],
        phase2: ['Barbell squats + chains', 'Safety bar squats + bands'],
        phase3: ['Leg press', 'Hack squat machine', 'Smith machine squats'],
        phase4: ['Sissy squat hold', 'Leg extension hold (stretched)']
      },

      hipDominant: {
        phase1: ['Leg curls', 'Glute bridges (light)'],
        phase2: ['Barbell deadlifts + chains', 'Romanian deadlifts'],
        phase3: ['Lying leg curls', 'Seated leg curls', 'Glute-ham raises'],
        phase4: ['Romanian deadlift hold (bottom position)']
      },

      armFlexion: {
        phase1: ['Cable curls', 'Machine curls'],
        phase2: ['Barbell curls', 'EZ-bar curls (NO chains/bands on arms)'],
        phase3: ['Cable curls', 'Machine curls', 'Dumbbell curls'],
        phase4: ['Incline dumbbell curl hold (stretched position)']
      },

      armExtension: {
        phase1: ['Cable pushdowns', 'Machine dips'],
        phase2: ['Close-grip bench press', 'Weighted dips'],
        phase3: ['Cable pushdowns', 'Overhead cable extensions', 'Machine dips'],
        phase4: ['Overhead dumbbell extension hold (stretched position)']
      }
    },

    equipmentHierarchy: {
      phase1: {
        preferred: ['Cables', 'Machines'],
        rationale: 'Constant tension, easy to control, focus on feel not load',
        avoid: ['Heavy barbells', 'Free weights requiring stabilization']
      },

      phase2: {
        preferred: ['Barbells', 'Specialty bars compatible with chains/bands'],
        rationale: 'Maximum load potential, accommodating resistance compatibility, explosive work',
        avoid: ['Machines', 'Unstable implements (bosu balls, etc.)']
      },

      phase3: {
        preferred: ['Machines', 'Cables', 'Dumbbells (for some movements)'],
        rationale: 'Safe during extreme fatigue, quick weight changes for drops, constant tension',
        avoid: ['Heavy barbells (dangerous when fatigued)', 'Chains/bands (too unstable)']
      },

      phase4: {
        preferred: ['Dumbbells', 'Cables', 'Light barbells'],
        rationale: 'Allow deep stretch, controllable for isometric holds, safe under moderate load',
        avoid: ['Heavy loads', 'Machines that restrict ROM']
      }
    },

    unilateralRequirements: {
      minimumFrequency: 'At least 1 unilateral exercise per muscle group per week',
      bestPhases: 'Phase 1 (pre-activation) or Phase 3 (pump work)',
      rationale: 'Address imbalances, enhance mind-muscle connection, increase motor unit recruitment per side',
      examples: {
        chest: 'Single-arm cable flyes (Phase 1 or 3)',
        back: 'Single-arm dumbbell rows (Phase 1 or 3)',
        shoulders: 'Single-arm cable lateral raises (Phase 1 or 3)',
        legs: 'Bulgarian split squats (Phase 3), Single-leg curls (Phase 3)'
      }
    },

    compoundToIsolationRatio: {
      phase1: { compound: 0, isolation: 100 },
      phase2: { compound: 100, isolation: 0 },
      phase3: { compound: 40, isolation: 60 },
      phase4: { compound: 0, isolation: 100 }
    },

    safetyPrinciples: [
      'NEVER use chains/bands in Phase 3 - too dangerous when fatigued',
      'NEVER use heavy barbells in Phase 4 - moderate loads only for stretching',
      'Prioritize machines in Phase 3 for safety during drops/rest-pause',
      'Use barbells primarily in Phase 2 when CNS is fresh',
      'Phase 1 should NEVER cause injury risk - activation only'
    ]
  },

  stimulusToFatigue: {
    philosophy: 'Mountain Dog Training optimizes stimulus-to-fatigue (S:F) ratio through PHASE-BASED exercise distribution. Unlike other methods that categorize exercises globally, Mountain Dog recognizes that the SAME exercise can have different S:F profiles depending on which phase it appears in and how it\'s executed.',

    phaseBasedStimulusFatigue: {
      phase1PreActivation: {
        stimulusFatigueRatio: 'MAXIMUM S:F (9:1)',
        rationale: 'Low load, high mind-muscle connection, minimal systemic fatigue',
        exercises: 'Isolation, cables, machines - activation without damage',
        fatigueManagement: 'Extremely low - this phase ADDS to recovery, not detracts'
      },

      phase2Explosive: {
        stimulusFatigueRatio: 'LOW S:F (4:6)',
        rationale: 'High CNS demand, heavy loads, systemic fatigue, but NECESSARY for strength/power development',
        exercises: 'Barbell compounds with chains/bands - high fatigue but high reward',
        fatigueManagement: 'Accept high fatigue - this is the COST of explosive/strength work, but volume is controlled (3-6 sets only)'
      },

      phase3SupramaxPump: {
        stimulusFatigueRatio: 'HIGH S:F (7:3)',
        rationale: 'Maximum hypertrophy stimulus via metabolic stress with moderate systemic fatigue (machines reduce CNS demand)',
        exercises: 'Machines, cables, isolation - massive local fatigue, low systemic fatigue',
        fatigueManagement: 'Local muscle fatigue is HIGH (intentional), but systemic/CNS fatigue is LOW due to machine use'
      },

      phase4LoadedStretching: {
        stimulusFatigueRatio: 'MAXIMUM S:F (9:1)',
        rationale: 'Unique growth stimulus (mechanotransduction) with near-zero fatigue cost',
        exercises: 'Light loads, isometric holds in stretched position',
        fatigueManagement: 'Essentially ZERO systemic fatigue - passive tension, not active contraction'
      }
    },

    exerciseCategorization: {
      highStimulusLowFatigue: [
        'Phase 1: ALL exercises (cable flyes, leg extensions, machine curls)',
        'Phase 3: Machine exercises (leg press, machine chest press, lat pulldown)',
        'Phase 4: ALL exercises (loaded stretching has maximum S:F)',
        'Unilateral machine work (single-leg press, single-arm cable work)'
      ],

      moderateStimulusFatigue: [
        'Phase 3: Dumbbell compound movements (dumbbell bench, dumbbell rows)',
        'Phase 2: Specialty bar work (safety bar squats, trap bar deadlifts)',
        'Moderate-load cable exercises with drop sets'
      ],

      lowStimulusHighFatigue: [
        'Phase 2: Heavy barbell compounds with chains/bands (bench, squats, deadlifts, overhead press)',
        'Any exercise performed with extremely heavy load (85%+ 1RM)',
        'Full-body movements (Olympic lifts - NOT used in Mountain Dog)'
      ]
    },

    fatigueManagementStrategy: {
      weeklyDistribution: 'Fatigue is ACCEPTED in Phase 2 (necessary for strength), but MINIMIZED in Phases 1, 3, and 4 through exercise selection',

      volumeAllocation: {
        phase1: '15-20% of total weekly sets (low fatigue)',
        phase2: '25-30% of total weekly sets (high fatigue but controlled volume)',
        phase3: '40-50% of total weekly sets (high volume but low systemic fatigue via machines)',
        phase4: '5-10% of total "sets" (time-based, near-zero fatigue)'
      },

      recoveryCost: {
        phase1: 'Negligible - may actually ENHANCE recovery via blood flow',
        phase2: 'HIGH - requires 3-4 days for CNS/muscular recovery',
        phase3: 'MODERATE - local muscle needs 2-3 days, but CNS recovers quickly',
        phase4: 'ZERO - no recovery cost, purely additive stimulus'
      },

      autoRegulationByPhase: [
        'If fatigued: NEVER skip Phase 1 or Phase 4 (low fatigue cost)',
        'If fatigued: Reduce Phase 2 volume or loads (this is high-fatigue work)',
        'If fatigued: Reduce intensity techniques in Phase 3 but maintain volume',
        'If well-rested: Add sets to Phase 2 or increase loads',
        'Phase 4 is ALWAYS performed regardless of fatigue state'
      ]
    },

    optimalStimulusFatigueBalance: {
      weeklyTarget: 'Accumulate 60-70% of weekly volume from HIGH S:F exercises (Phases 1, 3, 4)',
      fatigueMarkers: [
        'Monitor Phase 2 bar speed (primary fatigue indicator)',
        'Track sleep quality (systemic recovery)',
        'Assess joint health (overuse indicator)',
        'Monitor motivation/mental readiness'
      ],
      adjustmentProtocol: {
        ifFatigueHigh: 'Reduce Phase 2 volume by 1-2 sets, maintain Phases 1, 3, 4',
        ifRecoveryGood: 'Add 1 set to Phase 2, consider extra set in Phase 3',
        ifPlateaued: 'Rotate exercises (especially Phase 2 and 3), maintain phase structure'
      }
    }
  }
}

async function seedMountainDog() {
  console.log('🏔️  Seeding Mountain Dog Training approach...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('training_approaches')
    .select('id')
    .eq('name', mountainDogApproach.name)
    .single()

  let data, error

  if (existing) {
    console.log('⚠️  Mountain Dog approach already exists. Updating...')
    const result = await supabase
      .from('training_approaches')
      .update({
        creator: mountainDogApproach.creator,
        category: mountainDogApproach.category,
        recommended_level: mountainDogApproach.recommended_level,
        level_notes: mountainDogApproach.level_notes,
        philosophy: mountainDogApproach.philosophy,
        short_philosophy: mountainDogApproach.short_philosophy,
        variables: mountainDogApproach.variables,
        progression_rules: mountainDogApproach.progression,
        exercise_rules: mountainDogApproach.exerciseSelection,
        rationales: mountainDogApproach.rationales,
        volume_landmarks: mountainDogApproach.volumeLandmarks,
        frequency_guidelines: mountainDogApproach.frequencyGuidelines,
        advanced_techniques: mountainDogApproach.advancedTechniques,
        split_variations: mountainDogApproach.splitVariations,
        periodization: mountainDogApproach.periodization,
        rom_emphasis: mountainDogApproach.romEmphasis,
        exercise_selection_principles: mountainDogApproach.exerciseSelectionPrinciples,
        stimulus_to_fatigue: mountainDogApproach.stimulusToFatigue
      })
      .eq('id', existing.id)
      .select()

    data = result.data
    error = result.error
  } else {
    const result = await supabase
      .from('training_approaches')
      .insert({
        name: mountainDogApproach.name,
        creator: mountainDogApproach.creator,
        category: mountainDogApproach.category,
        recommended_level: mountainDogApproach.recommended_level,
        level_notes: mountainDogApproach.level_notes,
        philosophy: mountainDogApproach.philosophy,
        short_philosophy: mountainDogApproach.short_philosophy,
        variables: mountainDogApproach.variables,
        progression_rules: mountainDogApproach.progression,
        exercise_rules: mountainDogApproach.exerciseSelection,
        rationales: mountainDogApproach.rationales,
        volume_landmarks: mountainDogApproach.volumeLandmarks,
        frequency_guidelines: mountainDogApproach.frequencyGuidelines,
        advanced_techniques: mountainDogApproach.advancedTechniques,
        split_variations: mountainDogApproach.splitVariations,
        periodization: mountainDogApproach.periodization,
        rom_emphasis: mountainDogApproach.romEmphasis,
        exercise_selection_principles: mountainDogApproach.exerciseSelectionPrinciples,
        stimulus_to_fatigue: mountainDogApproach.stimulusToFatigue
      })
      .select()

    data = result.data
    error = result.error
  }

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Mountain Dog Training approach seeded successfully!')
  console.log('📊 Approach ID:', data?.[0]?.id)
  console.log('🏔️  Created by:', data?.[0]?.creator)
  console.log('\n🔑 Key Features:')
  console.log('  - 4-Phase Workout Structure (Pre-Activation → Explosive → Supramax Pump → Loaded Stretching)')
  console.log('  - Chains/Bands for Accommodating Resistance (Phase 2)')
  console.log('  - Loaded Stretching Protocol (30-60s holds in Phase 4)')
  console.log('  - NO Deload Policy (6-12 weeks)')
  console.log('  - 12-Week Block Periodization')
  console.log('  - Exercise Rotation every 3-4 weeks')
  console.log('  - Extreme Intensity Techniques (drops, rest-pause, giant sets)')
}

seedMountainDog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
