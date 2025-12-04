-- ============================================
-- ARVO COACH MODE - Demo Client Seed Script
-- ============================================
--
-- Creates a complete demo client for testing coach mode functionality.
-- The demo client is linked to ALL users with role='coach'.
--
-- EXECUTION:
--   npx supabase db execute -f supabase/seed-demo-client.sql
--
-- CLEANUP:
--   DELETE FROM auth.users WHERE id = '00000000-0000-4000-a000-000000000001';
--   (Cascade will delete all related records)
--
-- ============================================

-- Fixed UUIDs for demo data (easily identifiable and reproducible)
DO $$
DECLARE
    demo_client_id UUID := '00000000-0000-4000-a000-000000000001';
    demo_workout_push UUID := '00000000-0000-4000-a000-000000000010';
    demo_workout_pull UUID := '00000000-0000-4000-a000-000000000011';
    demo_workout_legs UUID := '00000000-0000-4000-a000-000000000012';
    demo_progress_1 UUID := '00000000-0000-4000-a000-000000000020';
    demo_progress_2 UUID := '00000000-0000-4000-a000-000000000021';
    demo_template UUID := '00000000-0000-4000-a000-000000000030';
    demo_assignment UUID := '00000000-0000-4000-a000-000000000040';
    approach_id UUID;
    coach_record RECORD;
    first_coach_id UUID;
