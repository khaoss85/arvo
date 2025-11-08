# ARVO - AI-Driven Training App

A Next.js 14 application for AI-powered parametric training with real-time workout execution and intelligent progression, built with TypeScript, Supabase, and OpenAI.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI (GPT-5-mini for progression and workout generation)
- **Styling**: Tailwind CSS (mobile-first, dark theme)
- **Backend**: Supabase (Auth, Database, RLS)
- **State Management**: Zustand (with localStorage persistence)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Validation**: Zod (runtime type safety)
- **Dark Mode**: next-themes (system preference)

## Features

### Authentication & Security
- Magic link authentication (passwordless)
- Row Level Security (RLS) on all database tables
- Secure session management with Supabase Auth

### Intelligent Onboarding
- 5-step guided onboarding flow
- Interactive body map for weak point selection
- Equipment preference configuration
- Strength baseline assessment via 1RM calculator
- Training approach selection (Kuba Method)
- AI-generated first workout based on profile

### AI Orchestration Layer
- **Knowledge Engine**: Parametric training approach system
- **Progression Calculator Agent**: Real-time set-by-set suggestions using GPT-5-mini
- **Exercise Selector Agent**: Smart exercise substitution based on equipment and patterns
- **Workout Generator Agent**: Creates progressive workouts based on performance history

### Real-Time Workout Execution
- Mobile-optimized workout interface (44px+ touch targets)
- Live AI progression suggestions after each set
- Quick weight adjustments (±10% for too heavy/light)
- Exercise substitution with automatic weight adjustment
- Crash recovery with localStorage persistence
- Wake Lock API (keeps screen on during workouts)
- Fullscreen mode for distraction-free gym use
- Navigation guards to prevent accidental exit
- Personal record tracking and celebration

### Progress Tracking
- Set-by-set performance logging (weight, reps, RIR)
- Workout volume calculations
- Duration tracking
- Exercise history and personal records
- Visual progress indicators

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### 2. Clone and Install

```bash
git clone https://github.com/khaoss85/arvo.git
cd arvo
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Where to find these values**:
- **Supabase**: Project settings → API → Project URL and anon public key
- **OpenAI**: Platform dashboard → API Keys → Create new secret key

See `.env.local.example` for a complete template.

### 4. Database Setup

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Run the migration

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
arvo/
├── app/                              # Next.js App Router
│   ├── (auth)/                      # Auth route group
│   │   └── login/                   # Login page
│   ├── (protected)/                 # Protected route group
│   │   ├── dashboard/               # Dashboard with workout cards
│   │   ├── onboarding/              # 5-step onboarding flow
│   │   │   ├── approach/            # Training approach selection
│   │   │   ├── weak-points/         # Body map weak point selection
│   │   │   ├── equipment/           # Equipment preferences
│   │   │   ├── strength/            # Strength baseline (1RM)
│   │   │   └── review/              # Review and submit
│   │   └── workout/[id]/            # Active workout execution
│   ├── auth/                        # Auth callback
│   ├── providers.tsx                # React Query & Theme providers
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page (redirects)
├── components/
│   ├── ui/                          # Reusable UI components (Button, Input, etc.)
│   └── features/                    # Feature-specific components
│       ├── dashboard/               # Dashboard components
│       │   └── workout-generator.tsx # AI workout generation
│       ├── onboarding/              # Onboarding components
│       │   ├── approach-card.tsx    # Training approach card
│       │   └── body-map.tsx         # Interactive SVG body map
│       └── workout/                 # Workout execution components
│           ├── workout-execution.tsx  # Main workout container
│           ├── exercise-card.tsx      # Current exercise display
│           ├── set-logger.tsx         # Set logging interface
│           ├── workout-progress.tsx   # Progress indicator
│           ├── workout-summary.tsx    # Post-workout summary
│           ├── quick-adjustments.tsx  # Quick action menu
│           └── exercise-substitution.tsx # Exercise replacement modal
├── lib/
│   ├── ai/                          # AI client configuration
│   │   └── client.ts                # OpenAI singleton (GPT-5-mini)
│   ├── agents/                      # AI agents
│   │   ├── base.agent.ts            # Abstract base agent class
│   │   ├── progression-calculator.agent.ts # Set progression AI
│   │   └── exercise-selector.agent.ts      # Exercise selection AI
│   ├── knowledge/                   # Knowledge Engine
│   │   ├── types.ts                 # Training approach types
│   │   └── engine.ts                # Knowledge Engine class
│   ├── supabase/                    # Supabase client utilities
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client
│   │   └── middleware.ts            # Middleware utilities
│   ├── services/                    # API service layer
│   │   ├── auth.service.ts
│   │   ├── training-approach.service.ts
│   │   ├── user-profile.service.ts
│   │   ├── exercise.service.ts
│   │   ├── workout.service.ts
│   │   ├── workout-generator.service.ts # AI workout generation
│   │   ├── set-log.service.ts
│   │   └── onboarding.service.ts
│   ├── stores/                      # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── onboarding.store.ts      # Onboarding flow state
│   │   └── workout-execution.store.ts # Active workout state
│   ├── types/                       # TypeScript types & Zod schemas
│   │   ├── database.ts              # Database types
│   │   ├── schemas.ts               # Zod schemas
│   │   └── onboarding.ts            # Onboarding types
│   ├── hooks/                       # React Query hooks
│   │   └── useAI.ts                 # AI agent hooks
│   └── utils/                       # Utility functions
│       ├── auth.server.ts           # Server-side auth helpers
│       └── workout-helpers.ts       # Workout calculations
├── docs/                            # Documentation
│   └── WORKOUT_EXECUTION.md         # Complete workout execution docs
├── scripts/                         # Utility scripts
│   └── seed-kuba-approach.ts        # Seed Kuba Method
├── supabase/
│   └── migrations/                  # Database migrations
└── middleware.ts                    # Next.js middleware for auth
```

