-- Profile Connections System
-- Enables users to connect with others and share modules with granular permissions

-- =====================================================
-- ENUMS
-- =====================================================

-- Relationship types between users
CREATE TYPE connection_relationship AS ENUM (
  'spouse',
  'partner',
  'friend',
  'family',
  'roommate',
  'colleague',
  'other'
);

-- Connection status
CREATE TYPE connection_status AS ENUM (
  'pending',      -- Invitation sent, awaiting acceptance
  'active',       -- Connection is active
  'blocked',      -- Connection is blocked
  'archived'      -- Connection is archived but not deleted
);

-- Permission levels for each module
CREATE TYPE module_permission_level AS ENUM (
  'none',         -- No access
  'view',         -- Can view only
  'collaborate',  -- Can view and edit shared items
  'merged'        -- Full merge (see everything as if it's yours)
);

-- Available modules that can be shared
CREATE TYPE shareable_module AS ENUM (
  'travel',
  'visa',
  'trip-planner',
  'finances',
  'shopping',
  'meals',
  'goals',
  'habits',
  'todos',
  'notes',
  'projects',
  'journal',
  'mood',
  'period',
  'seventy-five-hard',
  'skincare'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Profile Connections
-- Stores relationships between users
CREATE TABLE IF NOT EXISTS profile_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Connection participants
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Connection metadata
  relationship connection_relationship NOT NULL DEFAULT 'other',
  status connection_status NOT NULL DEFAULT 'pending',

  -- Custom labels (optional nicknames)
  requester_label VARCHAR(100), -- What requester calls receiver (e.g., "My Husband")
  receiver_label VARCHAR(100),  -- What receiver calls requester (e.g., "My Wife")

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT different_users CHECK (requester_id != receiver_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id)
);

-- Module Permissions
-- Stores granular permissions for each module per connection
CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Connection reference
  connection_id UUID NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,

  -- Module and permission
  module shareable_module NOT NULL,
  permission_level module_permission_level NOT NULL DEFAULT 'none',

  -- Directional permissions (A -> B might differ from B -> A)
  -- user_id is the person GRANTING the permission
  -- They're allowing the OTHER person in the connection to access THEIR data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Custom settings per module (JSON for flexibility)
  -- Examples:
  -- - Finances: { "share_accounts": ["checking"], "hide_accounts": ["savings"] }
  -- - Goals: { "share_categories": ["financial", "travel"] }
  -- - Travel: { "auto_merge": true }
  settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_module_permission UNIQUE (connection_id, module, user_id)
);

-- Connection Invitations (for pending connections)
CREATE TABLE IF NOT EXISTS connection_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invitation details
  connection_id UUID NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,

  -- Invitation message
  message TEXT,

  -- Proposed permissions (what requester is offering to share)
  proposed_permissions JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),

  CONSTRAINT unique_invitation UNIQUE (connection_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profile_connections_requester ON profile_connections(requester_id);
CREATE INDEX idx_profile_connections_receiver ON profile_connections(receiver_id);
CREATE INDEX idx_profile_connections_status ON profile_connections(status);
CREATE INDEX idx_module_permissions_connection ON module_permissions(connection_id);
CREATE INDEX idx_module_permissions_user ON module_permissions(user_id);
CREATE INDEX idx_module_permissions_module ON module_permissions(module);
CREATE INDEX idx_connection_invitations_connection ON connection_invitations(connection_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE profile_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_invitations ENABLE ROW LEVEL SECURITY;

-- Profile Connections Policies

-- Users can view connections where they are either requester or receiver
CREATE POLICY "Users can view their connections"
  ON profile_connections
  FOR SELECT
  USING (
    auth.uid() = requester_id OR
    auth.uid() = receiver_id
  );

-- Users can create connections (send invitations)
CREATE POLICY "Users can create connections"
  ON profile_connections
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update their own connection metadata
CREATE POLICY "Users can update their connections"
  ON profile_connections
  FOR UPDATE
  USING (
    auth.uid() = requester_id OR
    auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = requester_id OR
    auth.uid() = receiver_id
  );

-- Users can delete connections they're part of
CREATE POLICY "Users can delete their connections"
  ON profile_connections
  FOR DELETE
  USING (
    auth.uid() = requester_id OR
    auth.uid() = receiver_id
  );

-- Module Permissions Policies

-- Users can view permissions for their connections
CREATE POLICY "Users can view module permissions"
  ON module_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = module_permissions.connection_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

-- Users can only set permissions for their own data
CREATE POLICY "Users can create their own permissions"
  ON module_permissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own permissions
CREATE POLICY "Users can update their own permissions"
  ON module_permissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own permissions
CREATE POLICY "Users can delete their own permissions"
  ON module_permissions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Connection Invitations Policies

-- Users can view invitations for their connections
CREATE POLICY "Users can view connection invitations"
  ON connection_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

-- Only requesters can create invitations
CREATE POLICY "Requesters can create invitations"
  ON connection_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND requester_id = auth.uid()
    )
  );

-- Only requesters can update their invitations
CREATE POLICY "Requesters can update invitations"
  ON connection_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND requester_id = auth.uid()
    )
  );

-- Both parties can delete invitations
CREATE POLICY "Users can delete invitations"
  ON connection_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all active connections for a user
CREATE OR REPLACE FUNCTION get_user_connections(user_uuid UUID)
RETURNS TABLE (
  connection_id UUID,
  other_user_id UUID,
  relationship connection_relationship,
  label VARCHAR(100),
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id as connection_id,
    CASE
      WHEN pc.requester_id = user_uuid THEN pc.receiver_id
      ELSE pc.requester_id
    END as other_user_id,
    pc.relationship,
    CASE
      WHEN pc.requester_id = user_uuid THEN pc.requester_label
      ELSE pc.receiver_label
    END as label,
    pc.created_at,
    pc.accepted_at
  FROM profile_connections pc
  WHERE
    (pc.requester_id = user_uuid OR pc.receiver_id = user_uuid)
    AND pc.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission to access another user's module
CREATE OR REPLACE FUNCTION has_module_permission(
  viewer_uuid UUID,
  owner_uuid UUID,
  module_name shareable_module,
  required_level module_permission_level
)
RETURNS BOOLEAN AS $$
DECLARE
  connection_uuid UUID;
  permission_level module_permission_level;
BEGIN
  -- Find active connection between users
  SELECT id INTO connection_uuid
  FROM profile_connections
  WHERE
    ((requester_id = viewer_uuid AND receiver_id = owner_uuid) OR
     (requester_id = owner_uuid AND receiver_id = viewer_uuid))
    AND status = 'active'
  LIMIT 1;

  IF connection_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get permission level
  SELECT mp.permission_level INTO permission_level
  FROM module_permissions mp
  WHERE
    mp.connection_id = connection_uuid
    AND mp.module = module_name
    AND mp.user_id = owner_uuid;

  IF permission_level IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if permission meets required level
  RETURN permission_level::text >= required_level::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_connections_updated_at
  BEFORE UPDATE ON profile_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_permissions_updated_at
  BEFORE UPDATE ON module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
