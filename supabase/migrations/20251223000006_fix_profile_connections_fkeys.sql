-- Fix Profile Connections Foreign Key Constraints
-- Migration created: 2025-12-23
-- Purpose: Fix foreign key constraint names to enable proper relationship queries
-- Fixes: 400 Bad Request error when querying profile_connections with user relationships

-- Drop existing foreign key constraints if they exist
DO $$
BEGIN
  -- Drop old constraints (they might have auto-generated names)
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

-- Add foreign key constraints with explicit names
DO $$
BEGIN
  -- Add requester_id foreign key with explicit name
  ALTER TABLE profile_connections
    ADD CONSTRAINT profile_connections_requester_id_fkey
    FOREIGN KEY (requester_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  
  -- Add receiver_id foreign key with explicit name
  ALTER TABLE profile_connections
    ADD CONSTRAINT profile_connections_receiver_id_fkey
    FOREIGN KEY (receiver_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Added foreign key constraints with explicit names';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Foreign key constraints already exist with correct names';
  WHEN undefined_table THEN
    RAISE NOTICE 'Table profile_connections does not exist';
END $$;

-- Verification
DO $$
DECLARE
  fkey_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO fkey_count
  FROM information_schema.table_constraints
  WHERE table_name = 'profile_connections'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name IN (
      'profile_connections_requester_id_fkey',
      'profile_connections_receiver_id_fkey'
    );

  IF fkey_count = 2 THEN
    RAISE NOTICE '✅ SUCCESS: Foreign key constraints properly named';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 2 foreign keys, found %', fkey_count;
  END IF;
END $$;

