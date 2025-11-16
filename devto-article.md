---
title: "Building an AI Workout Coach: OpenAI Responses API + Dynamic Reasoning Levels"
published: false
description: "17+ specialized agents with configurable reasoning effort—from <2s ultra-fast to 240s deep reasoning. Here's the architecture."
tags: ai, nextjs, typescript, showdev
cover_image:
---

# Building an AI Workout Coach: OpenAI Responses API + Dynamic Reasoning Levels

I've been tracking workouts in Excel for a decade. Formulas for 1RM calculations, conditional formatting for volume landmarks, macros for progressive overload. It worked—until it didn't.

Excel can't tell when I'm tired. It can't suggest "hey, drop the weight 2.5kg because you left 3 RIR on that last set when you should've left 1." It can't learn that I prefer cable exercises over barbell for triceps because of elbow pain.

So I built **ARVO**—an AI-powered training app with **17+ specialized agents** that orchestrate real-time coaching decisions. Not generic "do 3x10" programs. Real set-by-set progression with detailed reasoning, adaptive to your performance.

The interesting part? Each agent uses **different reasoning effort levels** depending on latency requirements. My progression calculator needs <2s responses (you're waiting between sets), while workout planning can take 90-240s for deep reasoning.

Here's the architecture.

## The Problem: Why Generic Apps Fall Short

If you've ever used a fitness app, you know the pattern: select a pre-made program, follow the prescribed sets and reps, log your data. Maybe it has some basic progression like "add 5lbs when you complete all sets."

**This doesn't work for serious training methodologies.**

Take the Kuba Method (an evidence-based approach focused on volume landmarks and progressive overload). It has rules like:
- Different rep ranges for accumulation vs. intensification phases
- Exercise selection based on weak points and equipment availability
- Volume calculations that depend on your caloric phase (bulk/cut/maintenance)
- Injury-aware exercise avoidance with intelligent substitutions
- Pattern learning from your biomechanical preferences

**That's hundreds of interconnected rules.** Excel can handle the math, but it can't adapt in real-time. Generic apps simplify these methodologies into cookie-cutter programs that lose the nuance.

What if an AI could interpret the methodology's rules AND adapt to your real-time performance?

## The Solution: 17+ Specialized Agents with Dynamic Reasoning

ARVO uses **17+ specialized AI agents**, each optimized for different tasks. Three core agents handle the workout flow:

### 1. ExerciseSelectorAgent (Exercise Selection)

**Job**: Select the right exercises for each workout.
**Reasoning Level**: `low` (90s timeout—this runs once at workout start, latency isn't critical)

This agent considers:
- Your weak points (selected via an interactive body map during onboarding)
- Target muscle groups for the current mesocycle phase
- Available equipment
- Recent exercise history (avoids repetition—no one wants squats 3x/week)
- Active injuries and biomechanical preferences
- Whether you're bulking, cutting, or maintaining

**Example decision**:
```
User Profile:
- Weak point: Chest (upper portion)
- Equipment: Full gym
- Recent exercises: Flat barbell bench (2 days ago)
- Injury: Right shoulder discomfort with overhead pressing
- Phase: Accumulation (higher volume, moderate intensity)

Agent Decision:
Exercise: Incline Dumbbell Press
Reasoning: "Targets upper chest weak point. Dumbbells allow natural
shoulder path vs. barbell. Hasn't been performed in 5 days. Suitable
for accumulation phase with 3-4 sets of 8-12 reps."
```

The agent doesn't just pick exercises randomly—it explains its reasoning, so you understand WHY you're doing incline DB press instead of barbell.

### 2. ProgressionCalculator (Set-by-Set Coaching)

**Job**: Suggest weight and reps for each set based on your previous set performance.
**Reasoning Level**: `none` (15s timeout—<2s response time is critical; you're waiting between sets)

This is where the reasoning level optimization shines. After every set you complete, the agent analyzes:
- Weight used vs. expected
- Reps achieved vs. target
- RIR (Reps in Reserve) you reported
- Your mental readiness state
- Fatigue accumulation across the workout

Then it suggests the next set's load with detailed reasoning.

**Real example from a workout**:
```typescript
// Previous set data
const previousSet = {
  weight: 100,
  reps: 8,
  targetReps: 10,
  rir: 3, // User reported "could've done 3 more reps"
  targetRir: 1
};

// Agent suggestion for next set
{
  suggestedWeight: 105,
  suggestedReps: 10,
  reasoning: "You left 3 RIR when target was 1, indicating the weight
  was too light. Increasing by 5kg should bring you closer to target
  intensity. Aim for 10 reps with 1 RIR to match accumulation phase
  intensity requirements."
}
```

This is **set-by-set coaching**. Not "follow this template"—but "here's what you should do next based on what just happened."

### 3. WorkoutModificationValidator (Real-Time Adaptation)

**Job**: Validate and adapt workout modifications when performance deviates from expectations.
**Reasoning Level**: `low` (90s timeout—happens a few times per workout, acceptable latency)

Sometimes you have a bad day. Maybe you're sleep-deprived, or that weight was heavier than expected. This agent watches for variance and adjusts:

- **If you're underperforming**: Reduces volume or intensity for remaining sets to avoid junk volume
- **If you're overperforming**: Considers adding volume or intensity if recovery allows
- **If you hit a plateau**: Suggests alternative exercises or rep schemes

**Example**:
```
Planned: 4 sets of squats @ 150kg for 8 reps (1-2 RIR)
Actual Set 1: 150kg x 6 reps (3 RIR) — underperformance

Recalculation:
- Reduce to 3 total sets (from 4)
- Decrease weight to 140kg for sets 2-3
- Reasoning: "Significant underperformance suggests readiness issue.
  Reducing volume and load to maintain quality over quantity."
```

The system **prioritizes training quality** over blindly following a template.

### The Other 14+ Agents

Beyond the core three, ARVO has specialized agents for specific tasks:

- **AudioScriptGeneratorAgent** (`reasoning='low'`): Generates personalized audio coaching scripts
- **InsightsGeneratorAgent** (`reasoning='low'`): Analyzes patterns and generates training insights
- **MemoryConsolidatorAgent**: Learns from your preferences and biomechanics
- **HydrationAdvisorAgent**: Smart hydration reminders (ACSM guidelines-based)
- **ExerciseSubstitutionAgent**: Suggests alternatives when equipment is busy
- **12+ more** for validation, substitution, reordering, and analysis tasks

Each agent is optimized for its specific task—latency-critical agents use `reasoning='none'`, complex reasoning uses `medium/high`.

## Tech Stack: OpenAI Responses API at the Core

Building this required balancing AI capabilities, developer experience, and production readiness.

### Next.js 14 + App Router

I needed:
- Server-side AI orchestration (API routes for agent calls)
- Client-side state management for real-time workout tracking
- Mobile-optimized UI (the app runs in the gym)
- Fast iteration cycles

Next.js 14's App Router gives me server components for AI logic and client components for interactive UI. The DX is fantastic, and deployment to Vercel is one command.

### OpenAI Responses API + GPT-5 Models

Here's the most interesting architectural decision: **I'm using OpenAI's Responses API**, not the standard Chat Completions API.

**Why Responses API?**

1. **Configurable reasoning effort levels** (the killer feature)
2. **Multi-turn CoT persistence** with `previous_response_id`
3. **Verbosity control** for agent outputs
4. **Built-in chain-of-thought reasoning**

Here's what the API call looks like:

```typescript
const response = await this.openai.responses.create({
  model: this.model, // 'gpt-5-mini' (default) or 'gpt-5.1' (production)
  input: combinedInput,
  reasoning: { effort: this.reasoningEffort }, // 🎯 KEY FEATURE
  text: { verbosity: this.verbosity },
  ...(responseIdToUse && { previous_response_id: responseIdToUse })
});
```

**The 5 Reasoning Levels**:

| Level | Timeout | Use Case | Example Agent |
|-------|---------|----------|---------------|
| `none` | 15s | Ultra-low latency, instant responses | ProgressionCalculator |
| `minimal` | 30s | Fast simple tasks | Quick validations |
| `low` | 90s | Standard constraints (default) | Most agents |
| `medium` | 240s | Complex multi-constraint optimization | Workout planning |
| `high` | 240s | Maximum reasoning for hardest problems | Edge cases |

**Why this matters**:

When you finish a set and need the next weight suggestion, you can't wait 30 seconds. The ProgressionCalculator uses `reasoning='none'` for **<2s responses**.

But when generating a full workout plan (which happens once at the start), I can use `reasoning='low'` or `medium'` for deeper reasoning—you're not waiting mid-workout.

**Multi-Turn CoT Persistence**:

```typescript
// Pass previous_response_id for context retention
...(responseIdToUse && { previous_response_id: responseIdToUse })

// Save for next call
this.lastResponseId = response.id;
```

This gives **+4.3% accuracy improvement** (Tau-Bench verified) and **30-50% CoT token reduction** across a workout session. The AI maintains reasoning context across multiple calls without re-explaining fundamentals.

**Model Choice**: GPT-5-mini (default) vs. GPT-5.1 (production)

I use GPT-5-mini for development (faster, cheaper) and GPT-5.1 for production (better reasoning quality). Both support the full reasoning level spectrum.

**Cost consideration**: Each workout costs ~$0.08-0.15 in API calls with GPT-5-mini. For a serious lifter doing 4-5 workouts/week, that's ~$2-3/month—far less than a personal trainer.

### Supabase (PostgreSQL + Auth + Realtime)

I needed:
- User authentication (Supabase Auth)
- Relational database for workout history (PostgreSQL)
- Row-level security for data privacy
- Realtime subscriptions (future feature: live workout sharing)

Supabase gives me all of this with a great DX. The auto-generated TypeScript types from database schema are a game-changer:

```typescript
// Auto-generated from Supabase schema
type Workout = Database['public']['Tables']['workouts']['Row'];
type Exercise = Database['public']['Tables']['exercises']['Row'];

// Type-safe queries
const { data, error } = await supabase
  .from('workouts')
  .select('*, exercises(*)')
  .eq('user_id', userId);
```

Row-level security ensures users only access their own data—critical for a health/fitness app.

### TypeScript + Zod Everywhere

Runtime validation is essential when dealing with AI outputs. LLMs can hallucinate or return unexpected formats.

Every agent response is validated with Zod schemas:

```typescript
import { z } from 'zod';

const ExerciseSuggestionSchema = z.object({
  exerciseName: z.string(),
  sets: z.number().min(1).max(10),
  reps: z.number().min(1).max(30),
  reasoning: z.string().min(20),
  targetMuscles: z.array(z.string()),
});

// Validate AI response
const suggestion = ExerciseSuggestionSchema.parse(aiResponse);
```

If the AI returns invalid data, I catch it immediately rather than propagating bugs to the UI.

## The Knowledge Engine: Parametric Training

Here's where ARVO differs from "generic AI fitness app #427."

I didn't want the AI to invent a training program. I wanted it to **interpret existing, proven methodologies** with complete fidelity.

So I built a **parametric knowledge engine**—a structured representation of training methodologies that the AI can query and reason over.

**Example: Kuba Method configuration** (362 lines of rules):

```typescript
export const kubaMethodConfig = {
  name: "Kuba Method",
  phases: {
    accumulation: {
      intensityRange: [65, 75], // % of 1RM
      volumeLandmarks: {
        bulk: { sets: "4-6", reps: "8-12" },
        cut: { sets: "3-4", reps: "10-15" },
        maintenance: { sets: "3-5", reps: "8-12" },
      },
      exerciseSelectionRules: [
        "Prioritize compound movements",
        "Include 2-3 isolation exercises per muscle group",
        "Avoid same exercise within 4 days",
      ],
      progressionLogic: {
        trigger: "When all sets meet top of rep range with 0-1 RIR",
        action: "Increase weight by 2.5-5kg",
      },
    },
    intensification: {
      // ... similar structure
    },
    deload: {
      // ... similar structure
    },
  },
  injuryProtocol: {
    shoulderPain: ["Avoid overhead pressing", "Substitute with neutral grip"],
    lowerBackPain: ["Reduce axial loading", "Focus on cable/machine work"],
  },
};
```

The agents receive this configuration as context. When making decisions, they reference these rules and explain how they applied them.

**This is not prompt engineering tricks**—it's structured domain knowledge that ensures methodology fidelity.

I also implemented **Mike Mentzer's HIT** with 532 lines of configuration (ultra-low volume, max intensity, advanced techniques). Same AI system, completely different training approach—because the knowledge engine is parametric.

## The Hard Parts: What I Learned Building This

### Challenge 1: Validation-Driven Retry System

**Problem**: AI outputs are unpredictable. Even with Zod validation, sometimes the AI suggests something that's technically valid but contextually wrong (e.g., "add 50kg to your next set" after you barely completed the previous one).

**Solution**: Built a retry mechanism with validation feedback loops.

```typescript
protected async completeWithRetry<T>(
  userPrompt: string,
  validationFn: (result: T) => Promise<{ valid: boolean; feedback: string }>,
  maxAttempts: number = 3,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await this.complete<T>(userPrompt);
    const validation = await validationFn(result);

    if (validation.valid) return result;

    // Retry with validation feedback
    userPrompt += `\n\nPrevious attempt failed validation: ${validation.feedback}`;
  }

  throw new Error('Max validation attempts exceeded');
}
```

When validation fails, I pass the **specific failure reason** back to the AI for the next attempt. This dramatically improved suggestion quality—from ~75% valid to ~95%.

**Progressive timeout scaling**: Each retry gets 1.5x longer timeout (1.0x → 1.5x → 2.0x) to give the AI more thinking time.

### Challenge 2: State Persistence Across Crashes

**Problem**: You're mid-workout, phone browser crashes (or you accidentally swipe away the tab). Losing that data is unacceptable.

**Solution**: Dual-layer persistence.

```typescript
// Layer 1: Optimistic localStorage (instant writes)
const saveWorkoutState = (state: WorkoutState) => {
  localStorage.setItem('arvo:active-workout', JSON.stringify(state));
};

// Layer 2: Supabase sync (every 30 seconds + on completion)
const syncToDatabase = async (state: WorkoutState) => {
  await supabase.from('workouts').upsert({
    id: state.workoutId,
    user_id: state.userId,
    exercises: state.exercises,
    status: state.status,
    updated_at: new Date().toISOString(),
  });
};
```

On reload, the app checks localStorage first, then syncs with Supabase. You can crash and recover seamlessly.

### Challenge 3: Sub-2s AI Latency

**Problem**: Waiting 5-10 seconds for a set suggestion between sets kills the flow.

**Solution**: `reasoning='none'` + optimistic UI.

```typescript
// ProgressionCalculator uses reasoning='none'
const response = await this.openai.responses.create({
  model: 'gpt-5-mini',
  input: setData,
  reasoning: { effort: 'none' }, // 🎯 Ultra-fast mode
  text: { verbosity: 'concise' },
});

// Response in <2s
const suggestion = response.content;
```

By using `reasoning='none'`, I get **<2s responses** even with GPT-5 models. The AI still provides quality suggestions, just without extended reasoning chains.

For comparison, `reasoning='low'` would take 5-8s for the same task—unacceptable when you're mid-workout.

### Challenge 4: Mobile UX in the Gym

**Problem**: You're holding dumbbells. Your hands are sweaty. The screen keeps turning off.

**Solutions**:
- **Wake Lock API**: Keeps screen on during workouts
```typescript
const wakeLock = await navigator.wakeLock.request('screen');
```
- **44px minimum touch targets**: All buttons are easily tappable with sweaty fingers
- **Fullscreen mode**: Maximizes screen real estate
- **Quick actions**: "Equipment busy," "Too heavy," "Too light" shortcuts to adjust on the fly

These aren't glamorous features, but they're critical for real-world usage.

### Challenge 5: Handling AI Hallucinations Gracefully

**Problem**: Sometimes the AI suggests nonsensical weights (e.g., "try 250kg for your first bench press set").

**Solution**: Multi-layer validation.

```typescript
// Zod schema catches type errors
const suggestion = ExerciseSuggestionSchema.parse(aiResponse);

// Business logic validation
if (suggestion.weight > user.estimatedMax * 1.2) {
  throw new Error('Suggested weight exceeds safe range');
}

// User override always available
// "This doesn't look right" → triggers re-generation with adjusted context
```

I also log all AI suggestions to review patterns and improve prompts over time.

## What I Learned

**1. Reasoning levels are a game-changer for multi-agent systems**
- Not all tasks need deep reasoning
- `reasoning='none'` for latency-critical tasks (<2s responses)
- `reasoning='medium/high'` for complex planning (acceptable 90-240s)
- Match reasoning effort to task requirements, not a one-size-fits-all approach

**2. Multi-turn CoT persistence compounds over sessions**
- `previous_response_id` gives +4.3% accuracy and -30-50% tokens
- The AI learns patterns across a workout without re-explaining
- Critical for maintaining context in long-running agent sessions

**3. Validation-driven retries > perfect prompts**
- Even great prompts fail ~25% of the time
- Feedback loops (validation → retry with feedback) → 95% success rate
- Progressive timeout scaling (1.0x → 1.5x → 2.0x) helps on retries

**4. LLMs are great at reasoning, terrible at precision**
- Use AI for "what exercise should I do and why?"
- Don't use AI for "calculate my 1RM" (use formulas)
- Responses API with structured outputs bridges this gap

**5. Structured knowledge > prompt engineering**
- My 362-line knowledge engine beats any "clever prompt"
- Domain expertise must be encoded, not implied
- Parametric configuration enables methodology fidelity

**6. Mobile web is underrated for fitness**
- No app store approval
- Instant updates
- Cross-platform from day one
- PWA capabilities (Wake Lock, offline support) are production-ready

**7. Users care about transparency**
- Every AI decision includes reasoning
- Users often read the reasoning before following suggestions
- "Show your work" builds trust—even when the AI is wrong

**8. Type safety saves lives**
- TypeScript + Zod caught hundreds of runtime errors
- AI outputs are unpredictable—validate everything
- Zod validation + business logic validation + user override = robust system

## Try ARVO & Let's Talk

I've been using ARVO for my own training for 3 months. It's genuinely changed how I approach progressive overload—I'm lifting smarter, not just harder.

**Try it**: [arvo.guru](https://arvo.guru) (free to start, no credit card)

**Curious about the tech?** I'm happy to deep-dive on:
- OpenAI Responses API implementation patterns
- Reasoning level optimization strategies
- Multi-agent orchestration with CoT persistence
- Validation-driven retry systems
- Knowledge engine design for parametric training
- Mobile-first React patterns for gym use

**What would you want to know about the implementation?** Drop questions below—I'll answer everything.

And if you've built AI-powered vertical tools, I'd love to hear about your architecture. What reasoning level strategies have worked for you? What challenges did you hit that I haven't mentioned?

---

_Built with Next.js 14, TypeScript, OpenAI Responses API (GPT-5-mini/GPT-5.1), Supabase, and way too much coffee. Currently powering 100+ workouts/week with 17+ specialized agents._
