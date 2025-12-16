-- Gamification System Schema
-- Adds points, levels, achievements, and streaks tracking across all features

-- ============================================================================
-- User Gamification Profile
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Points & Levels
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  
  -- Streaks
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  
  -- Stats
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  goals_achieved INTEGER NOT NULL DEFAULT 0,
  focus_sessions INTEGER NOT NULL DEFAULT 0,
  focus_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Rank (calculated field for leaderboard)
  rank_title TEXT NOT NULL DEFAULT 'Beginner',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own gamification profile"
  ON user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification profile"
  ON user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification profile"
  ON user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Achievement Definitions (Static, admin-managed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('streak', 'completion', 'time', 'special', 'milestone', 'social')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- Requirement
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'tasks_completed', 'habits_completed', 'goals_achieved', 
    'streak_days', 'focus_minutes', 'focus_sessions',
    'total_xp', 'level_reached', 'special'
  )),
  requirement_target INTEGER NOT NULL,
  
  -- Reward
  xp_reward INTEGER NOT NULL DEFAULT 50,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed - achievements are public definitions

-- ============================================================================
-- User Achievements (Unlocked achievements per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 100, -- percentage at time of unlock
  
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Point Transactions (Audit log of all XP changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL, -- positive for gains, negative for losses
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'task', 'habit', 'goal', 'focus', 'achievement', 'streak', 'bonus', 'challenge'
  )),
  source_id UUID, -- Optional reference to the source entity
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON user_gamification(total_xp DESC);

