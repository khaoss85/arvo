# Workout Execution System

Complete documentation for the real-time workout execution interface with AI-powered progression suggestions.

## Architecture Overview

The workout execution system follows a client-driven architecture with real-time AI integration:

```
User → Dashboard → Workout Page → Execution Store → AI Agents → Database
                        ↓
                   Components (Exercise Card, Set Logger, etc.)
                        ↓
                   Services (SetLog, Workout)
```

### Key Design Principles

1. **AI-Driven Progression**: Every set triggers AI analysis for next set suggestions
2. **Crash Recovery**: Essential state persisted to localStorage for interruption recovery
3. **Mobile-First**: Optimized for gym use with large touch targets (44px+), high contrast
4. **Real-time Feedback**: Immediate visual confirmation and progression guidance
5. **Zero Mock Data**: All suggestions are real AI calls using GPT-5-mini

## Core Components

### 1. Workout Execution Store (`lib/stores/workout-execution.store.ts`)

Zustand store managing active workout state with localStorage persistence.

**State Structure**:
```typescript
{
  workoutId: string | null
  workout: Workout | null
  exercises: ExerciseExecution[]  // Current workout exercises
  currentExerciseIndex: number
  startedAt: Date | null
  isActive: boolean
}
```

**Key Methods**:

- `startWorkout(workout, userId)` - Initialize new workout session
- `resumeWorkout(workout, userId)` - Resume interrupted workout
- `logSet(setData)` - Log completed set and trigger AI suggestion
- `setAISuggestion(suggestion)` - Store AI recommendation
- `substituteExercise(index, newExercise)` - Replace exercise mid-workout
- `nextExercise()` - Advance to next exercise
- `saveProgress()` - Persist state to database
- `completeWorkout()` - Mark workout as done
- `reset()` - Clear all state

**Persistence Strategy**:
- Essential data (workoutId, exercises, currentIndex) → localStorage
- Full workout state → Supabase on each set logged
- Recovery on reload checks localStorage first

### 2. Exercise Card (`components/features/workout/exercise-card.tsx`)

Main interface for current exercise display and AI suggestions.

**Features**:
- Displays current exercise with target sets/reps/weight
- Shows completed sets with visual indicators
- Requests AI suggestion after each completed set
- Displays AI rationale and alternatives
- Quick access to adjustments and substitution

**AI Integration**:
```typescript
useEffect(() => {
  if (lastCompletedSet && !exercise.currentAISuggestion && !isLastSet) {
    getSuggestion({
      lastSet: { weight, reps, rir },
      setNumber: currentSetNumber,
      exerciseType: 'compound', // or 'isolation'
      approachId
    }, {
      onSuccess: (suggestion) => {
        setAISuggestion(suggestion)
        setShowSuggestion(true)
      }
    })
  }
}, [lastCompletedSet])
```

**Key Props**:
- `exercise: ExerciseExecution` - Current exercise state
- `approachId: string` - Training approach for AI context

### 3. Set Logger (`components/features/workout/set-logger.tsx`)

Mobile-optimized interface for logging set performance.

**Input Controls**:
- **Weight**: ±2.5kg buttons + direct input (0.5kg precision)
- **Reps**: ±1 rep buttons + direct input
- **RIR**: Grid selector (0-5, visual feedback)

**Pre-population**:
- First set: Uses target weight + target reps
- Subsequent sets: Uses AI suggestion if available
- No suggestion: Uses previous set values

**Validation**:
- Weight ≥ 0
- Reps ≥ 1
- RIR 0-5
- All fields required before logging

**Mental Readiness Tracking** (Optional):
- Collapsible 1-5 emoji-based selector
- Tracks psychological state during sets
- Independent from physical metrics (RIR)
- Optional per set, required at workout completion
- Scales: 😫 (Drained) → 🔥 (Locked In)

### 4. Mental Readiness System

**Overview**:
Mental readiness tracking captures the user's psychological state during training to provide holistic insights beyond physical performance metrics.

**Design Philosophy**:
- **Dual-Level Tracking**: Set-level (optional) + Workout-level (required)
- **Low Friction**: Collapsible UI, emoji-based for quick selection
- **AI Integration**: Influences progression, recovery recommendations, and insights
- **Early Warning**: Detects mental fatigue before physical burnout

**Implementation**:

1. **Set-Level (Optional)**:
```typescript
// In SetLogger component
const [mentalReadiness, setMentalReadiness] = useState<number | undefined>()
const [showMentalSelector, setShowMentalSelector] = useState(false)

// Logged with each set
logSet({ weight, reps, rir, mentalReadiness })
```

