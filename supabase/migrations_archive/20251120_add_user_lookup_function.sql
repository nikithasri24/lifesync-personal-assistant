-- Helper function to look up user ID by email
-- This allows users to find each other by email without exposing all user data

CREATE OR REPLACE FUNCTION lookup_user_by_email(user_email TEXT)
RETURNS TABLE (user_id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return users who exist in auth.users
  RETURN QUERY
  SELECT
    id as user_id,
    email::TEXT as email
  FROM auth.users
  WHERE auth.users.email = user_email
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION lookup_user_by_email(TEXT) TO authenticated;
