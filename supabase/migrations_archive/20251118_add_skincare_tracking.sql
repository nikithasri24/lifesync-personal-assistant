-- Skincare Tracking Feature
-- Track skincare products, routines, and daily completion

-- Skincare Products Table
CREATE TABLE IF NOT EXISTS skincare_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product Info
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL, -- cleanser, toner, serum, moisturizer, sunscreen, treatment, mask, eye_cream, exfoliant, oil, other
  product_type TEXT, -- gel, cream, foam, liquid, spray, sheet_mask, etc.

  -- Usage Info
  usage_time TEXT[] NOT NULL, -- ['AM', 'PM', 'BOTH']
  order_in_routine INTEGER, -- Step order in routine (1=first, 2=second, etc.)
  frequency TEXT, -- daily, every_other_day, weekly, as_needed

  -- Product Details
  skin_concerns TEXT[], -- acne, dryness, aging, sensitivity, hyperpigmentation, redness, etc.
  key_ingredients TEXT[],
  notes TEXT,

  -- Purchase & Tracking
  purchase_date DATE,
  expiry_date DATE,
  price NUMERIC(10, 2),
  size TEXT, -- e.g., "50ml", "1oz"
  where_to_buy TEXT,
  repurchase BOOLEAN DEFAULT false,

  -- Status
  currently_using BOOLEAN DEFAULT true,
  started_using_date DATE,
  stopped_using_date DATE,

  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  effectiveness INTEGER CHECK (effectiveness >= 1 AND effectiveness <= 5),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skincare Routines Table (AM/PM templates)
CREATE TABLE IF NOT EXISTS skincare_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- "Morning Routine", "Evening Routine", "Special Occasion"
  routine_type TEXT NOT NULL, -- AM, PM, WEEKLY, SPECIAL
  is_active BOOLEAN DEFAULT true,

  -- Routine Steps (ordered list of product IDs)
  product_ids UUID[] NOT NULL,

  -- Scheduling
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc. NULL means all days

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Skincare Log Table (track completion)
CREATE TABLE IF NOT EXISTS skincare_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  routine_id UUID REFERENCES skincare_routines(id) ON DELETE SET NULL,
  routine_type TEXT NOT NULL, -- AM, PM

  -- Completion tracking
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  products_used UUID[], -- Array of product IDs actually used
  skipped_products UUID[], -- Products in routine but skipped

  -- Skin condition tracking
  skin_condition TEXT, -- great, good, okay, bad, terrible
  skin_notes TEXT, -- How skin felt, any reactions, etc.

  -- Environmental factors
  weather TEXT, -- sunny, rainy, humid, dry, cold
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),

  -- Photos
  photo_urls TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date, routine_type)
);

-- Skin Observations Table (track skin changes, reactions, etc.)
CREATE TABLE IF NOT EXISTS skin_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Observation
  observation_type TEXT NOT NULL, -- breakout, irritation, improvement, dryness, oiliness, redness, glow
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  location TEXT, -- forehead, cheeks, chin, nose, around_eyes, neck, etc.

  description TEXT,

  -- Potential causes
  suspected_product_id UUID REFERENCES skincare_products(id) ON DELETE SET NULL,
  other_factors TEXT, -- diet, stress, hormones, weather, etc.

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_date DATE,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_skincare_products_user ON skincare_products(user_id);
CREATE INDEX idx_skincare_products_usage ON skincare_products(user_id, currently_using);
CREATE INDEX idx_skincare_routines_user ON skincare_routines(user_id);
CREATE INDEX idx_skincare_routines_active ON skincare_routines(user_id, is_active);
CREATE INDEX idx_skincare_logs_user_date ON skincare_logs(user_id, date DESC);
CREATE INDEX idx_skincare_logs_user_type ON skincare_logs(user_id, routine_type, date DESC);
CREATE INDEX idx_skin_observations_user_date ON skin_observations(user_id, date DESC);

-- Row Level Security (RLS)
ALTER TABLE skincare_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE skincare_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE skincare_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_observations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own skincare products"
  ON skincare_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skincare products"
  ON skincare_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skincare products"
  ON skincare_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skincare products"
  ON skincare_products FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own skincare routines"
  ON skincare_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skincare routines"
  ON skincare_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skincare routines"
  ON skincare_routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skincare routines"
  ON skincare_routines FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own skincare logs"
  ON skincare_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skincare logs"
  ON skincare_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skincare logs"
  ON skincare_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skincare logs"
  ON skincare_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own skin observations"
  ON skin_observations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skin observations"
  ON skin_observations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skin observations"
  ON skin_observations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skin observations"
  ON skin_observations FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_skincare_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skincare_products_updated_at
  BEFORE UPDATE ON skincare_products
  FOR EACH ROW
  EXECUTE FUNCTION update_skincare_updated_at();

CREATE TRIGGER update_skincare_routines_updated_at
  BEFORE UPDATE ON skincare_routines
  FOR EACH ROW
  EXECUTE FUNCTION update_skincare_updated_at();

CREATE TRIGGER update_skincare_logs_updated_at
  BEFORE UPDATE ON skincare_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_skincare_updated_at();

CREATE TRIGGER update_skin_observations_updated_at
  BEFORE UPDATE ON skin_observations
  FOR EACH ROW
  EXECUTE FUNCTION update_skincare_updated_at();

-- Helper View: Current Routine Summary
CREATE OR REPLACE VIEW skincare_routine_summary AS
SELECT
  r.id as routine_id,
  r.user_id,
  r.name as routine_name,
  r.routine_type,
  r.is_active,
  CARDINALITY(r.product_ids) as product_count,
  ARRAY_AGG(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL) as categories_used
FROM skincare_routines r
LEFT JOIN LATERAL unnest(r.product_ids) AS product_id ON true
LEFT JOIN skincare_products p ON p.id = product_id
WHERE r.is_active = true
GROUP BY r.id, r.user_id, r.name, r.routine_type, r.is_active, r.product_ids;

-- Helper View: Streak Tracking
CREATE OR REPLACE VIEW skincare_streaks AS
WITH daily_completion AS (
  SELECT
    user_id,
    date,
    COUNT(*) FILTER (WHERE completed = true) as completed_routines,
    COUNT(*) as total_routines
  FROM skincare_logs
  GROUP BY user_id, date
)
SELECT
  user_id,
  COUNT(*) as current_streak_days,
  MAX(date) as last_completion_date
FROM daily_completion
WHERE completed_routines > 0
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;