BEGIN
    -- ========================================
    -- 0. CLEANUP: Remove existing demo data
    -- ========================================
    DELETE FROM auth.users WHERE id = demo_client_id;

    -- ========================================
    -- 1. GET TRAINING APPROACH
    -- ========================================
    SELECT id INTO approach_id FROM training_approaches WHERE name = 'Kuba Method' LIMIT 1;
    IF approach_id IS NULL THEN
        SELECT id INTO approach_id FROM training_approaches LIMIT 1;
    END IF;

    IF approach_id IS NULL THEN
        RAISE EXCEPTION 'No training approaches found. Please seed approaches first.';
    END IF;

    RAISE NOTICE 'Using approach_id: %', approach_id;

    -- ========================================
    -- 2. CREATE DEMO CLIENT IN AUTH.USERS
    -- ========================================
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        demo_client_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'demo.client@arvo.app',
        crypt('demo_password_123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Marco", "demo_user": true}',
        NOW() - INTERVAL '30 days',
        NOW(),
        '',
        ''
    );

    RAISE NOTICE 'Created auth.users entry for demo client';

    -- ========================================
    -- 3. CREATE DEMO CLIENT IN PUBLIC.USERS
    -- ========================================
    INSERT INTO users (id, email, role, created_at)
    VALUES (demo_client_id, 'demo.client@arvo.app', 'user', NOW() - INTERVAL '30 days');

    RAISE NOTICE 'Created public.users entry for demo client';

    -- ========================================
    -- 4. CREATE USER PROFILE
    -- ========================================
    INSERT INTO user_profiles (
        user_id,
        first_name,
        age,
        gender,
        weight,
        height,
        experience_years,
        approach_id,
        preferred_split,
        caloric_phase,
        preferred_language,
        training_focus,
        available_equipment,
        weak_points,
        audio_coaching_enabled,
        created_at,
        updated_at
    ) VALUES (
        demo_client_id,
        'Marco',
        28,
        'male',
        78.5,
        178,
        3,
        approach_id,
        'push_pull_legs',
        'maintenance',
        'it',
        'balanced',
        ARRAY['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
        ARRAY['chest', 'shoulders'],
        true,
        NOW() - INTERVAL '30 days',
        NOW()
    );

    RAISE NOTICE 'Created user_profiles entry for demo client';

    -- ========================================
    -- 5. LINK TO ALL COACHES
    -- ========================================
    FOR coach_record IN
        SELECT id FROM users WHERE role IN ('coach', 'admin')
    LOOP
        IF first_coach_id IS NULL THEN
            first_coach_id := coach_record.id;
        END IF;

        INSERT INTO coach_client_relationships (
            id,
            coach_id,
            client_id,
            status,
            client_autonomy,
            invited_at,
            accepted_at,
            notes,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            coach_record.id,
            demo_client_id,
            'active',
            'standard',
            NOW() - INTERVAL '25 days',
            NOW() - INTERVAL '25 days',
            'Demo client per testing coach mode',
            NOW() - INTERVAL '25 days',
            NOW()
        )
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Linked demo client to coach: %', coach_record.id;
    END LOOP;

    -- Update coach_id in user_profiles to first coach
    IF first_coach_id IS NOT NULL THEN
        UPDATE user_profiles
        SET coach_id = first_coach_id
        WHERE user_id = demo_client_id;
    END IF;

    -- ========================================
    -- 6. CREATE COMPLETED WORKOUTS
    -- ========================================

    -- PUSH WORKOUT (2 days ago)
    INSERT INTO workouts (
        id,
        user_id,
        approach_id,
        planned_at,
        started_at,
        completed_at,
        duration_seconds,
        total_volume,
        total_sets,
        status,
        workout_type,
        workout_name,
        target_muscle_groups,
        split_type,
        mental_readiness_overall,
        notes,
        exercises,
        created_at,
        updated_at
    ) VALUES (
        demo_workout_push,
        demo_client_id,
        approach_id,
        CURRENT_DATE - INTERVAL '2 days',
        (CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '9 hours')::timestamptz,
        (CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '10 hours' + INTERVAL '15 minutes')::timestamptz,
        4500,
        8500,
        16,
        'completed',
        'push',
        'Push Day - Chest & Shoulders Focus',
        ARRAY['chest', 'shoulders', 'triceps'],
        'push_pull_legs',
        4,
        'Sessione solida, buone sensazioni sulla panca',
        ARRAY[
            '{"exerciseName": "Barbell Bench Press", "name": "Barbell Bench Press", "equipment": "barbell", "sets": 4, "repRange": [6, 8], "targetWeight": 85, "rir": 2, "primaryMuscles": ["chest"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Incline Dumbbell Press", "name": "Incline Dumbbell Press", "equipment": "dumbbell", "sets": 3, "repRange": [8, 10], "targetWeight": 30, "rir": 2, "primaryMuscles": ["chest"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Seated Dumbbell Shoulder Press", "name": "Seated Dumbbell Shoulder Press", "equipment": "dumbbell", "sets": 3, "repRange": [8, 10], "targetWeight": 24, "rir": 2, "primaryMuscles": ["shoulders"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Cable Lateral Raise", "name": "Cable Lateral Raise", "equipment": "cable", "sets": 3, "repRange": [12, 15], "targetWeight": 8, "rir": 1, "primaryMuscles": ["shoulders"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Tricep Pushdown", "name": "Tricep Pushdown", "equipment": "cable", "sets": 3, "repRange": [10, 12], "targetWeight": 25, "rir": 1, "primaryMuscles": ["triceps"], "animationUrl": null}'::jsonb
        ],
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    );

    -- PULL WORKOUT (4 days ago)
    INSERT INTO workouts (
        id,
        user_id,
        approach_id,
        planned_at,
        started_at,
        completed_at,
        duration_seconds,
        total_volume,
        total_sets,
        status,
        workout_type,
        workout_name,
        target_muscle_groups,
        split_type,
        mental_readiness_overall,
        notes,
        exercises,
        created_at,
        updated_at
    ) VALUES (
        demo_workout_pull,
        demo_client_id,
        approach_id,
        CURRENT_DATE - INTERVAL '4 days',
        (CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '18 hours')::timestamptz,
        (CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '19 hours' + INTERVAL '20 minutes')::timestamptz,
        4800,
        9200,
        15,
        'completed',
        'pull',
        'Pull Day - Back & Biceps',
        ARRAY['back', 'biceps', 'rear_delts'],
        'push_pull_legs',
        4,
        'Stacco pesante oggi, PR personale!',
        ARRAY[
            '{"exerciseName": "Conventional Deadlift", "name": "Conventional Deadlift", "equipment": "barbell", "sets": 4, "repRange": [5, 6], "targetWeight": 140, "rir": 2, "primaryMuscles": ["back", "glutes"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Barbell Row", "name": "Barbell Row", "equipment": "barbell", "sets": 3, "repRange": [8, 10], "targetWeight": 70, "rir": 2, "primaryMuscles": ["back"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Lat Pulldown", "name": "Lat Pulldown", "equipment": "cable", "sets": 3, "repRange": [10, 12], "targetWeight": 60, "rir": 2, "primaryMuscles": ["back"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Face Pull", "name": "Face Pull", "equipment": "cable", "sets": 3, "repRange": [15, 20], "targetWeight": 20, "rir": 1, "primaryMuscles": ["rear_delts"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Dumbbell Curl", "name": "Dumbbell Curl", "equipment": "dumbbell", "sets": 2, "repRange": [10, 12], "targetWeight": 14, "rir": 1, "primaryMuscles": ["biceps"], "animationUrl": null}'::jsonb
        ],
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days'
    );

    -- LEGS WORKOUT (6 days ago)
    INSERT INTO workouts (
        id,
        user_id,
        approach_id,
        planned_at,
        started_at,
        completed_at,
        duration_seconds,
        total_volume,
        total_sets,
        status,
        workout_type,
        workout_name,
        target_muscle_groups,
        split_type,
        mental_readiness_overall,
        notes,
        exercises,
        created_at,
        updated_at
    ) VALUES (
        demo_workout_legs,
        demo_client_id,
        approach_id,
        CURRENT_DATE - INTERVAL '6 days',
        (CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '10 hours')::timestamptz,
        (CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '11 hours' + INTERVAL '30 minutes')::timestamptz,
        5400,
        12000,
        18,
        'completed',
        'legs',
        'Leg Day - Quad Emphasis',
        ARRAY['quads', 'hamstrings', 'glutes', 'calves'],
        'push_pull_legs',
        3,
        'Gambe stanche ma completato tutto',
        ARRAY[
            '{"exerciseName": "Barbell Back Squat", "name": "Barbell Back Squat", "equipment": "barbell", "sets": 4, "repRange": [6, 8], "targetWeight": 110, "rir": 2, "primaryMuscles": ["quads", "glutes"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Leg Press", "name": "Leg Press", "equipment": "machine", "sets": 3, "repRange": [10, 12], "targetWeight": 180, "rir": 2, "primaryMuscles": ["quads"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Romanian Deadlift", "name": "Romanian Deadlift", "equipment": "barbell", "sets": 3, "repRange": [8, 10], "targetWeight": 80, "rir": 2, "primaryMuscles": ["hamstrings", "glutes"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Leg Curl", "name": "Leg Curl", "equipment": "machine", "sets": 3, "repRange": [10, 12], "targetWeight": 45, "rir": 1, "primaryMuscles": ["hamstrings"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Leg Extension", "name": "Leg Extension", "equipment": "machine", "sets": 3, "repRange": [12, 15], "targetWeight": 50, "rir": 1, "primaryMuscles": ["quads"], "animationUrl": null}'::jsonb,
            '{"exerciseName": "Standing Calf Raise", "name": "Standing Calf Raise", "equipment": "machine", "sets": 2, "repRange": [15, 20], "targetWeight": 80, "rir": 1, "primaryMuscles": ["calves"], "animationUrl": null}'::jsonb
        ],
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '6 days'
    );

    RAISE NOTICE 'Created 3 demo workouts';

    -- ========================================
    -- 7. CREATE SETS LOG ENTRIES
    -- ========================================

    -- Push workout sets
    INSERT INTO sets_log (workout_id, exercise_name, set_number, weight_target, weight_actual, reps_target, reps_actual, rir_actual, set_type, mental_readiness, created_at) VALUES
    (demo_workout_push, 'Barbell Bench Press', 1, 60, 60, 8, 8, 4, 'warmup', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Barbell Bench Press', 2, 85, 85, 7, 7, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Barbell Bench Press', 3, 85, 85, 7, 6, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Barbell Bench Press', 4, 85, 82.5, 7, 6, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Incline Dumbbell Press', 1, 30, 30, 9, 9, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Incline Dumbbell Press', 2, 30, 30, 9, 8, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Incline Dumbbell Press', 3, 30, 28, 9, 8, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Seated Dumbbell Shoulder Press', 1, 24, 24, 9, 9, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Seated Dumbbell Shoulder Press', 2, 24, 24, 9, 8, 2, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Seated Dumbbell Shoulder Press', 3, 24, 22, 9, 8, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Cable Lateral Raise', 1, 8, 8, 14, 14, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Cable Lateral Raise', 2, 8, 8, 14, 12, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Cable Lateral Raise', 3, 8, 7, 14, 12, 0, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Tricep Pushdown', 1, 25, 25, 11, 11, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Tricep Pushdown', 2, 25, 25, 11, 10, 1, 'working', 4, NOW() - INTERVAL '2 days'),
    (demo_workout_push, 'Tricep Pushdown', 3, 25, 22.5, 11, 10, 0, 'working', 4, NOW() - INTERVAL '2 days');

    -- Pull workout sets
    INSERT INTO sets_log (workout_id, exercise_name, set_number, weight_target, weight_actual, reps_target, reps_actual, rir_actual, set_type, mental_readiness, created_at) VALUES
    (demo_workout_pull, 'Conventional Deadlift', 1, 100, 100, 5, 5, 4, 'warmup', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Conventional Deadlift', 2, 140, 140, 5, 5, 2, 'working', 5, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Conventional Deadlift', 3, 140, 140, 5, 5, 2, 'working', 5, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Conventional Deadlift', 4, 145, 145, 5, 4, 1, 'working', 5, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Barbell Row', 1, 70, 70, 9, 9, 2, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Barbell Row', 2, 70, 70, 9, 8, 2, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Barbell Row', 3, 70, 67.5, 9, 8, 1, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Lat Pulldown', 1, 60, 60, 11, 11, 2, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Lat Pulldown', 2, 60, 60, 11, 10, 2, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Lat Pulldown', 3, 60, 57.5, 11, 10, 1, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Face Pull', 1, 20, 20, 17, 17, 1, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Face Pull', 2, 20, 20, 17, 15, 1, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Face Pull', 3, 20, 17.5, 17, 15, 0, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Dumbbell Curl', 1, 14, 14, 11, 11, 1, 'working', 4, NOW() - INTERVAL '4 days'),
    (demo_workout_pull, 'Dumbbell Curl', 2, 14, 14, 11, 10, 1, 'working', 4, NOW() - INTERVAL '4 days');

    -- Legs workout sets
    INSERT INTO sets_log (workout_id, exercise_name, set_number, weight_target, weight_actual, reps_target, reps_actual, rir_actual, set_type, mental_readiness, created_at) VALUES
    (demo_workout_legs, 'Barbell Back Squat', 1, 80, 80, 8, 8, 4, 'warmup', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Barbell Back Squat', 2, 110, 110, 7, 7, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Barbell Back Squat', 3, 110, 110, 7, 6, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Barbell Back Squat', 4, 110, 105, 7, 6, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Press', 1, 180, 180, 11, 11, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Press', 2, 180, 180, 11, 10, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Press', 3, 180, 170, 11, 10, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Romanian Deadlift', 1, 80, 80, 9, 9, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Romanian Deadlift', 2, 80, 80, 9, 8, 2, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Romanian Deadlift', 3, 80, 75, 9, 8, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Curl', 1, 45, 45, 11, 11, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Curl', 2, 45, 45, 11, 10, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Curl', 3, 45, 42.5, 11, 10, 0, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Extension', 1, 50, 50, 13, 13, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Extension', 2, 50, 50, 13, 12, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Leg Extension', 3, 50, 47.5, 13, 12, 0, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Standing Calf Raise', 1, 80, 80, 17, 17, 1, 'working', 3, NOW() - INTERVAL '6 days'),
    (demo_workout_legs, 'Standing Calf Raise', 2, 80, 80, 17, 15, 0, 'working', 3, NOW() - INTERVAL '6 days');

    RAISE NOTICE 'Created sets_log entries for all workouts';

    -- ========================================
    -- 8. CREATE PROGRESS CHECKS
    -- ========================================

    -- Progress check 1 (14 days ago)
    INSERT INTO progress_checks (
        id,
        user_id,
        taken_at,
        cycle_number,
        weight,
        notes,
        is_milestone,
        created_at,
        updated_at
    ) VALUES (
        demo_progress_1,
        demo_client_id,
        NOW() - INTERVAL '14 days',
        1,
        77.8,
        'Inizio programma con il coach. Obiettivo: mantenere massa e migliorare definizione.',
        true,
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '14 days'
    );

    -- Progress check 2 (7 days ago)
    INSERT INTO progress_checks (
        id,
        user_id,
        taken_at,
        cycle_number,
        weight,
        notes,
        is_milestone,
        created_at,
        updated_at
    ) VALUES (
        demo_progress_2,
        demo_client_id,
        NOW() - INTERVAL '7 days',
        2,
        78.5,
        'Prima settimana completata. Forza aumentata su tutti i fondamentali. Leggero aumento peso corporeo.',
        false,
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days'
    );

    RAISE NOTICE 'Created 2 progress checks';

    -- ========================================
    -- 9. CREATE BODY MEASUREMENTS
    -- ========================================

    -- Measurements for progress check 1
    INSERT INTO body_measurements (check_id, measurement_type, value, unit, created_at) VALUES
    (demo_progress_1, 'chest', 101.0, 'cm', NOW() - INTERVAL '14 days'),
    (demo_progress_1, 'waist', 84.0, 'cm', NOW() - INTERVAL '14 days'),
    (demo_progress_1, 'arm_left', 34.0, 'cm', NOW() - INTERVAL '14 days'),
    (demo_progress_1, 'arm_right', 34.5, 'cm', NOW() - INTERVAL '14 days'),
    (demo_progress_1, 'thigh_left', 58.0, 'cm', NOW() - INTERVAL '14 days'),
    (demo_progress_1, 'thigh_right', 58.5, 'cm', NOW() - INTERVAL '14 days');

    -- Measurements for progress check 2
    INSERT INTO body_measurements (check_id, measurement_type, value, unit, created_at) VALUES
    (demo_progress_2, 'chest', 102.0, 'cm', NOW() - INTERVAL '7 days'),
    (demo_progress_2, 'waist', 83.0, 'cm', NOW() - INTERVAL '7 days'),
    (demo_progress_2, 'arm_left', 34.5, 'cm', NOW() - INTERVAL '7 days'),
    (demo_progress_2, 'arm_right', 35.0, 'cm', NOW() - INTERVAL '7 days'),
    (demo_progress_2, 'thigh_left', 58.5, 'cm', NOW() - INTERVAL '7 days'),
    (demo_progress_2, 'thigh_right', 59.0, 'cm', NOW() - INTERVAL '7 days');

    RAISE NOTICE 'Created body measurements';

    -- ========================================
    -- 10. CREATE WORKOUT TEMPLATE (for first coach)
    -- ========================================
    IF first_coach_id IS NOT NULL THEN
        INSERT INTO workout_templates (
            id,
            coach_id,
            name,
            description,
            workout_type,
            target_muscle_groups,
            exercises,
            tags,
            usage_count,
            is_public,
            created_at,
            updated_at
        ) VALUES (
            demo_template,
            first_coach_id,
            'Push Day - Hypertrophy Focus',
            'Template push classico per ipertrofia. 4-5 esercizi, focus su petto e spalle.',
            'push',
            ARRAY['chest', 'shoulders', 'triceps'],
            '[
                {"exerciseName": "Barbell Bench Press", "sets": 4, "repRange": [6, 8], "equipment": "barbell", "rir": 2},
                {"exerciseName": "Incline Dumbbell Press", "sets": 3, "repRange": [8, 10], "equipment": "dumbbell", "rir": 2},
                {"exerciseName": "Cable Flye", "sets": 3, "repRange": [12, 15], "equipment": "cable", "rir": 1},
                {"exerciseName": "Seated Dumbbell Shoulder Press", "sets": 3, "repRange": [8, 10], "equipment": "dumbbell", "rir": 2},
                {"exerciseName": "Cable Lateral Raise", "sets": 3, "repRange": [12, 15], "equipment": "cable", "rir": 1}
            ]'::jsonb,
            ARRAY['hypertrophy', 'push', 'intermediate'],
            1,
            false,
            NOW() - INTERVAL '20 days',
            NOW() - INTERVAL '20 days'
        );

        RAISE NOTICE 'Created workout template for coach: %', first_coach_id;

        -- ========================================
        -- 11. CREATE COACH ASSIGNMENT (for first workout)
        -- ========================================
        INSERT INTO coach_workout_assignments (
            id,
            workout_id,
            coach_id,
            client_id,
            assignment_type,
            template_id,
            coach_notes,
            assigned_at,
            approved_at,
            created_at
        ) VALUES (
            demo_assignment,
            demo_workout_push,
            first_coach_id,
            demo_client_id,
            'template',
            demo_template,
            'Inizia con questo push day. Focus su tempo controllato nelle negative. Tienimi aggiornato sulle sensazioni!',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        );

        RAISE NOTICE 'Created coach assignment';
    ELSE
        RAISE NOTICE 'No coaches found - skipping template and assignment creation';
    END IF;

    -- ========================================
    -- SUMMARY
    -- ========================================
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEMO CLIENT SEED COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Demo Client ID: %', demo_client_id;
    RAISE NOTICE 'Email: demo.client@arvo.app';
    RAISE NOTICE 'Name: Marco';
    RAISE NOTICE 'Workouts created: 3 (Push, Pull, Legs)';
    RAISE NOTICE 'Progress checks: 2';
    RAISE NOTICE 'Linked to all coaches/admins';
    RAISE NOTICE '';
    RAISE NOTICE 'To cleanup: DELETE FROM auth.users WHERE id = ''%''', demo_client_id;
    RAISE NOTICE '============================================';

END $$;
