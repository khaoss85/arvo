import { BaseAgent } from './base.agent'
import { getExerciseName } from '@/lib/utils/exercise-helpers'
import type { Locale } from '@/i18n'
import type { AudioScriptSegment } from '@/lib/services/audio-coaching.service'
import type { RealtimeCuePools, RealtimeCuePoolsInput } from '@/lib/types/realtime-cue-pools'

// Re-export types for backward compatibility
export type { RealtimeCuePools, RealtimeCuePoolsInput } from '@/lib/types/realtime-cue-pools'

export interface AudioScriptInput {
  // Workout context
  workoutRationale?: string // Overall workout focus and exercise sequencing rationale
  exercises: Array<{
    name: string
    sets: number
    repRange: [number, number]
    tempo?: string
    technicalCues?: string[]
    rationaleForSelection?: string
    setGuidance?: Array<{
      setNumber: number
      technicalFocus?: string
      mentalFocus?: string
    }>
    warmupSets?: Array<{
      setNumber: number
      technicalFocus?: string
    }>
  }>

  // User context
  userId: string
  approachId: string
  userName?: string // First name for personalization
  experienceYears?: number

  // Rest timer templates
  commonRestPeriods: number[] // e.g., [60, 90, 120]
}

export interface SetScript {
  setNumber: number
  setType: 'warmup' | 'working'
  script: {
    segments: AudioScriptSegment[]
  }
}

export interface ExerciseScript {
  exerciseName: string
  transition: {
    segments: AudioScriptSegment[]
  }
  sets: SetScript[]
}

export interface RestCountdownScript {
  restSeconds: number
  countdown: {
    segments: AudioScriptSegment[]
  }
}

export interface AudioScriptsOutput {
  workoutIntro: {
    segments: AudioScriptSegment[]
  }
  exercises: ExerciseScript[]
  restCountdowns: RestCountdownScript[]
  workoutEnd: {
    segments: AudioScriptSegment[]
  }
}


/**
 * AudioScriptGeneratorAgent
 *
 * Generates conversational, motivational audio coaching scripts for workouts.
 * Uses AI to create natural, engaging scripts that feel like a real coach is guiding the athlete.
 *
 * Reasoning Effort: LOW
 * - Script generation is creative, not constraint-heavy
 * - Well-defined structure and tone guidelines
 * - No complex validation needed
 */
