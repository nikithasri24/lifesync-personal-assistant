-- Check Dashboard Data
-- Run this in Supabase SQL Editor to see what data you have

-- 1. Check total transactions
SELECT
  'Total Transactions' as info,
  COUNT(*) as count
FROM transactions
WHERE user_id = auth.uid();

-- 2. Check transactions by type
SELECT
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
WHERE user_id = auth.uid()
GROUP BY type;

-- 3. Check transactions by month
SELECT
  DATE_TRUNC('month', date)::date as month,
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE user_id = auth.uid()
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

-- 4. Check categorized vs uncategorized transactions
SELECT
  CASE WHEN category_id IS NULL THEN 'Uncategorized' ELSE 'Categorized' END as status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
WHERE user_id = auth.uid()
GROUP BY CASE WHEN category_id IS NULL THEN 'Uncategorized' ELSE 'Categorized' END;

-- 5. Check categories assigned to transactions
SELECT
  c.name as category,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_amount
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
GROUP BY c.name
ORDER BY total_amount DESC;

-- 6. Check if you have any income (credit) transactions
SELECT
  description,
  amount,
  date,
  COALESCE(c.name, 'Uncategorized') as category
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
  AND t.type = 'credit'
ORDER BY date DESC
LIMIT 10;

-- 7. Sample of recent transactions
SELECT
  date,
  description,
  type,
  amount,
  COALESCE(c.name, 'Uncategorized') as category,
  a.name as account
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
WHERE t.user_id = auth.uid()
ORDER BY date DESC
LIMIT 20;
