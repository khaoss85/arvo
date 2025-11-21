-- Add ai_response_id column to workouts table for GPT-5 reasoning persistence
-- This enables exercise selection reasoning continuity across consecutive workouts

ALTER TABLE workouts
ADD COLUMN ai_response_id TEXT;

-- Create index for efficient lookups of workouts by AI response ID
CREATE INDEX idx_workouts_ai_response_id ON workouts(ai_response_id);

-- Add helpful comment explaining the column's purpose
COMMENT ON COLUMN workouts.ai_response_id IS
  'OpenAI response ID from exercise selection. Used with previous_response_id parameter in Responses API for reasoning continuity across consecutive workouts. Enables GPT-5 cumulative learning of user exercise preferences, equipment choices, and substitution patterns.';