2. **Workout-Level (Required)**:
```typescript
// In WorkoutSummary component
const [mentalReadinessSelected, setMentalReadinessSelected] = useState<number | null>(null)

// Required before completing workout
handleCompleteSummary() {
  if (!mentalReadinessSelected) {
    alert('Please select your mental state')
    return
  }
  markAsCompletedWithStats({ ..., mentalReadinessOverall })
}
```

**Scale Definition**:
```typescript
{
  1: { emoji: '😫', label: 'Drained', description: 'Struggled mentally throughout' },
  2: { emoji: '😕', label: 'Struggling', description: 'Lacked motivation' },
  3: { emoji: '😐', label: 'Neutral', description: 'Average mental state' },
  4: { emoji: '🙂', label: 'Engaged', description: 'Focused and present' },
  5: { emoji: '🔥', label: 'Locked In', description: 'Peak mental flow state' }
}
```

**Database Schema**:
```sql
-- Set-level tracking (optional)
ALTER TABLE sets_log
  ADD COLUMN mental_readiness INTEGER CHECK (mental_readiness >= 1 AND mental_readiness <= 5);

-- Workout-level tracking (required on completion)
ALTER TABLE workouts
  ADD COLUMN mental_readiness_overall INTEGER CHECK (mental_readiness_overall >= 1 AND mental_readiness_overall <= 5);

-- Analytics indexes
CREATE INDEX idx_sets_log_mental_readiness ON sets_log(mental_readiness) WHERE mental_readiness IS NOT NULL;
CREATE INDEX idx_workouts_mental_readiness ON workouts(mental_readiness_overall, completed_at) WHERE mental_readiness_overall IS NOT NULL AND completed = true;
```

**AI Integration**:

1. **ProgressionCalculator Agent**:
```typescript
// Input includes mental readiness from last set
{
  lastSet: { weight, reps, rir, mentalReadiness?: number },
  // ...
}

// AI considers mental state for progression
// Low mental readiness (≤2) → More conservative progression even if physical targets met
```

2. **WorkoutSummaryAgent**:
```typescript
// Input includes overall mental state
{
  // ...
  mentalReadinessOverall?: number
}

// AI factors mental state into:
// - Recovery recommendations
// - Performance assessment
// - Deload signals
```

3. **InsightsGenerator Agent**:
```typescript
// Fetches mental readiness analytics
const mentalData = await getMentalReadinessAnalytics(userId, days)

// Provides trend analysis:
// - Average mental state over period
// - Trend (improving/declining/stable)
// - Low mental state workout count
// - Alerts for consistent low readiness (burnout indicator)
```

**Analytics**:
```typescript
// Mental readiness analytics structure
{
  hasData: boolean
  average: number              // Average mental state (1-5)
  trend: 'improving' | 'declining' | 'stable'
  label: string                // 'Drained' to 'Locked In'
  lowMentalWorkouts: number    // Count of workouts with mental readiness ≤ 2
  totalWorkouts: number
}
```

**Use Cases**:

1. **Early Burnout Detection**: Physical PRs but declining mental readiness = deload signal
2. **Smarter Progression**: Don't push weight if mentally drained even if physically capable
3. **Pattern Recognition**: "Always mentally drained on legs day" = programming issue
4. **Holistic Training**: Acknowledges that bodybuilding is both physical and mental

**Display**:
- Set Logger: Optional collapsible selector (hidden by default)
- Exercise Card: Shows emoji next to completed sets if logged
- Workout Summary: Required 5-option grid selector before completion
- Progress Analytics: Mental readiness trends in insights dashboard

### 5. Quick Adjustments (`components/features/workout/quick-adjustments.tsx`)

Modal with common workout adjustments.

**Actions**:
1. **Equipment Busy**: Opens exercise substitution with equipment-specific alternatives
2. **Too Heavy**: Reduces target weight by 10% (rounded to nearest 0.5kg)
3. **Too Light**: Increases target weight by 10% (rounded to nearest 0.5kg)
4. **Rest Info**: Displays auto-regulation message

**Implementation**:
```typescript
const handleTooHeavy = () => {
  const newWeight = Math.round(currentExercise.targetWeight * 0.9 * 2) / 2
  const adjusted: ExerciseExecution = {
    ...currentExercise,
    targetWeight: newWeight,
    currentAISuggestion: null  // Clear AI suggestion
  }
  substituteExercise(exerciseIndex, adjusted)
  onClose()
}
```

### 5. Exercise Substitution (`components/features/workout/exercise-substitution.tsx`)

