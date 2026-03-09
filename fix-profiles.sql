-- Fix Profiles Table RLS Policies
-- Run this in Supabase SQL Editor
-- This is critical because fetching messages usually joins the profiles table.
-- If profiles are not readable, the message fetch will fail.

BEGIN;

-- 1. Enable RLS on profiles (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing blocking policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. Create Permissive Read Policy
-- This allows the 'messages' query to join with 'profiles' successfully
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- 4. Create Write Policies
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

COMMIT;

SELECT 'Profiles Policies Updated' as status;
