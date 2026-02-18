-- Drop existing table if it was created incorrectly
DROP TABLE IF EXISTS travel_bucket_list CASCADE;

-- Create travel_bucket_list table for dream destinations with snake_case column names
CREATE TABLE travel_bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connection_id TEXT,
  shared_with TEXT[] DEFAULT '{}',

  -- Destination details
  name TEXT NOT NULL,
  description TEXT,
  country_code TEXT,
  country_name TEXT,
  city_name TEXT,
  region_name TEXT,

  -- Bucket list metadata
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL CHECK (category IN ('beach', 'mountain', 'city', 'cultural', 'adventure', 'relaxation', 'food', 'wildlife', 'other')),
  estimated_budget NUMERIC,
  currency TEXT DEFAULT 'USD',
  target_year INTEGER,
  target_season TEXT CHECK (target_season IN ('spring', 'summer', 'fall', 'winter')),

  -- Planning
  is_visited BOOLEAN DEFAULT false,
  visited_date TIMESTAMPTZ,
  notes TEXT,
  inspiration_url TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Wishlist items
  must_do TEXT[] DEFAULT '{}',
  must_eat TEXT[] DEFAULT '{}',
  must_see TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_travel_bucket_list_user_id ON travel_bucket_list(user_id);
CREATE INDEX idx_travel_bucket_list_is_visited ON travel_bucket_list(is_visited);
CREATE INDEX idx_travel_bucket_list_priority ON travel_bucket_list(priority);
CREATE INDEX idx_travel_bucket_list_created_at ON travel_bucket_list(created_at DESC);

-- Enable Row Level Security
ALTER TABLE travel_bucket_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own bucket list destinations and those shared with them
CREATE POLICY "Users can view own and shared bucket list" ON travel_bucket_list
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR auth.uid()::text = ANY(shared_with)
  );

-- Users can insert their own bucket list destinations
CREATE POLICY "Users can create own bucket list" ON travel_bucket_list
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own bucket list destinations and those shared with them
CREATE POLICY "Users can update own and shared bucket list" ON travel_bucket_list
  FOR UPDATE
  USING (
    auth.uid()::text = user_id
    OR auth.uid()::text = ANY(shared_with)
  );

-- Users can delete their own bucket list destinations
CREATE POLICY "Users can delete own bucket list" ON travel_bucket_list
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_travel_bucket_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_bucket_list_updated_at
  BEFORE UPDATE ON travel_bucket_list
  FOR EACH ROW
  EXECUTE FUNCTION update_travel_bucket_list_updated_at();

-- Grant permissions
GRANT ALL ON travel_bucket_list TO authenticated;
GRANT ALL ON travel_bucket_list TO service_role;
