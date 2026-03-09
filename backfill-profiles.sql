-- Backfill Profiles Script
-- Run this in Supabase SQL Editor to fix missing profiles
-- This ensures every user in auth.users has a corresponding entry in public.profiles

BEGIN;

-- Insert missing profiles for users that exist in auth.users but not in public.profiles
INSERT INTO public.profiles (id, nickname)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'nickname', 'Anonymous')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Report how many were inserted
GET DIAGNOSTICS last_row_count = ROW_COUNT;

COMMIT;

SELECT 
    'Profiles Backfill Completed' as status, 
    last_row_count as profiles_created;
