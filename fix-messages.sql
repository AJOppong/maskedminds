-- Fix Messages Table RLS Policies
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential existing blocking policies
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;

-- 3. Create permissive policies
-- Allow anyone to read messages (since this is an open chat app)
CREATE POLICY "Anyone can view messages"
    ON public.messages FOR SELECT
    USING (true);

-- Allow authenticated users to send messages
CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (true);

COMMIT;

SELECT 'Message Policies Updated' as status;
