-- Together Feature - Relationship milestones, messages, and challenges
-- Reuses existing profile_connections from Shared feature for partner linking

-- =====================================================
-- ENHANCE PROFILE_CONNECTIONS TABLE
-- =====================================================
-- Add relationship_start_date to existing profile_connections table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profile_connections' AND column_name = 'relationship_start_date'
  ) THEN
    ALTER TABLE profile_connections ADD COLUMN relationship_start_date date;
  END IF;
END $$;

-- =====================================================
-- MILESTONES TABLE
-- =====================================================
-- Track birthdays, anniversaries, and special dates
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES profile_connections(id) ON DELETE CASCADE, -- Link to connection if shared with partner

  -- Milestone details
  title text NOT NULL,
  milestone_type text NOT NULL CHECK (milestone_type IN (
    'birthday', 'anniversary', 'first_date', 'move_in',
    'engagement', 'wedding', 'custom'
  )),
  milestone_date date NOT NULL,
  recurring boolean DEFAULT false, -- Yearly recurrence

  -- Person
  for_whom text NOT NULL CHECK (for_whom IN ('me', 'partner', 'both')),
  partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- If for partner

  -- Details
  description text,
  notes text, -- Gift ideas, celebration plans
  photo_urls text[], -- Array of photo URLs

  -- Reminders
  reminder_30d boolean DEFAULT true,
  reminder_7d boolean DEFAULT true,
  reminder_1d boolean DEFAULT true,
  reminder_day_of boolean DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_connection ON milestones(connection_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);

-- RLS Policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own milestones and partner's" ON milestones;
CREATE POLICY "Users can view their own milestones and partner's" ON milestones
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    -- Can view partner's milestones if connected
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = milestones.connection_id
        AND status = 'active'
        AND auth.uid() IN (requester_id, receiver_id)
    )
  );

DROP POLICY IF EXISTS "Users can create their own milestones" ON milestones;
CREATE POLICY "Users can create their own milestones" ON milestones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own milestones" ON milestones;
CREATE POLICY "Users can update their own milestones" ON milestones
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own milestones" ON milestones;
CREATE POLICY "Users can delete their own milestones" ON milestones
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PARTNER_MESSAGES TABLE
-- =====================================================
-- Personal letters and messages with reveal triggers
CREATE TABLE IF NOT EXISTS partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  title text NOT NULL,
  message_body text NOT NULL, -- Rich text/markdown
  photo_urls text[], -- Attached photos
  video_url text, -- Optional video
  background_music_url text, -- Optional background music

  -- Reveal settings
  reveal_trigger text NOT NULL CHECK (reveal_trigger IN (
    'first_login', 'specific_date', 'achievement', 'manual'
  )),
  reveal_date timestamptz, -- For specific_date trigger
  achievement_id uuid, -- Link to habit/goal for achievement trigger

  -- Status
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'draft', 'scheduled', 'revealed', 'read', 'archived'
  )),
  revealed_at timestamptz,
  read_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_messages_sender ON partner_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_recipient ON partner_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_connection ON partner_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_status ON partner_messages(status);
CREATE INDEX IF NOT EXISTS idx_partner_messages_trigger ON partner_messages(reveal_trigger);

-- RLS Policies
ALTER TABLE partner_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON partner_messages;
CREATE POLICY "Users can view messages they sent or received" ON partner_messages
  FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

DROP POLICY IF EXISTS "Users can create messages to their partner" ON partner_messages;
CREATE POLICY "Users can create messages to their partner" ON partner_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = partner_messages.connection_id
        AND status = 'active'
        AND auth.uid() IN (requester_id, receiver_id)
    )
  );

DROP POLICY IF EXISTS "Senders can update their own messages" ON partner_messages;
CREATE POLICY "Senders can update their own messages" ON partner_messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Senders can delete their own messages" ON partner_messages;
CREATE POLICY "Senders can delete their own messages" ON partner_messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- =====================================================
-- ACHIEVEMENT_REWARDS TABLE
-- =====================================================
-- Gamified challenges linked to habits/goals with unlockable rewards
CREATE TABLE IF NOT EXISTS achievement_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Challenge details
  title text NOT NULL,
  description text,

  -- Linked habit or goal
  linked_type text NOT NULL CHECK (linked_type IN ('habit', 'goal', 'task')),
  linked_id uuid NOT NULL, -- ID of habit/goal/task

  -- Target criteria
  target_type text NOT NULL CHECK (target_type IN (
    'completion', 'count', 'streak', 'milestone'
  )),
  target_value integer, -- e.g., 1 pull-up, 30 pushups, 7-day streak
  current_progress integer DEFAULT 0,

  -- Reward
  reward_type text NOT NULL CHECK (reward_type IN (
    'message', 'surprise', 'activity', 'gift'
  )),
  reward_description text,
  reward_message_id uuid REFERENCES partner_messages(id) ON DELETE SET NULL,
  hide_reward boolean DEFAULT true, -- Show as "Mystery Reward"

  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'expired', 'cancelled'
  )),
  completed_at timestamptz,
  expiration_date date,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievement_rewards_creator ON achievement_rewards(creator_id);
