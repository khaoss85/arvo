-- Add unique constraint on request_id to prevent duplicate entries
-- This is a follow-up fix after stabilizing useEffect dependencies in ProgressFeedback

-- First, cleanup any existing duplicate entries (keeping the earliest one)
DELETE FROM workout_generation_metrics a
USING workout_generation_metrics b
WHERE a.id > b.id
AND a.request_id = b.request_id;

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE workout_generation_metrics
ADD CONSTRAINT workout_generation_metrics_request_id_unique
UNIQUE (request_id);
