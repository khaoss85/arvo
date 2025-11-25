-- ========================================
-- FIX MISSING SCHEMA FOR ARVO
-- Run this in Supabase Dashboard > SQL Editor
-- IMPORTANT: Review the diagnostic_check.sql output first!
-- ========================================

-- ========================================
-- 1. ADD ROLE COLUMN TO USERS TABLE
-- ========================================
DO $$
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'role'
    ) THEN
        -- Add role column with default 'user'
        ALTER TABLE public.users ADD COLUMN role text DEFAULT 'user' NOT NULL;

        -- Add constraint to only allow 'user' or 'admin'
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

        RAISE NOTICE 'Added role column to users table';
    ELSE
        RAISE NOTICE 'Role column already exists in users table';
    END IF;
END $$;

-- ========================================
-- 2. CREATE WAITLIST_ENTRIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    first_name text,
    training_goal text,
    referral_code text UNIQUE NOT NULL,
    referrer_id uuid REFERENCES public.waitlist_entries(id) ON DELETE SET NULL,
    queue_position integer,
    invited_count integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'converted')),
    converted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_email ON public.waitlist_entries(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON public.waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_referral_code ON public.waitlist_entries(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_referrer_id ON public.waitlist_entries(referrer_id);

-- Enable RLS
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waitlist_entries
-- Users can view their own waitlist entry by email
DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON public.waitlist_entries;
CREATE POLICY "Users can view their own waitlist entry"
    ON public.waitlist_entries FOR SELECT
    USING (auth.email() = email);

-- Users can insert their own waitlist entry
DROP POLICY IF EXISTS "Users can insert their own waitlist entry" ON public.waitlist_entries;
CREATE POLICY "Users can insert their own waitlist entry"
    ON public.waitlist_entries FOR INSERT
    WITH CHECK (auth.email() = email);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waitlist_entries_updated_at ON public.waitlist_entries;
CREATE TRIGGER update_waitlist_entries_updated_at
    BEFORE UPDATE ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 3. CREATE GENERATE_REFERRAL_CODE FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
    code text;
    code_exists boolean;
BEGIN
    LOOP
        -- Generate a 6-character uppercase alphanumeric code
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM public.waitlist_entries WHERE referral_code = code
        ) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. CREATE FUNCTION TO UPDATE QUEUE POSITIONS
-- ========================================
CREATE OR REPLACE FUNCTION public.update_queue_positions()
RETURNS void AS $$
BEGIN
    -- Update queue positions based on invited_count (descending) and created_at (ascending)
    WITH ranked_entries AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                ORDER BY invited_count DESC, created_at ASC
            ) as new_position
        FROM public.waitlist_entries
        WHERE status = 'pending'
    )
    UPDATE public.waitlist_entries we
    SET queue_position = re.new_position
    FROM ranked_entries re
    WHERE we.id = re.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. VERIFY SCHEMA
-- ========================================
DO $$
DECLARE
    role_exists boolean;
    waitlist_exists boolean;
    func_exists boolean;
BEGIN
    -- Check role column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
    ) INTO role_exists;

    -- Check waitlist_entries table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'waitlist_entries'
    ) INTO waitlist_exists;

    -- Check generate_referral_code function
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_name = 'generate_referral_code'
    ) INTO func_exists;

    -- Report results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCHEMA FIX RESULTS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'users.role column exists: %', role_exists;
    RAISE NOTICE 'waitlist_entries table exists: %', waitlist_exists;
    RAISE NOTICE 'generate_referral_code() function exists: %', func_exists;
    RAISE NOTICE '========================================';

    IF role_exists AND waitlist_exists AND func_exists THEN
        RAISE NOTICE 'All schema elements are now in place!';
    ELSE
        RAISE WARNING 'Some schema elements may be missing. Run diagnostic_check.sql to verify.';
    END IF;
END $$;
