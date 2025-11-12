-- Emergency cleanup script: Delete ALL tasks from the database
-- WARNING: This will permanently delete all tasks. Use with caution!

-- Step 1: First delete all child tasks (those with parent_id)
DELETE FROM tasks
WHERE user_id = auth.uid()
AND parent_id IS NOT NULL;

-- Step 2: Then delete all parent/standalone tasks
DELETE FROM tasks
WHERE user_id = auth.uid();

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_tasks FROM tasks WHERE user_id = auth.uid();
