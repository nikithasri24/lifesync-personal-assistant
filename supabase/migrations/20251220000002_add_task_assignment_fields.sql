-- Add task assignment fields for delegated tasks / family task assignment
-- Enables features like "remind my husband to pick up milk"

-- User ID of the person who assigned this task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);

-- When the task was assigned
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN tasks.assigned_to IS 'User ID of the person this task is assigned to (for delegated tasks)';
COMMENT ON COLUMN tasks.assigned_by IS 'User ID of the person who assigned/delegated this task';
COMMENT ON COLUMN tasks.assigned_at IS 'Timestamp when the task was assigned to someone';

-- Create index for assigned tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by) WHERE assigned_by IS NOT NULL;

-- Update RLS policy to allow viewing tasks assigned to you
-- Users can see tasks they own OR tasks assigned to them
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own or assigned tasks" ON tasks
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to
  );

-- Users can update tasks they own OR tasks assigned to them
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own or assigned tasks" ON tasks
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = assigned_to
  );

