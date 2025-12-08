-- Run this in Supabase SQL Editor to check your transactions
-- This query shows all transactions for the current authenticated user

-- First, check if you have any accounts
SELECT
  'Accounts' as table_name,
  COUNT(*) as count,
  array_agg(name) as account_names
FROM accounts
WHERE user_id = auth.uid()
GROUP BY table_name;

-- Then check transactions
SELECT
  'Transactions' as table_name,
  COUNT(*) as count
FROM transactions
WHERE user_id = auth.uid()
GROUP BY table_name;

-- Show recent transactions with details
SELECT
  t.id,
  t.description,
  t.amount,
  t.type,
  t.date,
  a.name as account_name,
  c.name as category_name,
  t.created_at
FROM transactions t
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
ORDER BY t.date DESC
LIMIT 10;
