-- =====================================================
-- PENDING EMAIL INVITATIONS
-- =====================================================
-- Support inviting users who don't have accounts yet
-- When they sign up, these invitations will be converted to connections

-- Create table for pending invitations to unregistered users
CREATE TABLE IF NOT EXISTS pending_email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The user who sent the invitation
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email address of the person being invited (not yet registered)
  invitee_email TEXT NOT NULL,
  
  -- Relationship type
  relationship TEXT NOT NULL DEFAULT 'friend'
    CHECK (relationship IN ('spouse', 'partner', 'friend', 'family', 'roommate', 'colleague', 'other')),
  
  -- Custom label from inviter
  inviter_label TEXT,
  
  -- Optional message
  message TEXT,
  
  -- Proposed permissions
  proposed_permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Unique constraint: one pending invitation per inviter-email pair
  CONSTRAINT unique_pending_invitation UNIQUE (inviter_id, invitee_email)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pending_invitations_invitee_email 
  ON pending_email_invitations(invitee_email) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_invitations_inviter 
  ON pending_email_invitations(inviter_id, status);

CREATE INDEX IF NOT EXISTS idx_pending_invitations_expires 
  ON pending_email_invitations(expires_at) 
  WHERE status = 'pending';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE pending_email_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they sent
CREATE POLICY "Users can view their sent invitations"
  ON pending_email_invitations FOR SELECT
  USING (auth.uid() = inviter_id);

-- Users can create invitations
CREATE POLICY "Users can create invitations"
  ON pending_email_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Users can cancel their own invitations
CREATE POLICY "Users can update their invitations"
  ON pending_email_invitations FOR UPDATE
  USING (auth.uid() = inviter_id);

-- Users can delete their own invitations
CREATE POLICY "Users can delete their invitations"
  ON pending_email_invitations FOR DELETE
  USING (auth.uid() = inviter_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get pending invitations for a newly registered user
CREATE OR REPLACE FUNCTION get_pending_invitations_for_email(user_email TEXT)
RETURNS SETOF pending_email_invitations
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM pending_email_invitations
  WHERE invitee_email = user_email
    AND status = 'pending'
    AND expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION get_pending_invitations_for_email(TEXT) TO authenticated;

-- Function to automatically accept pending invitations when user signs up
CREATE OR REPLACE FUNCTION process_pending_invitations_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_inv RECORD;
BEGIN
  -- Loop through all pending invitations for this email
  FOR pending_inv IN 
    SELECT * FROM pending_email_invitations 
    WHERE invitee_email = NEW.email 
      AND status = 'pending'
      AND expires_at > now()
  LOOP
    -- Create the connection
    INSERT INTO profile_connections (
      requester_id,
      receiver_id,
      relationship,
      requester_label,
      status
    ) VALUES (
      pending_inv.inviter_id,
      NEW.id,
      pending_inv.relationship,
      pending_inv.inviter_label,
      'pending'  -- Still pending until they accept
    ) ON CONFLICT (requester_id, receiver_id) DO NOTHING;
    
    -- Mark invitation as accepted
    UPDATE pending_email_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = pending_inv.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to process pending invitations when user signs up
DROP TRIGGER IF EXISTS on_user_signup_process_invitations ON auth.users;
CREATE TRIGGER on_user_signup_process_invitations
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_invitations_on_signup();

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'pending_email_invitations'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE '✅ SUCCESS: pending_email_invitations table created';
  ELSE
    RAISE WARNING '⚠️ WARNING: pending_email_invitations table was not created';
  END IF;
END $$;

