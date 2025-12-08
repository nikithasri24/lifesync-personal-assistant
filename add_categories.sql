-- Add Miscellaneous and Vanity categories
-- Run this in Supabase SQL Editor

-- Insert Miscellaneous category
INSERT INTO categories (user_id, name, icon, color)
VALUES (
  auth.uid(),
  'Miscellaneous',
  '📦',
  '#94a3b8'
)
ON CONFLICT DO NOTHING;

-- Insert Vanity category
INSERT INTO categories (user_id, name, icon, color)
VALUES (
  auth.uid(),
  'Vanity',
  '💄',
  '#ec4899'
)
ON CONFLICT DO NOTHING;

-- Verify the categories were added
SELECT id, name, icon, color
FROM categories
WHERE user_id = auth.uid()
  AND name IN ('Miscellaneous', 'Vanity')
ORDER BY name;
