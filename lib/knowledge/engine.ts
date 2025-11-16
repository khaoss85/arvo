import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TrainingApproach } from './types'

export class KnowledgeEngine {
  private supabase: any

  constructor(supabaseClient?: any) {
    // Accept optional Supabase client for server-side usage
    this.supabase = supabaseClient || getSupabaseBrowserClient()
  }

  async loadApproach(approachId: string): Promise<TrainingApproach> {
    const { data, error } = await this.supabase
      .from('training_approaches')
      .select('*')
      .eq('id', approachId)
      .single()

    if (error || !data) {
      throw new Error(`Approach not found: ${approachId}`)
    }

    return {
      id: data.id,
      name: data.name,
      creator: data.creator || '',
      philosophy: data.philosophy || '',
      variables: data.variables as TrainingApproach['variables'],
      progression: data.progression_rules as TrainingApproach['progression'],
      exerciseSelection: data.exercise_rules as TrainingApproach['exerciseSelection'],
      rationales: data.rationales as Record<string, string> || {},

      // Optional Kuba methodology fields (approach-agnostic)
      volumeLandmarks: data.volume_landmarks || undefined,
      frequencyGuidelines: data.frequency_guidelines || undefined,
      romEmphasis: data.rom_emphasis || undefined,
      exerciseSelectionPrinciples: data.exercise_selection_principles || undefined,
      stimulusToFatigue: data.stimulus_to_fatigue || undefined,
      advancedTechniques: data.advanced_techniques || undefined,
      splitVariations: data.split_variations || undefined,
      periodization: data.periodization || undefined
    }
  }

  /**
   * Get recent split modification history for a user
   * Used to provide AI context about user's customization patterns
   */
  async getSplitModificationHistory(userId: string, limit: number = 20) {
    const { data, error } = await this.supabase
      .from('split_modifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching split modification history:', error)
      return []
    }

