-- Create travel_bucket_list table for dream destinations
CREATE TABLE IF NOT EXISTS travel_bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL,
  connectionId TEXT,
  sharedWith TEXT[] DEFAULT '{}',

  -- Destination details
  name TEXT NOT NULL,
  description TEXT,
  countryCode TEXT,
  countryName TEXT,
  cityName TEXT,
  regionName TEXT,

  -- Bucket list metadata
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL CHECK (category IN ('beach', 'mountain', 'city', 'cultural', 'adventure', 'relaxation', 'food', 'wildlife', 'other')),
  estimatedBudget NUMERIC,
  currency TEXT DEFAULT 'USD',
  targetYear INTEGER,
  targetSeason TEXT CHECK (targetSeason IN ('spring', 'summer', 'fall', 'winter')),

  -- Planning
  isVisited BOOLEAN DEFAULT false,
  visitedDate TIMESTAMPTZ,
  notes TEXT,
  inspirationUrl TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Wishlist items
  mustDo TEXT[] DEFAULT '{}',
  mustEat TEXT[] DEFAULT '{}',
  mustSee TEXT[] DEFAULT '{}',

  -- Timestamps
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_travel_bucket_list_userId ON travel_bucket_list(userId);
CREATE INDEX IF NOT EXISTS idx_travel_bucket_list_isVisited ON travel_bucket_list(isVisited);
CREATE INDEX IF NOT EXISTS idx_travel_bucket_list_priority ON travel_bucket_list(priority);
CREATE INDEX IF NOT EXISTS idx_travel_bucket_list_createdAt ON travel_bucket_list(createdAt DESC);

-- Enable Row Level Security
ALTER TABLE travel_bucket_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own bucket list destinations and those shared with them
CREATE POLICY "Users can view own and shared bucket list" ON travel_bucket_list
  FOR SELECT
  USING (
    auth.uid()::text = userId
    OR auth.uid()::text = ANY(sharedWith)
  );

-- Users can insert their own bucket list destinations
CREATE POLICY "Users can create own bucket list" ON travel_bucket_list
  FOR INSERT
  WITH CHECK (auth.uid()::text = userId);

-- Users can update their own bucket list destinations and those shared with them
CREATE POLICY "Users can update own and shared bucket list" ON travel_bucket_list
  FOR UPDATE
  USING (
    auth.uid()::text = userId
    OR auth.uid()::text = ANY(sharedWith)
  );

-- Users can delete their own bucket list destinations
CREATE POLICY "Users can delete own bucket list" ON travel_bucket_list
  FOR DELETE
  USING (auth.uid()::text = userId);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_travel_bucket_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = now();
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
