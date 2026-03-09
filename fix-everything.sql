-- MASTER FIX SCRIPT for Masked Minds
-- Run this in Supabase SQL Editor to fix timeouts and missing columns.

BEGIN;

-- 1. Ensure 'chats' table has correct columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'title') THEN
        ALTER TABLE public.chats ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Chat';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'description') THEN
        ALTER TABLE public.chats ADD COLUMN description TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 2. Reset RLS Policies to prevent recursion/timeouts
-- Drop all chat policies first to verify clean slate
DROP POLICY IF EXISTS "Chats are viewable by everyone" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can view chats" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;

-- Re-enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for everyone (including anon)
CREATE POLICY "Anyone can view chats"
    ON public.chats FOR SELECT
    USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "Authenticated users can insert chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow UPDATE for creators
CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- 3. Add Cleanup Function (for expiration logic)
CREATE OR REPLACE FUNCTION public.cleanup_expired_chats(hours_retention INT DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.chats
    WHERE created_at < NOW() - (hours_retention || ' hours')::INTERVAL
    RETURNING count(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- 4. Verification
SELECT 'Database Successfully Updated' as status;
