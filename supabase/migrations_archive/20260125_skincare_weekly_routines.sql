-- Skincare Weekly Routines
-- Simple text-based weekly routine table for AM/PM routines by day of week

-- =====================================================
-- WEEKLY ROUTINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS skincare_weekly_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- AM and PM routine descriptions (text-based, e.g., "Cleanser + Vitamin C + Moisturizer + SPF")
  am_routine TEXT,
  pm_routine TEXT,
  
  -- Optional notes for special instructions
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One entry per user per day of week
  UNIQUE(user_id, day_of_week)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_skincare_weekly_user ON skincare_weekly_routines(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE skincare_weekly_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own weekly routines" ON skincare_weekly_routines;
DROP POLICY IF EXISTS "Users can insert own weekly routines" ON skincare_weekly_routines;
DROP POLICY IF EXISTS "Users can update own weekly routines" ON skincare_weekly_routines;
DROP POLICY IF EXISTS "Users can delete own weekly routines" ON skincare_weekly_routines;

CREATE POLICY "Users can view own weekly routines" ON skincare_weekly_routines
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly routines" ON skincare_weekly_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly routines" ON skincare_weekly_routines
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weekly routines" ON skincare_weekly_routines
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_skincare_weekly_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_skincare_weekly_updated_at_trigger ON skincare_weekly_routines;
CREATE TRIGGER update_skincare_weekly_updated_at_trigger
  BEFORE UPDATE ON skincare_weekly_routines
  FOR EACH ROW EXECUTE FUNCTION update_skincare_weekly_updated_at();

