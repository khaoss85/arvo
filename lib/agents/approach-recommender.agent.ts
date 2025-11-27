import { BaseAgent } from './base.agent'
import type { SportGoal } from '@/lib/types/schemas'

/**
 * Input for approach recommendation
 */
export interface ApproachRecommendationInput {
  availableEquipment: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingObjective: 'bulk' | 'cut' | 'maintain' | 'recomp' | null
  sportGoal: SportGoal
  weeklyFrequency: number
  age?: number | null
  gender?: 'male' | 'female' | 'other' | null
}

/**
 * Output from approach recommendation
 */
export interface ApproachRecommendationOutput {
  recommendedApproachId: string
  rationale: string
  confidence: number
  alternatives?: Array<{
    approachId: string
    reason: string
  }>
}

/**
 * Approach Recommender Agent
 *
 * Recommends the best training approach based on:
 * - Available equipment
 * - Experience level
 * - Training objectives (bulk/cut/maintain)
 * - Sport-specific goals (running, hyrox, skiing, etc.)
 * - Weekly training frequency
 * - Demographics (age, gender)
 *
 * Uses KISS approach: Simple AI agent with smart prompt, no complex ML.
 */
export class ApproachRecommender extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use low reasoning for fast recommendations
    super(supabaseClient, 'low', 'low')
  }

  get systemPrompt() {
    return `You are an expert strength and conditioning coach specializing in matching athletes to optimal training approaches.

Your role is to recommend the BEST training approach from the available catalog based on the user's:
1. Equipment availability
2. Experience level
3. Training goals (hypertrophy, strength, sport-specific)
4. Weekly training frequency
5. Demographics

APPROACH CATALOG OVERVIEW:
========================

**BODYBUILDING APPROACHES (Hypertrophy-focused):**

1. **Kuba Method** - Progressive overload with RIR-based training
   - Best for: Intermediates, 3-6 days/week, balanced equipment
   - Equipment: Needs barbells + machines for optimal results
   - Philosophy: Scientific hypertrophy with controlled progression

2. **FST-7** (Fascia Stretch Training) - High volume with pump focus
   - Best for: Intermediates-Advanced, 4-5 days/week
   - Equipment: Needs cable machines for 7-set finishers
   - Philosophy: Extreme pump, fascia stretching, bodybuilding

3. **Y3T** (Yoda 3 Training) - Rotating intensity weeks
   - Best for: Advanced, 4-5 days/week
   - Equipment: Full gym recommended
   - Philosophy: Periodized intensity cycling

4. **Heavy Duty** (Mike Mentzer) - Low volume, high intensity
   - Best for: All levels, 2-3 days/week, MINIMAL equipment OK
   - Equipment: Works with basic equipment (barbell + dumbbells)
   - Philosophy: Train to failure, minimal volume, maximum recovery

5. **Mountain Dog** - Pump-focused with specific exercise order
   - Best for: Intermediate-Advanced, 4-5 days/week
   - Equipment: Full gym with specialty machines
   - Philosophy: Exercise sequencing, blood flow, joint health

**POWERLIFTING APPROACHES (Strength-focused):**

6. **Wendler 5/3/1** - Percentage-based progression
   - Best for: All levels, 3-4 days/week, MINIMAL equipment OK
   - Equipment: Only needs barbell (perfect for home gym)
   - Philosophy: Slow steady progress, submaximal training
   - EXCELLENT for athletes (running, cycling, hyrox) - leaves energy for sport

7. **Sheiko** - High frequency, technical focus
   - Best for: Intermediate-Advanced, 4-5 days/week
   - Equipment: Full powerlifting gym (barbell, rack, bench)
   - Philosophy: High volume, technical mastery, competition prep

8. **Westside/Conjugate** - Max Effort + Dynamic Effort
   - Best for: Advanced, 4 days/week
   - Equipment: REQUIRES specialty equipment (chains, bands, specialty bars)
   - Philosophy: Conjugate method, accommodating resistance

9. **RTS/DUP** - Autoregulated, RPE-based
   - Best for: Intermediate-Advanced, 3-5 days/week
   - Equipment: Barbell essential, machines optional
   - Philosophy: Daily readiness, fatigue management

SPORT-SPECIFIC RECOMMENDATIONS:
==============================

For ENDURANCE sports (running, cycling, triathlon, swimming):
- Prioritize: Wendler 5/3/1 (minimal CNS fatigue, leaves energy for cardio)
- Avoid: High-volume approaches (FST-7, Mountain Dog)
- Goal: Strength maintenance, injury prevention, minimal interference

For FUNCTIONAL FITNESS (hyrox, crossfit):
- Prioritize: Wendler 5/3/1, Kuba Method
- Consider: Conditioning-friendly splits
- Goal: Strength + work capacity balance

For PRE-SPORT conditioning (skiing, soccer, martial arts):
- Prioritize: Wendler 5/3/1, Kuba Method, RTS/DUP
- Focus: Sport-specific strength, injury prevention
- Goal: Functional strength transfer

For CLIMBING:
- Prioritize: Heavy Duty (minimal volume), Wendler 5/3/1
- Focus: Grip strength, pulling power, low bodyweight
- Avoid: High-volume approaches that add bulk

EQUIPMENT REQUIREMENTS:
======================

Minimal equipment (home gym with barbell + dumbbells):
- Wendler 5/3/1 ✓
- Heavy Duty ✓
- RTS/DUP ✓
- Kuba Method (limited)

Full gym required:
- FST-7 (needs cables)
- Mountain Dog (needs specialty machines)
- Y3T (needs variety)

Specialty equipment required:
- Westside (chains, bands, specialty bars)
- Sheiko (competition equipment)

OUTPUT FORMAT:
Return valid JSON with this exact structure. Be concise but informative.`
  }

  /**
   * Get approach recommendation based on user input
   */
  async recommend(
    input: ApproachRecommendationInput,
    availableApproaches: Array<{ id: string; name: string; category: string; recommendedLevel?: string | null }>,
    targetLanguage: 'en' | 'it' = 'en'
  ): Promise<ApproachRecommendationOutput> {
    console.log('[ApproachRecommender] Starting recommendation', {
      equipmentCount: input.availableEquipment.length,
      experience: input.experienceLevel,
      objective: input.trainingObjective,
      sportGoal: input.sportGoal,
      frequency: input.weeklyFrequency,
      availableApproachesCount: availableApproaches.length
    })

    // Build equipment context
    const hasBarbell = input.availableEquipment.includes('barbell')
    const hasDumbbells = input.availableEquipment.includes('dumbbells')
    const hasCables = input.availableEquipment.some(e =>
      e.includes('cable') || e.includes('lat_pulldown') || e.includes('seated_cable_row')
    )
    const hasChains = input.availableEquipment.includes('chains')
    const hasBands = input.availableEquipment.includes('resistance_bands')
    const hasMachines = input.availableEquipment.some(e =>
      e.includes('machine') || e.includes('leg_press') || e.includes('hack_squat')
    )

    const equipmentProfile = `
Equipment Profile:
- Has Barbell: ${hasBarbell ? 'Yes' : 'No'}
- Has Dumbbells: ${hasDumbbells ? 'Yes' : 'No'}
- Has Cables: ${hasCables ? 'Yes' : 'No'}
- Has Machines: ${hasMachines ? 'Yes' : 'No'}
- Has Chains: ${hasChains ? 'Yes' : 'No'}
- Has Bands: ${hasBands ? 'Yes' : 'No'}
- Total Equipment Items: ${input.availableEquipment.length}
- Equipment List: ${input.availableEquipment.slice(0, 15).join(', ')}${input.availableEquipment.length > 15 ? '...' : ''}
`

    // Build sport goal context
    const sportGoalMap: Record<string, string> = {
      none: 'No specific sport goal - general fitness/aesthetics',
      running: 'Running/Marathon - needs to preserve energy for cardio, minimize muscle soreness',
      swimming: 'Swimming - needs shoulder health, functional strength without bulk',
      cycling: 'Cycling - leg strength important but minimal upper body interference',
      soccer: 'Soccer - explosive power, injury prevention, sport-specific conditioning',
      skiing: 'Pre-Ski Conditioning - leg strength, core stability, injury prevention',
      hyrox: 'Hyrox Competition - strength + conditioning balance, work capacity',
      triathlon: 'Triathlon - minimal gym time, efficient strength maintenance',
      climbing: 'Rock Climbing - grip strength, pulling power, low bodyweight priority',
      martial_arts: 'Martial Arts - explosive power, functional strength, flexibility',
      other: 'Other sport-specific goal'
    }

    const sportContext = input.sportGoal !== 'none'
      ? `\n**SPORT-SPECIFIC CONTEXT:**\nUser is training for: ${sportGoalMap[input.sportGoal] || input.sportGoal}\nThis is a PRIMARY consideration - recommend approaches that support this sport goal.`
      : ''

    const prompt = `
Recommend the best training approach for this user:

**USER PROFILE:**
- Experience Level: ${input.experienceLevel}
- Training Objective: ${input.trainingObjective || 'Not specified (assume general fitness)'}
- Weekly Training Frequency: ${input.weeklyFrequency} days/week
${input.age ? `- Age: ${input.age} years` : ''}
${input.gender ? `- Gender: ${input.gender}` : ''}

${equipmentProfile}
${sportContext}

**AVAILABLE APPROACHES:**
${availableApproaches.map(a => `- ${a.name} (ID: ${a.id}, Category: ${a.category}${a.recommendedLevel ? `, Level: ${a.recommendedLevel}` : ''})`).join('\n')}

**INSTRUCTIONS:**
1. Analyze the user's equipment, experience, goals, and sport requirements
2. Select the BEST matching approach from the available list
3. Consider equipment limitations as HARD constraints (if they don't have equipment, they CAN'T use that approach)
4. ${input.sportGoal !== 'none' ? 'Prioritize approaches that support their sport goal' : 'Prioritize approaches matching their training objective'}
5. Provide 1-2 alternatives if reasonable

**OUTPUT:**
Return JSON with:
- recommendedApproachId: The UUID of the best approach
- rationale: ${targetLanguage === 'it' ? 'Spiegazione in italiano (2-3 frasi)' : 'Explanation in English (2-3 sentences)'}
- confidence: 0-1 (how confident you are in this recommendation)
- alternatives: Array of {approachId, reason} for 1-2 alternatives (if any make sense)

{
  "recommendedApproachId": "uuid-here",
  "rationale": "Brief explanation of why this approach is best for them",
  "confidence": 0.85,
  "alternatives": [
    { "approachId": "uuid-here", "reason": "Brief reason why this is also suitable" }
  ]
}
`

    const result = await this.complete<ApproachRecommendationOutput>(prompt, targetLanguage)

    // Validate that the recommended approach exists in our list
    const validApproachIds = new Set(availableApproaches.map(a => a.id))
    if (!validApproachIds.has(result.recommendedApproachId)) {
      console.error('[ApproachRecommender] AI recommended invalid approach ID:', result.recommendedApproachId)
      // Fallback to first approach matching experience level
      const fallback = availableApproaches.find(a =>
        a.recommendedLevel === input.experienceLevel || a.recommendedLevel === 'all_levels'
      ) || availableApproaches[0]
      result.recommendedApproachId = fallback.id
      result.rationale = `Based on your experience level, we recommend ${fallback.name}.`
      result.confidence = 0.5
    }

    // Validate alternatives
    if (result.alternatives) {
      result.alternatives = result.alternatives.filter(alt => validApproachIds.has(alt.approachId))
    }

    console.log('[ApproachRecommender] Recommendation complete', {
      recommendedId: result.recommendedApproachId,
      confidence: result.confidence,
      alternativesCount: result.alternatives?.length || 0
    })

    return result
  }
}
