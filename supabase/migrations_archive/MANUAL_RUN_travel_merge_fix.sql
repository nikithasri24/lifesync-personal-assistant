-- ==================== MANUAL FIX: Make user_id nullable in visited_locations ====================
-- Run this in Supabase SQL Editor to fix the migration issue
-- This allows user_id to be NULL when locations are shared (connection_id is set)

ALTER TABLE visited_locations ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'visited_locations' 
  AND column_name IN ('user_id', 'connection_id');

