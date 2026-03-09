-- Database Update for Chat Fixes & Expiration
-- Run this in Supabase SQL Editor

-- 1. Ensure chats table has title and description
-- This is idempotent; will only add if missing (though ALTER TABLE ADD COLUMN IF NOT EXISTS is standard PG 9.6+)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'title') THEN
        ALTER TABLE public.chats ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Chat';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'description') THEN
        ALTER TABLE public.chats ADD COLUMN description TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 2. Create function to delete expired chats
-- Deletes chats created more than X hours ago
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

-- 3. (Optional) Enable pg_cron if available and schedule it
-- Note: pg_cron is not always available on free tier, so we also provide an API route method.
-- Uncomment the following lines if you have pg_cron enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-chats-every-hour', '0 * * * *', $$SELECT public.cleanup_expired_chats(24)$$);
