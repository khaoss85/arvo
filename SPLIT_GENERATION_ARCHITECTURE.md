# Split Generation Architecture

## Overview

This document explains the hybrid AI approach used for split plan generation, which balances speed, reliability, and GPT-5 reasoning persistence.

## Two-Path Architecture

### Path 1: First-Time Onboarding (Fast & Reliable)
**Location:** `app/actions/split-actions.ts` → `generateSplitPlanAction()` (line 117)

**API:** OpenAI Chat Completions with Structured Outputs
**Agent Method:** `SplitPlanner.planSplitWithStructuredOutput()`
**Timeout:** 15 seconds (reasoning: 'none')
**Response Time:** 15-30 seconds typical

**Why this approach:**
- **Speed:** New users need immediate feedback during onboarding to prevent drop-off
- **Reliability:** Structured Outputs guarantees valid JSON, no parsing errors
- **Simplicity:** First-time users have minimal context (no cycle history, memories, or insights)

**Trade-offs:**
- ✅ 60-70% faster than Responses API
- ✅ Guaranteed valid JSON output
- ❌ No reasoning persistence (but not needed for first-time users)
- ❌ Not fully GPT-5 compliant (doesn't use Responses API)

---

### Path 2: Split Adaptation (GPT-5 Reasoning Persistence)
**Location:** `app/actions/split-actions.ts` → `adaptSplitAfterCycleAction()` (line 768)

**API:** OpenAI Responses API with reasoning effort
**Agent Method:** `SplitPlanner.planSplit(input, lang, previousResponseId)`
**Reasoning Effort:** 'medium' (240s timeout)
**Response Time:** 90-180 seconds typical

**Why this approach:**
- **Quality:** Returning users have rich context (cycle history, memories, substitution patterns, insights)
- **Reasoning Continuity:** Each adaptation builds on previous AI reasoning via `previous_response_id`
- **Personalization:** Deep reasoning considers user preferences and performance trends
- **GPT-5 Compliance:** Uses recommended Responses API with reasoning persistence

**Trade-offs:**
- ✅ GPT-5 compliant (uses Responses API + reasoning_effort)
- ✅ Reasoning persistence across adaptations (cumulative learning)
- ✅ Higher quality for complex adaptation scenarios
- ❌ Slower (90-180s vs 15-30s)
- ❌ Requires JSON parsing (but rare failures with GPT-5)

---

## Reasoning Persistence (GPT-5 Feature)

### How It Works

1. **First Split Generation (Onboarding)**
   ```typescript
   // Fast path - no previous reasoning needed
   const splitPlanData = await splitPlanner.planSplitWithStructuredOutput(input, 'en')
   // responseId is null for Structured Outputs (Chat Completions API)
   ```

2. **First Adaptation**
   ```typescript
   // Load current split (has no previous response ID yet)
   const currentSplit = await SplitPlanService.getActiveServer(userId)
   const previousResponseId = currentSplit.ai_response_id || undefined // undefined

   // Generate adapted split with reasoning
   const adaptedSplit = await planner.planSplit(input, 'en', previousResponseId)
   // adaptedSplit.responseId = 'resp_abc123...'

   // Store response ID for next adaptation
   await SplitPlanService.createServer({
     ...splitData,
     ai_response_id: adaptedSplit.responseId
   })
   ```

3. **Subsequent Adaptations**
   ```typescript
   // Load previous response ID
   const currentSplit = await SplitPlanService.getActiveServer(userId)
   const previousResponseId = currentSplit.ai_response_id // 'resp_abc123...'

   // AI receives previous reasoning context!
   const adaptedSplit = await planner.planSplit(input, 'en', previousResponseId)
   // adaptedSplit.responseId = 'resp_xyz789...'

   // Chain continues...
   ```

### Benefits of Reasoning Persistence

According to OpenAI Tau-Bench benchmarks:
- **+4.3% accuracy improvement** when using previous_response_id
- **-30-50% reduction in reasoning tokens** (AI doesn't re-derive previous conclusions)
- **Better personalization** over time as AI builds on learned user preferences

---

## Database Schema

### `split_plans` Table

```sql
CREATE TABLE split_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  approach_id UUID,
  split_type TEXT NOT NULL,
  cycle_days INTEGER NOT NULL,
  sessions JSONB NOT NULL,
  frequency_map JSONB NOT NULL,
  volume_distribution JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  ai_response_id TEXT, -- OpenAI response ID for reasoning continuity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_split_plans_ai_response_id ON split_plans(ai_response_id);
```

The `ai_response_id` column stores the OpenAI response ID from split generation. This enables passing `previous_response_id` to subsequent adaptations, creating a reasoning chain.

---

## Code Flow

### SplitPlanner Agent (`lib/agents/split-planner.agent.ts`)

```typescript
// Method 1: Fast onboarding (Structured Outputs)
async planSplitWithStructuredOutput(
  input: SplitPlannerInput,
  targetLanguage?: 'en' | 'it'
): Promise<SplitPlanOutput> {
  // Uses Chat Completions API with json_schema
  // Returns: { ...splitData, responseId: undefined }
}

// Method 2: Quality adaptations (Responses API)
async planSplit(
  input: SplitPlannerInput,
  targetLanguage?: 'en' | 'it',
  previousResponseId?: string // GPT-5 reasoning continuity
): Promise<SplitPlanOutput> {
  // Calls base.complete() with previousResponseId
  const result = await this.complete<SplitPlanOutput>(
    prompt,
    targetLanguage,
    undefined, // timeout
    previousResponseId // Enables reasoning persistence
  )

  // Extract response ID from base agent
  return {
    ...result,
    responseId: this.lastResponseId // For next adaptation
  }
}
```

### Split Actions (`app/actions/split-actions.ts`)

```typescript
// Onboarding: Fast path
export async function generateSplitPlanAction(input, generationRequestId) {
  const splitPlanner = new SplitPlanner(supabase) // reasoning: 'low'

  const splitPlanData = await splitPlanner.planSplitWithStructuredOutput(
    input,
    targetLanguage
  )

  // Store split (responseId will be null for Structured Outputs)
  const splitPlan = await SplitPlanService.createServer({
    ...splitData,
    ai_response_id: splitPlanData.responseId || null
  })
}

// Adaptation: Reasoning persistence path
export async function adaptSplitAfterCycleAction(userId) {
  // Load current split and its AI response ID
  const currentSplit = await SplitPlanService.getActiveServer(userId)
  const previousResponseId = currentSplit.ai_response_id || undefined

  // Use medium reasoning for quality adaptations
  const planner = new SplitPlanner(supabase, 'medium')

  // Pass previous reasoning context
  const adaptedSplit = await planner.planSplit(
    input,
    targetLanguage,
    previousResponseId // Enables cumulative learning
  )

  // Store new split with response ID for next adaptation
  const newSplit = await SplitPlanService.createServer({
    ...splitData,
    ai_response_id: adaptedSplit.responseId || null
  })
}
```

---

## API Compatibility Matrix

| Feature | Chat Completions API | Responses API |
|---------|---------------------|---------------|
| Structured Outputs (json_schema) | ✅ Yes | ❌ No |
| Reasoning effort parameter | ❌ No | ✅ Yes |
| previous_response_id | ❌ No | ✅ Yes |
| Reasoning persistence | ❌ No | ✅ Yes |
| Guaranteed valid JSON | ✅ Yes | ❌ No (manual parsing) |
| Typical response time | 15-30s | 90-240s |
| Best for | First-time onboarding | Returning user adaptations |

**Key Insight:** The two APIs are mutually exclusive. You cannot use Structured Outputs with Responses API features. Our hybrid approach uses both strategically.

---

## When to Use Each Path

### Use Structured Outputs (Fast Path) When:
- First-time user onboarding
- User has no cycle history
- Speed is critical (preventing drop-off)
- Simple context (minimal input data)
- Guaranteed JSON output is needed

### Use Responses API (Reasoning Path) When:
- Adapting existing splits after cycles
- User has rich context (memories, insights, substitutions)
- Quality > Speed
- Building on previous AI reasoning
- GPT-5 compliance is important

---

## Reasoning Effort Levels

Configured in `lib/agents/base.agent.ts`:

```typescript
protected getTimeoutForReasoning(): number {
  switch (this.reasoningEffort) {
    case 'none':   return 15000   // 15s - Structured Outputs implicit
    case 'low':    return 90000   // 90s - Quick reasoning
    case 'medium': return 240000  // 240s - Deep reasoning (adaptations)
    case 'high':   return 240000  // 240s - Maximum reasoning
  }
}
```

**Current Usage:**
- Onboarding: `reasoning: 'none'` (implicit with Structured Outputs)
- Adaptations: `reasoning: 'medium'` (line 766 in split-actions.ts)

---

## Testing the Reasoning Chain

To verify reasoning persistence is working:

1. **Check response ID storage:**
   ```sql
   SELECT id, user_id, ai_response_id, created_at
   FROM split_plans
   WHERE user_id = '<user_id>'
   ORDER BY created_at DESC;
   ```

2. **Verify chain continuity:**
   ```typescript
   // After first adaptation
   console.log('First adaptation response ID:', adaptedSplit.responseId)

   // After second adaptation (should reference first)
   console.log('Previous response ID used:', previousResponseId)
   console.log('New response ID:', adaptedSplit.responseId)
   ```

3. **Monitor AI logs:**
   ```
   🤖 [BASE_AGENT] Starting AI completion request... {
     previousResponseId: 'resp_abc123...' // Should appear after first adaptation
   }
   ```

---

## Future Enhancements

1. **Analytics:** Track response ID chains to measure reasoning persistence impact on user satisfaction
2. **Prompt Optimization:** Reduce prompt size from 12KB to 6-8KB for faster Responses API calls
3. **Hybrid Onboarding:** Use Structured Outputs for initial plan, then immediate Responses API adaptation if user has imported data
4. **Response ID Cleanup:** Periodically archive old response IDs (OpenAI retains for 30 days)

---

## References

- [OpenAI Responses API Documentation](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [GPT-5 Prompting Best Practices (Tau-Bench)](https://platform.openai.com/docs/guides/prompt-engineering)

---

**Last Updated:** 2025-11-21
**Author:** Claude Code (AI-assisted architecture)
