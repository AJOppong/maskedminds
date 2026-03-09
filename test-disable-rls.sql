-- Temporary permissive RLS policies for testing
-- This will help us identify if RLS is the issue

-- Disable RLS temporarily to test
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Try creating a chat now. If it works, we know it's an RLS issue.
-- If it still doesn't work, the problem is elsewhere.

-- After testing, re-enable RLS with these simpler policies:
-- ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow all for chats" ON public.chats;
-- CREATE POLICY "Allow all for chats"
--     ON public.chats
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow all for messages" ON public.messages;
-- CREATE POLICY "Allow all for messages"
--     ON public.messages
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);
