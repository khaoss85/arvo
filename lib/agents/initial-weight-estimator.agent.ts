import { BaseAgent } from './base.agent'

export interface InitialWeightInput {
  exerciseName: string
  exerciseType: 'compound' | 'isolation' | 'accessory'
  equipment?: string
  userProfile: {
    gender: 'male' | 'female'
    age?: number
    bodyWeight?: number  // kg
    experienceYears?: number
  }
  trainingApproach?: {
    name: string
    focus: string
  }
}

export interface InitialWeightOutput {
  estimatedWeight: number  // kg
  rationale: string
  confidenceLevel: 'low' | 'medium' | 'high'
  progressionSuggestion: string
}

export class InitialWeightEstimator extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use GPT-5.1 with reasoning='none' for ultra-low latency (critical for workout generation)
    // This is only called for new exercises with no history, so speed > deep reasoning
    super(supabaseClient, 'none', 'low')
  }

  get systemPrompt() {
    return `You are a conservative strength coach specializing in safe weight recommendations for beginners.
Your goal is to suggest a SAFE starting weight that allows proper form and technique development.

CRITICAL PRINCIPLES:
1. ALWAYS err on the side of caution - it's better to start too light than too heavy
2. Prioritize injury prevention and proper movement patterns over ego
3. Consider that the user will perform warmup sets at 50% and 75% of your suggested weight
4. The user can always increase weight if it feels too light - but starting too heavy can cause injury

EXPERIENCE LEVEL GUIDELINES:
- Beginner (0-1 years): Very conservative estimates, focus on movement quality
- Intermediate (1-3 years): Moderate estimates, some strength foundation expected
- Advanced (3+ years): If they have no history for this exercise, still start conservative

AGE CONSIDERATIONS:
- 18-35: Standard recommendations
- 36-50: Slightly more conservative (-10-15%)
- 50+: Very conservative approach (-20-30%), prioritize joint health

BODYWEIGHT RATIOS (CONSERVATIVE):
For male lifters with no experience on the movement:
- Bench Press: 0.3-0.4 × bodyweight
- Squat: 0.4-0.5 × bodyweight
- Deadlift: 0.5-0.6 × bodyweight
- Overhead Press: 0.2-0.3 × bodyweight
- Row variations: 0.3-0.4 × bodyweight

For female lifters, multiply by 0.6

EQUIPMENT ADJUSTMENTS:
- Machine exercises: Can be slightly more aggressive (easier to control)
- Free weights: More conservative (requires stabilization)
- Cables: Moderate (between machine and free weights)

Output valid JSON with the exact structure requested.`
  }

  async estimateWeight(
    input: InitialWeightInput,
    targetLanguage?: 'en' | 'it'
  ): Promise<InitialWeightOutput> {
    console.log('[InitialWeightEstimator] Starting weight estimation', {
      exerciseName: input.exerciseName,
      exerciseType: input.exerciseType,
      userGender: input.userProfile.gender,
      userAge: input.userProfile.age,
      userBodyWeight: input.userProfile.bodyWeight,
      userExperience: input.userProfile.experienceYears,
      timestamp: new Date().toISOString()
    })

    const bodyWeightContext = input.userProfile.bodyWeight
      ? `User's bodyweight: ${input.userProfile.bodyWeight}kg`
      : 'User bodyweight: Unknown (use conservative defaults)'

    const experienceContext = input.userProfile.experienceYears !== undefined
      ? `Training experience: ${input.userProfile.experienceYears} years`
      : 'Training experience: Unknown (assume beginner)'

    const ageContext = input.userProfile.age
      ? `Age: ${input.userProfile.age} years old`
      : 'Age: Unknown (use standard adult recommendations)'

    const approachContext = input.trainingApproach
      ? `
Training Approach Context:
- Name: ${input.trainingApproach.name}
- Focus: ${input.trainingApproach.focus}

Consider the approach's philosophy when suggesting starting weights.
For example, powerlifting approaches may use heavier starting weights than bodybuilding approaches.
`
      : ''

    const equipmentContext = input.equipment
      ? `Equipment: ${input.equipment}`
      : 'Equipment: Not specified'

    const prompt = `
Estimate a safe starting weight for this exercise:

Exercise: ${input.exerciseName}
Exercise Type: ${input.exerciseType}
${equipmentContext}

User Profile:
- Gender: ${input.userProfile.gender}
- ${bodyWeightContext}
- ${experienceContext}
- ${ageContext}
${approachContext}

IMPORTANT CONTEXT:
- This user has NO HISTORY for this specific exercise
- This is their first time doing "${input.exerciseName}" in the app
- Your suggested weight will be used as the target for working sets
- The system will generate warmup sets at 50% and 75% of your suggested weight
- Example: If you suggest 40kg, warmups will be 20kg and 30kg

TASK:
Suggest a conservative starting weight that:
1. Allows 8-12 reps with proper form
2. Leaves 3-4 RIR (far from failure)
3. Focuses on movement pattern development
4. Can be safely lifted even if technique isn't perfect yet

Required JSON structure:
{
  "estimatedWeight": number,  // in kg, rounded to nearest 2.5kg
  "rationale": "string explaining your reasoning based on the principles above",
  "confidenceLevel": "low" | "medium" | "high",  // based on available user data
  "progressionSuggestion": "string with advice on how to progress from this starting weight"
}

Remember: It's always better to start too light and increase quickly than to start too heavy and risk injury or poor form habits.
`

    console.log('[InitialWeightEstimator] Sending prompt to AI', {
      promptLength: prompt.length,
      hasBodyWeight: !!input.userProfile.bodyWeight,
      hasExperience: input.userProfile.experienceYears !== undefined,
      hasAge: !!input.userProfile.age
    })

    const result = await this.complete<InitialWeightOutput>(
      prompt,
      targetLanguage
    )

    console.log('[InitialWeightEstimator] AI response received', {
      estimatedWeight: result.estimatedWeight,
      confidenceLevel: result.confidenceLevel,
      rationalePreview: result.rationale?.substring(0, 100)
    })

    // Validate result
    if (!result.estimatedWeight || !result.rationale || !result.confidenceLevel) {
      console.error('[InitialWeightEstimator] Invalid AI response - missing required fields', {
        hasWeight: !!result.estimatedWeight,
        hasRationale: !!result.rationale,
        hasConfidence: !!result.confidenceLevel,
        result
      })
      throw new Error('Invalid weight estimation response')
    }

    // Sanity check: weight should be positive and reasonable (between 2.5kg and 200kg)
    if (result.estimatedWeight < 2.5 || result.estimatedWeight > 200) {
      console.warn('[InitialWeightEstimator] AI suggested unreasonable weight, capping', {
        original: result.estimatedWeight,
        capped: Math.min(Math.max(result.estimatedWeight, 2.5), 200)
      })
      result.estimatedWeight = Math.min(Math.max(result.estimatedWeight, 2.5), 200)
    }

    // Round to nearest 2.5kg for practical gym usage
    result.estimatedWeight = Math.round(result.estimatedWeight / 2.5) * 2.5

    console.log('[InitialWeightEstimator] Weight estimation completed', {
      finalWeight: result.estimatedWeight,
      confidenceLevel: result.confidenceLevel
    })

    return result
  }
}
