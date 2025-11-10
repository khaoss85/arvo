# Workout Insights & User Memory System - Implementation Guide

## Status: Foundation Complete ✅

This document provides implementation guidance for completing the Insights & Memory system.

---

## ✅ **Completed** (Foundation)

### 1. Database Layer
- ✅ `workout_insights` table created with full schema
- ✅ `user_memory_entries` table created with full schema
- ✅ `workouts.user_notes` column added
- ✅ Helper functions: `get_active_insights()`, `get_active_memories()`, `boost_memory_confidence()`, `update_insight_relevance_scores()`
- ✅ RLS policies configured
- ✅ Indexes for performance

### 2. TypeScript Types
- ✅ Database types regenerated with new tables

### 3. Service Layer
- ✅ `lib/services/insight.service.ts` - Complete CRUD operations for insights
- ✅ `lib/services/memory.service.ts` - Complete CRUD operations for memories

### 4. AI Agents
- ✅ `lib/agents/insight-parser.agent.ts` - Parses free-form notes into structured insights
- ✅ `lib/agents/memory-consolidator.agent.ts` - Analyzes patterns and consolidates memories
- ✅ `lib/agents/exercise-selector.agent.ts` - Extended with `activeInsights` and `activeMemories` input + `insightInfluencedChanges` output

---

## 🚧 **Remaining Implementation** (To Be Completed)

### Phase 1: Agent Extensions (HIGH PRIORITY)

#### 1.1. Complete ExerciseSelectorAgent Integration
**File**: `lib/agents/exercise-selector.agent.ts`

**What to do:**
```typescript
// In the selectExercises() method, after loading approach and context:

// Add insights/memories context to the prompt
let insightsContext = '';
if (input.activeInsights && input.activeInsights.length > 0) {
  insightsContext += '\n## Active User Insights\n';
  input.activeInsights.forEach(insight => {
    insightsContext += `- [${insight.severity}/${insight.type}] ${insight.exerciseName || 'General'}: "${insight.userNote}"\n`;
    if (insight.severity === 'critical' || insight.severity === 'warning') {
      insightsContext += `  ⚠️ ACTION REQUIRED: `;
      if (insight.exerciseName) {
        insightsContext += `Avoid or substitute ${insight.exerciseName}\n`;
      }
    }
  });
}

let memoriesContext = '';
if (input.activeMemories && input.activeMemories.length > 0) {
  memoriesContext += '\n## User Preferences & Patterns (Learned)\n';
  input.activeMemories.forEach(memory => {
    memoriesContext += `- [${memory.category}] ${memory.title} (confidence: ${(memory.confidenceScore * 100).toFixed(0)}%)\n`;
    if (memory.description) {
      insightsContext += `  ${memory.description}\n`;
    }
    if (memory.relatedExercises.length > 0) {
      insightsContext += `  Related: ${memory.relatedExercises.join(', ')}\n`;
    }
  });
}

// Add to userPrompt before sending to AI
const fullPrompt = `${userPrompt}${insightsContext}${memoriesContext}

**IMPORTANT**:
- AVOID exercises with critical/warning insights
- PREFER exercises that match user memories (equipment, patterns)
- Include "insightInfluencedChanges" array in your output to document any substitutions/preferences applied
`;

// After AI response, populate insightInfluencedChanges field
```

**Expected Output Enhancement:**
```typescript
{
  exercises: [...],
  workoutRationale: "...",
  weakPointAddress: "...",
  insightInfluencedChanges: [
    {
      source: 'insight',
      sourceId: 'insight-123',
      sourceTitle: 'Dolore gomito su overhead tricep',
      action: 'substituted',
      originalExercise: 'French Press',
      selectedExercise: 'Cable Tricep Pushdown',
      reason: 'Avoided overhead tricep due to elbow pain (severity: caution)'
    },
    {
      source: 'memory',
      sourceId: 'memory-456',
      sourceTitle: 'Preferisce dumbbell per spalle',
      action: 'preferred',
      selectedExercise: 'Dumbbell Shoulder Press',
      reason: 'User consistently chooses dumbbell over barbell (confidence: 85%)'
    }
  ]
}
```

