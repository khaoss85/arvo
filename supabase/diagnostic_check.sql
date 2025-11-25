-- ========================================
-- DIAGNOSTIC SCRIPT FOR ARVO DATABASE
-- Run this in Supabase Dashboard > SQL Editor
-- ========================================

-- 1. CHECK IF USERS TABLE HAS ROLE COLUMN
SELECT 'Checking users table structure...' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. CHECK ALL PUBLIC TABLES
SELECT '---' as separator;
SELECT 'Listing all public tables...' as step;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. CHECK IF DANIELE.PELLERI EXISTS AND HAS ADMIN ROLE
SELECT '---' as separator;
SELECT 'Checking daniele.pelleri@gmail.com status...' as step;
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'daniele.pelleri@gmail.com';

-- 4. CHECK ALL USERS WITH THEIR ROLES
SELECT '---' as separator;
SELECT 'Listing all users and their roles...' as step;
SELECT id, email, role, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. CHECK WAITLIST_ENTRIES TABLE STRUCTURE (if exists)
SELECT '---' as separator;
SELECT 'Checking waitlist_entries table structure...' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'waitlist_entries'
ORDER BY ordinal_position;

-- 6. CHECK VERONICA.PENASSO IN WAITLIST
SELECT '---' as separator;
SELECT 'Checking veronica.penasso status in waitlist...' as step;
SELECT id, email, first_name, status, converted_user_id, created_at, updated_at
FROM public.waitlist_entries
WHERE email LIKE '%veronica%'
ORDER BY created_at DESC;

-- 7. CHECK AUTH.USERS FOR BOTH DANIELE AND VERONICA
SELECT '---' as separator;
SELECT 'Checking auth.users for daniele and veronica...' as step;
SELECT id, email, created_at, last_sign_in_at, confirmed_at, email_confirmed_at
FROM auth.users
WHERE email LIKE '%veronica%' OR email LIKE '%daniele%'
ORDER BY created_at DESC;

-- 8. CHECK IF GENERATE_REFERRAL_CODE FUNCTION EXISTS
SELECT '---' as separator;
SELECT 'Checking if generate_referral_code() function exists...' as step;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'generate_referral_code';

-- 9. CHECK RLS POLICIES ON USERS TABLE
SELECT '---' as separator;
SELECT 'Checking RLS policies on users table...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- 10. CHECK RLS POLICIES ON WAITLIST_ENTRIES TABLE
SELECT '---' as separator;
SELECT 'Checking RLS policies on waitlist_entries table...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'waitlist_entries';

SELECT '---' as separator;
SELECT 'Diagnostic check complete!' as result;
