-- Important Dates / Birthdays & Anniversaries Tracking
-- Track birthdays, anniversaries, and other important dates with reminders

-- Create important_dates table
CREATE TABLE IF NOT EXISTS important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Person/Event details
  person_name TEXT NOT NULL,
  relationship TEXT, -- e.g., 'mother', 'spouse', 'friend', 'colleague'
  
  -- Date info
  date_type TEXT NOT NULL CHECK (date_type IN ('birthday', 'anniversary', 'memorial', 'custom')),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  year INTEGER, -- Optional: birth year for age calculation, or anniversary year
  
  -- Reminders
  reminder_days_before INTEGER[] DEFAULT '{7, 1}', -- Remind 1 week and 1 day before
  
  -- Notes and gift ideas
  notes TEXT,
  gift_ideas TEXT[], -- Array of gift ideas
  
  -- Celebration planning
  celebration_notes TEXT,
  last_celebrated_year INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_important_dates_user ON important_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_month_day ON important_dates(month, day);
CREATE INDEX IF NOT EXISTS idx_important_dates_type ON important_dates(user_id, date_type);

-- Enable RLS
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own important dates"
  ON important_dates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own important dates"
  ON important_dates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own important dates"
  ON important_dates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own important dates"
  ON important_dates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_important_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER important_dates_updated_at
  BEFORE UPDATE ON important_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_important_dates_updated_at();

-- Helper function to get upcoming dates
CREATE OR REPLACE FUNCTION get_upcoming_important_dates(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  person_name TEXT,
  date_type TEXT,
  month INTEGER,
  day INTEGER,
  year INTEGER,
  days_until INTEGER,
  age INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_this_year INTEGER := EXTRACT(YEAR FROM v_today);
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.person_name,
    d.date_type,
    d.month,
    d.day,
    d.year,
    CASE 
      WHEN make_date(v_this_year, d.month, d.day) >= v_today 
      THEN make_date(v_this_year, d.month, d.day) - v_today
      ELSE make_date(v_this_year + 1, d.month, d.day) - v_today
    END AS days_until,
    CASE 
      WHEN d.year IS NOT NULL THEN v_this_year - d.year
      ELSE NULL
    END AS age
  FROM important_dates d
  WHERE d.user_id = p_user_id
    AND d.is_active = true
    AND (
      (make_date(v_this_year, d.month, d.day) >= v_today 
       AND make_date(v_this_year, d.month, d.day) <= v_today + p_days_ahead)
      OR
      (make_date(v_this_year + 1, d.month, d.day) <= v_today + p_days_ahead)
    )
  ORDER BY days_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE important_dates IS 'Birthdays, anniversaries, and other important dates to remember';
COMMENT ON FUNCTION get_upcoming_important_dates IS 'Get important dates coming up in the next N days';

