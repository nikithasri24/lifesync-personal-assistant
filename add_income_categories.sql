-- Add Income Categories
-- Run this in Supabase SQL Editor to create income-specific categories

-- IMPORTANT: Replace 'YOUR_USER_ID' with your actual user ID
-- To get your user ID, run this first:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- OR use this to see all user IDs:
-- SELECT id, email FROM auth.users;

-- Once you have your user ID, replace it in the INSERT below

-- Add common income categories
INSERT INTO categories (user_id, name, icon, color)
SELECT
  user_id,
  name,
  icon,
  color
FROM (VALUES
  ('Salary', '💰', '#10b981'),
  ('Freelance', '💼', '#059669'),
  ('Bonus', '🎁', '#34d399'),
  ('Investment', '📈', '#6ee7b7'),
  ('Refund', '↩️', '#a7f3d0'),
  ('Gift', '🎉', '#d1fae5'),
  ('Other Income', '💵', '#6ee7b7')
) AS new_categories(name, icon, color)
CROSS JOIN (
  SELECT id as user_id FROM auth.users LIMIT 1  -- This gets the first user
) AS user_table
WHERE NOT EXISTS (
  SELECT 1 FROM categories
  WHERE categories.user_id = user_table.user_id
  AND categories.name = new_categories.name
);

-- Verify income categories were added
SELECT
  name,
  icon,
  color,
  '✅ Income Category' as type
FROM categories
WHERE name IN ('Salary', 'Freelance', 'Bonus', 'Investment', 'Refund', 'Gift', 'Other Income')
ORDER BY name;

-- Show all your categories grouped by type
SELECT
  CASE
    WHEN name IN ('Salary', 'Freelance', 'Bonus', 'Investment', 'Refund', 'Gift', 'Other Income')
    THEN 'Income'
    ELSE 'Expense'
  END as category_type,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as categories
FROM categories
GROUP BY category_type;
