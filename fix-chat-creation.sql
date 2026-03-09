-- Comprehensive RLS Fix for Chat Creation
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Chats are viewable by everyone" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can view chats" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;

-- 3. Re-create Policies

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- CHATS
-- Allow anyone (even anon) to view chats
CREATE POLICY "Anyone can view chats"
    ON public.chats FOR SELECT
    USING (true);

-- Allow authenticated users to create chats
CREATE POLICY "Authenticated users can insert chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow creators to update their chats
CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- MESSAGES
-- Allow anyone to view messages
CREATE POLICY "Anyone can view messages"
    ON public.messages FOR SELECT
    USING (true);

-- Allow authenticated users to send messages
CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMIT;

-- Verification query
SELECT 'RLS Policies Updated Successfully' as status;
