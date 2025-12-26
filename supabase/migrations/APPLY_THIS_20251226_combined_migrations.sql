-- =====================================================
-- COMBINED MIGRATIONS - Apply this in Supabase Dashboard
-- =====================================================
-- This file combines:
-- 1. lookup_user_by_email function
-- 2. pending_email_invitations table and triggers
--
-- HOW TO APPLY:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- =====================================================

-- =====================================================
-- PART 1: USER LOOKUP FUNCTION
-- =====================================================

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

-- =====================================================
-- PART 2: PENDING EMAIL INVITATIONS TABLE
-- =====================================================

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

-- =====================================================
-- PART 3: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pending_invitations_invitee_email 
  ON pending_email_invitations(invitee_email) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_invitations_inviter 
  ON pending_email_invitations(inviter_id, status);

CREATE INDEX IF NOT EXISTS idx_pending_invitations_expires 
  ON pending_email_invitations(expires_at) 
  WHERE status = 'pending';

-- =====================================================
-- PART 4: RLS POLICIES
-- =====================================================

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

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

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

-- =====================================================
-- PART 6: AUTO-PROCESS TRIGGER
-- =====================================================

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

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  function1_exists BOOLEAN;
  function2_exists BOOLEAN;
BEGIN
  -- Check table
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'pending_email_invitations'
  ) INTO table_exists;

  -- Check functions
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'lookup_user_by_email'
  ) INTO function1_exists;

  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'process_pending_invitations_on_signup'
  ) INTO function2_exists;

  -- Report results
  IF table_exists THEN
    RAISE NOTICE '✅ SUCCESS: pending_email_invitations table created';
  ELSE
    RAISE WARNING '⚠️ WARNING: pending_email_invitations table was not created';
  END IF;

  IF function1_exists THEN
    RAISE NOTICE '✅ SUCCESS: lookup_user_by_email function created';
  ELSE
    RAISE WARNING '⚠️ WARNING: lookup_user_by_email function was not created';
  END IF;

  IF function2_exists THEN
    RAISE NOTICE '✅ SUCCESS: process_pending_invitations_on_signup function created';
  ELSE
    RAISE WARNING '⚠️ WARNING: process_pending_invitations_on_signup function was not created';
  END IF;
END $$;

