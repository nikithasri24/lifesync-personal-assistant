-- Migration: Fix tasks foreign key to use CASCADE on delete
-- This allows parent tasks to be deleted automatically when needed

-- Drop the existing foreign key constraint
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_parent_id_fkey;

-- Add it back with CASCADE on delete
ALTER TABLE tasks
ADD CONSTRAINT tasks_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES tasks(id)
ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT tasks_parent_id_fkey ON tasks IS
'Foreign key to parent task - cascades deletes to preserve referential integrity';
