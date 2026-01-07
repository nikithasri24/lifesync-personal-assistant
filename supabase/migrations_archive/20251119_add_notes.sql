-- Migration: Add notes table with Supabase persistence
-- Purpose: Migrate notes from localStorage to database for cross-device sync
-- Date: 2025-11-19

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS notes_user_id_created_at_idx ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS notes_category_idx ON notes(user_id, category) WHERE category IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own notes
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Add helpful comments
COMMENT ON TABLE notes IS 'User notes with tags and categories for organization';
COMMENT ON COLUMN notes.user_id IS 'Foreign key to auth.users - owner of the note';
COMMENT ON COLUMN notes.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN notes.category IS 'Optional category for grouping notes';
