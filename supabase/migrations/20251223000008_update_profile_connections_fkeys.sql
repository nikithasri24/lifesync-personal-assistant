-- Update Profile Connections to Reference Profiles Table
-- Migration created: 2025-12-23
-- Purpose: Update foreign keys to reference profiles table instead of auth.users
-- Fixes: 400 Bad Request error when querying profile_connections with user relationships

-- Drop existing foreign key constraints
DO $$
BEGIN
  ALTER TABLE profile_connections 
    DROP CONSTRAINT IF EXISTS profile_connections_requester_id_fkey;
  
  ALTER TABLE profile_connections 
    DROP CONSTRAINT IF EXISTS profile_connections_receiver_id_fkey;
    
  RAISE NOTICE 'Dropped old foreign key constraints';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Table profile_connections does not exist yet';
  WHEN undefined_object THEN
    RAISE NOTICE 'Foreign key constraints did not exist';
END $$;

-- Add foreign key constraints referencing profiles table
DO $$
BEGIN
  -- Add requester_id foreign key
  ALTER TABLE profile_connections
    ADD CONSTRAINT profile_connections_requester_id_fkey
    FOREIGN KEY (requester_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  
  -- Add receiver_id foreign key
  ALTER TABLE profile_connections
    ADD CONSTRAINT profile_connections_receiver_id_fkey
    FOREIGN KEY (receiver_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Added foreign key constraints referencing profiles table';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Foreign key constraints already exist';
  WHEN undefined_table THEN
    RAISE NOTICE 'Table profile_connections or profiles does not exist';
END $$;

-- Verification
DO $$
DECLARE
  fkey_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO fkey_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'profile_connections'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'profiles';

  IF fkey_count = 2 THEN
    RAISE NOTICE '✅ SUCCESS: Foreign keys now reference profiles table';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 2 foreign keys to profiles, found %', fkey_count;
  END IF;
END $$;