AI-powered exercise replacement with equipment adjustment.

**Workflow**:
1. Extract movement pattern from current exercise
2. Fetch similar exercises via `ExerciseService.getByPattern(pattern)`
3. User selects new equipment type
4. Calculate weight adjustment using biomechanical multipliers
5. Preserve completed sets from original exercise

**Equipment Multipliers**:
```typescript
{
  'Barbell': 1.0,
  'Dumbbells': 0.85,  // ~15% lighter (bilateral deficit)
  'Machine': 0.8,     // ~20% lighter (stabilization assistance)
  'Cables': 0.75,     // ~25% lighter (continuous tension)
  'Bodyweight': 1.0
}
```

**Example**:
- Current: Barbell Squat @ 100kg
- Switch to: Dumbbell Goblet Squat
- Adjusted: 100kg × (0.85 / 1.0) = 85kg (rounded to nearest 2.5kg)

### 6. Workout Progress (`components/features/workout/workout-progress.tsx`)

Visual progress indicator and exercise list.

**Displays**:
- Progress bar (% completion)
- Exercise list with status indicators:
  - Current: Blue highlight with border
  - Completed: Green background
  - Pending: Gray background
- Sets completed vs target for each exercise

### 7. Workout Summary (`components/features/workout/workout-summary.tsx`)

Post-workout summary with stats and next workout generation.

**Statistics Shown**:
- Total sets completed
- Total volume (weight × reps summed)
- Workout duration (formatted: "1h 23m")
- Exercise breakdown

**Actions**:
- **Generate Next Workout**: AI creates follow-up workout based on performance
- **Back to Dashboard**: Returns to main view

## AI Integration Points

### 1. Progression Calculator Agent

**Trigger**: After each completed set (except final set)

**Input**:
```typescript
{
  lastSet: {
    weight: number,
    reps: number,
    rir: number,
    mentalReadiness?: number  // 1-5 scale (optional)
  },
  setNumber: number,
  exerciseType: 'compound' | 'isolation',
  approachId: string,
  experienceYears?: number | null,
  userAge?: number | null
}
```

**Output**:
```typescript
{
  weight: number,
  reps: number,
  rirTarget: number,
  rationale: string,
  alternatives: Array<{ weight, reps, context }>
}
```

**Logic** (via GPT-5-mini):
- Analyzes last set RIR and performance
- Consults training approach parameters (Kuba Method)
- Suggests progressive overload or weight adjustment
- Provides rationale for recommendation

**Example**:
```
Last Set: 100kg × 8 reps @ RIR 1
Suggestion: 100kg × 9 reps @ RIR 1
Rationale: "Good performance with 1 RIR. Add 1 rep to continue progressive overload while maintaining intensity."
```

### 2. Exercise Selector Agent

**Trigger**: User clicks "Equipment Busy" in Quick Adjustments

**Input**:
```typescript
{
  currentExercise: string,
  pattern: string,
  availableExercises: Exercise[],
  preferredEquipment?: string
}
```

**Output**:
```typescript
{
  recommendedExercises: Array<{
    exerciseId: string,
    exerciseName: string,
    reasoning: string
  }>
}
```

### 3. Workout Generator Agent

**Trigger**: "Generate Next Workout" button on summary

**Input**:
```typescript
{
  userId: string,
  recentWorkouts: Workout[],
  profile: UserProfile,
  approachId: string
}
```

**Output**:
```typescript
{
  exercises: Array<{
    exerciseId: string,
    sets: number,
    reps: [number, number],
    weight: number
  }>,
  plannedAt: Date,
  rationale: string
}
```

## State Management Flow

### Starting a Workout

```
1. User clicks "Start Workout" on dashboard
2. Navigation to /workout/[id]
3. Server component loads workout + verifies ownership
4. WorkoutExecution component initializes
5. Store.startWorkout() called:
   - Sets isActive = true
   - Loads exercises into state
   - Persists to localStorage
   - Updates workout.started_at in DB
6. Renders first exercise
```

### Logging a Set

```
1. User inputs weight, reps, RIR
2. Clicks "Log Set"
3. SetLogger.handleLogSet():
   - Validates input
   - Calls store.logSet()
4. Store.logSet():
   - Creates set_log entry in DB
   - Adds to completedSets array
   - Calls saveProgress()
   - Persists to localStorage
5. ExerciseCard detects new completed set:
   - Triggers AI suggestion request
   - Shows loading state
6. AI responds:
   - Store.setAISuggestion() called
   - UI updates with suggestion
   - SetLogger pre-populates with suggestion
```

