-- Enable replication for specific tables to support Realtime subscriptions
-- Run this in the Supabase SQL Editor

-- 1. Enable replication for 'chats' table
alter table "chats" replica identity full;

-- 2. Enable replication for 'messages' table
alter table "messages" replica identity full;

-- 3. Add tables to the supabase_realtime publication
begin;
  -- Try to create publication if it doesn't exist (Supabase usually has it by default)
  -- If it exists, we just add tables to it.
  -- Note: specific syntax may vary slightly depending on Postgres version, 
  -- but usually 'alter publication ... add table' works.
  
  -- We'll just attempt to add them. If they are already added, this might warn but shouldn't fail destructively.
  alter publication supabase_realtime add table chats;
  alter publication supabase_realtime add table messages;
commit;
