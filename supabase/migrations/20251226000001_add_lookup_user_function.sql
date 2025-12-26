-- =====================================================
-- USER LOOKUP FUNCTION
-- =====================================================
-- Helper function to look up user ID by email
-- This allows users to find each other by email without exposing all user data
-- Required for connection invitations

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS lookup_user_by_email(TEXT);

-- Create the lookup function
CREATE OR REPLACE FUNCTION lookup_user_by_email(user_email TEXT)
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT, avatar_url TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return user info from profiles table (which syncs with auth.users)
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email::TEXT as email,
    p.full_name::TEXT as full_name,
    p.avatar_url::TEXT as avatar_url
  FROM profiles p
  WHERE p.email = user_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION lookup_user_by_email(TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION lookup_user_by_email IS 
  'Looks up a user by email address and returns their basic profile information. 
   Used for sending connection invitations. Only accessible to authenticated users.';

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
    RAISE NOTICE '✅ SUCCESS: lookup_user_by_email function created';
  ELSE
    RAISE WARNING '⚠️ WARNING: lookup_user_by_email function was not created';
  END IF;
END $$;

