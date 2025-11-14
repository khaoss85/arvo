-- =====================================================
-- Bro Split & Weak Point Focus Split Support
-- Adds support for 5-day Bro Split (with A/B variations)
-- and Weak Point Focus Split (specialization-based training)
-- =====================================================

-- ===================
-- ENUM UPDATES
-- ===================

-- Add new split types
DO $$ BEGIN
    -- Add bro_split (5-day split: chest, back, shoulders, arms, legs with A/B variations)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'bro_split'
        AND enumtypid = 'split_type'::regtype
    ) THEN
        ALTER TYPE split_type ADD VALUE 'bro_split';
    END IF;

    -- Add weak_point_focus (specialization split with increased frequency/volume for target muscle)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'weak_point_focus'
        AND enumtypid = 'split_type'::regtype
    ) THEN
        ALTER TYPE split_type ADD VALUE 'weak_point_focus';
    END IF;
END $$;

-- Add new workout types for Bro Split
DO $$ BEGIN
    -- Add chest (dedicated chest day)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'chest'
        AND enumtypid = 'workout_type'::regtype
    ) THEN
        ALTER TYPE workout_type ADD VALUE 'chest';
    END IF;

    -- Add back (dedicated back day)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'back'
        AND enumtypid = 'workout_type'::regtype
    ) THEN
        ALTER TYPE workout_type ADD VALUE 'back';
    END IF;

    -- Add shoulders (dedicated shoulder day)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'shoulders'
        AND enumtypid = 'workout_type'::regtype
    ) THEN
        ALTER TYPE workout_type ADD VALUE 'shoulders';
    END IF;

    -- Add arms (dedicated arms day - biceps + triceps)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'arms'
        AND enumtypid = 'workout_type'::regtype
    ) THEN
        ALTER TYPE workout_type ADD VALUE 'arms';
    END IF;
END $$;

-- ===================
-- TABLE UPDATES
-- ===================

-- Add specialization support to split_plans
ALTER TABLE split_plans
  ADD COLUMN IF NOT EXISTS specialization_muscle VARCHAR,
  ADD COLUMN IF NOT EXISTS specialization_frequency INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS specialization_volume_multiplier DECIMAL(3,2) DEFAULT NULL;

COMMENT ON COLUMN split_plans.specialization_muscle IS 'Target muscle for weak point focus split (e.g., "chest", "shoulders", "legs")';
COMMENT ON COLUMN split_plans.specialization_frequency IS 'Number of times per cycle the specialization muscle is trained';
COMMENT ON COLUMN split_plans.specialization_volume_multiplier IS 'Volume multiplier for specialization muscle (e.g., 1.5 = 50% more volume)';

-- Add specialization preference to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferred_specialization_muscle VARCHAR;

COMMENT ON COLUMN user_profiles.preferred_specialization_muscle IS 'User preferred muscle to specialize on for weak point focus splits';

-- ===================
-- VALIDATION
-- ===================

-- Note: Validation of specialization_muscle based on split_type
-- is handled at the application level in split-plan.service.ts
-- to avoid enum value commitment issues in PostgreSQL

-- ===================
-- INDEXES
-- ===================

-- Index for filtering by specialization muscle
CREATE INDEX IF NOT EXISTS idx_split_plans_specialization
ON split_plans(specialization_muscle)
WHERE specialization_muscle IS NOT NULL;

-- Index for user specialization preference
CREATE INDEX IF NOT EXISTS idx_user_profiles_specialization
ON user_profiles(preferred_specialization_muscle)
WHERE preferred_specialization_muscle IS NOT NULL;
