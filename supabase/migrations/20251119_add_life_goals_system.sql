-- Life Goals & Dreams System
-- Comprehensive goal tracking with milestones, templates, gamification, and accountability
-- Note: Using "life_goals" to avoid conflict with finance "goals" table

-- Life Goals table
CREATE TABLE IF NOT EXISTS life_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- personal, health, career, financial, fitness
  priority VARCHAR(20) NOT NULL, -- low, medium, high, critical
  status VARCHAR(50) NOT NULL DEFAULT 'not-started', -- not-started, in-progress, completed, on-hold, abandoned
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Measurable targets
  target_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  unit VARCHAR(50), -- kg, hours, dollars, etc.

  -- Dates
  start_date TIMESTAMP WITH TIME ZONE,
  target_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,

  -- Gamification
  difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard, extreme
  xp_reward INTEGER DEFAULT 100,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  streak_enabled BOOLEAN DEFAULT FALSE,
  streak_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
  streak_target INTEGER,
  last_streak_update TIMESTAMP WITH TIME ZONE,

  -- Organization
  tags TEXT[], -- Array of tags
  is_public BOOLEAN DEFAULT FALSE,
  template_id UUID, -- Reference to goal template if created from one

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Goal milestones/sub-tasks
CREATE TABLE IF NOT EXISTS life_goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  target_date TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Goal check-ins (accountability)
CREATE TABLE IF NOT EXISTS life_goal_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_update INTEGER, -- Progress percentage at check-in
  notes TEXT,
  mood VARCHAR(20), -- great, good, okay, struggling, stuck
  blockers TEXT, -- What's blocking progress
  wins TEXT, -- What went well
  next_actions TEXT, -- What's next
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Goal streak history
CREATE TABLE IF NOT EXISTS life_goal_streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

-- Dreams table
CREATE TABLE IF NOT EXISTS life_dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- travel, experiences, possessions, achievements, relationships, lifestyle
  priority VARCHAR(50) NOT NULL, -- someday, within-5-years, within-10-years, lifetime
  status VARCHAR(50) NOT NULL DEFAULT 'dreaming', -- dreaming, planning, in-progress, achieved, no-longer-interested

  -- Planning
  estimated_cost DECIMAL(10, 2),
  estimated_timeframe VARCHAR(100),
  required_resources TEXT[], -- Array of resources needed
  inspiration_sources TEXT[], -- URLs, books, people, etc.

  -- Progress
  achieved_at TIMESTAMP WITH TIME ZONE,

  -- Organization
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,

  -- Vision board
  vision_board_images TEXT[], -- URLs to images
  vision_board_notes TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Goal-Dream relationships (dreams can be broken into goals)
CREATE TABLE IF NOT EXISTS life_dream_goals (
  dream_id UUID NOT NULL REFERENCES life_dreams(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (dream_id, goal_id)
);

-- Life Goal templates (pre-defined goal structures)
CREATE TABLE IF NOT EXISTS life_goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  estimated_duration_days INTEGER, -- How long this goal typically takes

  -- Template structure
  default_milestones JSONB, -- Array of milestone templates
  suggested_tags TEXT[],
  tips TEXT,
  resources TEXT[], -- Helpful resources for this goal

  -- Metadata
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID, -- User who created template (null for system templates)
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Goal-Habit relationships (track which habits support which goals)
CREATE TABLE IF NOT EXISTS life_goal_habits (
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL, -- References habits table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, habit_id)
);

-- Life Goal-Task relationships (tasks that contribute to goals)
CREATE TABLE IF NOT EXISTS life_goal_tasks (
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  task_id UUID NOT NULL, -- References tasks/todos table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE life_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_dream_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_goal_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for life_goals
CREATE POLICY "Users can view their own life goals"
  ON life_goals FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own life goals"
  ON life_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life goals"
  ON life_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life goals"
  ON life_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for life_goal_milestones
CREATE POLICY "Users can view milestones of their life goals"
  ON life_goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_milestones.goal_id
      AND (life_goals.user_id = auth.uid() OR life_goals.is_public = true)
    )
  );

CREATE POLICY "Users can create milestones for their life goals"
  ON life_goal_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_milestones.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of their life goals"
  ON life_goal_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_milestones.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones from their life goals"
  ON life_goal_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_milestones.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

