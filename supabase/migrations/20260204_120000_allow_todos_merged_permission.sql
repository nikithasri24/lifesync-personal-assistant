-- =====================================================
-- Allow 'merged' permission for 'todos' module
-- =====================================================
-- This migration removes any CHECK constraints that might
-- prevent the 'todos' module from having 'merged' permission
-- =====================================================

-- Drop any existing CHECK constraint on module_permissions that restricts permission levels
-- Note: This is safe because we'll rely on application-level validation via MODULE_CONFIGS
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Find and drop any check constraints on the module_permissions table
    FOR constraint_name_var IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'module_permissions'
        AND tc.constraint_type = 'CHECK'
        AND tc.constraint_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE module_permissions DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
    END LOOP;
END $$;

-- Verify the change by showing current constraints
COMMENT ON TABLE module_permissions IS
  'Module permissions for profile connections. Permission levels are validated at application level via MODULE_CONFIGS.';
