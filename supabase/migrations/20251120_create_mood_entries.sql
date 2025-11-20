-- Create mood_entries table for mood tracking
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('excellent', 'good', 'neutral', 'bad', 'terrible')),
  energy TEXT NOT NULL CHECK (energy IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);

-- Add index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for mood_entries
-- Users can view their own mood entries
CREATE POLICY "Users can view own mood entries"
  ON mood_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own mood entries
CREATE POLICY "Users can insert own mood entries"
  ON mood_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own mood entries
CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own mood entries
CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mood_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER mood_entries_updated_at
  BEFORE UPDATE ON mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_mood_entries_updated_at();
