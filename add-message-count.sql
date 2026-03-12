-- Helper View: chat message counts for trending
-- Run in Supabase SQL Editor

CREATE OR REPLACE VIEW public.chat_message_counts AS
SELECT
    m.chat_id,
    COUNT(*) AS message_count,
    MAX(m.created_at) AS last_message_at
FROM public.messages m
WHERE m.is_system = false
GROUP BY m.chat_id;

-- Grant select to anon and authenticated roles
GRANT SELECT ON public.chat_message_counts TO anon, authenticated;
