-- Fix RLS Policy Security Gaps in Together Feature
-- Issue: partner_id field not validated against actual partner in connection

-- =====================================================
-- MILESTONES - Enhanced RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own milestones and partner's" ON milestones;
DROP POLICY IF EXISTS "Users can create their own milestones" ON milestones;

-- Enhanced SELECT policy with partner_id validation
CREATE POLICY "Users can view their own milestones and partner's" ON milestones
  FOR SELECT
  USING (
    -- Can view own milestones
    auth.uid() = user_id
    OR
    -- Can view partner's milestones ONLY if:
    -- 1. Valid connection exists
    -- 2. User is part of the connection
    -- 3. partner_id (if set) matches the other user in the connection
    EXISTS (
      SELECT 1 FROM profile_connections pc
      WHERE pc.id = milestones.connection_id
        AND pc.status = 'active'
        AND auth.uid() IN (pc.requester_id, pc.receiver_id)
        AND (
          -- Either partner_id is not set (milestone is for current user)
          milestones.partner_id IS NULL
          OR
          -- Or partner_id matches the other person in the connection
          milestones.partner_id = CASE
            WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
            WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
          END
        )
    )
  );

-- Enhanced INSERT policy with partner_id validation
CREATE POLICY "Users can create their own milestones" ON milestones
  FOR INSERT
  WITH CHECK (
    -- Must be the milestone creator
    auth.uid() = user_id
    AND
    -- If partner_id is set, must be valid partner from connection
    (
      partner_id IS NULL
      OR
      (
        connection_id IS NOT NULL
        AND
        EXISTS (
          SELECT 1 FROM profile_connections pc
          WHERE pc.id = connection_id
            AND pc.status = 'active'
            AND auth.uid() IN (pc.requester_id, pc.receiver_id)
            AND partner_id = CASE
              WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
              WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
            END
        )
      )
    )
  );

-- =====================================================
-- PARTNER_MESSAGES - Enhanced RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can create messages to their partner" ON partner_messages;

-- Enhanced INSERT policy with recipient_id validation
CREATE POLICY "Users can create messages to their partner" ON partner_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    -- Verify connection exists and is active
    EXISTS (
      SELECT 1 FROM profile_connections pc
      WHERE pc.id = partner_messages.connection_id
        AND pc.status = 'active'
        AND auth.uid() IN (pc.requester_id, pc.receiver_id)
        AND
        -- Verify recipient_id matches the other person in connection
        recipient_id = CASE
          WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
          WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
        END
    )
  );

-- =====================================================
-- ACHIEVEMENT_REWARDS - Enhanced RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can create rewards for their partner" ON achievement_rewards;

-- Enhanced INSERT policy with recipient_id validation
CREATE POLICY "Users can create rewards for their partner" ON achievement_rewards
  FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND
    -- Verify connection exists and is active
    EXISTS (
      SELECT 1 FROM profile_connections pc
      WHERE pc.id = achievement_rewards.connection_id
        AND pc.status = 'active'
        AND auth.uid() IN (pc.requester_id, pc.receiver_id)
        AND
        -- Verify recipient_id matches the other person in connection
        recipient_id = CASE
          WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
          WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
        END
    )
  );

-- =====================================================
-- SECURITY COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view their own milestones and partner's" ON milestones IS
'Enhanced security: Validates partner_id against actual partner in connection to prevent unauthorized access';

COMMENT ON POLICY "Users can create their own milestones" ON milestones IS
'Enhanced security: Ensures partner_id can only be set to the actual partner from an active connection';

COMMENT ON POLICY "Users can create messages to their partner" ON partner_messages IS
'Enhanced security: Validates recipient_id matches the other person in the connection';

COMMENT ON POLICY "Users can create rewards for their partner" ON achievement_rewards IS
'Enhanced security: Validates recipient_id matches the other person in the connection';
