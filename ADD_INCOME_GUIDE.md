# How to Add Income Transactions - Complete Guide

There are **3 ways** to add income transactions to populate your dashboard visualizations.

---

## Method 1: Add Transaction Button (Easiest - UI)

### Steps:

1. Go to **Finances → Transactions** tab
2. Click **"Add Transaction"** button
3. Fill out the form:
   - **Account**: Select your checking account (or wherever income is deposited)
   - **Description**: `October Salary` or `Paycheck - Oct 2025`
   - **Amount**: Your income amount (e.g., `5000`)
   - **Category**: Select an income category (or create one like "Salary" or "Income")
   - **Date**: `2025-10-01` (or appropriate date)
   - **Type**: Select **"Credit (Income)"** ⬅️ **CRITICAL!**
   - **Notes**: Optional (e.g., "Monthly salary")

4. Click **"Add Transaction"**

### ✅ Pros:
- Visual, easy to use
- Form validation
- Can add category immediately

### ❌ Cons:
- One transaction at a time
- Slower for multiple income sources

---

## Method 2: SQL Insert (Fast - Bulk)

### Single Income Transaction

Run this in **Supabase SQL Editor**:

```sql
-- Add October 2025 Salary
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id, notes)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  '2025-10-01',
  'October Salary',
  5000.00,
  'credit',  -- This makes it INCOME
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Miscellaneous' LIMIT 1),
  'Monthly salary payment';
```

### Multiple Income Transactions

```sql
-- Add multiple income sources for October 2025
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  date,
  description,
  amount,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Miscellaneous' LIMIT 1)
FROM (VALUES
  ('2025-10-01'::date, 'October Salary', 5000.00),
  ('2025-10-15'::date, 'Freelance Project Payment', 1500.00),
  ('2025-10-20'::date, 'Bonus', 2000.00),
  ('2025-10-25'::date, 'Investment Dividend', 250.00)
) AS income_data(date, description, amount);
```

### Recurring Monthly Income (Last 6 Months)

```sql
-- Add salary for last 6 months
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  DATE(month || '-01'),
  'Salary - ' || TO_CHAR(DATE(month || '-01'), 'Month YYYY'),
  5000.00,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Miscellaneous' LIMIT 1)
FROM (VALUES
  ('2025-05'),
  ('2025-06'),
  ('2025-07'),
  ('2025-08'),
  ('2025-09'),
  ('2025-10')
) AS months(month);
```

### ✅ Pros:
- Fast for bulk operations
- Can add historical data quickly
- Can use patterns/loops

### ❌ Cons:
- Requires SQL knowledge
- Less user-friendly
- No form validation

---

## Method 3: Import CSV (Best for Historical Data)

If you have income data in a spreadsheet:

### Steps:

1. **Prepare CSV file** (`income.csv`):
```csv
date,description,amount,type,account,category
2025-10-01,October Salary,5000.00,credit,My Checking Account,Salary
2025-09-01,September Salary,5000.00,credit,My Checking Account,Salary
2025-08-01,August Salary,5000.00,credit,My Checking Account,Salary
```

2. **Import via Supabase**:
   - Go to Supabase Dashboard → Table Editor
   - Select `transactions` table
   - Click **"Insert" → "Import data from CSV"**
   - Upload your CSV file
   - Map columns correctly
   - Import

### ✅ Pros:
- Great for historical data
- Can import from bank exports
- Bulk operation

### ❌ Cons:
- Need to format CSV correctly
- Must manually add `user_id` column
- Requires account IDs

---

## Common Income Categories to Create

Before adding income, create these categories in **Finances → Settings**:

| Category Name | Description |
|--------------|-------------|
| **Salary** | Regular employment income |
| **Freelance** | Freelance/contract work |
| **Bonus** | Employment bonuses |
| **Investment** | Investment income, dividends |
| **Gift** | Monetary gifts received |
| **Refund** | Tax refunds, purchase refunds |
| **Other Income** | Miscellaneous income |

---

## Quick Examples by Use Case

### Use Case 1: Regular Monthly Salary
```sql
-- Add this month's salary
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND name = 'My Checking Account' LIMIT 1),
  '2025-10-01',
  'October 2025 Salary',
  5000.00,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Salary' LIMIT 1);
```

### Use Case 2: Multiple Income Sources
```sql
-- Salary + Freelance + Side Hustle
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  date,
  description,
  amount,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = category LIMIT 1)
FROM (VALUES
  ('2025-10-01'::date, 'Monthly Salary', 5000.00, 'Salary'),
  ('2025-10-15'::date, 'Freelance Web Design', 1200.00, 'Freelance'),
  ('2025-10-20'::date, 'Etsy Shop Sales', 350.00, 'Other Income')
) AS income_data(date, description, amount, category);
```

### Use Case 3: Bi-weekly Paychecks
```sql
-- Two paychecks per month
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  date,
  description,
  amount,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Salary' LIMIT 1)
FROM (VALUES
  ('2025-10-01'::date, 'Paycheck 1/2', 2500.00),
  ('2025-10-15'::date, 'Paycheck 2/2', 2500.00)
) AS paychecks(date, description, amount);
```

---

## Verification

After adding income, verify it was added correctly:

```sql
-- Check recent income transactions
SELECT
  date,
  description,
  amount,
  c.name as category,
  a.name as account
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
WHERE t.user_id = auth.uid()
  AND t.type = 'credit'
ORDER BY t.date DESC
LIMIT 10;
```

Expected output:
```
date        | description          | amount  | category | account
------------|---------------------|---------|----------|----------------
2025-10-01  | October Salary      | 5000.00 | Salary   | My Checking
2025-09-01  | September Salary    | 5000.00 | Salary   | My Checking
```

---

## Important Notes

### ⚠️ Type Must Be 'credit'
Income transactions **must** have `type = 'credit'`. This is how the system distinguishes income from expenses:
- `type = 'credit'` → Income (money IN)
- `type = 'debit'` → Expense (money OUT)

### 💡 Category Is Optional But Recommended
While you can leave `category_id` as `NULL`, categorizing income helps with:
- Money Flow visualization
- Income tracking by source
- Tax reporting

### 🎯 Account Selection
Income should go into:
- **Checking accounts** (most common)
- **Savings accounts** (if direct deposit there)
- **Investment accounts** (for dividends)

---

## Troubleshooting

### "Income not showing in Money Flow"
✅ Check that `type = 'credit'`
✅ Check that category is assigned
✅ Verify date is in the selected month

### "Wrong month showing"
✅ Make sure date format is `YYYY-MM-DD`
✅ Check the month dropdown on dashboard

### "Can't find my account"
```sql
-- List your accounts
SELECT id, name, type FROM accounts WHERE user_id = auth.uid();
```

---

## Summary

| Method | Best For | Speed | Difficulty |
|--------|----------|-------|-----------|
| **UI Form** | 1-5 transactions | Slow | Easy ⭐ |
| **SQL Insert** | 5+ transactions | Fast | Medium ⭐⭐ |
| **CSV Import** | Historical data | Fast | Hard ⭐⭐⭐ |

**Recommendation**:
- Use **UI Form** for adding one-off income
- Use **SQL Insert** for monthly recurring income setup
- Use **CSV Import** if you have existing data from bank/spreadsheet
