-- Travel Tracking Tables
-- Enables comprehensive travel tracking with scratch maps, trip journals, and expense management

-- =====================================================
-- VISITED LOCATIONS (Scratch Map Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS visited_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Location details
  location_type TEXT NOT NULL CHECK (location_type IN ('country', 'state', 'city', 'region')),
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2
  country_name TEXT NOT NULL,
  state_code TEXT,
  state_name TEXT,
  city_name TEXT,
  region_name TEXT,

  -- Visit info
  status TEXT NOT NULL DEFAULT 'visited' CHECK (status IN ('visited', 'lived', 'transit', 'wishlist')),
  first_visit_date DATE,
  last_visit_date DATE,
  visit_count INTEGER DEFAULT 1,
  total_days INTEGER,

  -- Notes
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  favorite_place BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate locations per user
  UNIQUE(user_id, location_type, country_code, state_code, city_name)
);

CREATE INDEX idx_visited_locations_user ON visited_locations(user_id);
CREATE INDEX idx_visited_locations_country ON visited_locations(country_code);
CREATE INDEX idx_visited_locations_status ON visited_locations(status);

-- =====================================================
-- TRIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Location
  countries TEXT[] NOT NULL DEFAULT '{}', -- Array of country codes
  cities TEXT[],

  -- Trip metadata
  trip_type TEXT DEFAULT 'vacation' CHECK (trip_type IN ('vacation', 'business', 'weekend', 'road_trip', 'backpacking', 'cruise', 'other')),
  travel_companions TEXT[],

  -- Budget & Expenses
  budget_amount DECIMAL(12, 2),
  budget_currency TEXT NOT NULL DEFAULT 'USD',
  total_spent DECIMAL(12, 2) DEFAULT 0,

  -- Media
  cover_photo_url TEXT,
  photo_urls TEXT[],

  -- Status
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'ongoing', 'completed', 'cancelled')),

  -- Rating & memories
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  highlights TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_status ON trips(status);

-- =====================================================
-- TRIP EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- Expense details
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL CHECK (category IN ('accommodation', 'transportation', 'food', 'activities', 'shopping', 'entertainment', 'health', 'other')),

  -- Payment info
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'mobile_payment', 'other')),
  paid_by TEXT,

  -- Location
  location TEXT,
  country_code TEXT,

  -- Splitting
  shared_with TEXT[],
  split_amount DECIMAL(12, 2),

  -- Receipt
  receipt_photo_url TEXT,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trip_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX idx_trip_expenses_user ON trip_expenses(user_id);
CREATE INDEX idx_trip_expenses_date ON trip_expenses(date);
CREATE INDEX idx_trip_expenses_category ON trip_expenses(category);

-- =====================================================
-- JOURNAL ENTRIES
-- =====================================================
CREATE TABLE IF NOT EXISTS travel_journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

  -- Entry details
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Location
  location TEXT,
  country_code TEXT,
  coordinates JSONB, -- {lat: number, lng: number}

  -- Media
  photo_urls TEXT[],

  -- Metadata
  mood TEXT CHECK (mood IN ('amazing', 'great', 'good', 'okay', 'bad')),
  weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'snowy', 'windy')),

  -- Tags
  tags TEXT[],

  -- Privacy
  is_private BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user ON travel_journal_entries(user_id);
CREATE INDEX idx_journal_entries_trip ON travel_journal_entries(trip_id);
CREATE INDEX idx_journal_entries_date ON travel_journal_entries(date);

-- =====================================================
-- ITINERARIES
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  activities JSONB NOT NULL DEFAULT '[]', -- Array of ItineraryActivity objects
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(trip_id, date)
);

CREATE INDEX idx_itineraries_trip ON trip_itineraries(trip_id);
CREATE INDEX idx_itineraries_date ON trip_itineraries(date);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update trip's total_spent based on expenses
CREATE OR REPLACE FUNCTION update_trip_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trips
  SET total_spent = (
    SELECT COALESCE(SUM(amount), 0)
    FROM trip_expenses
    WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trip total_spent when expenses change
CREATE TRIGGER trigger_update_trip_total_spent
AFTER INSERT OR UPDATE OR DELETE ON trip_expenses
FOR EACH ROW
EXECUTE FUNCTION update_trip_total_spent();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_visited_locations_updated_at BEFORE UPDATE ON visited_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_expenses_updated_at BEFORE UPDATE ON trip_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_journal_entries_updated_at BEFORE UPDATE ON travel_journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_itineraries_updated_at BEFORE UPDATE ON trip_itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE visited_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_itineraries ENABLE ROW LEVEL SECURITY;

-- Policies for visited_locations
CREATE POLICY "Users can view own visited locations"
  ON visited_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visited locations"
  ON visited_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visited locations"
  ON visited_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own visited locations"
  ON visited_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for trip_expenses
CREATE POLICY "Users can view own trip expenses"
  ON trip_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trip expenses"
  ON trip_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip expenses"
  ON trip_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trip expenses"
  ON trip_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for travel_journal_entries
CREATE POLICY "Users can view own journal entries"
  ON travel_journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON travel_journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON travel_journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON travel_journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for trip_itineraries
CREATE POLICY "Users can view own itineraries"
  ON trip_itineraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own itineraries"
  ON trip_itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries"
  ON trip_itineraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries"
  ON trip_itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for travel statistics
CREATE OR REPLACE VIEW travel_stats AS
SELECT
  user_id,
  COUNT(DISTINCT CASE WHEN location_type = 'country' AND status = 'visited' THEN country_code END) as countries_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'state' AND status = 'visited' THEN state_code END) as states_visited,
  COUNT(DISTINCT CASE WHEN location_type = 'city' AND status = 'visited' THEN city_name END) as cities_visited,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id) as total_trips,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id AND status = 'completed') as completed_trips,
  (SELECT COUNT(*) FROM trips t WHERE t.user_id = visited_locations.user_id AND status IN ('planning', 'ongoing')) as upcoming_trips,
  (SELECT COALESCE(SUM(total_spent), 0) FROM trips t WHERE t.user_id = visited_locations.user_id AND status = 'completed') as total_spent,
  (SELECT COUNT(*) FROM travel_journal_entries j WHERE j.user_id = visited_locations.user_id) as journal_entries
FROM visited_locations
GROUP BY user_id;