    return data || []
  }

  /**
   * Build comprehensive user context for AI validation
   * Includes user profile data and optionally modification history
   */
  async buildUserContext(userId: string, options?: {
    includeModificationHistory?: boolean
    modificationHistoryLimit?: number
  }) {
    // Fetch user profile with all context data
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('approach_id, age, experience_years, weak_points, current_mesocycle_week, mesocycle_phase')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    const context: {
      userId: string
      approachId?: string
      experienceYears?: number
      userAge?: number
      weakPoints?: string[]
      mesocycleWeek?: number
      mesocyclePhase?: 'accumulation' | 'intensification' | 'deload' | 'transition'
      modificationHistory?: any[]
    } = {
      userId,
      approachId: profile?.approach_id,
      experienceYears: profile?.experience_years,
      userAge: profile?.age,
      weakPoints: profile?.weak_points || [],
      mesocycleWeek: profile?.current_mesocycle_week,
      mesocyclePhase: profile?.mesocycle_phase as 'accumulation' | 'intensification' | 'deload' | 'transition' | undefined,
    }

    // Include modification history if requested
    if (options?.includeModificationHistory) {
      const limit = options?.modificationHistoryLimit || 20
      context.modificationHistory = await this.getSplitModificationHistory(userId, limit)
    }

    return context
  }

  formatContextForAI(approach: TrainingApproach, aspect: string): string {
    // Format specific aspect of approach for AI context
    switch (aspect) {
      case 'progression':
        return `
Training approach: ${approach.name}
Philosophy: ${approach.philosophy}
Progression priority: ${approach.progression?.priority || 'reps_first'}
When to add weight: ${approach.progression?.rules?.whenToAddWeight || 'When hitting upper rep range'}
Set progression strategy: ${approach.progression?.setProgression?.strategy || 'maintain_weight_add_reps'}
Conditions: ${approach.progression?.setProgression?.conditions || 'N/A'}
        `.trim()

      case 'exercise_selection':
        // Build comprehensive approach context with philosophy and constraints
        // Support multiple variable structures (different approaches structure their variables differently)
        const vars = approach.variables as any
        const setsPerExercise = vars?.setsPerExercise?.working
          || (vars?.sets?.range ? `${vars.sets.range[0]}-${vars.sets.range[1]}` : null)

        // Check for total sets constraint (some approaches prescribe fixed total sets per workout)
        const totalSetsConstraint = vars?.sessionDuration?.totalSets
          ? `\n- TOTAL sets per workout: ${vars.sessionDuration.totalSets[0]}-${vars.sessionDuration.totalSets[1]} sets MAXIMUM`
          : ''

        // Build progression context from approach progression rules or variables
        let progressionContext = ''
        if (approach.progression?.rules?.whenToAddWeight) {
          progressionContext = `\n\n⚠️ PROGRESSION RULE: ${approach.progression.rules.whenToAddWeight}`
        } else if (vars?.sets?.progressionNotes) {
          progressionContext = `\n\n⚠️ PROGRESSION RULE: ${vars.sets.progressionNotes}`
        }

        return `
=== TRAINING APPROACH (PRIMARY CONSTRAINT) ===
Approach: ${approach.name}${approach.creator ? ` by ${approach.creator}` : ''}

PHILOSOPHY (MUST RESPECT):
${approach.philosophy || 'No specific philosophy provided'}

Volume Guidelines (RESPECT THESE CONSTRAINTS):
- Sets per exercise: ${setsPerExercise ? `${setsPerExercise} working sets` : 'Not specified'}${totalSetsConstraint}
- Exercises per workout: ${approach.exerciseSelection?.exercisesPerWorkout?.min || 4}-${approach.exerciseSelection?.exercisesPerWorkout?.max || 6} exercises${progressionContext}

Exercise Selection Philosophy:
- Priority rules: ${approach.exerciseSelection?.priorityRules?.join(', ') || 'Compounds first'}
- Distribution: ${approach.exerciseSelection?.exercisesPerWorkout?.distribution || 'Balanced'}

⚠️ CRITICAL HIERARCHY RULE:
All subsequent context (periodization, caloric phase, session goals) must be modulated WITHIN the constraints above.
If any guidance conflicts with this approach's philosophy or volume guidelines, THE APPROACH WINS.
        `.trim()

      case 'split_planning':
        return `
Training Approach: ${approach.name} by ${approach.creator}
Philosophy: ${approach.philosophy}

Core Training Variables:
- Sets per exercise: ${approach.variables?.setsPerExercise?.working || '2'} working sets
- Rep ranges: Compounds ${approach.variables?.repRanges?.compound?.join('-') || '6-10'}, Isolation ${approach.variables?.repRanges?.isolation?.join('-') || '10-15'}
- RIR targets: Normal=${approach.variables?.rirTarget?.normal || 1}, Intense=${approach.variables?.rirTarget?.intense || 0}, Deload=${approach.variables?.rirTarget?.deload || 3}
- Training frequency: ${approach.variables?.frequency?.weeklyPattern || '3-4 days per week'}

Exercise Selection Philosophy:
- Priority rules: ${approach.exerciseSelection?.priorityRules?.join(', ') || 'Compounds first'}
- Exercises per workout: ${approach.exerciseSelection?.exercisesPerWorkout?.min || 4}-${approach.exerciseSelection?.exercisesPerWorkout?.max || 6}
- Distribution: ${approach.exerciseSelection?.exercisesPerWorkout?.distribution || 'Balanced'}
        `.trim()

      case 'workout_planning':
        // Format approach context for audio coaching script generation
        const approachVars = approach.variables as any
        const coachingCues = approachVars?.coaching_cues || approachVars?.coachingPhilosophy || 'Focus on controlled execution and progressive overload'
        const intensityManagement = approachVars?.intensity_management || approachVars?.intensityGuidelines || 'Build intensity progressively across sets'
        const tempoPhilosophy = approachVars?.tempo_philosophy || approachVars?.tempo?.philosophy ||
          (approachVars?.tempo?.default ? `Default tempo: ${approachVars.tempo.default}` : 'Controlled, deliberate reps with full range of motion')
        const setExecutionStyle = approachVars?.set_execution_style || approachVars?.executionStyle ||
          'Maintain strict form, focus on mind-muscle connection'

        return `
TRAINING METHODOLOGY: ${approach.name}${approach.creator ? ` by ${approach.creator}` : ''}

PHILOSOPHY:
${approach.philosophy || 'Evidence-based progressive overload approach'}

COACHING PRINCIPLES:
${coachingCues}

INTENSITY MANAGEMENT:
${intensityManagement}

SET EXECUTION STYLE:
${setExecutionStyle}

TEMPO PHILOSOPHY:
${tempoPhilosophy}
        `.trim()

      default:
        return JSON.stringify(approach, null, 2)
    }
  }
}
