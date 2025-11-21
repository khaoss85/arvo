-- Add ai_response_id column to split_plans table for GPT-5 reasoning persistence
-- This enables cumulative learning across split adaptations by maintaining reasoning continuity

ALTER TABLE split_plans
ADD COLUMN ai_response_id TEXT;

-- Add index for faster lookups when fetching previous response IDs
CREATE INDEX idx_split_plans_ai_response_id ON split_plans(ai_response_id);

-- Add comment explaining the column's purpose
COMMENT ON COLUMN split_plans.ai_response_id IS
  'OpenAI response ID from split generation. Used with previous_response_id parameter in Responses API for reasoning continuity across adaptations. Enables GPT-5 cumulative learning.';
