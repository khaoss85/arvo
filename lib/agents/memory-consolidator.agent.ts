import { BaseAgent } from './base.agent';
import type { MemoryCategory, MemorySource } from '@/lib/services/memory.service';
import { getExerciseName } from '@/lib/utils/exercise-helpers';

export interface MemoryConsolidatorInput {
  userId: string;
  timeWindow: '30d' | '90d' | 'all';
  workoutHistory: Array<{
    id: string;
    completedAt: string;
    mentalReadiness?: number;
    duration: number;
    exercises: Array<{
      name: string;
      primaryMuscles?: string[];
    }>;
  }>;
  substitutionHistory?: Array<{
    originalExercise: string;
    replacementExercise: string;
    reason?: string;
    timestamp: string;
  }>;
  existingInsights: Array<{
    id: string;
    type: string;
    severity: string;
    userNote: string;
    exerciseName?: string;
    status: string;
  }>;
  existingMemories: Array<{
    id: string;
    category: string;
    title: string;
    confidence: number;
    relatedExercises: string[];
  }>;
  userProfile: {
    experienceYears?: number;
    weakPoints?: string[];
    availableEquipment?: string[];
    mesocyclePhase?: string;
  };
}

export interface DetectedPattern {
  type: 'substitution' | 'timing' | 'volume' | 'mental_readiness' | 'exercise_preference' | 'recovery';
  description: string;
  confidence: number;
  evidence: string[];
  suggestedMemory: {
    category: MemoryCategory;
    title: string;
    description: string;
    relatedExercises?: string[];
    relatedMuscles?: string[];
  };
}

export interface MemorySuggestion {
  action: 'create' | 'update' | 'archive';
  memoryId?: string;
  category: MemoryCategory;
  title: string;
  description: string;
  confidence: number;
  source: MemorySource;
  relatedExercises?: string[];
  relatedMuscles?: string[];
  reason: string;
}

export interface MemoryConsolidatorOutput {
  patternsDetected: DetectedPattern[];
  memorySuggestions: MemorySuggestion[];
  insightsToResolve: Array<{
    insightId: string;
    reason: string;
  }>;
  memoriesToArchive: Array<{
    memoryId: string;
    reason: string;
  }>;
  summary: string;
}

export class MemoryConsolidatorAgent extends BaseAgent {
  protected reasoningEffort: 'low' | 'medium' | 'high' = 'high';

  get systemPrompt(): string {
    return `You are an expert pattern recognition agent for a bodybuilding training application. Your role is to analyze historical workout data, insights, and user behavior to consolidate knowledge into actionable memory entries.

## Your Task
Analyze the provided data to:
1. **Detect Patterns**: Identify recurring behaviors, preferences, limitations, and strengths
2. **Suggest Memory Updates**: Recommend creating, updating, or archiving memory entries
3. **Propose Insight Resolutions**: Identify insights that are no longer relevant
4. **Consolidate Knowledge**: Build a coherent understanding of what the system has learned about the user

## Pattern Types to Detect

### 1. Substitution Patterns
- User consistently replaces Exercise A with Exercise B
- **Confidence threshold**: 3+ substitutions in time window
- **Example**: "3 times replaced Barbell Shoulder Press with Dumbbell Shoulder Press"
- **Memory category**: equipment or preference

### 2. Timing Patterns
- User performs better at certain times of day
- **Evidence**: Mental readiness scores, workout completion times
- **Example**: "Mental readiness avg 4.2/5 between 18:00-20:00 vs 3.1/5 between 7:00-9:00"
- **Memory category**: pattern

### 3. Volume Patterns
- User responds better to specific set/rep schemes
- **Evidence**: Mental readiness, workout completion consistency
- **Example**: "Higher mental readiness on 4x8-10 vs 3x5 heavy"
- **Memory category**: pattern

### 4. Mental Readiness Trends
- Consistent low/high mental readiness for specific exercises or workout types
- **Example**: "Consistently low mental readiness (avg 2.8/5) on leg days"
- **Memory category**: pattern or limitation

### 5. Exercise Preferences
- User performs certain exercises more frequently or with better results
- **Evidence**: Exercise frequency, mental readiness, lack of substitutions
- **Example**: "Prefers cable exercises for triceps, used in 8/10 push workouts"
- **Memory category**: preference

### 6. Recovery Patterns
- User needs more/less recovery for specific muscle groups
- **Evidence**: Mental readiness trends, workout spacing
- **Example**: "Consistently low energy when training shoulders < 3 days apart"
- **Memory category**: recovery or limitation

## Memory Suggestion Guidelines

### Create New Memory
- Pattern detected with confidence ≥ 0.7
- No existing similar memory
- Clear actionable insight

### Update Existing Memory
- Pattern reinforces existing memory (boost confidence)
- New evidence for existing pattern (times_confirmed++)
- Pattern contradicts outdated memory (update description)

### Archive Memory
- No evidence in recent time window (60+ days)
- Pattern contradicted by recent behavior
- Insight resolved and no longer relevant

## Insight Resolution Criteria
Suggest resolving an insight if:
- Not mentioned in last 3+ workouts after occurrence
- Related exercise performed without issue 3+ times
- User has adapted (e.g., switched equipment, adjusted form)

## Confidence Score Calculation
- 0.5-0.6: Weak pattern (2 occurrences)
- 0.7-0.8: Moderate pattern (3-4 occurrences)
- 0.9+: Strong pattern (5+ occurrences or clear evidence)

## Output Format
Return a JSON object with:
1. **patternsDetected**: Array of identified patterns with evidence
2. **memorySuggestions**: Specific actions to take on memories
3. **insightsToResolve**: Insights that should be marked as resolved
4. **memoriesToArchive**: Memories that are no longer relevant
5. **summary**: Brief text summary of findings

## Example Output

{
  "patternsDetected": [
    {
      "type": "substitution",
      "description": "User consistently prefers dumbbell over barbell for shoulder pressing",
      "confidence": 0.85,
      "evidence": [
        "3 substitutions from Barbell Shoulder Press to Dumbbell Shoulder Press in 30 days",
        "No pain/injury insights for dumbbell variant",
        "Mental readiness avg 4.3/5 on dumbbell vs 3.2/5 on barbell"
      ],
      "suggestedMemory": {
        "category": "equipment",
        "title": "Prefers dumbbell for shoulder pressing",
        "description": "User consistently chooses dumbbell shoulder press over barbell. Better mind-muscle connection and no discomfort.",
        "relatedExercises": ["Dumbbell Shoulder Press", "Barbell Shoulder Press"],
        "relatedMuscles": ["anterior deltoid", "lateral deltoid"]
      }
    }
  ],
  "memorySuggestions": [
    {
      "action": "create",
      "category": "equipment",
      "title": "Prefers dumbbell for shoulder pressing",
      "description": "User consistently chooses dumbbell shoulder press over barbell. Better mind-muscle connection and no discomfort.",
      "confidence": 0.85,
      "source": "substitution_history",
      "relatedExercises": ["Dumbbell Shoulder Press"],
      "relatedMuscles": ["anterior deltoid", "lateral deltoid"],
      "reason": "Strong pattern of 3 substitutions with improved mental readiness"
    }
  ],
  "insightsToResolve": [
    {
      "insightId": "abc-123",
      "reason": "Elbow pain not mentioned in 4 consecutive workouts. French press performed successfully 2x."
    }
  ],
  "memoriesToArchive": [],
  "summary": "Detected 1 strong pattern: User prefers dumbbell over barbell for shoulder work. Suggested creating memory entry. 1 insight can be resolved (elbow pain)."
}

Be thorough in your analysis and only suggest high-confidence patterns.`;
  }

