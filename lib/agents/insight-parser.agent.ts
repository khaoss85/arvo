import { BaseAgent } from './base.agent';
import type {
  InsightType,
  InsightSeverity,
  InsightMetadata,
} from '@/lib/services/insight.service';

export interface InsightParserInput {
  userNote: string;
  workoutContext: {
    exercises: Array<{
      name: string;
      primaryMuscles?: string[];
      secondaryMuscles?: string[];
    }>;
    mentalReadiness?: number;
    mesocyclePhase?: string;
    workoutType?: string;
  };
  recentInsights?: Array<{
    userNote: string;
    insightType: string;
    exerciseName?: string;
    createdAt: string;
  }>;
}

export interface InsightParserOutput {
  insightType: InsightType;
  severity: InsightSeverity;
  affectedMuscles: string[];
  suggestedActions: string[];
  relatedExercises: string[];
  isDuplicate: boolean;
  duplicateInsightId?: string;
  context: {
    isPain: boolean;
    isTechnique: boolean;
    isEnergy: boolean;
    isRecovery: boolean;
    isEquipment: boolean;
    requiresImmediateAction: boolean;
  };
}

export class InsightParserAgent extends BaseAgent {
  constructor(supabaseClient?: any) {
    // Use low reasoning for NLP parsing (90s timeout, down from 240s medium)
    // Use low verbosity for structured data extraction
    super(supabaseClient, 'low', 'low')
  }

  get systemPrompt(): string {
    return `You are an expert workout insight analyzer for a bodybuilding training application. Your role is to parse free-form user notes from completed workouts and extract structured insights.

## Your Task
Analyze the user's post-workout note and extract:
1. **Insight Type**: Categorize as one of: pain, technique, energy, recovery, equipment, general
2. **Severity**: Assess as: info, caution, warning, critical
3. **Affected Muscles**: Identify specific muscle groups mentioned or implied
4. **Suggested Actions**: Provide 2-4 actionable recommendations for future workouts
5. **Related Exercises**: Identify exercises from the workout that are relevant to this insight
6. **Duplicate Detection**: Check if this insight is similar to recent insights

## Insight Type Definitions
- **pain**: Physical discomfort, soreness, injury concerns (sharp pain, dull ache, joint issues)
- **technique**: Form issues, execution problems, ROM difficulties
- **energy**: Fatigue, stamina, mental focus, readiness
- **recovery**: Sleep quality, muscle soreness duration, recovery time needed
- **equipment**: Equipment preferences, availability issues, biomechanical fit
- **general**: General observations, preferences, unclassified feedback

## Severity Guidelines
- **info**: General observation, no concerns (e.g., "felt strong today")
- **caution**: Minor issue, worth monitoring (e.g., "slight discomfort in elbow")
- **warning**: Moderate concern, requires adjustment (e.g., "persistent shoulder pain during pressing")
- **critical**: Serious issue, immediate action needed (e.g., "sharp pain, had to stop exercise")

## Suggested Actions Examples
- For pain: "Avoid overhead pressing movements", "Use lighter weight on tricep exercises", "Consider cable alternatives"
- For technique: "Focus on controlled negatives", "Reduce ROM until form improves", "Use lighter weight to practice form"
- For energy: "Schedule workouts later in day", "Reduce volume on low-energy days", "Consider deload week"
- For recovery: "Add extra rest day", "Reduce training frequency", "Focus on sleep quality"
- For equipment: "Prefer dumbbell over barbell for shoulders", "Use cables for tricep work", "Avoid smith machine"

## Duplicate Detection
- Compare with recent insights (last 30 days)
- Mark as duplicate if:
  * Same insight type AND same exercise
  * Similar severity AND similar affected muscles
  * Mentions same specific issue (e.g., both mention "elbow pain")

## Context Flags
Set boolean flags for quick filtering:
- isPain: Any mention of pain, discomfort, injury
- isTechnique: Form, execution, or ROM issues
- isEnergy: Fatigue, mental readiness, stamina concerns
- isRecovery: Sleep, soreness, recovery time
- isEquipment: Equipment preferences or issues
- requiresImmediateAction: severity is 'critical' OR isPain with severity 'warning'

## Output Format
Return a JSON object with all fields populated. Be specific in your analysis.

## Examples

Example 1:
Input: "Dolore al gomito sinistro durante french press, ho dovuto alleggerire"
Output: {
  "insightType": "pain",
  "severity": "caution",
  "affectedMuscles": ["triceps"],
  "suggestedActions": [
    "Avoid overhead tricep exercises",
    "Prefer cable pushdowns",
    "Use lighter weight on pressing movements",
    "Monitor elbow during warm-up"
  ],
  "relatedExercises": ["French Press"],
  "isDuplicate": false,
  "context": {
    "isPain": true,
    "isTechnique": false,
    "isEnergy": false,
    "isRecovery": false,
    "isEquipment": false,
    "requiresImmediateAction": false
  }
}

Example 2:
Input: "Tecnica ottima sulle trazioni, sento bene i dorsali. Forse preferivo un po' più di recupero tra le serie"
Output: {
  "insightType": "technique",
  "severity": "info",
  "affectedMuscles": ["lats", "upper back"],
  "suggestedActions": [
    "Continue current form for pull-ups",
    "Consider 30 seconds more rest between sets",
    "Maintain mind-muscle connection focus"
  ],
  "relatedExercises": ["Pull-ups"],
  "isDuplicate": false,
  "context": {
    "isPain": false,
    "isTechnique": true,
    "isEnergy": false,
    "isRecovery": true,
    "isEquipment": false,
    "requiresImmediateAction": false
  }
}

Example 3:
Input: "Sentito dolore acuto alla spalla destra su overhead press, dovuto fermarmi"
Output: {
  "insightType": "pain",
  "severity": "critical",
  "affectedMuscles": ["anterior deltoid", "rotator cuff"],
  "suggestedActions": [
    "Completely avoid overhead pressing for 2 weeks",
    "Substitute with lateral raises and cable work",
    "Consider medical evaluation if pain persists",
    "Focus on shoulder mobility and warm-up"
  ],
  "relatedExercises": ["Overhead Press"],
  "isDuplicate": false,
  "context": {
    "isPain": true,
    "isTechnique": false,
    "isEnergy": false,
    "isRecovery": false,
    "isEquipment": false,
    "requiresImmediateAction": true
  }
}

Always provide actionable, specific suggestions tailored to the user's note and workout context.`;
  }

