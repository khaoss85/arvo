# ARVO - Development Principles & Guidelines

## Project Overview

ARVO is an AI-driven workout planning and tracking application built with Next.js 14, Supabase, and React Query. The application uses AI agents to make intelligent decisions about workout programming, progression, and adaptation.

## Core Architecture Principles

### 1. No Silos - Integrate with All Existing Services

**Always check existing services before creating new ones:**

- Review `lib/services/` for existing functionality
- Check `lib/hooks/` for existing React Query hooks
- Examine `lib/stores/` for existing Zustand stores
- Look at `components/` for reusable UI components

**When adding new features:**
- Extend existing services rather than creating isolated new ones
- Use dependency injection to connect services
- Ensure services communicate through well-defined interfaces
- Example: Don't create a separate workout service if `workout.service.ts` already exists

### 2. AI-Driven - Use Agents for All Decisions, No Hardcoded Logic

**AI-First Approach:**
- All workout decisions should flow through AI agents/models
- No hardcoded workout templates or progression formulas
- Training approaches define rules, AI interprets and applies them
- Use `training_approaches` table to store AI behavior configuration

**Avoid:**
```typescript
// ❌ BAD - Hardcoded logic
if (exerciseType === 'compound') {
  sets = 3;
  reps = 8;
}
```

**Instead:**
```typescript
// ✅ GOOD - AI-driven decision
const workoutPlan = await aiAgent.generateWorkout({
  approach: userApproach,
  history: userHistory,
  preferences: userPreferences
});
```

### 3. No Duplication - Reuse Existing Components/Services

**Before creating anything new:**
1. Search the codebase for similar functionality
2. Check if existing code can be extended/refactored
3. Use composition over duplication
4. Share common logic through utilities in `lib/utils/`

**Service Layer Structure:**
- `auth.service.ts` - Authentication operations
- `user-profile.service.ts` - User profile management
- `training-approach.service.ts` - Training methodology
- `exercise.service.ts` - Exercise database operations
- `workout.service.ts` - Workout planning
- `set-log.service.ts` - Set tracking and logging
- `workout-generator.service.ts` - AI-driven workout generation

**Always reuse:**
- Supabase clients from `lib/supabase/`
- Type-safe schemas from `lib/types/schemas.ts`
- Database types from `lib/types/database.ts`
- UI components from `components/ui/`

### 4. Holistic Vision - Consider Entire Codebase

**Before implementing features:**
- Understand how the feature fits into the overall architecture
- Consider impact on existing services and components
- Think about data flow across the application
- Map dependencies and relationships

**Key Integration Points:**
1. **Auth Flow**: Middleware → Auth Service → User Service → Profile Service
2. **Workout Flow**: User Profile → Training Approach → Workout Generator → Workout Service → Set Log
3. **Data Flow**: UI Components → React Query Hooks → Services → Supabase
4. **State Management**: Zustand Stores for client state, React Query for server state

**Always ask:**
- How does this feature affect existing workflows?
- What services need to be updated?
- Are there side effects on other features?
- Does this maintain consistency with existing patterns?

### 5. Minimal Fallbacks - Real Data Only, No Mock Data

**Production-First Mindset:**
- Never use mock data in production code
- Handle loading and error states properly
- Use real Supabase data from day one
- Implement proper data fetching with React Query

**Avoid:**
```typescript
// ❌ BAD - Mock data fallback
const workouts = data ?? MOCK_WORKOUTS;
```

**Instead:**
```typescript
// ✅ GOOD - Proper states handling
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data || data.length === 0) return <EmptyState />;
return <WorkoutList workouts={data} />;
```

**For development/testing:**
- Use seeding scripts in `scripts/`
- Create test data programmatically through services
- Clean up test data after use (see next principle)

### 6. Clean Testing - Remove Test Data After Use

**Test Data Lifecycle:**
1. Create test data programmatically before tests
2. Use transactions when possible
3. Clean up after tests complete
4. Never leave orphaned test records

**Example pattern:**
```typescript
// ✅ GOOD - Clean test data pattern
async function setupTestWorkout() {
  const workout = await workoutService.create({...});
  return {
    workout,
    cleanup: async () => {
      await workoutService.delete(workout.id);
    }
  };
}

// Usage
const { workout, cleanup } = await setupTestWorkout();
try {
  // Run tests...
} finally {
  await cleanup();
}
```

