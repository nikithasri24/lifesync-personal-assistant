-- Quick Add Income for October 2025
-- Copy and paste this into Supabase SQL Editor
-- Modify the amounts and descriptions to match your actual income

-- Option 1: Single Monthly Salary
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id, notes)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  '2025-10-01',
  'October 2025 Salary',
  5000.00,  -- ⬅️ CHANGE THIS to your salary amount
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Miscellaneous' LIMIT 1),
  'Monthly salary payment';

-- Verify it was added
SELECT
  date,
  description,
  amount,
  type,
  c.name as category
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
  AND t.type = 'credit'
  AND t.date >= '2025-10-01'
  AND t.date < '2025-11-01'
ORDER BY t.date DESC;
