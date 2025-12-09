-- Add sidebar_section column to tasks table for manual organization
-- This allows users to manually assign tasks to specific sidebar sections

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS sidebar_section TEXT
CHECK (sidebar_section IN ('todo', 'in_progress', 'backlog', 'scheduled', NULL));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_sidebar_section ON tasks(sidebar_section) WHERE sidebar_section IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN tasks.sidebar_section IS 'Manual sidebar organization: todo (high priority), in_progress (actively working), backlog (low priority queue), scheduled (on calendar). NULL means task uses automatic categorization.';
