-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create training_approaches table
create table public.training_approaches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  creator text,
  philosophy text,
  variables jsonb not null,
  progression_rules jsonb not null,
  exercise_rules jsonb not null,
  rationales jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_profiles table
create table public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  approach_id uuid references public.training_approaches(id) on delete set null,
  weak_points text[],
  experience_years integer check (experience_years >= 0),
  strength_baseline jsonb,
  equipment_preferences jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create exercises table
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pattern text,
  equipment_variants jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create workouts table
create table public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  approach_id uuid references public.training_approaches(id) on delete set null,
  planned_at date,
  exercises jsonb[],
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create sets_log table
create table public.sets_log (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  set_number integer,
  weight_target decimal,
  weight_actual decimal,
  reps_target integer,
  reps_actual integer,
  rir_actual integer check (rir_actual >= 0 and rir_actual <= 10),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better performance
create index idx_user_profiles_user_id on public.user_profiles(user_id);
create index idx_user_profiles_approach_id on public.user_profiles(approach_id);
create index idx_workouts_user_id on public.workouts(user_id);
create index idx_workouts_planned_at on public.workouts(planned_at);
create index idx_workouts_completed on public.workouts(completed);
create index idx_sets_log_workout_id on public.sets_log(workout_id);
create index idx_sets_log_exercise_id on public.sets_log(exercise_id);
create index idx_exercises_pattern on public.exercises(pattern);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.training_approaches enable row level security;
alter table public.user_profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.sets_log enable row level security;

-- RLS Policies for users table
create policy "Users can view their own user record"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own user record"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own user record"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies for training_approaches table (public read, authenticated write)
create policy "Anyone can view training approaches"
  on public.training_approaches for select
  to authenticated
  using (true);

create policy "Authenticated users can create training approaches"
  on public.training_approaches for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update training approaches"
  on public.training_approaches for update
  to authenticated
  using (true);

create policy "Authenticated users can delete training approaches"
  on public.training_approaches for delete
  to authenticated
  using (true);

-- RLS Policies for user_profiles table
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own profile"
  on public.user_profiles for delete
  using (auth.uid() = user_id);

-- RLS Policies for exercises table (public read, authenticated write)
create policy "Anyone can view exercises"
  on public.exercises for select
  to authenticated
  using (true);

create policy "Authenticated users can create exercises"
  on public.exercises for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update exercises"
  on public.exercises for update
  to authenticated
  using (true);

create policy "Authenticated users can delete exercises"
  on public.exercises for delete
  to authenticated
  using (true);

-- RLS Policies for workouts table
create policy "Users can view their own workouts"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workouts"
  on public.workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workouts"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- RLS Policies for sets_log table
create policy "Users can view sets from their own workouts"
  on public.sets_log for select
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = sets_log.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can insert sets for their own workouts"
  on public.sets_log for insert
  with check (
    exists (
      select 1 from public.workouts
      where workouts.id = sets_log.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can update sets from their own workouts"
  on public.sets_log for update
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = sets_log.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can delete sets from their own workouts"
  on public.sets_log for delete
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = sets_log.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- Function to automatically create user record on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user record on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_workouts_updated_at
  before update on public.workouts
  for each row execute procedure public.update_updated_at_column();
