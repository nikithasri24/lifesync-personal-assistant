-- =====================================================
-- FIX LOOKUP USER FUNCTION
-- =====================================================
-- Fix the return type to work with PostgREST .single() call
-- The issue is that RETURNS TABLE doesn't work well with .single()
-- We need to return a JSON object instead

-- Drop the old function
DROP FUNCTION IF EXISTS lookup_user_by_email(TEXT);

-- Create the fixed function that returns JSONB
CREATE OR REPLACE FUNCTION lookup_user_by_email(user_email TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Return user info from profiles table as JSONB
  SELECT jsonb_build_object(
    'user_id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
  )
  INTO result
  FROM profiles p
  WHERE p.email = user_email
  LIMIT 1;
  
  -- Return the result (will be null if user not found)
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION lookup_user_by_email(TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION lookup_user_by_email IS 
  'Looks up a user by email address and returns their basic profile information as JSONB. 
   Returns null if user not found. Used for sending connection invitations.';

-- Verification
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'lookup_user_by_email'
  ) INTO function_exists;

  IF function_exists THEN
    RAISE NOTICE '✅ SUCCESS: lookup_user_by_email function fixed';
  ELSE
    RAISE WARNING '⚠️ WARNING: lookup_user_by_email function was not created';
  END IF;
END $$;