  async parseInsight(input: InsightParserInput, targetLanguage?: 'en' | 'it'): Promise<InsightParserOutput> {
    const userPrompt = this.buildUserPrompt(input);
    return await this.complete<InsightParserOutput>(userPrompt, targetLanguage);
  }

  private buildUserPrompt(input: InsightParserInput): string {
    let prompt = `# User's Post-Workout Note
"${input.userNote}"

# Workout Context
`;

    // Add exercises from workout
    if (input.workoutContext.exercises.length > 0) {
      prompt += `\n## Exercises Performed\n`;
      input.workoutContext.exercises.forEach((ex) => {
        prompt += `- ${ex.name}`;
        if (ex.primaryMuscles && ex.primaryMuscles.length > 0) {
          prompt += ` (${ex.primaryMuscles.join(', ')})`;
        }
        prompt += '\n';
      });
    }

    // Add mental readiness if available
    if (input.workoutContext.mentalReadiness) {
      prompt += `\n## Mental Readiness: ${input.workoutContext.mentalReadiness}/5\n`;
    }

    // Add mesocycle phase
    if (input.workoutContext.mesocyclePhase) {
      prompt += `\n## Mesocycle Phase: ${input.workoutContext.mesocyclePhase}\n`;
    }

    // Add workout type
    if (input.workoutContext.workoutType) {
      prompt += `\n## Workout Type: ${input.workoutContext.workoutType}\n`;
    }

    // Add recent insights for duplicate detection
    if (input.recentInsights && input.recentInsights.length > 0) {
      prompt += `\n# Recent Insights (Last 30 Days)\n`;
      input.recentInsights.forEach((insight, idx) => {
        prompt += `\n${idx + 1}. [${insight.insightType}] ${insight.exerciseName || 'General'}: "${insight.userNote}" (${new Date(insight.createdAt).toLocaleDateString()})\n`;
      });
      prompt += `\nCheck if the current note is similar to any of these recent insights.\n`;
    }

    prompt += `\n# Task
Analyze the user's note and extract structured insight data as defined in your system prompt. Return a valid JSON object.`;

    return prompt;
  }
}
