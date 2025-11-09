-- Add multiselect equipment preferences to user_profiles
-- Replaces the old single-select movement-pattern-based system

-- Step 1: Add new column for equipment array
ALTER TABLE public.user_profiles
ADD COLUMN available_equipment text[];

-- Step 2: Add comment explaining the field
COMMENT ON COLUMN public.user_profiles.available_equipment IS
  'Array of equipment IDs available to the user (multiselect). Uses equipment taxonomy from frontend constants.';

-- Step 3: Create GIN index for array queries (performance optimization)
CREATE INDEX idx_user_profiles_available_equipment
ON public.user_profiles USING GIN (available_equipment);

-- Step 4: Migrate existing equipment_preferences data
-- Map old movement-pattern preferences to new equipment IDs
UPDATE public.user_profiles
SET available_equipment = ARRAY(
  SELECT DISTINCT equipment_id
  FROM (
    -- Map Barbell
    SELECT 'barbell' as equipment_id
    WHERE (equipment_preferences->>'chest') = 'Barbell'
       OR (equipment_preferences->>'back_horizontal') = 'Barbell'
       OR (equipment_preferences->>'shoulders') = 'Barbell'
       OR (equipment_preferences->>'legs_quad') = 'Barbell'
       OR (equipment_preferences->>'legs_hip') = 'Barbell'

    UNION

    -- Map Dumbbells
    SELECT 'dumbbells' as equipment_id
    WHERE (equipment_preferences->>'chest') = 'Dumbbells'
       OR (equipment_preferences->>'back_horizontal') = 'Dumbbells'
       OR (equipment_preferences->>'shoulders') = 'Dumbbells'
       OR (equipment_preferences->>'legs_quad') = 'Dumbbells'
       OR (equipment_preferences->>'legs_hip') = 'Dumbbells'

    UNION

    -- Map Machines (general selectorized machines)
    SELECT UNNEST(ARRAY['chest_press_machine', 'seated_row_machine', 'leg_press_45']) as equipment_id
    WHERE (equipment_preferences->>'chest') = 'Machine'
       OR (equipment_preferences->>'back_horizontal') = 'Machine'
       OR (equipment_preferences->>'legs_quad') = 'Machine'
       OR (equipment_preferences->>'legs_hip') = 'Machine'

    UNION

    -- Map Cables
    SELECT UNNEST(ARRAY['cable_station', 'lat_pulldown', 'seated_cable_row']) as equipment_id
    WHERE (equipment_preferences->>'chest') = 'Cables'
       OR (equipment_preferences->>'back_horizontal') = 'Cables'
       OR (equipment_preferences->>'shoulders') = 'Cables'
       OR (equipment_preferences->>'legs_hip') = 'Cables'

    UNION

    -- Map Bodyweight
    SELECT UNNEST(ARRAY['pull_up_bar', 'dip_station']) as equipment_id
    WHERE (equipment_preferences->>'chest') = 'Bodyweight'
       OR (equipment_preferences->>'legs_quad') = 'Bodyweight'

    UNION

    -- Map Lat Machine
    SELECT 'lat_pulldown' as equipment_id
    WHERE (equipment_preferences->>'back_vertical') = 'Lat Machine'

    UNION

    -- Map Pull-up Bar
    SELECT 'pull_up_bar' as equipment_id
    WHERE (equipment_preferences->>'back_vertical') = 'Pull-up Bar'
  ) AS mapped
  WHERE equipment_id IS NOT NULL
)
WHERE equipment_preferences IS NOT NULL;

-- Step 5: Set default for users with no equipment preferences
-- Give them a basic home gym setup (dumbbells + pull-up bar)
UPDATE public.user_profiles
SET available_equipment = ARRAY['dumbbells', 'pull_up_bar']
WHERE available_equipment IS NULL OR array_length(available_equipment, 1) = 0;

-- Note: We keep equipment_preferences column for now (rollback safety)
-- It can be dropped in a future migration after confirming the migration worked
