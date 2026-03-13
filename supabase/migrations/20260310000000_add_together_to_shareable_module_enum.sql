-- Add 'together' to the shareable_module enum
-- This enables the Together feature to use merged mode / module_permissions

ALTER TYPE shareable_module ADD VALUE IF NOT EXISTS 'together';
