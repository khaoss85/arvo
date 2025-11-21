-- Add 'rest' value to workout_type enum
-- This allows split plans to mark rest days with workoutType = 'rest'

ALTER TYPE workout_type ADD VALUE IF NOT EXISTS 'rest';
