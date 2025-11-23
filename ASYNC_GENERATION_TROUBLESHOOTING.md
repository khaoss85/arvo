# Async Generation Troubleshooting Guide

This document catalogs critical fixes for the async workout/split generation system (Inngest + polling). These fixes resolve production issues and prevent regressions.

**Last Updated:** November 23, 2025
**Related Commits:** `a369bd7`, `6fcabc2`

---

## Critical Fixes (November 2025)

### 1. Polling Endpoint Split Generation Detection

**Problem:**
After Inngest successfully completed split generation (onboarding), the client remained stuck at 85% progress indefinitely. The polling endpoint never detected completion, causing infinite polling.

**Root Cause:**
The polling endpoint (`/api/workouts/generation-status/[requestId]`) only checked for `workout_id` to determine completion:

```typescript
// ❌ BEFORE: Only handled workout generation
if (queueEntry.status === 'completed' && queueEntry.workout_id) {
  // Return workout completion...
}
```

However, split generation (used in onboarding) sets `split_plan_id`, NOT `workout_id`. The condition failed, causing the endpoint to return `status: 'in_progress'` forever.

**Solution:**
Updated the endpoint to handle both generation types by checking for `split_plan_id` AND `workout_id`:

```typescript
// ✅ AFTER: Handle both split and workout generation
if (queueEntry.status === 'completed') {
  // Check for split generation first
  if (queueEntry.split_plan_id) {
    return Response.json({
      status: 'complete',
      splitPlanId: queueEntry.split_plan_id
    })
  }

  // Then check for workout generation
  if (queueEntry.workout_id) {
    const workout = await WorkoutService.getByIdServer(queueEntry.workout_id)
    return Response.json({
      status: 'complete',
      workout,
      insightInfluencedChanges: []
    })
  }
}
```

**Files Changed:**
- `app/api/workouts/generation-status/[requestId]/route.ts` (lines 64-109)

**Prevention:**
- ✅ When adding new generation types, update polling endpoint
- ✅ Test BOTH split and workout generation completion
- ✅ Monitor polling endpoint for stuck generations

**Testing:**
```bash
# Verify split generation completes
1. Complete onboarding flow
2. Check console: should see "Split generation completed (from database)"
3. Should redirect to dashboard (not stuck at 85%)

# Verify workout generation completes
1. Generate workout from dashboard timeline
2. Check console: should see "Workout generation completed (from database)"
3. Should show generated workout (not stuck polling)
```

---

### 2. Supabase 406 Errors in getActiveGeneration

**Problem:**
Console flooded with `406 Not Acceptable` errors when checking for active generations:

```
GET /workout_generation_queue?user_id=eq.xxx&status=in.(pending,in_progress) 406 (Not Acceptable)
```

**Root Cause:**
The `getActiveGeneration()` method used `.single()` after `.limit(1)`:

```typescript
// ❌ BEFORE: Caused 406 when no active generation
const { data, error } = await supabase
  .from('workout_generation_queue')
  .select('*')
  .eq('user_id', userId)
  .in('status', ['pending', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single()  // <-- Errors if 0 rows!
```

In PostgREST/Supabase, `.single()` expects EXACTLY 1 row and throws an error if 0 rows are found. This caused 406 errors every time there was no active generation (a common scenario).

**Solution:**
Replace `.single()` with `.maybeSingle()`:

```typescript
// ✅ AFTER: Returns null gracefully when no rows
const { data, error } = await supabase
  .from('workout_generation_queue')
  .select('*')
  .eq('user_id', userId)
  .in('status', ['pending', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()  // <-- Returns null if 0 rows, no error ✓
```

