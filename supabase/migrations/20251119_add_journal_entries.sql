-- Create journal_entries table
-- Stores user journal entries with mood tracking, tags, and rich content

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry content
  title VARCHAR(500),
  content TEXT NOT NULL,
  mood VARCHAR(20) CHECK (mood IN ('excellent', 'good', 'neutral', 'bad', 'terrible')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Optional fields for future enhancement
  weather JSONB,
  gratitude TEXT,
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX journal_entries_user_id_created_at_idx ON journal_entries(user_id, created_at DESC);
CREATE INDEX journal_entries_tags_idx ON journal_entries USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- Add helpful comments
COMMENT ON TABLE journal_entries IS 'User journal entries with mood tracking, tags, and rich content';
COMMENT ON COLUMN journal_entries.mood IS 'User mood rating: excellent, good, neutral, bad, terrible';
COMMENT ON COLUMN journal_entries.tags IS 'User-defined tags for categorization and filtering';
COMMENT ON COLUMN journal_entries.attachments IS 'JSON array of file attachments (photos, documents)';
COMMENT ON COLUMN journal_entries.weather IS 'Optional weather data at time of entry';
COMMENT ON COLUMN journal_entries.gratitude IS 'Optional gratitude reflection';
