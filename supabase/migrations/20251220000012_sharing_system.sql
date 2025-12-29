-- Sharing System Schema
-- Tables for profile connections and module-level sharing permissions

-- ============================================================================
-- Profile Connections
-- ============================================================================
-- Represents a connection between two users (spouse, family, friend, etc.)

CREATE TABLE IF NOT EXISTS profile_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The user who initiated the connection
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The user who received/accepted the connection
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Relationship type
  relationship TEXT NOT NULL DEFAULT 'family'
    CHECK (relationship IN ('spouse', 'partner', 'friend', 'family', 'roommate', 'colleague', 'other')),
  
  -- Connection status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'blocked', 'archived')),
  
  -- Custom labels (nicknames)
  requester_label TEXT,  -- What requester calls the receiver
  receiver_label TEXT,   -- What receiver calls the requester
  
  -- Additional notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT no_self_connection CHECK (requester_id != receiver_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id)
);

-- ============================================================================
-- Connection Invitations
-- ============================================================================
-- Stores invitation details and proposed permissions

CREATE TABLE IF NOT EXISTS connection_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,
  
  -- Optional message from requester
  message TEXT,
  
  -- Proposed permissions (can be accepted or modified)
  proposed_permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  
  CONSTRAINT unique_invitation UNIQUE (connection_id)
);

-- ============================================================================
-- Module Permissions
-- ============================================================================
-- Per-module sharing permissions for each connection

CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The connection this permission belongs to
  connection_id UUID NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,
  
  -- The user who is granting this permission (data owner)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Module being shared
  module TEXT NOT NULL
    CHECK (module IN ('travel', 'visa', 'trip-planner', 'finances', 'shopping', 'meals', 
                      'goals', 'habits', 'todos', 'notes', 'projects', 'journal', 'mood', 
                      'skincare', 'nutrition')),
  
  -- Permission level
  permission_level TEXT NOT NULL DEFAULT 'none'
    CHECK (permission_level IN ('none', 'view', 'collaborate', 'merged')),
  
  -- Module-specific settings (e.g., which categories to share)
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One permission per module per user per connection
  CONSTRAINT unique_module_permission UNIQUE (connection_id, user_id, module)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_connections_requester ON profile_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON profile_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON profile_connections(status);
CREATE INDEX IF NOT EXISTS idx_permissions_connection ON module_permissions(connection_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON module_permissions(module);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE profile_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Profile Connections: Users can see connections they're part of
DROP POLICY IF EXISTS "Users can view own connections" ON profile_connections;
CREATE POLICY "Users can view own connections"
  ON profile_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON profile_connections;
CREATE POLICY "Users can create connection requests"
  ON profile_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update own connections" ON profile_connections;
CREATE POLICY "Users can update own connections"
  ON profile_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete own connections" ON profile_connections;
CREATE POLICY "Users can delete own connections"
  ON profile_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Connection Invitations: Visible to connection participants
DROP POLICY IF EXISTS "Users can view invitations for their connections" ON connection_invitations;
CREATE POLICY "Users can view invitations for their connections"
  ON connection_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Requesters can create invitations" ON connection_invitations;
CREATE POLICY "Requesters can create invitations"
  ON connection_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = connection_invitations.connection_id
      AND requester_id = auth.uid()
    )
  );

-- Module Permissions: Users manage their own permissions
DROP POLICY IF EXISTS "Users can view permissions for their connections" ON module_permissions;
CREATE POLICY "Users can view permissions for their connections"
  ON module_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = module_permissions.connection_id
      AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage their own permissions" ON module_permissions;
CREATE POLICY "Users can manage their own permissions"
  ON module_permissions FOR ALL
  USING (user_id = auth.uid());