## Database Schema

The app uses the following core tables:

- **training_approaches**: Training methodologies and their parameters
- **users**: User accounts (extends Supabase auth)
- **user_profiles**: User preferences and baselines
- **exercises**: Exercise library with variants
- **workouts**: Planned and completed workouts
- **sets_log**: Individual set records

All tables have Row Level Security (RLS) enabled for data protection.

## Authentication Flow

1. User enters email on `/login`
2. Magic link sent to email
3. User clicks link → redirected to `/auth/callback`
4. Session created → redirected to `/dashboard`

## Development Guidelines

**For detailed development principles and guidelines, see [`.claude/instructions.md`](.claude/instructions.md)**

### Core Principles

1. **No Silos** - Integrate with all existing services, avoid isolated solutions
2. **AI-Driven** - Use agents for decisions, minimize hardcoded logic
3. **No Duplication** - Reuse existing components and services
4. **Holistic Vision** - Consider the entire codebase architecture
5. **Minimal Fallbacks** - Use real data only, no mock data in production
6. **Clean Testing** - Remove test data after use
7. **Update Documentation** - Keep docs current with changes

### Services Layer

All database operations go through the services layer (`lib/services/`). Each service:
- Uses Zod schemas for validation
- Provides both client and server methods
- Handles errors consistently
- Returns typed data
- Integrates with existing services (no silos)

### React Query Hooks

Custom hooks in `lib/hooks/` provide:
- Automatic caching
- Optimistic updates
- Cache invalidation
- Loading/error states

### State Management

- **Zustand**: Local UI state, active workout state
- **React Query**: Server state, data fetching
- **Supabase Realtime**: Live data updates (to be implemented)

### AI-First Development

This app is AI-driven. Key decisions flow through AI agents:
- Exercise selection based on training approach
- Set/rep schemes based on user progression
- Load prescription considering fatigue
- Volume autoregulation based on performance

Avoid hardcoded workout logic - let AI interpret training approaches.

## User Journey

### 1. First-Time User
1. Visit app → Redirected to `/login`
2. Enter email → Magic link sent
3. Click magic link → Session created
4. Redirected to `/onboarding/approach`
5. Complete 5-step onboarding:
   - Select training approach (Kuba Method)
   - Mark weak points on interactive body map
   - Configure equipment preferences
   - Input strength baseline (1RM for key lifts)
   - Review profile and submit
6. AI generates first workout
7. Redirected to `/dashboard`