---

#### 1.2. Extend ProgressionCalculatorAgent
**File**: `lib/agents/progression-calculator.agent.ts`

**Changes needed:**
1. Add to `ProgressionInput`:
```typescript
activeInsights?: Array<{
  exerciseName?: string;
  type: string;
  severity: string;
}>;
```

2. In `calculateProgression()` method, check if current exercise has active insights:
```typescript
const relevantInsights = input.activeInsights?.filter(
  i => i.exerciseName === input.exercise.name && i.type === 'pain'
);

if (relevantInsights && relevantInsights.length > 0) {
  // Add to prompt: "User has reported pain on this exercise. Be conservative with progression."
}
```

3. Adjust suggestions to be more conservative if pain/injury insights exist.

---

#### 1.3. Extend ExerciseSubstitutionAgent
**File**: `lib/agents/exercise-substitution.agent.ts`

**Changes needed:**
1. Add to `SubstitutionInput`:
```typescript
activeInsights?: Array<{...}>;
activeMemories?: Array<{...}>;
```

2. In `validateSubstitution()`, filter suggestions to avoid exercises with insights

3. **NEW**: After successful substitution (user confirms), create a memory entry if it's a recurring pattern:
```typescript
// In the calling code (after user confirms substitution)
import { memoryService } from '@/lib/services/memory.service';

// Check if this is 3rd+ substitution
const similarMemories = await memoryService.findSimilarMemories(
  userId,
  `Prefers ${replacementExercise} over ${originalExercise}`,
  'equipment',
  [originalExercise, replacementExercise]
);

if (similarMemories.length === 0) {
  // First substitution - create memory with low confidence
  await memoryService.createMemory({
    userId,
    category: 'equipment',
    source: 'substitution_history',
    title: `Prefers ${replacementExercise} for ${muscleGroup}`,
    description: `User substituted ${originalExercise} with ${replacementExercise}`,
    confidenceScore: 0.5,
    relatedExercises: [originalExercise, replacementExercise],
    metadata: { substitutionCount: 1 }
  });
} else {
  // Boost existing memory confidence
  await memoryService.boostConfidence(similarMemories[0].id, 0.15);
}
```

---

#### 1.4. Extend InsightsGeneratorAgent
**File**: `lib/agents/insights-generator.agent.ts`

**Changes needed:**
1. Add to `generateInsights()` call:
```typescript
import { insightService } from '@/lib/services/insight.service';
import { memoryService } from '@/lib/services/memory.service';
import { MemoryConsolidatorAgent } from '@/lib/agents/memory-consolidator.agent';

// Before AI generation, load insights and memories
const activeInsights = await insightService.getActiveInsights(userId);
const activeMemories = await memoryService.getActiveMemories(userId);

// Call MemoryConsolidatorAgent
const consolidator = new MemoryConsolidatorAgent();
const consolidationResult = await consolidator.consolidateMemories({
  userId,
  timeWindow: '30d',
  workoutHistory,  // passed from analytics
  existingInsights: activeInsights,
  existingMemories: activeMemories,
  userProfile
});

// Add sections to output:
output.activeInsights = activeInsights;
output.consolidatedMemories = activeMemories;
output.proposedResolutions = consolidationResult.insightsToResolve;
```

2. Update output interface to include:
```typescript
activeInsights?: WorkoutInsight[];
consolidatedMemories?: UserMemoryEntry[];
proposedResolutions?: Array<{insightId: string, reason: string}>;
```

---

### Phase 2: UI Components (MEDIUM PRIORITY)

#### 2.1. Workout Summary - Add Notes Field
**File**: `app/workout/[id]/summary/page.tsx`

**Changes:**
1. Add textarea after mental readiness slider:
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">
    Note aggiuntive (opzionale)
  </label>
  <textarea
    value={workoutNotes}
    onChange={(e) => setWorkoutNotes(e.target.value)}
    placeholder="Es: Sentito dolore alla spalla, tecnica buona sulle trazioni, preferivo più recupero..."
    className="w-full min-h-[100px] p-3 rounded-lg border"
  />
  <p className="text-xs text-muted-foreground">
    Le tue note aiuteranno l'AI a personalizzare i workout futuri
  </p>