### Completing a Workout

```
1. User completes last set of last exercise
2. Clicks "Complete Workout"
3. Store.completeWorkout():
   - Calculates stats (volume, duration)
   - Calls WorkoutService.markAsCompletedWithStats()
   - Navigates to summary view
4. WorkoutSummary renders:
   - Loads and displays stats
   - Offers "Generate Next Workout"
5. User generates next or returns to dashboard
6. Store.reset() clears all state
```

## Mobile Optimizations

### 1. Touch Targets
- All interactive elements ≥ 44px
- Buttons: 48-56px height
- Large tap areas for critical actions

### 2. Visual Hierarchy
- High contrast (white text on dark background)
- Primary actions: Bright colors (blue, green)
- Secondary actions: Muted colors (gray)
- Danger actions: Red accents

### 3. Navigation Guards
- `beforeunload` event warns on accidental exit
- Confirmation modal for "Exit Workout"
- Browser back button intercepted

### 4. Fullscreen & Wake Lock
```typescript
// Wake Lock (keeps screen on)
const wakeLock = await navigator.wakeLock.request('screen')

// Fullscreen (gym mode)
document.documentElement.requestFullscreen()
```

### 5. Offline Resilience
- localStorage persists workout state
- Service layer handles network errors gracefully
- Manual sync on connection restore

## Database Schema Integration

### Tables Used

**workouts**:
- `id`, `user_id`, `planned_at`, `completed`, `started_at`, `completed_at`
- `exercises` (JSONB): Array of exercise details
- `stats` (JSONB): `{ totalVolume, duration }`
- `mental_readiness_overall` (INTEGER, 1-5): Overall mental state for workout
- `duration_seconds`, `total_volume`, `total_sets`

**set_logs**:
- `id`, `workout_id`, `exercise_id`, `set_number`
- `weight_actual`, `reps_actual`, `rir_actual`
- `mental_readiness` (INTEGER, 1-5, nullable): Set-level mental state
- `created_at`

**exercises**:
- `id`, `name`, `pattern`, `equipment_variants`
- `primary_muscles`, `secondary_muscles`

### RLS Policies

All tables enforce user-level security:
```sql
-- Workouts: Users can only access their own
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

-- Set Logs: Users can only log sets for their workouts
CREATE POLICY "Users can create own set logs"
  ON set_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = set_logs.workout_id
      AND workouts.user_id = auth.uid()
    )
  );
```

## Error Handling

### Network Errors
- AI suggestion fails → Use last performance as fallback
- Set log fails → Retry with exponential backoff
- Show user-friendly error messages

### Validation Errors
- Invalid weight/reps → Highlight field, show requirement
- Missing data → Disable submit until complete
- Server validation failure → Show specific error

### State Recovery
- Page reload → Check localStorage for active workout
- Corrupted state → Clear and redirect to dashboard
- Missing workout → Redirect with error message

## Performance Considerations

### 1. AI Call Optimization
- Debounce rapid requests (500ms)
- Cache suggestions per set number
- Cancel pending requests on navigation

### 2. Re-render Optimization
- Zustand selective subscriptions
- React.memo on heavy components
- Virtualization for long exercise lists (future)

### 3. Database Writes
- Batch set logs where possible
- Optimistic UI updates
- Background sync with retry queue

## Testing Strategy

### Unit Tests
- Workout helpers (adjustWeightForEquipment, calculateSetVolume)
- State management actions
- Validation functions

### Integration Tests
- Full workout flow (start → log sets → complete)
- AI suggestion request/response cycle
- Exercise substitution with weight adjustment

### E2E Tests
- Complete workout from dashboard to summary
- Crash recovery scenario
- Multiple device scenarios

## Future Enhancements

1. **Voice Commands**: Hands-free set logging
2. **Video Form Check**: AI analyzes exercise form
3. **Rest Timer**: Auto-regulated based on HRV
4. **Social Features**: Share PRs, compete with friends
5. **Apple Watch Integration**: Log sets from wrist
6. **Offline Mode**: Full functionality without internet
7. **Advanced Analytics**: Progress charts, volume trends
8. **Custom Exercise Library**: User-created exercises

## References

- Workout Execution Store: `lib/stores/workout-execution.store.ts`
- AI Agents: `lib/agents/progression-calculator.agent.ts`, `lib/agents/exercise-selector.agent.ts`
- Services: `lib/services/set-log.service.ts`, `lib/services/workout.service.ts`
- Components: `components/features/workout/*`
- Helpers: `lib/utils/workout-helpers.ts`
