-- Add Miscellaneous and Vanity categories for all users
-- Migration: 20251207_add_miscellaneous_vanity_categories

-- Note: This will add these categories for ALL users in the system
-- If you only want to add for your user, use add_categories.sql instead

-- Create a function to safely add categories for a user
CREATE OR REPLACE FUNCTION add_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert Miscellaneous if it doesn't exist
  INSERT INTO categories (user_id, name, icon, color)
  SELECT p_user_id, 'Miscellaneous', '📦', '#94a3b8'
  WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE user_id = p_user_id AND name = 'Miscellaneous'
  );

  -- Insert Vanity if it doesn't exist
  INSERT INTO categories (user_id, name, icon, color)
  SELECT p_user_id, 'Vanity', '💄', '#ec4899'
  WHERE NOT EXISTS (
    SELECT 1 FROM categories
    WHERE user_id = p_user_id AND name = 'Vanity'
  );
END;
$$;

-- Add categories for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN (SELECT DISTINCT user_id FROM categories)
  LOOP
    PERFORM add_default_categories(user_record.user_id);
  END LOOP;
END;
$$;

-- Drop the function after use (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS add_default_categories(uuid);
