-- Create views to expose user data for connections
-- This is necessary because PostgREST cannot directly query auth.users from the client

-- View: connection_users
-- Exposes minimal user information needed for connections
CREATE OR REPLACE VIEW connection_users AS
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON connection_users TO authenticated;

-- View: connections_with_users
-- Combines connections with user information
CREATE OR REPLACE VIEW connections_with_users AS
SELECT
  pc.*,
  json_build_object(
    'id', requester.id,
    'email', requester.email,
    'full_name', requester.raw_user_meta_data->>'full_name',
    'avatar_url', requester.raw_user_meta_data->>'avatar_url'
  ) as requester_user,
  json_build_object(
    'id', receiver.id,
    'email', receiver.email,
    'full_name', receiver.raw_user_meta_data->>'full_name',
    'avatar_url', receiver.raw_user_meta_data->>'avatar_url'
  ) as receiver_user
FROM profile_connections pc
LEFT JOIN auth.users requester ON pc.requester_id = requester.id
LEFT JOIN auth.users receiver ON pc.receiver_id = receiver.id;

-- Grant access to authenticated users
GRANT SELECT ON connections_with_users TO authenticated;

-- Enable RLS on the view
ALTER VIEW connections_with_users SET (security_invoker = true);

-- View: invitations_with_connections
-- Combines invitations with connection and user information
CREATE OR REPLACE VIEW invitations_with_connections AS
SELECT
  ci.*,
  json_build_object(
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
    'requester_user', json_build_object(
      'id', requester.id,
      'email', requester.email,
      'full_name', requester.raw_user_meta_data->>'full_name',
      'avatar_url', requester.raw_user_meta_data->>'avatar_url'
    ),
    'receiver_user', json_build_object(
      'id', receiver.id,
      'email', receiver.email,
      'full_name', receiver.raw_user_meta_data->>'full_name',
      'avatar_url', receiver.raw_user_meta_data->>'avatar_url'
    )
  ) as connection
FROM connection_invitations ci
LEFT JOIN profile_connections pc ON ci.connection_id = pc.id
LEFT JOIN auth.users requester ON pc.requester_id = requester.id
LEFT JOIN auth.users receiver ON pc.receiver_id = receiver.id;

-- Grant access to authenticated users
GRANT SELECT ON invitations_with_connections TO authenticated;

-- Enable RLS on the view
ALTER VIEW invitations_with_connections SET (security_invoker = true);

-- Add helpful comment
COMMENT ON VIEW connections_with_users IS 'View combining profile connections with user information. Used by client to fetch connections with user details.';
COMMENT ON VIEW invitations_with_connections IS 'View combining invitations with connection and user information. Used by client to fetch pending invitations.';
COMMENT ON VIEW connection_users IS 'Minimal user information view for connections feature.';
