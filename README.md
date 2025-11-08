# Training App

A Next.js 14 application for parametric training program building and workout tracking, built with TypeScript, Supabase, and modern web technologies.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Backend**: Supabase (Auth, Database, Realtime)
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Validation**: Zod
- **Dark Mode**: next-themes (system preference)

## Features

- Magic link authentication
- Mobile-first responsive design
- Dark mode with system preference
- Type-safe database operations
- Real-time data synchronization
- Clean architecture with services layer

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You can find these values in your Supabase project settings under "API".

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
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group
│   │   └── login/           # Login page
│   ├── (protected)/         # Protected route group
│   │   └── dashboard/       # Dashboard page
│   ├── auth/                # Auth callback
│   ├── providers.tsx        # React Query & Theme providers
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects)
├── components/
│   ├── ui/                  # Reusable UI components
│   └── features/            # Feature-specific components
├── lib/
│   ├── supabase/           # Supabase client utilities
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Middleware utilities
│   ├── services/           # API service layer
│   │   ├── auth.service.ts
│   │   ├── training-approach.service.ts
│   │   ├── user-profile.service.ts
│   │   ├── exercise.service.ts
│   │   ├── workout.service.ts
│   │   └── set-log.service.ts
│   ├── stores/             # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── workout.store.ts
│   │   └── ui.store.ts
│   ├── types/              # TypeScript types & Zod schemas
│   │   ├── database.ts     # Database types
│   │   └── schemas.ts      # Zod schemas
│   ├── hooks/              # React Query hooks
│   └── utils/              # Utility functions
├── supabase/
│   └── migrations/         # Database migrations
└── middleware.ts           # Next.js middleware for auth
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

### Services Layer

All database operations go through the services layer (`lib/services/`). Each service:
- Uses Zod schemas for validation
- Provides both client and server methods
- Handles errors consistently
- Returns typed data

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

## Next Steps

This foundation is ready for implementing features:

1. **Profile Setup**: Complete user onboarding flow
2. **Workout Builder**: Create workouts based on training approach
3. **Workout Logger**: Track sets, reps, weight during workouts
4. **Progress Tracking**: Visualize strength gains over time
5. **Exercise Library**: Browse and manage exercises

## License

Private project - All rights reserved
