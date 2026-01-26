-- Personal Care Schedule
-- One scheduled item per day for focused personal care tracking

-- =====================================================
-- PERSONAL CARE SCHEDULE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS personal_care_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES personal_care_items(id) ON DELETE CASCADE,
  
  -- The scheduled date (one item per day per user)
  scheduled_date DATE NOT NULL,
  
  -- Status: scheduled, completed, skipped
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped')),
  
  -- When it was completed (if applicable)
  completed_at TIMESTAMPTZ,
  
  -- Optional notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One item per day per user
  UNIQUE(user_id, scheduled_date)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pc_schedule_user ON personal_care_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_pc_schedule_date ON personal_care_schedule(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pc_schedule_item ON personal_care_schedule(item_id);
CREATE INDEX IF NOT EXISTS idx_pc_schedule_month ON personal_care_schedule(user_id, scheduled_date) 
  WHERE scheduled_date >= date_trunc('month', CURRENT_DATE);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE personal_care_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own schedule" ON personal_care_schedule;
DROP POLICY IF EXISTS "Users can insert own schedule" ON personal_care_schedule;
DROP POLICY IF EXISTS "Users can update own schedule" ON personal_care_schedule;
DROP POLICY IF EXISTS "Users can delete own schedule" ON personal_care_schedule;

CREATE POLICY "Users can view own schedule" ON personal_care_schedule
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON personal_care_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON personal_care_schedule
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON personal_care_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FOR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_pc_schedule_updated_at ON personal_care_schedule;
CREATE TRIGGER update_pc_schedule_updated_at
  BEFORE UPDATE ON personal_care_schedule
  FOR EACH ROW EXECUTE FUNCTION update_personal_care_updated_at();

-- =====================================================
-- FUNCTION: When schedule is completed, also log it
-- =====================================================
CREATE OR REPLACE FUNCTION log_schedule_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'completed', create a log entry
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO personal_care_logs (user_id, item_id, completed_at, skipped, notes)
    VALUES (NEW.user_id, NEW.item_id, COALESCE(NEW.completed_at, NOW()), false, NEW.notes)
    ON CONFLICT DO NOTHING;
    
    -- Also update completed_at if not set
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_schedule_completion ON personal_care_schedule;
CREATE TRIGGER trigger_log_schedule_completion
  BEFORE UPDATE ON personal_care_schedule
  FOR EACH ROW
  EXECUTE FUNCTION log_schedule_completion();

