-- Masked Minds Admin Setup Script
-- Run this ONCE in your Supabase SQL Editor to promote a user to admin.
-- Replace 'your-email@example.com' with the actual admin user's email.

-- Step 1: Create a reports table for user-submitted content reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    reporter_session TEXT, -- anonymous session identifier
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a report (anonymous)
CREATE POLICY "Anyone can create a report"
    ON public.reports FOR INSERT
    WITH CHECK (true);

-- Only admins can read reports (via service role in API routes)
-- Regular users cannot read reports
CREATE POLICY "Admins read all reports"
    ON public.reports FOR SELECT
    USING (false); -- Completely blocked from client; API uses service role

-- Step 2: Add 'locked' and 'flagged' columns to chats table
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Step 3: Promote maskedminds26@gmail.com to admin
-- This makes the account recognized as admin by the dashboard.
-- Run this in Supabase Dashboard → SQL Editor:
UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
  WHERE email = 'maskedminds26@gmail.com';

-- ========================================================
-- IMPORTANT: The Supabase account for maskedminds26@gmail.com
-- must already exist with password "admin".
-- If it does not exist yet:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Click "Invite user" or "Add user"
--   3. Use email: maskedminds26@gmail.com, password: admin
--   4. Then run the UPDATE above
-- ========================================================
