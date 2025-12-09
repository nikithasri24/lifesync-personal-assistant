-- ============================================================================
-- Migration: Add List Notes Feature
-- Date: 2025-12-10
-- Description: Extends notes to support list-type notes with checkable items
--              that include rich metadata (completion, tags, due dates, URLs)
-- ============================================================================

-- ============================================================================
-- PHASE 1: Add note_type to notes table
-- ============================================================================

-- Add note_type column (default to 'note', can be 'list')
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type VARCHAR(50) NOT NULL DEFAULT 'note';

-- Add check constraint to ensure valid note types
ALTER TABLE notes ADD CONSTRAINT notes_type_check
  CHECK (note_type IN ('note', 'list'));

-- Add index for filtering by note type
CREATE INDEX IF NOT EXISTS notes_type_idx ON notes(user_id, note_type);

-- ============================================================================
-- PHASE 2: Create list_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,

  -- Item content
  title VARCHAR(500) NOT NULL,
  notes TEXT, -- Optional description/details

  -- Status and organization
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Optional metadata
  due_date DATE, -- Optional deadline
  url TEXT, -- Link to external resource (IMDb, Goodreads, etc.)

  -- Position and ordering
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: Indexes for Performance
-- ============================================================================

-- List items indexes
CREATE INDEX IF NOT EXISTS list_items_user_id_idx ON list_items(user_id);
CREATE INDEX IF NOT EXISTS list_items_note_id_idx ON list_items(note_id, sort_order);
CREATE INDEX IF NOT EXISTS list_items_tags_idx ON list_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS list_items_due_date_idx ON list_items(user_id, due_date)
  WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS list_items_completed_idx ON list_items(note_id, completed);

-- ============================================================================
-- PHASE 4: Row Level Security
-- ============================================================================

ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- List Items RLS Policies
CREATE POLICY "Users can view their own list items"
  ON list_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own list items"
  ON list_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own list items"
  ON list_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own list items"
  ON list_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 5: Auto-Update Timestamps
-- ============================================================================

-- List items updated_at trigger
CREATE OR REPLACE FUNCTION update_list_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_items_updated_at_trigger
  BEFORE UPDATE ON list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_list_items_updated_at();

-- ============================================================================
-- PHASE 6: Auto-Set Completed Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_list_item_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when item is marked as completed
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = NOW();
  END IF;

  -- Clear completed_at when item is unmarked
  IF NEW.completed = false AND OLD.completed = true THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_items_completed_at_trigger
  BEFORE UPDATE ON list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_list_item_completed_at();

-- ============================================================================
-- PHASE 7: Update notes updated_at when list items change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_note_on_list_item_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent note's updated_at timestamp
  UPDATE notes
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.note_id, OLD.note_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_items_update_note_trigger
  AFTER INSERT OR UPDATE OR DELETE ON list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_note_on_list_item_change();

-- ============================================================================
-- PHASE 8: Documentation
-- ============================================================================

COMMENT ON COLUMN notes.note_type IS 'Type of note: "note" for regular notes, "list" for list notes with items';

COMMENT ON TABLE list_items IS 'Items within list-type notes with rich metadata (completion, tags, dates, URLs)';
COMMENT ON COLUMN list_items.notes IS 'Optional description or additional details for the item';
COMMENT ON COLUMN list_items.tags IS 'User-defined tags for categorization within the list';
COMMENT ON COLUMN list_items.url IS 'Optional link to external resource (IMDb, Amazon, Google Maps, etc.)';
COMMENT ON COLUMN list_items.due_date IS 'Optional deadline for item completion';
COMMENT ON COLUMN list_items.sort_order IS 'User-defined sort position for custom ordering';
