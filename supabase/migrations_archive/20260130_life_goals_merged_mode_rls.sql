-- Migration: Update life_goals RLS policies for merged mode
-- Description: Allow partners to see each other's personal goals when both have merged mode enabled
-- Date: 2026-01-30

-- Drop the existing SELECT policy that only allows viewing own goals
DROP POLICY IF EXISTS "Users can view their own life goals" ON life_goals;

-- Create a new SELECT policy that allows:
-- 1. Viewing own goals (user_id = auth.uid())
-- 2. Viewing public goals (is_public = true)
-- 3. Viewing shared goals (connection_id matches a connection the user is part of)
-- 4. Viewing partner's personal goals when BOTH users have merged mode for goals
CREATE POLICY "Users can view own and partner goals in merged mode" ON life_goals
FOR SELECT USING (
  -- Own goals
  (auth.uid() = user_id)
  OR
  -- Public goals
  (is_public = true)
  OR
  -- Shared goals (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections 
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal goals in merged mode:
  -- The goal belongs to a partner (user_id != me) AND connection_id IS NULL (personal goal)
  -- AND both users have 'merged' permission for 'goals' module
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    -- Check that BOTH users have merged permission for goals
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id
      AND mp1.module = 'goals'
      AND mp1.user_id = auth.uid()
      AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id
      AND mp2.module = 'goals'
      AND mp2.user_id = (
        CASE 
          WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
          ELSE pc.requester_id
        END
      )
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- Also update the existing "Users can view their own or shared goals" policy if it exists
-- (This might be redundant now, but let's keep it clean)
DROP POLICY IF EXISTS "Users can view their own or shared goals" ON life_goals;