-- RLS Policies for life_goal_checkins
CREATE POLICY "Users can view check-ins of their life goals"
  ON life_goal_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_checkins.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create check-ins for their life goals"
  ON life_goal_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_checkins.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their life goal check-ins"
  ON life_goal_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_checkins.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their life goal check-ins"
  ON life_goal_checkins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_checkins.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

-- RLS Policies for life_goal_streak_history
CREATE POLICY "Users can view streak history of their life goals"
  ON life_goal_streak_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_streak_history.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create streak history for their life goals"
  ON life_goal_streak_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_streak_history.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their life goal streak history"
  ON life_goal_streak_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_streak_history.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their life goal streak history"
  ON life_goal_streak_history FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_streak_history.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

-- RLS Policies for life_dreams
CREATE POLICY "Users can view their own life dreams"
  ON life_dreams FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own life dreams"
  ON life_dreams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life dreams"
  ON life_dreams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life dreams"
  ON life_dreams FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for life_dream_goals
CREATE POLICY "Users can view dream-goal relationships"
  ON life_dream_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_dreams
      WHERE life_dreams.id = life_dream_goals.dream_id
      AND life_dreams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dream-goal relationships"
  ON life_dream_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_dreams
      WHERE life_dreams.id = life_dream_goals.dream_id
      AND life_dreams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dream-goal relationships"
  ON life_dream_goals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_dreams
      WHERE life_dreams.id = life_dream_goals.dream_id
      AND life_dreams.user_id = auth.uid()
    )
  );

-- RLS Policies for life_goal_templates
CREATE POLICY "Everyone can view public life goal templates"
  ON life_goal_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create life goal templates"
  ON life_goal_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their life goal templates"
  ON life_goal_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their life goal templates"
  ON life_goal_templates FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for life_goal_habits
CREATE POLICY "Users can view life goal-habit relationships"
  ON life_goal_habits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_habits.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create life goal-habit relationships"
  ON life_goal_habits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_habits.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete life goal-habit relationships"
  ON life_goal_habits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_habits.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

-- RLS Policies for life_goal_tasks
CREATE POLICY "Users can view life goal-task relationships"
  ON life_goal_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_tasks.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create life goal-task relationships"
  ON life_goal_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_tasks.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete life goal-task relationships"
  ON life_goal_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM life_goals
      WHERE life_goals.id = life_goal_tasks.goal_id
      AND life_goals.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_life_goals_user_id ON life_goals(user_id);
CREATE INDEX idx_life_goals_status ON life_goals(status);
CREATE INDEX idx_life_goals_category ON life_goals(category);
CREATE INDEX idx_life_goals_target_date ON life_goals(target_date);
CREATE INDEX idx_life_goals_template_id ON life_goals(template_id);

CREATE INDEX idx_life_goal_milestones_goal_id ON life_goal_milestones(goal_id);
CREATE INDEX idx_life_goal_milestones_order ON life_goal_milestones(goal_id, order_index);

CREATE INDEX idx_life_goal_checkins_goal_id ON life_goal_checkins(goal_id);
CREATE INDEX idx_life_goal_checkins_date ON life_goal_checkins(check_in_date);

CREATE INDEX idx_life_goal_streak_history_goal_id ON life_goal_streak_history(goal_id);
CREATE INDEX idx_life_goal_streak_history_date ON life_goal_streak_history(goal_id, date);

CREATE INDEX idx_life_dreams_user_id ON life_dreams(user_id);
CREATE INDEX idx_life_dreams_status ON life_dreams(status);
CREATE INDEX idx_life_dreams_category ON life_dreams(category);

CREATE INDEX idx_life_dream_goals_dream_id ON life_dream_goals(dream_id);
CREATE INDEX idx_life_dream_goals_goal_id ON life_dream_goals(goal_id);

CREATE INDEX idx_life_goal_templates_category ON life_goal_templates(category);
CREATE INDEX idx_life_goal_templates_public ON life_goal_templates(is_public);

CREATE INDEX idx_life_goal_habits_goal_id ON life_goal_habits(goal_id);
CREATE INDEX idx_life_goal_habits_habit_id ON life_goal_habits(habit_id);

CREATE INDEX idx_life_goal_tasks_goal_id ON life_goal_tasks(goal_id);
CREATE INDEX idx_life_goal_tasks_task_id ON life_goal_tasks(task_id);

-- Triggers for updated_at
CREATE TRIGGER update_life_goals_updated_at
  BEFORE UPDATE ON life_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_dreams_updated_at
  BEFORE UPDATE ON life_dreams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