**For database migrations/seeds:**
- Create idempotent seed scripts
- Use clear naming conventions (e.g., `seed_test_data.ts`)
- Document cleanup procedures
- Consider using separate test database for integration tests

### 7. Update Documentation

**Documentation Requirements:**
- Update README.md when adding major features
- Document API services with JSDoc comments
- Keep SETUP.md current with setup steps
- Add inline comments for complex AI logic
- Update type definitions and schemas

**What to document:**
```typescript
/**
 * Generates a personalized workout based on user's training approach and history.
 *
 * @param userId - The user's unique identifier
 * @param options - Workout generation options
 * @param options.targetDate - Target date for the workout
 * @param options.focusAreas - Optional muscle groups to emphasize
 * @returns Generated workout with exercises and set recommendations
 *
 * @example
 * const workout = await generateWorkout(userId, {
 *   targetDate: new Date('2024-01-15'),
 *   focusAreas: ['chest', 'triceps']
 * });
 */
```

**Keep updated:**
- API endpoint documentation
- Service method signatures
- Database schema changes
- Environment variable requirements
- Deployment procedures

## Tech Stack & Patterns

### Required Technologies
- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Magic Links
- **State Management**:
  - React Query (server state)
  - Zustand (client state)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript + Zod schemas
- **AI Integration**: TBD (OpenAI, Anthropic, or custom)

### File Structure Conventions
```
app/
  (auth)/          # Unauthenticated routes
  (protected)/     # Authenticated routes
lib/
  services/        # Business logic & API calls
  hooks/           # React Query hooks
  stores/          # Zustand stores
  types/           # TypeScript types & Zod schemas
  supabase/        # Supabase client utilities
  utils/           # Shared utilities
components/
  ui/              # Reusable UI components
supabase/
  migrations/      # Database migrations
scripts/
  *.ts             # Utility scripts (seeds, migrations, etc.)
```

## Development Workflow

### Adding a New Feature

1. **Research Phase**
   - Search codebase for related functionality
   - Identify services/hooks/components to reuse
   - Map out data flow and dependencies

2. **Design Phase**
   - Design AI-driven approach (no hardcoded logic)
   - Plan service layer integration
   - Consider holistic impact on codebase

3. **Implementation Phase**
   - Extend existing services when possible
   - Use real data with proper error handling
   - Follow established patterns and conventions
   - Add TypeScript types and Zod schemas

4. **Testing Phase**
   - Create test data programmatically
   - Test integration with existing features
   - Clean up test data after completion

5. **Documentation Phase**
   - Add JSDoc comments to new functions
   - Update relevant documentation files
   - Document any new environment variables or setup steps

### Code Quality Standards

- **Type Safety**: All functions must have proper TypeScript types
- **Validation**: Use Zod schemas for runtime validation
- **Error Handling**: Proper try/catch with meaningful error messages
- **Consistency**: Follow existing code style and patterns
- **Performance**: Use React Query for caching and optimistic updates

## AI Agent Guidelines

The application's intelligence comes from AI agents that make decisions based on:
- User's training approach configuration
- Historical workout data and performance
- Recovery status and fatigue management
- Progressive overload principles
- Individual preferences and constraints

**Key AI Decision Points:**
1. Exercise selection based on training approach rules
2. Set/rep schemes based on user progression
3. Load prescription considering fatigue and readiness
4. Volume autoregulation based on performance
5. Deload timing and implementation

**AI Integration Pattern:**
```typescript
// All AI decisions should flow through a service layer
const decision = await aiService.makeDecision({
  context: 'exercise_selection',
  approach: userApproach,
  history: workoutHistory,
  constraints: userPreferences
});
```

## Questions to Ask Before Coding

1. Does a service/component already exist for this?
2. How can AI make this decision instead of hardcoding it?
3. What existing code can I reuse or extend?
4. How does this fit into the broader application architecture?
5. Am I using real data with proper error handling?
6. How will I clean up test data?
7. What documentation needs to be updated?

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **Next.js 14 Docs**: https://nextjs.org/docs
- **Zustand Docs**: https://docs.pmnd.rs/zustand

---

**Remember**: The goal is to build a cohesive, intelligent, maintainable application where AI drives decisions, services integrate seamlessly, and the codebase remains clean and well-documented.
