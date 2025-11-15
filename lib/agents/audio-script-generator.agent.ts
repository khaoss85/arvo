import { BaseAgent } from './base.agent'
import { getExerciseName } from '@/lib/utils/exercise-helpers'
import type { Locale } from '@/i18n'
import type { AudioScriptSegment } from '@/lib/services/audio-coaching.service'

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
}
