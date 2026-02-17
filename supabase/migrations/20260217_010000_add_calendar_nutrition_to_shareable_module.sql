-- Add 'calendar' and 'nutrition' to shareable_module enum
-- Fixes 400 error when querying module_permissions with these modules

-- Add missing enum values to shareable_module
ALTER TYPE shareable_module ADD VALUE IF NOT EXISTS 'calendar';
ALTER TYPE shareable_module ADD VALUE IF NOT EXISTS 'nutrition';
