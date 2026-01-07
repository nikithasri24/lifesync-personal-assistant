-- Drop existing views that have permission issues
DROP VIEW IF EXISTS connections_with_users;
DROP VIEW IF EXISTS invitations_with_connections;
DROP VIEW IF EXISTS connection_users;

-- Create SECURITY DEFINER functions to safely query auth.users
-- These functions run with elevated privileges to access auth.users

-- Function: get_connections_with_users
-- Returns connections for the current user with user information
CREATE OR REPLACE FUNCTION get_connections_with_users()
RETURNS TABLE (
  id UUID,
  requester_id UUID,
  receiver_id UUID,
  relationship connection_relationship,
  status connection_status,
  requester_label VARCHAR(100),
  receiver_label VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  requester_user JSONB,
  receiver_user JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.requester_id,
    pc.receiver_id,
    pc.relationship,
    pc.status,
    pc.requester_label,
    pc.receiver_label,
    pc.notes,
    pc.created_at,
    pc.accepted_at,
    pc.updated_at,
    jsonb_build_object(
      'id', requester.id,
      'email', requester.email,
      'full_name', requester.raw_user_meta_data->>'full_name',
      'avatar_url', requester.raw_user_meta_data->>'avatar_url'
    ) as requester_user,
    jsonb_build_object(
      'id', receiver.id,
      'email', receiver.email,
      'full_name', receiver.raw_user_meta_data->>'full_name',
      'avatar_url', receiver.raw_user_meta_data->>'avatar_url'
    ) as receiver_user
  FROM profile_connections pc
  LEFT JOIN auth.users requester ON pc.requester_id = requester.id
  LEFT JOIN auth.users receiver ON pc.receiver_id = receiver.id
  WHERE pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_connections_with_users() TO authenticated;

-- Function: get_invitations_with_connections
-- Returns invitations for the current user with full connection and user information
CREATE OR REPLACE FUNCTION get_invitations_with_connections()
RETURNS TABLE (
  id UUID,
  connection_id UUID,
  message TEXT,
  proposed_permissions JSONB,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  connection JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.connection_id,
    ci.message,
    ci.proposed_permissions,
    ci.created_at,
    ci.expires_at,
    jsonb_build_object(
      'id', pc.id,
      'requester_id', pc.requester_id,
      'receiver_id', pc.receiver_id,
      'relationship', pc.relationship,
      'status', pc.status,
      'requester_label', pc.requester_label,
      'receiver_label', pc.receiver_label,
      'notes', pc.notes,
      'created_at', pc.created_at,
      'accepted_at', pc.accepted_at,
      'updated_at', pc.updated_at,
      'requester_user', jsonb_build_object(
        'id', requester.id,
        'email', requester.email,
        'full_name', requester.raw_user_meta_data->>'full_name',
        'avatar_url', requester.raw_user_meta_data->>'avatar_url'
      ),
      'receiver_user', jsonb_build_object(
        'id', receiver.id,
        'email', receiver.email,
        'full_name', receiver.raw_user_meta_data->>'full_name',
        'avatar_url', receiver.raw_user_meta_data->>'avatar_url'
      )
    ) as connection
  FROM connection_invitations ci
  LEFT JOIN profile_connections pc ON ci.connection_id = pc.id
  LEFT JOIN auth.users requester ON pc.requester_id = requester.id
  LEFT JOIN auth.users receiver ON pc.receiver_id = receiver.id
  WHERE pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_invitations_with_connections() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_connections_with_users() IS 'Returns connections for the current user with embedded user information. Uses SECURITY DEFINER to access auth.users.';
COMMENT ON FUNCTION get_invitations_with_connections() IS 'Returns invitations for the current user with embedded connection and user information. Uses SECURITY DEFINER to access auth.users.';