</div>
```

2. On submit (after saving workout stats):
```typescript
// Save user_notes to workout
if (workoutNotes.trim()) {
  await supabase
    .from('workouts')
    .update({ user_notes: workoutNotes })
    .eq('id', workoutId);

  // Parse insight with AI
  const parser = new InsightParserAgent();
  const parsed = await parser.parseInsight({
    userNote: workoutNotes,
    workoutContext: {
      exercises: workout.exercises,
      mentalReadiness: mentalReadinessOverall,
      mesocyclePhase: userProfile.mesocycle_phase,
      workoutType: workout.workout_type
    },
    recentInsights: await insightService.getInsights(userId, {
      status: ['active', 'monitoring'],
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    })
  });

  // Save insight
  const insight = await insightService.createInsight({
    userId,
    workoutId,
    exerciseName: parsed.relatedExercises[0],
    userNote: workoutNotes,
    insightType: parsed.insightType,
    severity: parsed.severity,
    metadata: {
      affectedMuscles: parsed.affectedMuscles,
      suggestedActions: parsed.suggestedActions,
      relatedExercises: parsed.relatedExercises
    }
  });

  // Create memory entry if applicable
  if (parsed.severity !== 'info') {
    await memoryService.createMemory({
      userId,
      category: parsed.insightType === 'pain' ? 'limitation' : 'preference',
      source: 'user_note',
      title: parsed.relatedExercises[0]
        ? `${parsed.insightType} on ${parsed.relatedExercises[0]}`
        : parsed.insightType,
      description: parsed.affectedMuscles.join(', '),
      confidenceScore: 0.6,
      sourceId: insight.id,
      relatedExercises: parsed.relatedExercises,
      relatedMuscles: parsed.affectedMuscles
    });
  }

  // Show toast
  toast.success('✓ Insight registrato: adatterò i workout futuri');
}
```

---

#### 2.2. Memory Dashboard Page
**File**: `app/profile/memory/page.tsx` (NEW)

Create a new page with tabs:
- **Overview**: Stats (active count, by category, avg confidence)
- **Preferences**: Memories with category='preference'
- **Limitations**: Memories with category='limitation'
- **Patterns**: Memories with category='pattern'
- **Strengths**: Memories with category='strength'
- **Equipment**: Memories with category='equipment'
- **Timeline**: All memories sorted by date

**UI Structure:**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { memoryService } from '@/lib/services/memory.service';
import { insightService } from '@/lib/services/insight.service';
import type { MemoryDashboard } from '@/lib/services/memory.service';

export default function MemoryDashboardPage() {
  const [dashboard, setDashboard] = useState<MemoryDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'limitations' | 'patterns'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const userId = // get from auth
    const data = await memoryService.getMemoryDashboard(userId);
    setDashboard(data);
  }

  // Render cards for each category
  // Add actions: resolve insight, archive memory, boost confidence
}
```

**Key Features:**
- Visual confidence bars (0-100%)
- Action buttons: "Segna come risolto", "Archivia", "Modifica"
- Export JSON button
- Refresh/consolidate button (triggers MemoryConsolidatorAgent)

---

#### 2.3. Workout Generation Notifications
**File**: Component that calls `ExerciseSelectorAgent.selectExercises()`

**After receiving output with `insightInfluencedChanges`:**
```typescript
if (result.insightInfluencedChanges && result.insightInfluencedChanges.length > 0) {
  // Show toast notification
  toast.info(
    `🔔 Ho adattato il workout in base a ciò che ho imparato su di te`,
    {
      action: {
        label: 'Dettagli',
        onClick: () => showInsightChangesModal(result.insightInfluencedChanges)
      }
    }
  );
}
```

**Modal content:**
```tsx
<div>
  <h3>Modifiche Applicate</h3>
  {changes.map(change => (
    <div key={change.sourceId}>
      {change.action === 'substituted' && (
        <p>✓ Evitato {change.originalExercise} → Scelto {change.selectedExercise}</p>
      )}
      {change.action === 'preferred' && (
        <p>✓ Preferito {change.selectedExercise}</p>
      )}
      <p className="text-sm text-muted">{change.reason}</p>
    </div>
  ))}
</div>
```

