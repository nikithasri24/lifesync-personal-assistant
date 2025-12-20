-- Add location fields to tasks table for errands and location-based reminders
-- This enables features like "visit Costco on your way home"

-- Location name (e.g., "Costco", "Target", "Home Depot")
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Full address for the location
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_address TEXT;

-- GPS coordinates for proximity detection
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_coordinates JSONB;
-- Example: {"lat": 37.7749, "lng": -122.4194}

-- Flag to mark task as an errand (for location-based reminder filtering)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_errand BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN tasks.location_name IS 'Name of the location for errand tasks (e.g., Costco, Target)';
COMMENT ON COLUMN tasks.location_address IS 'Full address of the errand location';
COMMENT ON COLUMN tasks.location_coordinates IS 'GPS coordinates as JSON: {"lat": number, "lng": number}';
COMMENT ON COLUMN tasks.is_errand IS 'Whether this task is an errand that can trigger location-based reminders';

-- Create index for errand tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_errand ON tasks(is_errand) WHERE is_errand = true;

-- Create index for tasks with locations
CREATE INDEX IF NOT EXISTS idx_tasks_location_name ON tasks(location_name) WHERE location_name IS NOT NULL;