CREATE INDEX IF NOT EXISTS idx_achievement_rewards_recipient ON achievement_rewards(recipient_id);
CREATE INDEX IF NOT EXISTS idx_achievement_rewards_connection ON achievement_rewards(connection_id);
CREATE INDEX IF NOT EXISTS idx_achievement_rewards_status ON achievement_rewards(status);
CREATE INDEX IF NOT EXISTS idx_achievement_rewards_linked ON achievement_rewards(linked_type, linked_id);

-- RLS Policies
ALTER TABLE achievement_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view rewards they created or received" ON achievement_rewards;
CREATE POLICY "Users can view rewards they created or received" ON achievement_rewards
  FOR SELECT
  USING (auth.uid() IN (creator_id, recipient_id));

DROP POLICY IF EXISTS "Users can create rewards for their partner" ON achievement_rewards;
CREATE POLICY "Users can create rewards for their partner" ON achievement_rewards
  FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND
    EXISTS (
      SELECT 1 FROM profile_connections
      WHERE id = achievement_rewards.connection_id
        AND status = 'active'
        AND auth.uid() IN (requester_id, receiver_id)
    )
  );

DROP POLICY IF EXISTS "Creators can update their own rewards" ON achievement_rewards;
CREATE POLICY "Creators can update their own rewards" ON achievement_rewards
  FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Creators can delete their own rewards" ON achievement_rewards;
CREATE POLICY "Creators can delete their own rewards" ON achievement_rewards
  FOR DELETE
  USING (auth.uid() = creator_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partner_messages_updated_at ON partner_messages;
CREATE TRIGGER update_partner_messages_updated_at
  BEFORE UPDATE ON partner_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievement_rewards_updated_at ON achievement_rewards;
CREATE TRIGGER update_achievement_rewards_updated_at
  BEFORE UPDATE ON achievement_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- Note: Together feature uses existing profile_connections from Shared
-- No need for separate active_partner_links view

-- Upcoming milestones (next 30 days)
CREATE OR REPLACE VIEW upcoming_milestones AS
SELECT
  m.*,
  CASE
    WHEN m.recurring THEN
      make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM m.milestone_date)::integer,
        EXTRACT(DAY FROM m.milestone_date)::integer
      )
    ELSE m.milestone_date
  END as next_occurrence,
  CASE
    WHEN m.recurring THEN
      make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::integer,
        EXTRACT(MONTH FROM m.milestone_date)::integer,
        EXTRACT(DAY FROM m.milestone_date)::integer
      ) - CURRENT_DATE
    ELSE m.milestone_date - CURRENT_DATE
  END as days_until
FROM milestones m
WHERE
  (m.recurring AND
    make_date(
      EXTRACT(YEAR FROM CURRENT_DATE)::integer,
      EXTRACT(MONTH FROM m.milestone_date)::integer,
      EXTRACT(DAY FROM m.milestone_date)::integer
    ) >= CURRENT_DATE
  )
  OR (NOT m.recurring AND m.milestone_date >= CURRENT_DATE)
ORDER BY next_occurrence;

-- Messages awaiting reveal
CREATE OR REPLACE VIEW pending_message_reveals AS
SELECT
  pm.*,
  CASE
    WHEN pm.reveal_trigger = 'specific_date' THEN pm.reveal_date <= now()
    ELSE false
  END as should_reveal_now
FROM partner_messages pm
WHERE pm.status = 'scheduled'
  AND pm.reveal_trigger IN ('first_login', 'specific_date');

-- Active challenges with progress
CREATE OR REPLACE VIEW active_challenges AS
SELECT
  ar.*,
  CASE
    WHEN ar.target_value > 0 THEN
      (ar.current_progress::float / ar.target_value::float * 100)::integer
    ELSE 0
  END as progress_percentage
FROM achievement_rewards ar
WHERE ar.status = 'active'
  AND (ar.expiration_date IS NULL OR ar.expiration_date >= CURRENT_DATE);

-- Grant view access
GRANT SELECT ON upcoming_milestones TO authenticated;
GRANT SELECT ON pending_message_reveals TO authenticated;
GRANT SELECT ON active_challenges TO authenticated;