---

### Phase 3: Background Jobs (LOW PRIORITY)

#### 3.1. Edge Function: Memory Consolidation (Weekly)
**File**: `supabase/functions/consolidate-memories/index.ts` (NEW)

```typescript
import { createClient } from '@supabase/supabase-js';
import { MemoryConsolidatorAgent } from '../../../lib/agents/memory-consolidator.agent';
import { memoryService } from '../../../lib/services/memory.service';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get all active users (or batch process)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(100);

  const consolidator = new MemoryConsolidatorAgent();

  for (const user of users || []) {
    // Load data
    const workoutHistory = // fetch
    const insights = // fetch
    const memories = // fetch

    // Consolidate
    const result = await consolidator.consolidateMemories({...});

    // Apply suggestions
    for (const suggestion of result.memorySuggestions) {
      if (suggestion.action === 'create') {
        await memoryService.createMemory({...});
      } else if (suggestion.action === 'update') {
        await memoryService.boostConfidence(suggestion.memoryId!, 0.1);
      }
    }

    // Resolve insights
    for (const resolution of result.insightsToResolve) {
      await insightService.proposeResolution(resolution.insightId, 'ai');
    }
  }

  return new Response('Consolidation complete', { status: 200 });
});
```

**Schedule**: Use Supabase Cron to run weekly (Sunday midnight)

---

#### 3.2. Edge Function: Time-Decay (Daily)
**File**: `supabase/functions/update-relevance-scores/index.ts` (NEW)

```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Call database function
  await supabase.rpc('update_insight_relevance_scores');

  return new Response('Time-decay applied', { status: 200 });
});
```

**Schedule**: Use Supabase Cron to run daily (midnight)

---

## 📊 **Integration Points Summary**

### When User Generates Workout
```typescript
// 1. Load insights and memories
const insights = await insightService.getActiveInsights(userId);
const memories = await memoryService.getActiveMemories(userId);

// 2. Pass to ExerciseSelectorAgent
const result = await exerciseSelector.selectExercises({
  ...existingInput,
  activeInsights: insights,
  activeMemories: memories
});

// 3. Show notification if changes applied
if (result.insightInfluencedChanges?.length > 0) {
  showToast('Workout adapted based on your insights');
}
```

### When User Completes Workout
```typescript
// 1. Save workout stats
// 2. If user_notes provided:
//    - Parse with InsightParserAgent
//    - Save to workout_insights
//    - Optionally create memory entry
// 3. Show confirmation
```

### Weekly Background Job
```typescript
// 1. For each active user:
//    - Run MemoryConsolidatorAgent
//    - Apply memory suggestions
//    - Propose insight resolutions
```

---

## 🎯 **Testing Checklist**

- [ ] User adds note → Insight created → Appears in dashboard
- [ ] Insight (pain/warning) → Next workout avoids exercise
- [ ] 3 substitutions → Memory created with confidence boost
- [ ] Memory (preference) → Next workout prefers equipment
- [ ] Insight resolved → Stops influencing workouts
- [ ] Memory archived → Stops influencing workouts
- [ ] Dashboard shows all categories correctly
- [ ] Export JSON works
- [ ] Time-decay reduces relevance over time
- [ ] Weekly consolidation detects patterns

---

## 🚀 **Next Steps**

1. Complete agent extensions (ExerciseSelectorAgent prompt integration)
2. Add notes field to workout summary UI
3. Create Memory Dashboard page
4. Add notification toasts for workout adaptations
5. Deploy Edge Functions for background jobs
6. Test end-to-end flow with real data

---

## 📝 **Notes**

- All database functions are already created and tested
- Services are fully functional
- Agents are ready to use
- Main work remaining is UI integration and prompt engineering
- No breaking changes to existing code

---

**Foundation Status**: ✅ Complete
**Implementation Status**: 🚧 40% Complete (Core infrastructure done)
**Estimated Time to MVP**: 8-12 hours (UI + integrations)