  async consolidateMemories(
    input: MemoryConsolidatorInput
  ): Promise<MemoryConsolidatorOutput> {
    const userPrompt = this.buildUserPrompt(input);
    return await this.complete<MemoryConsolidatorOutput>(userPrompt);
  }

  private buildUserPrompt(input: MemoryConsolidatorInput): string {
    let prompt = `# User ID: ${input.userId}
# Time Window: ${input.timeWindow}

# Workout History (${input.workoutHistory.length} workouts)
`;

    // Summarize workouts
    input.workoutHistory.forEach((workout, idx) => {
      prompt += `\n## Workout ${idx + 1} - ${new Date(workout.completedAt).toLocaleDateString()}`;
      if (workout.mentalReadiness) {
        prompt += ` (Mental Readiness: ${workout.mentalReadiness}/5)`;
      }
      prompt += `\nExercises: ${workout.exercises.map((e) => getExerciseName(e)).join(', ')}\n`;
    });

    // Substitution history
    if (input.substitutionHistory && input.substitutionHistory.length > 0) {
      prompt += `\n# Substitution History (${input.substitutionHistory.length} substitutions)\n`;
      input.substitutionHistory.forEach((sub, idx) => {
        prompt += `\n${idx + 1}. ${sub.originalExercise} → ${sub.replacementExercise}`;
        if (sub.reason) {
          prompt += ` (Reason: ${sub.reason})`;
        }
        prompt += ` - ${new Date(sub.timestamp).toLocaleDateString()}`;
      });
      prompt += '\n';
    }

    // Existing insights
    if (input.existingInsights.length > 0) {
      prompt += `\n# Existing Insights (${input.existingInsights.length})\n`;
      input.existingInsights.forEach((insight, idx) => {
        prompt += `\n${idx + 1}. [${insight.type}/${insight.severity}] ${insight.exerciseName || 'General'}: "${insight.userNote}" (Status: ${insight.status})`;
      });
      prompt += '\n';
    }

    // Existing memories
    if (input.existingMemories.length > 0) {
      prompt += `\n# Existing Memories (${input.existingMemories.length})\n`;
      input.existingMemories.forEach((memory, idx) => {
        prompt += `\n${idx + 1}. [${memory.category}] ${memory.title} (Confidence: ${(memory.confidence * 100).toFixed(0)}%)`;
        if (memory.relatedExercises.length > 0) {
          prompt += ` - Exercises: ${memory.relatedExercises.join(', ')}`;
        }
      });
      prompt += '\n';
    }

    // User profile
    prompt += `\n# User Profile\n`;
    if (input.userProfile.experienceYears) {
      prompt += `- Experience: ${input.userProfile.experienceYears} years\n`;
    }
    if (input.userProfile.weakPoints && input.userProfile.weakPoints.length > 0) {
      prompt += `- Weak Points: ${input.userProfile.weakPoints.join(', ')}\n`;
    }
    if (input.userProfile.availableEquipment && input.userProfile.availableEquipment.length > 0) {
      prompt += `- Equipment: ${input.userProfile.availableEquipment.join(', ')}\n`;
    }
    if (input.userProfile.mesocyclePhase) {
      prompt += `- Mesocycle Phase: ${input.userProfile.mesocyclePhase}\n`;
    }

    prompt += `\n# Task
Analyze all the data above and:
1. Detect recurring patterns (substitutions, timing, preferences, limitations)
2. Suggest memory actions (create, update, archive)
3. Identify insights that can be resolved
4. Identify memories that should be archived

Return a structured JSON response as defined in your system prompt.`;

    return prompt;
  }
}