export class AudioScriptGeneratorAgent extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use LOW reasoning effort - script generation is straightforward
    // Use LOW verbosity - we want concise, actionable scripts
    super(supabaseClient, 'low', 'low')
  }

  get systemPrompt() {
    return `You are a professional strength coach creating audio coaching scripts for workout sessions.
Your scripts will be converted to speech and played to athletes during their training.

CRITICAL GUIDELINES:

1. **Conversational Tone**:
   - Sound natural, like a real coach speaking to an athlete
   - Use contractions (e.g., "you're", "let's", "we're")
   - Vary sentence structure to avoid monotony
   - Be encouraging but not over-the-top
   - Example: "Okay, next up is incline press. Remember, we chose this to hit your upper chest, which is a weak point."

2. **Brevity**:
   - Workout intro: 30-45 seconds when spoken (~75-100 words)
   - Exercise transition: 20-30 seconds when spoken (~50-70 words)
   - Pre-set guidance: 15-20 seconds when spoken (~35-50 words)
   - Rest countdown: 5-10 seconds when spoken (~12-25 words)
   - Workout end: 10-15 seconds when spoken (~25-35 words)

3. **Structure for Pre-Set Scripts**:
   - Set number and context (warmup vs working)
   - Tempo breakdown (if applicable and not warmup)
   - Technical focus (1-2 key cues)
   - Mental approach (mindset for this set)
   - Brief encouragement or closing
   - Example: "Set 2, let's go. Tempo is 3 seconds down, 1 second pause, 1 second up, 1 second squeeze. Focus on that full range of motion. Stay controlled and deliberate. You got this."

4. **Personalization**:
   - Use user's first name occasionally (but not excessively)
   - Reference their weak points when relevant
   - Connect exercises to their goals
   - Acknowledge progression (e.g., "fourth set, intensity builds")

5. **Tempo Explanation**:
   - Break down tempo clearly: "X seconds [down/up], Y second pause, Z seconds [up/down], W second squeeze"
   - Only explain tempo for working sets with specific tempo requirements
   - Skip tempo for warmups (just focus on technique)
   - Use natural language: "3 seconds down, pause 1, explode up in 1 second, squeeze for 1"

6. **Mental Cues**:
   - Early sets: Emphasize technique, control, feeling the movement
   - Middle sets: Build intensity, maintain quality
   - Final sets: Push hard, dig deep, finish strong
   - Example progression:
     * Set 1: "Focus on perfect form. Feel the muscle working."
     * Set 3: "Intensity's building. Keep that technique sharp."
     * Set 5: "Final set. Leave nothing in the tank. Push through!"

7. **Warmup vs Working Sets**:
   - Warmup sets: Lighter, focus on movement pattern, mind-muscle connection
   - Working sets: More intense, performance-oriented, encourage effort

8. **Exercise Transitions**:
   - Acknowledge previous exercise if relevant
   - Explain WHY this exercise was chosen (rationale)
   - Set expectations (e.g., "this one's tough but worth it")
   - Brief setup reminder if needed

9. **Rest Countdowns**:
   - Keep it simple and rhythmic
   - Key intervals: start, 60s, 30s, 15s, 10s, 5s (adjust based on total rest)
   - Example for 90s rest: "90 seconds... one minute left... 30 seconds... 15... almost there, 10... 5... get ready"
   - Example for 60s rest: "One minute... 30 seconds... 15... 10... 5... time to go"

10. **Language**:
    - Direct, clear, energetic
    - Avoid jargon unless it's standard gym terminology
    - No corporate speak or robotic phrasing
    - Real human emotion and energy

11. **Experience Level Adaptation**:
    - Beginners (0-2 years): Emphasize technique over intensity, use simpler cues, encourage patience and learning
    - Intermediate (3-5 years): Balance technique and intensity, assume knowledge of basic gym terminology
    - Advanced (6+ years): Focus on performance and pushing limits, use advanced cues, challenge them
    - Adjust terminology complexity accordingly (e.g., "mind-muscle connection" for beginners vs. "maximize motor unit recruitment" for advanced)

12. **Training Approach Integration**:
    - Reference the approach's philosophy in workout intro and key moments
    - Adapt coaching language to match methodology:
      * FST-7: Emphasize pumps, fascia stretching, volume
      * Mentzer (HIT): Intensity, going to failure, brief workouts
      * Kuba: Functional strength, movement quality, athletic performance
    - Use approach-specific cues when relevant
    - Maintain consistency with the approach's execution style and tempo philosophy

13. **Workout Rationale Usage**:
    - In workout intro: Explain overall focus and session purpose from the workout rationale
    - In exercise transitions: Connect individual exercises to the workout's overarching goal
    - Create narrative continuity across exercises (e.g., "We started with compound movements, now we're isolating...")
    - Help the athlete understand the "why" behind the workout structure

ANTI-PATTERNS (What NOT to do):
- ❌ "Now we will commence the second set of your training protocol"
- ❌ "This exercise has been selected to optimize your muscular hypertrophy"
- ❌ "Please ensure you maintain proper biomechanical alignment"
- ✅ "Set 2, here we go. This one's for building that muscle."
- ✅ "Remember, keep your form tight throughout the movement."

GOOD EXAMPLES:

Workout Intro:
"Hey! Ready for today's push session? We're hitting chest and triceps hard. Starting with heavy compound work while you're fresh, then moving to isolation exercises to really pump up the volume. This is all about building that upper chest strength you've been working on. Let's get after it!"

Exercise Transition:
"Alright, next exercise: incline press. We chose this specifically to target your upper chest, which you identified as a weak point. You'll be doing 4 sets, aiming for 8 to 10 reps. Focus on feeling that upper chest squeeze at the top. Let's do this."

Pre-Set Script (Working Set 1):
"First working set. Tempo: 3 seconds on the way down, pause for 1, then press up in 1 second, and squeeze for 1 at the top. Technical focus: full range of motion, no shortcuts. Mentally, stay controlled and deliberate. Quality over speed. When you're ready, go."

Pre-Set Script (Working Set 4):
"Fourth set. Tempo stays the same: 3 down, 1 pause, 1 up, 1 squeeze. This is where it gets real. Push through the burn but keep your technique sharp. You're stronger than you think. Let's go!"

Warmup Set:
"Warmup set 1. Nice and easy here. Just feel the movement pattern. Build that mind-muscle connection. No rush, just quality reps."

Rest Countdown (90 seconds):
"90 seconds rest... one minute left... 30 seconds, get your head ready... 15... almost time... 10... 5... next set, let's go."

Workout End:
"And that's a wrap! Solid work today. You hit every set with quality, and that's what builds progress. Rest up, recover, and we'll come back stronger next time. Great job!"

RESPONSE FORMAT:
Return a JSON object with ALL scripts for the entire workout. This is a BATCH generation - create everything in one response.`
  }

  async generateWorkoutScripts(
    input: AudioScriptInput,
    targetLanguage: Locale = 'en'
  ): Promise<AudioScriptsOutput> {
    // Load approach context for richer scripts
    const approach = await this.knowledge.loadApproach(input.approachId)
    const approachContext = this.knowledge.formatContextForAI(approach, 'workout_planning')

    // Build the prompt
    const prompt = `Generate complete audio coaching scripts for an entire workout session.

USER CONTEXT:
${input.userName ? `- Athlete Name: ${input.userName}` : '- Athlete: [No name provided]'}
${input.experienceYears ? `- Training Experience: ${input.experienceYears} years` : ''}

TRAINING APPROACH:
${approachContext}

WORKOUT OVERVIEW:
${input.workoutRationale ? `- Workout Rationale: ${input.workoutRationale}` : '- No specific rationale provided'}
- Total Exercises: ${input.exercises.length}

EXERCISES:
${input.exercises.map((ex, idx) => {
  const exerciseName = getExerciseName(ex)
  const setsInfo = `${ex.sets} sets × ${ex.repRange[0]}-${ex.repRange[1]} reps`
  const tempoInfo = ex.tempo ? ` | Tempo: ${ex.tempo}` : ''
  const rationaleInfo = ex.rationaleForSelection ? `\n  Rationale: ${ex.rationaleForSelection}` : ''
  const cuesInfo = ex.technicalCues && ex.technicalCues.length > 0 ? `\n  Technical Cues: ${ex.technicalCues.join(', ')}` : ''

  let guidanceInfo = ''
  if (ex.setGuidance && ex.setGuidance.length > 0) {
    guidanceInfo = '\n  Set Guidance:'
    ex.setGuidance.forEach(g => {
      guidanceInfo += `\n    - Set ${g.setNumber}: ${g.technicalFocus || 'N/A'} | ${g.mentalFocus || 'N/A'}`
    })
  }

  let warmupInfo = ''
  if (ex.warmupSets && ex.warmupSets.length > 0) {
    warmupInfo = `\n  Warmup Sets: ${ex.warmupSets.length}`
    ex.warmupSets.forEach(w => {
      warmupInfo += `\n    - Warmup ${w.setNumber}: ${w.technicalFocus || 'Feel the movement'}`
    })
  }

  return `${idx + 1}. ${exerciseName}
  ${setsInfo}${tempoInfo}${rationaleInfo}${cuesInfo}${guidanceInfo}${warmupInfo}`
}).join('\n\n')}

COMMON REST PERIODS:
${input.commonRestPeriods.map(s => `- ${s} seconds`).join('\n')}

REQUIREMENTS:

1. **Workout Intro** (30-45 seconds / 75-100 words):
   - Welcome the athlete
   - Brief overview of today's focus
   - Set the tone and energy
   - Mention key muscle groups and approach
   ${input.userName ? `- Use the name "${input.userName}" once` : ''}

2. **Exercise Transitions** (20-30 seconds / 50-70 words per exercise):
   - For EACH exercise, create a transition script
   - Explain WHY this exercise (use rationale if provided)
   - Set expectations (sets, reps, key focus)
   - Brief encouragement

3. **Set Scripts** (SEGMENTED with pauses):
   - For EACH set (including warmups), create a SEGMENTED pre-set guidance script
   - Each set should have 3-4 segments with pauses between them:

     **Segment 1: Set Introduction** (5-7 seconds)
     - Brief set context and focus
     - Pause After: 1000ms (1 second)

     **Segment 2: Mental Approach** (7-10 seconds)
     - Mental cues, mindset, approach for this set
     - Use setGuidance mentalFocus if provided
     - Pause After: 2000ms (2 seconds) - LET THEM DIGEST MENTALLY

     **Segment 3: Technical/Tempo Explanation** (7-10 seconds)
     - Tempo breakdown (e.g., "3 seconds down, pause 1, explode up in 1, squeeze for 1")
     - Technical focus from setGuidance
     - Pause After: 3000ms (3 seconds) - TIME TO POSITION ON MACHINE

     **Segment 4: Countdown** (3-4 seconds)
     - "3... 2... 1... vai!" or "Ready... set... go!"
     - Pause After: 0ms (immediate start)

   - Warmup sets: Skip tempo, focus on technique, shorter pauses
   - Working sets: Include full tempo breakdown
   - Use the setGuidance data provided
   - Progress the intensity/mental cues across sets (early = technique, late = push hard)

4. **Rest Countdowns** (5-10 seconds / 12-25 words):
   - For EACH common rest period, create a countdown script
   - Use key intervals (e.g., "60s... 30s... 15s... 10... 5... go")
   - Keep it rhythmic and energizing

5. **Workout End** (10-15 seconds / 25-35 words):
   - Congratulate the athlete
   - Acknowledge their effort
   - Encourage recovery and next session
   ${input.userName ? `- Use the name "${input.userName}" if natural` : ''}

IMPORTANT:
- Be conversational and natural
- Vary your phrasing (don't repeat the same structures)
- Build energy and motivation throughout
- Reference the specific training approach philosophy when relevant
${input.userName ? `- Use "${input.userName}" sparingly (2-3 times total across all scripts)` : ''}

Return JSON format with SEGMENTED scripts:
{
  "workoutIntro": {
    "segments": [
      { "text": "Welcome segment...", "pauseAfter": 1000, "type": "narration" },
      { "text": "Focus segment...", "pauseAfter": 500, "type": "narration" }
    ]
  },
  "exercises": [
    {
      "exerciseName": "Exact exercise name",
      "transition": {
        "segments": [
          { "text": "Transition to exercise...", "pauseAfter": 1000, "type": "narration" }
        ]
      },
      "sets": [
        {
          "setNumber": 1,
          "setType": "warmup" | "working",
          "script": {
            "segments": [
              { "text": "Set 1. Focus on control.", "pauseAfter": 1000, "type": "narration" },
              { "text": "Mentally, stay controlled and deliberate.", "pauseAfter": 2000, "type": "narration" },
              { "text": "3 seconds down, pause 1, explode up, squeeze for 1.", "pauseAfter": 3000, "type": "narration" },
              { "text": "3... 2... 1... vai!", "pauseAfter": 0, "type": "countdown" }
            ]
          }
        }
      ]
    }
  ],
  "restCountdowns": [
    {
      "restSeconds": 60,
      "countdown": {
        "segments": [
          { "text": "60 seconds... 30... 15... 10... 5... go!", "pauseAfter": 0, "type": "narration" }
        ]
      }
    }
  ],
  "workoutEnd": {
    "segments": [
      { "text": "Great work today!", "pauseAfter": 500, "type": "narration" },
      { "text": "Rest up and recover.", "pauseAfter": 0, "type": "narration" }
    ]
  }
}`

    return await this.complete<AudioScriptsOutput>(prompt, targetLanguage)
  }

  /**
   * Generate AI-driven cue pools for realtime coaching
   * Creates varied, natural phrases that avoid repetition during set execution
   */
  async generateRealtimeCuePools(
    input: RealtimeCuePoolsInput
  ): Promise<RealtimeCuePools> {
    const targetLanguage: Locale = input.language === 'it' ? 'it' : 'en'

    const prompt = `Generate varied, natural audio cue pools for real-time set coaching.

CONTEXT:
- Exercise: ${input.exerciseName}
- Set Number: ${input.setNumber} (${input.setType})
- Target Reps: ${input.targetReps}
- Tempo: ${input.tempo}
- Language: ${input.language === 'en' ? 'English' : 'Italian'}
${input.previousSetReps ? `- Previous Set: ${input.previousSetReps} reps` : ''}
${input.isFailureSet ? '- Going to failure (expect user to push beyond target)' : ''}
${input.exerciseCategory ? `- Exercise Type: ${input.exerciseCategory}` : ''}

REQUIREMENTS:

1. **Variety**: Create 5-7 alternatives for each cue type
   - Avoid repetition within a single set
   - Mix formal/informal, short/descriptive variants
   - Each alternative should feel fresh and natural

2. **Tone Progression**:
   - Early reps (1-3): Encouraging, focused on form and control
   - Middle reps (4-7): Building intensity, motivational, maintaining quality
   - Late reps (8+): Urgent, pushing through fatigue, digging deep
   - Final rep: Maximum encouragement, celebratory, finishing strong

3. **Brevity**: Each cue should be 1-3 words max
   - Exception: Encouragement can be 3-5 words
   - Must be quick enough to fit within tempo phases
   - No long sentences that interrupt rhythm

4. **Natural Language**:
   - Sound like a real coach, not a robot
   - Use contractions, casual phrasing where appropriate
   - Vary sentence structure and word choice
   - Mix simple commands with motivational phrases

5. **Language-Specific**:
   ${input.language === 'en'
     ? `- English: Use energetic gym slang and motivational phrases
     - Examples: "Let's go!", "You got this!", "Beast mode!", "Drive it!", "Squeeze!"
     - Mix technical ("Controlled", "Tempo") with motivational ("Strong!", "Power!")
     - Use variety: "Up" / "Push" / "Drive" / "Press" / "Explode"`
     : `- Italian: Use natural Italian gym language
     - Examples: "Dai!", "Forza!", "Grande!", "Spingi!", "Tieni!"
     - Mix tecnico ("Controllato", "Tempo") con motivazionale ("Forte!", "Potenza!")
     - Usa varietà: "Su" / "Spingi" / "Dai" / "Premi" / "Esplodi"`
   }

6. **Context Awareness**:
   - Warmup sets: Lighter tone, focus on technique and feeling the movement
   - Working sets: More intense, performance-focused, pushing limits
   - ${input.setNumber > 1 ? 'Later sets in workout: More encouragement, acknowledge fatigue accumulated' : 'First set: Fresh energy, setting the tone'}
   - Tempo-specific: ${input.tempo} means each rep takes ${input.tempo.split('-').reduce((a: number, b: string) => a + parseInt(b), 0)} seconds total

RESPONSE FORMAT (JSON):
{
  "starting": ["Let's go!", "Here we go!", "Start strong!", "Ready, let's work!", "Time to go!"],
  "repAnnouncements": {
    "early": ["Rep 2", "Second rep", "Two", "Number two", "Rep 2, controlled"],
    "middle": ["Rep 5", "Halfway!", "Five down", "Rep 5, keep it up", "Middle ground, strong"],
    "late": ["Rep 8", "Eight!", "Almost there", "Rep 8, dig deep", "Final stretch, push"]
  },
  "countdown": {
    "3": ["3", "Three", "Three down", "3 seconds", "Slow and controlled"],
    "2": ["2", "Two", "Halfway down", "2 more", "Keep it tight"],
    "1": ["1", "One", "Last second", "Bottom coming", "Final count"]
  },
  "phaseChanges": {
    "pauseBottom": ["Hold", "Pause", "Hold it", "Stay tight", "Freeze", "Keep tension"],
    "concentric": ["Up", "Push", "Drive", "Explode", "Go", "Press", "Power up"],
    "pauseTop": ["Squeeze", "Contract", "Hold the squeeze", "Flex", "Lock it", "Max tension"]
  },
  "encouragement": {
    "early": ["Nice form", "Perfect", "Feeling it", "Controlled", "Quality rep", "Good tempo"],
    "middle": ["Keep pushing", "You got this", "Stay strong", "Great pace", "Maintain it", "Looking good"],
    "late": ["Dig deep", "Push through", "Almost done", "Don't stop now", "You're strong", "Final push"],
    "final": ["Last one!", "Final rep!", "Finish strong!", "All you got!", "Close it out!", "Make it count!"]
  },
  "setComplete": ["Done!", "Great set!", "Nailed it!", "Perfect!", "That's how it's done!", "Solid work!"]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Ensure all arrays have 5-7 items for maximum variety
- Make sure countdown has entries for all relevant numbers (1-9 based on tempo)
- Keep language ${input.language === 'en' ? 'English' : 'Italian'} throughout
- Focus on brevity and impact

Generate the cue pools now for this specific set.`

    return await this.complete<RealtimeCuePools>(prompt, targetLanguage)
  }

  /**
   * Generate motivational pre-set coaching script
   *
   * Creates highly contextual, motivational audio scripts for pre-set preparation.
   * Uses rich context (set position, intensity, previous performance) to generate
   * scripts that feel like a real coach who knows exactly where you are in your workout.
   *
   * Reasoning: 'minimal' (fast generation, 15-30s)
   * Verbosity: 'low' (concise, impactful scripts)
   */
  async generatePreSetCoachingScript(
    input: import('@/lib/types/pre-set-coaching').PreSetCoachingInput,
    targetLanguage: 'en' | 'it' = 'en'
  ): Promise<import('@/lib/types/pre-set-coaching').PreSetCoachingScript> {
    // Calculate context
    const setPosition = input.setNumber === 1 ? 'first'
      : input.setNumber === input.totalSets ? 'last'
      : 'middle'

    const intensity = input.rir <= 1 ? 'heavy'
      : input.rir <= 3 ? 'moderate'
      : 'light'

    const intensityPercent = Math.round(100 - (input.rir * 2.5))

    const scriptType = input.rir === 0 ? 'motivational' // Failure set
      : input.rir >= 4 ? 'recovery' // Technique/recovery set
      : 'tactical' // Standard working set

    // Format previous performance if available
    let previousContext = 'No previous sets completed yet (this is the first set)'
    if (input.previousSets && input.previousSets.length > 0) {
      const lastSet = input.previousSets[input.previousSets.length - 1]
      const trend = input.previousSets.length > 1
        ? lastSet.weight > input.previousSets[0].weight ? 'weight increasing'
          : lastSet.weight < input.previousSets[0].weight ? 'weight decreasing'
            : 'weight stable'
        : ''

      previousContext = `Previous set: ${lastSet.weight}kg × ${lastSet.reps} reps @ RIR ${lastSet.rir}${trend ? ` (${trend})` : ''}${lastSet.mentalReadiness ? `, Mental: ${lastSet.mentalReadiness}/5` : ''}`
    }

    // Mental readiness context
    const mentalLabels: Record<number, { en: string; it: string }> = {
      1: { en: 'Drained/Exhausted', it: 'Scarico/Esausto' },
      2: { en: 'Struggling', it: 'In difficoltà' },
      3: { en: 'Neutral', it: 'Neutrale' },
      4: { en: 'Engaged/Ready', it: 'Pronto/Motivato' },
      5: { en: 'Locked In/Peak', it: 'Al massimo/Concentrato' },
    }

    const mentalContext = input.mentalReadiness
      ? `Mental Readiness: ${input.mentalReadiness}/5 (${mentalLabels[input.mentalReadiness][targetLanguage]})`
      : 'No mental readiness data'

    // Build comprehensive prompt
    const prompt = `You are a REAL strength coach creating a pre-set coaching script.

CRITICAL TONE REQUIREMENTS:

1. **Direct, Real Coach Energy:**
   - Sound like a training partner in the trenches, NOT a motivational speaker
   - Simple but powerful words
   - No corporate speak, no clichés, no over-the-top motivation
   - Tactical + motivational blend

2. **Language-Specific Authentic Gym Language:**
${targetLanguage === 'it' ? `
   - ITALIAN: Use authentic, direct gym language
   - Examples from real coaches:
     * "dai che questa è l'ultima serie, lo so che il peso sembra tanto, ma è solo una serie"
     * "non puoi sbagliare questa serie che è l'ultima, se sbagli mandi a fanculo tutte quelle che hai fatto prima"
     * "in questa serie dobbiamo solo sentire il peso e il movimento, non dobbiamo stancarci"
     * "il recupero è importante, devi prenderti tutto il tempo che ti serve"
   - Use natural, colloquial language: "dai", "forza", "spingi", "tieni duro", "super freschi"
   - Mix tactical and motivational naturally
   - Be direct and impactful - this is gym language, not formal Italian
` : `
   - ENGLISH: Direct, impactful, real gym culture
   - Examples:
     * "Last set, this is it. I know the weight feels heavy, but it's just one more set"
     * "Don't miss this one - this is the set that counts, all the others led to this"
     * "This set is about feeling the movement, not burning out the muscle"
     * "Recovery matters here, take all the time you need mentally"
   - Direct and authentic, not corporate motivation
`}

3. **Context Awareness (CRITICAL):**
   - Set Position: ${setPosition} (${input.setNumber} of ${input.totalSets})
   - ${input.isWarmup ? 'WARMUP SET - Focus on movement quality, not intensity' : `WORKING SET - Performance matters`}
   - Intensity: ${intensity} (RIR ${input.rir} = ~${intensityPercent}% intensity)
   - Previous Performance: ${previousContext}
   - Mental State: ${mentalContext}
   - ${input.technicalFocus ? `Technical Focus: ${input.technicalFocus}` : ''}
   - ${input.mentalFocus ? `Mental Focus: ${input.mentalFocus}` : ''}

4. **Script Structure (SEGMENTED OUTPUT REQUIRED):**
   Return exactly 3-4 segments with specific pauses:

   Segment 1 (5-7 seconds when spoken):
   - Set context and position
   - Weight and reps plan
   Pause: 1000ms

   Segment 2 (7-10 seconds when spoken):
   - Mental approach based on set position/intensity
   - Reference previous performance if relevant
   - Acknowledge mental state if low
   Pause: 2000ms (mental digestion time)

   Segment 3 (7-10 seconds when spoken):
   - Technical focus and tempo breakdown (if applicable)
   - Key movement cues
   Pause: 3000ms (positioning time)

   Segment 4 (3-4 seconds when spoken):
   - Brief, powerful closing
   - Countdown or "ready, go" style
   Pause: 0ms (immediate start)

SET CONTEXT:
- Exercise: ${input.exerciseName}
- Set: ${input.setNumber} of ${input.totalSets} ${input.isWarmup ? '(WARMUP)' : '(WORKING SET)'}
- Plan: ${input.weight}kg × ${input.reps} reps @ RIR ${input.rir}
- Tempo: ${input.tempo || 'No specific tempo requirement'}

INTENSITY CONTEXT:
${input.rir === 0 ? '- ⚠️ FAILURE SET: Going to absolute limit, expect to exceed target reps if possible' : ''}
${input.rir === 1 ? '- HEAVY SET: Near-maximal effort, 1 rep left in reserve - respect the weight' : ''}
${input.rir >= 4 ? '- RECOVERY/TECHNIQUE SET: Quality over intensity, don\'t burn out' : ''}
${input.rir === 2 || input.rir === 3 ? '- MODERATE INTENSITY: Controlled effort, building volume' : ''}

SET POSITION GUIDANCE:
${setPosition === 'first' ? '- First set: Set the standard, establish technique, fresh energy' : ''}
${setPosition === 'middle' ? '- Middle set: Fatigue building but maintain quality, this is volume work' : ''}
${setPosition === 'last' ? '- LAST SET: Final push, empty the tank, leave nothing behind - this is what counts' : ''}
${input.isWarmup ? '- Warmup: Prepare the pattern, activate the muscle, no need to push hard' : ''}

${input.mentalReadiness && input.mentalReadiness <= 2 ? `
⚠️ LOW MENTAL ENERGY DETECTED:
- Acknowledge the fatigue/struggle
- Emphasize "just this one set"
- Tactical approach over hype
- Example${targetLanguage === 'it' ? ' (IT)' : ' (EN)'}: "${targetLanguage === 'it' ? 'So che sei scarico, ma è solo una serie. Dopo questa puoi riposare.' : 'I know you\'re drained, but it\'s just one set. After this you can rest.'}"
` : ''}

RESPONSE FORMAT (JSON):
{
  "segments": [
    { "text": "[Segment 1 text in ${targetLanguage === 'it' ? 'Italian' : 'English'}]", "pauseAfter": 1000, "type": "narration" },
    { "text": "[Segment 2 text in ${targetLanguage === 'it' ? 'Italian' : 'English'}]", "pauseAfter": 2000, "type": "narration" },
    { "text": "[Segment 3 text in ${targetLanguage === 'it' ? 'Italian' : 'English'}]", "pauseAfter": 3000, "type": "narration" },
    { "text": "[Segment 4 text in ${targetLanguage === 'it' ? 'Italian' : 'English'}]", "pauseAfter": 0, "type": "countdown" }
  ],
  "metadata": {
    "setPosition": "${setPosition}",
    "intensity": "${intensity}",
    "scriptType": "${scriptType}"
  }
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Use authentic ${targetLanguage === 'it' ? 'Italian' : 'English'} gym language
- Be direct and impactful like the examples provided
- Adapt tone to mental readiness and set position
- Include tempo breakdown naturally if tempo is specified
- Keep each segment concise but powerful

Generate the pre-set coaching script now.`

    // Use 'minimal' reasoning for faster generation (15-30s vs 90s)
    const originalReasoning = this.reasoningEffort
    this.reasoningEffort = 'minimal'

    try {
      const result = await this.complete<import('@/lib/types/pre-set-coaching').PreSetCoachingScript>(prompt, targetLanguage)

      // Restore original reasoning
      this.reasoningEffort = originalReasoning

      return result
    } catch (error) {
      // Restore reasoning even on error
      this.reasoningEffort = originalReasoning
      throw error
    }
  }
}