`.maybeSingle()` behavior:
- Returns `null` if no rows (no error) ✓
- Returns object if exactly 1 row ✓
- Returns error only if multiple rows (won't happen with `.limit(1)`)

**Files Changed:**
- `lib/services/generation-queue.service.ts` (line 175)

**Prevention:**
- ✅ Use `.maybeSingle()` instead of `.single()` when 0 rows is expected
- ✅ Only use `.single()` when exactly 1 row is guaranteed
- ✅ Check console for 406 errors during development

**Testing:**
```bash
# Should see NO 406 errors
1. Open DevTools console
2. Navigate to onboarding/review page
3. Filter console by "406"
4. Should be empty ✓
```

---

### 3. OpenAI Reasoning Compatibility (gpt-5-mini)

**Problem:**
Agents using gpt-5-mini with `reasoning: 'none'` failed with:

```
400 Unsupported value: 'none' is not supported with the 'gpt-5-mini' model.
Supported values are: 'minimal', 'low', 'medium', and 'high'.
```

**Root Cause:**
OpenAI reasoning support varies by model:
- **gpt-5.1:** Supports 'none', 'minimal', 'low', 'medium', 'high'
- **gpt-5-mini, gpt-5-nano:** Only support 'minimal', 'low', 'medium', 'high' (NO 'none')

7 agents were configured with `reasoning: 'none'` but used gpt-5-mini, causing API errors.

**Solution:**
Added automatic reasoning compatibility mapping in `BaseAgent`:

```typescript
// In BaseAgent class
protected getCompatibleReasoning(): 'none' | 'minimal' | 'low' | 'medium' | 'high' {
  // gpt-5.1 supports 'none', all other models need 'minimal' instead
  if (this.reasoningEffort === 'none' && !this.model.includes('gpt-5.1')) {
    // Map 'none' to 'minimal' for gpt-5-mini, gpt-5-nano, and other models
    // Performance is identical (both use 30s timeout)
    return 'minimal'
  }
  return this.reasoningEffort
}

// Use in API call
reasoning: { effort: this.getCompatibleReasoning() }
```

**Files Changed:**
- `lib/agents/base.agent.ts` (lines 74-82, 617)
- `lib/agents/exercise-substitution.agent.ts` (removed duplicate mapping)

**Prevention:**
- ✅ Always use gpt-5.1 if you need `reasoning: 'none'`
- ✅ Use 'minimal' for gpt-5-mini/nano (automatic via BaseAgent)
- ✅ Test agents with different models to catch compatibility issues

**Performance Note:**
Both 'none' (gpt-5.1) and 'minimal' (gpt-5-mini) use 30s timeout, so performance is equivalent.

---

### 4. Cancel/Resume React State Management

**Problem:**
After clicking cancel and then "Start Workout" again, no Inngest event was triggered. Additionally, "Generation request expired" errors appeared.

**Root Causes:**

1. **Cancel didn't mark generation as failed:**
   Cancel only reset UI state, but the database entry remained "pending/in_progress". On retry, the system found the old generation and tried to "resume" instead of starting fresh. The API skips Inngest triggering when resuming: `if (!isResuming) { inngest.send(...) }`

2. **React state batching with requestId:**
   Using `useState` for requestId caused timing issues. React 18 batches multiple `setState` calls within event handlers, so the requestId wasn't committed before ProgressFeedback rendered, causing it to generate its own ID (mismatch).

**Solution:**

1. **Properly cancel generations:**
```typescript
const handleGenerationCancel = async () => {
  const requestIdToCancel = generationRequestIdRef.current || existingRequestId

  if (requestIdToCancel) {
    await GenerationQueueService.markAsFailed({
      requestId: requestIdToCancel,
      errorMessage: 'User cancelled generation'
    })
  }

  // Reset all state
  setLoading(false)
  setResumingGeneration(false)
  setExistingRequestId(null)
  generationRequestIdRef.current = null
}
```

2. **Use useRef instead of useState for requestId:**
```typescript
// ❌ BEFORE: State batching caused timing issues
const [currentGenerationRequestId, setCurrentGenerationRequestId] = useState<string | null>(null)

// ✅ AFTER: Ref provides synchronous access
const generationRequestIdRef = useRef<string | null>(null)

// Generate before modal opens
if (!resumingGeneration && !generationRequestIdRef.current) {
  generationRequestIdRef.current = crypto.randomUUID()
}
```

3. **Correctly pass requestId to ProgressFeedback:**
```typescript
// Pass via requestBody for new generations
requestBody={{
  // ... other fields
  generationRequestId: generationRequestIdRef.current
}}

// Only pass existingRequestId when actually resuming
existingRequestId={resumingGeneration ? (generationRequestIdRef.current ?? undefined) : undefined}
```

**Files Changed:**
- `app/(protected)/onboarding/review/page.tsx` (lines 45, 170-171, 246-273, 754, 757-758)
- `components/ui/progress-feedback.tsx` (line 60)

**Prevention:**
- ✅ Always mark cancelled generations as "failed" in database
- ✅ Use `useRef` for values that need synchronous access before renders
- ✅ Distinguish between "new generation" and "resume" logic clearly
- ✅ Test cancel → retry flow to ensure Inngest triggers

---

## Architecture Overview

### Async Generation Flow

```
1. User Action (e.g., "Start Workout")
   ↓
2. Generate requestId (useRef, synchronous)
   ↓
3. POST /api/.../stream with requestId
   ↓
4. SSE Stream (Kickstart Pattern)
   - Create queue entry in database
   - Trigger Inngest event
   - Close stream immediately
   ↓
5. Client switches to POLLING mode
   - Polls /api/workouts/generation-status/[requestId]
   - Updates UI with progress from database
   ↓
6. Inngest Worker (Background)
   - Updates database progress: 0% → 10% → 60% → 85% → 100%
   - Sets workout_id OR split_plan_id on completion
   ↓
7. Polling detects completion
   - Checks split_plan_id (onboarding) OR workout_id (workout)
   - Returns status: 'complete' with result
   ↓
8. Client receives completion
   - Calls onComplete handler
   - Redirects or shows result
```

### Why This Architecture?

- **Kickstart Pattern:** SSE closes immediately to hand off to Inngest (mobile-friendly)
- **Polling Fallback:** Survives mobile standby, network issues, server restarts
- **Database Queue:** Persistent state enables resume after disconnection
- **Separate IDs:** `workout_id` vs `split_plan_id` for different generation types

---

## Testing Checklist

Before deploying changes to async generation:

- [ ] **Split Generation (Onboarding)**
  - [ ] Complete onboarding flow end-to-end
  - [ ] Verify progress updates (0% → 100%)
  - [ ] Confirm redirect to dashboard on completion
  - [ ] No stuck at 85% or infinite polling

- [ ] **Workout Generation**
  - [ ] Generate workout from dashboard timeline
  - [ ] Verify progress updates
  - [ ] Confirm workout appears after completion
  - [ ] No stuck polling

- [ ] **Cancel Flow**
  - [ ] Cancel during generation
  - [ ] Verify database marked as "failed"
  - [ ] Click "Start" again → new Inngest event triggered
  - [ ] No "expired" errors

- [ ] **Resume Flow**
  - [ ] Start generation
  - [ ] Close browser/navigate away
  - [ ] Return to page → should resume from database
  - [ ] No duplicate Inngest events

- [ ] **Error Handling**
  - [ ] No 406 errors in console
  - [ ] Expired generations show appropriate message
  - [ ] Failed generations show error details

- [ ] **Cross-Browser**
  - [ ] Test on Chrome, Safari, Firefox
  - [ ] Test on mobile (iOS Safari, Android Chrome)

---

## Debugging Tips

### Check Active Generations

```bash
# Using psql
psql $DATABASE_URL -c "
  SELECT request_id, status, progress_percent, current_phase, created_at
  FROM workout_generation_queue
  WHERE user_id = 'YOUR_USER_ID'
  AND status IN ('pending', 'in_progress')
  ORDER BY created_at DESC;
"

# Using npm script (if available)
npm run check:queue
```

### Monitor Inngest Events

1. Open Inngest Dev Server: http://localhost:8288/runs
2. Filter by function: "Generate Split (Async)" or "Generate Workout (Async)"
3. Check event payload and execution trace
4. Look for errors in step execution

### Enable Verbose Logging

Add to relevant files:

```typescript
// In ProgressFeedback
console.log('[ProgressFeedback] Polling response:', data)

// In polling endpoint
console.log('[GenerationStatus] Queue entry:', queueEntry)

// In Inngest worker
console.log('[Inngest] Current progress:', progressPercent)
```

### Common Issues

**Stuck at 85%:**
→ Polling endpoint not checking correct ID field (workout_id vs split_plan_id)

**406 Errors:**
→ Using `.single()` instead of `.maybeSingle()`

**"Expired" errors:**
→ React state batching with requestId (use `useRef`)

**Duplicate Inngest events:**
→ Not properly differentiating resume vs new generation

---

## Related Documentation

- [`ASYNC_GENERATION_SETUP.md`](./ASYNC_GENERATION_SETUP.md) - Initial async setup guide
- [`SPLIT_GENERATION_ASYNC_MIGRATION.md`](./SPLIT_GENERATION_ASYNC_MIGRATION.md) - Migration from sync to async
- [`SPLIT_GENERATION_ARCHITECTURE.md`](./SPLIT_GENERATION_ARCHITECTURE.md) - Architecture overview

---

## Commit References

- **`a369bd7`** - fix(generation): polling detection and 406 errors for async generation
- **`6fcabc2`** - fix(onboarding): comprehensive workout completion flow improvements

---

**Document Maintained By:** Claude Code
**For Issues:** See commit history or git blame for specific fixes
