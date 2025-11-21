-- Add learned_target_weights column to workouts table
-- This column stores weights learned/adjusted during workout execution for future use

ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS learned_target_weights JSONB DEFAULT NULL;

-- Add comment explaining the column structure
COMMENT ON COLUMN workouts.learned_target_weights IS
'Stores target weights learned during workout execution. Structure:
[
  {
    "exerciseName": "Bench Press",
    "targetWeight": 80,
    "updatedAt": "2025-11-20T10:30:00Z",
    "confidence": "high"
  }
]
Used to improve future weight suggestions by learning from actual user performance.';

-- Create index for faster queries when looking up learned weights
CREATE INDEX IF NOT EXISTS idx_workouts_learned_weights
ON workouts USING gin (learned_target_weights);

-- Add helpful comment on the index
COMMENT ON INDEX idx_workouts_learned_weights IS
'GIN index for efficient JSONB queries on learned_target_weights.
Enables fast lookups of learned weights by exercise name.';
