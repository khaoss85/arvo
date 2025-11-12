-- Fix exercise usage tracking trigger to handle jsonb[] array type correctly
-- Resolves: "function jsonb_array_elements(jsonb[]) does not exist" error

CREATE OR REPLACE FUNCTION update_exercise_usage()
RETURNS TRIGGER AS $$
DECLARE
  exercise_name TEXT;
BEGIN
  -- Extract exercise names from workout exercises JSONB array
  -- Use unnest() to expand the jsonb[] array, then access properties
  FOR exercise_name IN
    SELECT element->>'name'
    FROM unnest(NEW.exercises) AS element
  LOOP
    UPDATE exercise_generations
    SET usage_count = usage_count + 1,
        last_used_at = timezone('utc'::text, now())
    WHERE name = exercise_name
      AND (user_id = NEW.user_id OR user_id IS NULL);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_exercise_usage IS 'Tracks how often AI-generated exercises are used to maintain consistency. Updated to handle jsonb[] array type.';