### 2. Returning User - Start Workout
1. Login → Dashboard shows upcoming workouts
2. Click "Start Workout" on a workout card
3. Navigate to `/workout/[id]`
4. Workout execution interface loads:
   - Screen kept on (Wake Lock)
   - Navigation guard prevents accidental exit
   - First exercise displayed
5. Complete each set:
   - Input weight, reps, RIR
   - Log set → AI analyzes performance
   - AI suggests next set parameters with rationale
   - Accept suggestion or adjust manually
6. Quick adjustments available:
   - Equipment busy → Substitute exercise
   - Too heavy → Reduce weight 10%
   - Too light → Increase weight 10%
7. Complete all exercises
8. View workout summary (volume, duration, stats)
9. Generate next workout or return to dashboard

### 3. Advanced Features
- **Personal Records**: Automatically detected and celebrated
- **Crash Recovery**: Interrupted workouts resume from localStorage
- **Volume Tracking**: Total volume calculated across all sets
- **Exercise History**: View past performance for any exercise

## Architecture Highlights

### AI Agents System

All AI decisions flow through specialized agents using GPT-5-mini:

```typescript
// Progression Calculator Agent
const suggestion = await progressionCalculator.getSuggestion({
  lastSet: { weight: 100, reps: 8, rir: 1 },
  setNumber: 2,
  exerciseType: 'compound',
  approachId: 'kuba-method-id'
})
// → { weight: 100, reps: 9, rirTarget: 1, rationale: "..." }

// Exercise Selector Agent
const alternatives = await exerciseSelector.selectExercises({
  targetMuscles: ['quads', 'glutes'],
  equipment: ['Barbell', 'Dumbbells'],
  weakPoints: ['quads'],
  recentExercises: ['Squat', 'Leg Press']
})
// → [{ exerciseId, exerciseName, reasoning }, ...]

// Workout Generator
const workout = await WorkoutGeneratorService.generateWorkout(userId)
// → { exercises: [...], plannedAt: Date, rationale: "..." }
```

### Knowledge Engine

Training approaches are parametric and queryable:

```typescript
const approach = await knowledgeEngine.getApproach('kuba-method-id')
// Returns formatted context for AI agents:
{
  name: "Kuba Method",
  variables: {
    setsPerExercise: { working: 3, warmup: "2 progressive sets" },
    repRanges: { compound: [6, 10], isolation: [8, 15] },
    rirTarget: { normal: 1, intense: 0, deload: 3 },
    // ... full parametric definition
  },
  progression: { /* progression rules */ },
  exerciseSelection: { /* selection criteria */ }
}
```

### State Management Architecture

```
UI Layer (React Components)
    ↓
Zustand Stores (Client State)
    ↓
React Query Hooks (Server State Cache)
    ↓
Service Layer (Business Logic)
    ↓
Supabase Client (Database Access)
    ↓
PostgreSQL with RLS
```

**State Persistence**:
- **localStorage**: Active workout crash recovery (workoutId, exercises, currentIndex)
- **Supabase**: Source of truth for all workouts, sets, profiles
- **React Query**: Automatic caching, invalidation, optimistic updates

## Documentation

- **[WORKOUT_EXECUTION.md](docs/WORKOUT_EXECUTION.md)**: Complete technical documentation for workout execution system
- **[.claude/instructions.md](.claude/instructions.md)**: Development principles and guidelines

## Roadmap

### Completed ✅
- [x] Authentication with magic links
- [x] AI orchestration layer with OpenAI
- [x] Knowledge Engine for training approaches
- [x] 5-step onboarding flow with body map
- [x] AI workout generation
- [x] Real-time workout execution interface
- [x] Set-by-set AI progression suggestions
- [x] Exercise substitution with weight adjustment
- [x] Quick workout adjustments
- [x] Crash recovery system
- [x] Personal record tracking
- [x] Workout statistics (volume, duration)

### Planned 🚀
- [ ] Progress visualization (charts, trends)
- [ ] Exercise library browsing and filtering
- [ ] Custom exercise creation
- [ ] Workout templates
- [ ] Training plan management (mesocycles)
- [ ] Voice commands for hands-free logging
- [ ] Apple Watch integration
- [ ] Video form analysis with AI
- [ ] Social features (share PRs, compete)
- [ ] Advanced analytics (fatigue tracking, deload recommendations)

## License

Private project - All rights reserved
