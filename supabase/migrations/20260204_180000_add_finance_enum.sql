-- =====================================================
-- STEP 1: Add 'finance' to shareable_module enum
-- =====================================================
-- Description: Adds 'finance' as a valid shareable module type
-- Author: Claude Code (Bug Fix)
-- Date: 2026-02-04
-- =====================================================

DO $$
BEGIN
    -- Check if 'finance' is already in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'shareable_module'
        AND e.enumlabel = 'finance'
    ) THEN
        -- Add 'finance' to the enum
        ALTER TYPE shareable_module ADD VALUE 'finance';
        RAISE NOTICE 'Added finance to shareable_module enum';
    ELSE
        RAISE NOTICE 'finance already exists in shareable_module enum';
    END IF;
END $$;
