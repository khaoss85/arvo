-- MuscleWiki Exercise Cache Table
-- Stores exercise data from MuscleWiki API for cross-user caching
-- Reduces API calls by caching fetched exercises in Supabase

CREATE TABLE IF NOT EXISTS musclewiki_exercise_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musclewiki_id INT,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE,
  category TEXT,
  difficulty TEXT,
  mechanic TEXT,
  force TEXT,
  primary_muscles TEXT[],
  grips TEXT[],
  steps TEXT[],
  videos JSONB NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_musclewiki_name_normalized
  ON musclewiki_exercise_cache(name_normalized);
CREATE INDEX IF NOT EXISTS idx_musclewiki_category
  ON musclewiki_exercise_cache(category);
CREATE INDEX IF NOT EXISTS idx_musclewiki_primary_muscles
  ON musclewiki_exercise_cache USING GIN(primary_muscles);

-- RLS: Allow public read access (cached data is shared)
ALTER TABLE musclewiki_exercise_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to musclewiki cache" ON musclewiki_exercise_cache;
DROP POLICY IF EXISTS "Allow authenticated users to insert cache entries" ON musclewiki_exercise_cache;
DROP POLICY IF EXISTS "Allow authenticated users to update cache entries" ON musclewiki_exercise_cache;

CREATE POLICY "Allow public read access to musclewiki cache"
  ON musclewiki_exercise_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow authenticated users to insert cache entries"
  ON musclewiki_exercise_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cache entries"
  ON musclewiki_exercise_cache FOR UPDATE
  TO authenticated
  USING (true);
