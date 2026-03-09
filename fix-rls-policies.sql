-- Fix RLS Policies for Masked Minds
-- Run this if you're getting timeout errors when creating chats

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Chats are viewable by everyone" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;

-- Create correct RLS policies for chats
CREATE POLICY "Anyone can view chats"
    ON public.chats FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert chats"
    ON public.chats FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- Create correct RLS policies for messages
CREATE POLICY "Anyone can view messages"
    ON public.messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
