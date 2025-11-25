-- ========================================
-- FIX ADMIN ACCESS AND USER ISSUES
-- Run this in Supabase Dashboard > SQL Editor
-- IMPORTANT: Run fix_missing_schema.sql FIRST!
-- ========================================

-- ========================================
-- 1. ASSIGN ADMIN ROLE TO DANIELE.PELLERI
-- ========================================
DO $$
DECLARE
    user_exists boolean;
    user_id_var uuid;
BEGIN
    -- Check if user exists in public.users
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE email = 'daniele.pelleri@gmail.com'
    ) INTO user_exists;

    IF user_exists THEN
        -- Update role to admin
        UPDATE public.users
        SET role = 'admin'
        WHERE email = 'daniele.pelleri@gmail.com'
        RETURNING id INTO user_id_var;

        RAISE NOTICE '✓ Admin role assigned to daniele.pelleri@gmail.com (ID: %)', user_id_var;
    ELSE
        -- User doesn't exist in public.users, check auth.users
        SELECT id INTO user_id_var
        FROM auth.users
        WHERE email = 'daniele.pelleri@gmail.com'
        LIMIT 1;

        IF user_id_var IS NOT NULL THEN
            -- User exists in auth.users but not in public.users - create the record
            INSERT INTO public.users (id, email, role, created_at)
            VALUES (user_id_var, 'daniele.pelleri@gmail.com', 'admin', now())
            ON CONFLICT (id) DO UPDATE SET role = 'admin';

            RAISE NOTICE '✓ Created user record and assigned admin role to daniele.pelleri@gmail.com';
        ELSE
            RAISE WARNING '⚠ User daniele.pelleri@gmail.com not found in auth.users. User needs to login first!';
        END IF;
    END IF;
END $$;

-- ========================================
-- 2. CHECK VERONICA.PENASSO STATUS
-- ========================================
DO $$
DECLARE
    waitlist_record record;
    auth_user_id uuid;
    auth_user_confirmed boolean;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CHECKING VERONICA.PENASSO STATUS';
    RAISE NOTICE '========================================';

    -- Check waitlist_entries
    SELECT * INTO waitlist_record
    FROM public.waitlist_entries
    WHERE email LIKE '%veronica.penasso%' OR email LIKE '%veronica%'
    ORDER BY created_at DESC
    LIMIT 1;

    IF waitlist_record IS NOT NULL THEN
        RAISE NOTICE 'Waitlist Entry Found:';
        RAISE NOTICE '  Email: %', waitlist_record.email;
        RAISE NOTICE '  Status: %', waitlist_record.status;
        RAISE NOTICE '  Converted User ID: %', waitlist_record.converted_user_id;
        RAISE NOTICE '  Created: %', waitlist_record.created_at;
        RAISE NOTICE '  Updated: %', waitlist_record.updated_at;

        -- Check if user exists in auth.users
        SELECT id, confirmed_at IS NOT NULL
        INTO auth_user_id, auth_user_confirmed
        FROM auth.users
        WHERE email = waitlist_record.email;

        IF auth_user_id IS NOT NULL THEN
            RAISE NOTICE '  Auth User ID: %', auth_user_id;
            RAISE NOTICE '  Email Confirmed: %', auth_user_confirmed;

            -- Check if user record exists in public.users
            IF EXISTS (SELECT 1 FROM public.users WHERE id = auth_user_id) THEN
                RAISE NOTICE '  ✓ User record exists in public.users';
            ELSE
                RAISE NOTICE '  ⚠ User record missing in public.users - creating now...';

                -- Create user record
                INSERT INTO public.users (id, email, role, created_at)
                VALUES (auth_user_id, waitlist_record.email, 'user', now())
                ON CONFLICT (id) DO NOTHING;

                RAISE NOTICE '  ✓ User record created in public.users';
            END IF;

            -- Update waitlist status if not already converted
            IF waitlist_record.status != 'converted' THEN
                UPDATE public.waitlist_entries
                SET status = 'converted',
                    converted_user_id = auth_user_id,
                    updated_at = now()
                WHERE id = waitlist_record.id;

                RAISE NOTICE '  ✓ Waitlist status updated to "converted"';
            END IF;
        ELSE
            RAISE WARNING '  ⚠ User NOT found in auth.users!';
            RAISE WARNING '  ⚠ Magic link may have expired or user never clicked it';
            RAISE WARNING '  ⚠ You need to re-approve from admin panel to send a new magic link';
        END IF;
    ELSE
        RAISE WARNING '⚠ No waitlist entry found for veronica.penasso';
    END IF;
END $$;

-- ========================================
-- 3. LIST ALL CURRENT ADMINS
-- ========================================
SELECT '========================================' as separator;
SELECT 'CURRENT ADMIN USERS' as info;
SELECT '========================================' as separator;
SELECT id, email, role, created_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at;

-- ========================================
-- 4. LIST RECENT WAITLIST APPROVALS
-- ========================================
SELECT '========================================' as separator;
SELECT 'RECENT WAITLIST ENTRIES (ALL STATUSES)' as info;
SELECT '========================================' as separator;
SELECT email, first_name, status, converted_user_id, created_at, updated_at
FROM public.waitlist_entries
ORDER BY updated_at DESC
LIMIT 10;

-- ========================================
-- 5. SUMMARY
-- ========================================
DO $$
DECLARE
    admin_count integer;
    pending_count integer;
    approved_count integer;
    converted_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'admin';
    SELECT COUNT(*) INTO pending_count FROM public.waitlist_entries WHERE status = 'pending';
    SELECT COUNT(*) INTO approved_count FROM public.waitlist_entries WHERE status = 'approved';
    SELECT COUNT(*) INTO converted_count FROM public.waitlist_entries WHERE status = 'converted';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Admins: %', admin_count;
    RAISE NOTICE 'Waitlist Pending: %', pending_count;
    RAISE NOTICE 'Waitlist Approved: %', approved_count;
    RAISE NOTICE 'Waitlist Converted: %', converted_count;
    RAISE NOTICE '========================================';
END $$;
