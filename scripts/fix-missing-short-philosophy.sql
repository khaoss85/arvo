-- Fix missing short_philosophy for remaining approaches

-- 1. Update Kuba Method
UPDATE training_approaches
SET short_philosophy = 'Quality-focused training emphasizing controlled eccentric movements and autoregulated rest periods. Built around a systematic 3-days-on, 1-day-off cycle with moderate volume. Prioritizes technical execution and mind-muscle connection over ego lifting. Designed for sustainable progression through meticulous form and intelligent recovery management.'
WHERE name = 'Kuba Method';

-- 2. Update Y3T
UPDATE training_approaches
SET short_philosophy = 'Undulating periodization system rotating training stress across a 3-week microcycle: Heavy Week (6-8 reps, strength focus), Hybrid Week (8-12 reps, balanced hypertrophy), Hell Week (15-30+ reps, metabolic stress). Prevents adaptation plateaus through systematic variation. Used by 4x Mr. Olympia Flex Wheeler.'
WHERE name = 'Y3T (Yoda 3 Training - Neil Hill)';

-- 3. Delete duplicate Mountain Dog (keep only the one with short_philosophy)
DELETE FROM training_approaches
WHERE name = 'Mountain Dog Training (John Meadows)'
  AND short_philosophy IS NULL;

-- Verify results
SELECT
  name,
  creator,
  CASE
    WHEN short_philosophy IS NOT NULL THEN '✅ SET (' || array_length(string_to_array(short_philosophy, ' '), 1) || ' words)'
    ELSE '❌ NOT SET'
  END as short_philosophy_status
FROM training_approaches
ORDER BY name;
