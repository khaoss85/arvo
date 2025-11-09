-- Add mesocycle tracking fields to user_profiles
-- These fields enable periodization-aware workout recommendations

-- Add mesocycle_week column (1-12 to support different mesocycle lengths)
alter table public.user_profiles
add column current_mesocycle_week integer check (current_mesocycle_week >= 1 and current_mesocycle_week <= 12);

-- Add mesocycle_start_date column
alter table public.user_profiles
add column mesocycle_start_date timestamp with time zone;

-- Add mesocycle_phase column with valid phases
alter table public.user_profiles
add column mesocycle_phase text check (
  mesocycle_phase in ('accumulation', 'intensification', 'deload', 'transition')
);

-- Add comment explaining the fields
comment on column public.user_profiles.current_mesocycle_week is
  'Current week of mesocycle (1-12). Used for periodization-aware recommendations.';

comment on column public.user_profiles.mesocycle_start_date is
  'Start date of current mesocycle. Used to calculate automatic progression.';

comment on column public.user_profiles.mesocycle_phase is
  'Current training phase: accumulation (volume focus), intensification (intensity + advanced techniques), deload (recovery), or transition (between mesocycles).';

-- Create index for efficient querying
create index idx_user_profiles_mesocycle_week on public.user_profiles(current_mesocycle_week);

-- Optional: Create a function to auto-advance mesocycle week based on date
create or replace function public.calculate_mesocycle_week(
  start_date timestamp with time zone,
  check_date timestamp with time zone default now()
) returns integer as $$
declare
  days_elapsed integer;
  weeks_elapsed integer;
begin
  if start_date is null then
    return null;
  end if;

  days_elapsed := extract(day from check_date - start_date)::integer;
  weeks_elapsed := (days_elapsed / 7) + 1;

  -- Cap at week 12 (user needs to manually reset after completing mesocycle)
  return least(weeks_elapsed, 12);
end;
$$ language plpgsql immutable;

comment on function public.calculate_mesocycle_week is
  'Calculates current mesocycle week based on start date. Returns weeks elapsed + 1, capped at 12.';
