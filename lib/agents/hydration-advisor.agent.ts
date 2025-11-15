import { BaseAgent } from './base.agent'
import type { HydrationInput, HydrationOutput } from '@/lib/types/hydration'
import type { Locale } from '@/i18n'

export type { HydrationInput, HydrationOutput }

export class HydrationAdvisor extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use reasoning='none' for ultra-low latency during workouts (critical for gym UX)
    // Hydration timing decisions are straightforward and should be instant
    super(supabaseClient, 'none', 'low')
  }

  get systemPrompt() {
    return `You are a sports hydration coach specialized in resistance training.

Your role is to provide science-based hydration reminders during workouts based on ACSM guidelines and bodybuilding best practices.

=== SCIENTIFIC FOUNDATION ===

**ACSM Guidelines (American College of Sports Medicine):**
- During training: 0.4-0.8 L/hour (400-800ml/hour)
- Practical rule: 200-250ml every 15-20 minutes
- Goal: Limit dehydration to <2% body weight
- For 60-90 min resistance training: 0.5-1.0 L total

**Timing Triggers:**
- Time-based: Every 15-20 minutes of training
- Volume-based: Every 6-8 sets completed
- Context: Adjust for exercise type, intensity, and previous dismissals

**Exercise-Specific Considerations:**

1. **COMPOUND LOWER BODY (Squat, Leg Press, Hack Squat, Deadlifts, Romanian Deadlifts, Bulgarian Split Squats):**
   - RISK: Drinking too much 1-3 min before heavy sets = nausea/vomiting
   - REASON: Valsalva maneuver + stomach pressure + high lactate
   - RECOMMENDATION: "Small sips only" (50-100ml) before/during these exercises
   - SAFE TO DRINK MORE: After completing the heavy compound, during isolation exercises

2. **UPPER BODY & ISOLATION EXERCISES (Bench, Row, Curls, Extensions, Lateral Raises, etc.):**
   - Lower risk of nausea
   - Can drink normally (200-250ml)
   - Standard hydration reminders apply

**Intensity Indicators:**
- High intensity (low RIR 0-2, low mental readiness 1-2) = more sweating = more hydration needed
- Low intensity (high RIR 3-5, high mental readiness 4-5) = standard hydration

**Dismissal Logic:**
- If user dismissed reminder <10 minutes ago: DO NOT suggest again
- After 10+ minutes: OK to suggest again if timing/volume triggers met

=== YOUR TASK ===

Given the workout context, decide:
1. Should we show a hydration reminder? (considering time, sets, dismissal history)
2. What type of message? ('normal' for standard exercises, 'smallSipsOnly' for heavy compound legs)
3. Confidence level (high/medium/low) and urgency (normal/important/critical)
4. Brief reason explaining why (time elapsed, sets completed, etc.)
5. Recommended water amount based on context

Output valid JSON with the exact structure requested.`
  }

  async suggestHydration(input: HydrationInput, targetLanguage: Locale = 'en'): Promise<HydrationOutput> {
    console.log('[HydrationAdvisor] Starting hydration suggestion', {
      input: {
        workoutDurationMin: Math.round(input.workoutDurationMs / 60000),
        totalSetsCompleted: input.totalSetsCompleted,
        currentSetNumber: input.currentSetNumber,
        exerciseType: input.exerciseType,
        exerciseName: input.exerciseName,
        muscleGroups: input.muscleGroups,
        lastSetRIR: input.lastSetRIR,
        mentalReadiness: input.mentalReadiness,
        lastDismissedAt: input.lastDismissedAt,
      },
      timestamp: new Date().toISOString()
    })

    // Calculate derived values
    const workoutMinutes = Math.round(input.workoutDurationMs / 60000)
    const minutesSinceLastDismiss = input.lastDismissedAt
      ? Math.round((Date.now() - input.lastDismissedAt.getTime()) / 60000)
      : null

    // Detect if this is a heavy compound leg exercise (anti-nausea protocol)
    const compoundLegExercises = [
      'squat',
      'leg press',
      'hack squat',
      'deadlift',
      'romanian deadlift',
      'rdl',
      'bulgarian split squat',
      'front squat',
      'back squat',
      'sumo deadlift',
      'conventional deadlift',
      'good morning'
    ]
    const exerciseNameLower = input.exerciseName?.toLowerCase() || ''
    const isCompoundLeg = input.exerciseType === 'compound' &&
      input.muscleGroups.primary.some(mg =>
        ['Quadriceps', 'Glutes', 'Hamstrings'].includes(mg)
      ) &&
      compoundLegExercises.some(legEx => exerciseNameLower.includes(legEx))

    const prompt = `
=== WORKOUT CONTEXT ===

**Timing:**
- Workout duration: ${workoutMinutes} minutes
- Total sets completed: ${input.totalSetsCompleted}
- Current set number: ${input.currentSetNumber}

**Exercise Context:**
- Exercise type: ${input.exerciseType}
${input.exerciseName ? `- Exercise name: ${input.exerciseName}` : ''}
- Primary muscles: ${input.muscleGroups.primary.join(', ')}
- Secondary muscles: ${input.muscleGroups.secondary.join(', ')}
- Rest period: ${input.restSeconds}s

**Intensity Indicators:**
${input.lastSetRIR !== undefined ? `- Last set RIR: ${input.lastSetRIR}/5 (${input.lastSetRIR <= 2 ? 'HIGH intensity - more sweating' : 'moderate intensity'})` : '- No RIR data available'}
${input.mentalReadiness ? `- Mental readiness: ${input.mentalReadiness}/5 (${input.mentalReadiness <= 2 ? 'Drained - may need hydration' : 'Good energy'})` : '- No mental readiness data'}

**Dismissal History:**
${input.lastDismissedAt ? `- User last dismissed hydration reminder: ${minutesSinceLastDismiss} minutes ago` : '- No previous dismissals this session'}

**Exercise Classification:**
${isCompoundLeg ? '⚠️  DETECTED: Heavy compound leg exercise (squat/leg press/deadlift family)' : 'Standard exercise (upper body or isolation)'}

=== YOUR DECISION ===

Based on ACSM guidelines and the context above:

1. **Should suggest hydration?**
   - Time trigger: Every 15-20 minutes (current: ${workoutMinutes} min)
   - Volume trigger: Every 6-8 sets (current: ${input.totalSetsCompleted} sets)
   - Dismissal rule: If dismissed <10 min ago, DO NOT suggest
   - Decision: ?

2. **Message type:**
   ${isCompoundLeg ? '- This IS a compound leg exercise → use "smallSipsOnly" (50-100ml) to prevent nausea' : '- This is NOT a heavy compound leg → use "normal" message (200-250ml)'}

3. **Confidence & urgency:**
   - Time/volume triggers clear? → high confidence
   - Intensity indicators suggest high sweating? → higher urgency
   - Otherwise → medium/normal

4. **Reason:**
   - Brief explanation for user (e.g., "You've been training for 20 minutes" or "Take a quick break after 6 sets")

5. **Water amount:**
   - Normal exercises: "200-250ml"
   - Small sips only: "50-100ml (small sips)"
   - High intensity: consider upper range

Required JSON structure:
{
  "shouldSuggest": boolean,
  "messageType": "normal" | "smallSipsOnly",
  "confidence": "high" | "medium" | "low",
  "urgency": "normal" | "important" | "critical",
  "reason": "string (brief explanation)",
  "waterAmount": "string (e.g., '200-250ml' or '50-100ml')",
  "nextCheckInMinutes": number (when to check again, e.g., 10, 15, 20)
}

IMPORTANT: Respond in ${targetLanguage === 'it' ? 'Italian' : 'English'} for the "reason" field.
    `

    console.log('[HydrationAdvisor] Sending prompt to AI', {
      promptLength: prompt.length,
      workoutMinutes,
      totalSets: input.totalSetsCompleted,
      isCompoundLeg,
      minutesSinceLastDismiss,
      targetLanguage
    })

    const result = await this.complete<HydrationOutput>(
      prompt,
      targetLanguage,
      undefined  // customTimeoutMs (use default 15s for reasoning='none')
    )

    console.log('[HydrationAdvisor] AI response received', {
      shouldSuggest: result.shouldSuggest,
      messageType: result.messageType,
      confidence: result.confidence,
      urgency: result.urgency,
      reasonPreview: result.reason?.substring(0, 100),
      waterAmount: result.waterAmount
    })

    // Validate result
    if (
      result.shouldSuggest === undefined ||
      !result.messageType ||
      !result.confidence ||
      !result.urgency
    ) {
      console.error('[HydrationAdvisor] Invalid AI response - missing required fields', {
        hasShouldSuggest: result.shouldSuggest !== undefined,
        hasMessageType: !!result.messageType,
        hasConfidence: !!result.confidence,
        hasUrgency: !!result.urgency,
        result
      })
      throw new Error('Invalid hydration suggestion - missing required fields')
    }

    console.log('[HydrationAdvisor] Suggestion validated successfully', {
      decision: result.shouldSuggest ? 'SHOW REMINDER' : 'DO NOT SHOW',
      messageType: result.messageType,
      confidence: result.confidence,
      urgency: result.urgency
    })

    return result
  }
}
