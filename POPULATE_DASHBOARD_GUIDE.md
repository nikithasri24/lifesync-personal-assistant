# How to Populate Dashboard Visualizations

## Why Are the Visualizations Empty?

The dashboard visualizations require specific data to display:

### 1. **Top Categories vs Budget**
❌ Missing: Transactions with **categories assigned** and/or **budgets set**

### 2. **Money Flow Visualization**
❌ Missing: Both **income** (credit) AND **expense** (debit) transactions with **categories**

### 3. **Recent Spending Trends**
❌ Missing: Transactions with **categories** across multiple months

### 4. **Full Spending History**
❌ Missing: Historical transactions with **categories**

## What You Need to Do

### Step 1: Check Your Current Data

Run this SQL in Supabase SQL Editor to see what you have:

```sql
-- See file: check_dashboard_data.sql
```

The script will show:
- How many transactions you have
- How many are categorized vs uncategorized
- Whether you have income transactions
- Transaction breakdown by month

### Step 2: Add Categories to Your October Transactions

Your October transactions likely don't have categories assigned. You have two options:

#### Option A: Update Transactions Manually (Recommended for Few Transactions)

1. Go to **Finances → Transactions**
2. Find your October transactions
3. Click on each transaction to edit
4. Select a category from the dropdown
5. Save

#### Option B: Bulk Update via SQL (Faster for Many Transactions)

Run this in Supabase SQL Editor:

```sql
-- Example: Assign categories to transactions based on description

-- Coffee purchases → Coffee category
UPDATE transactions
SET category_id = (SELECT id FROM categories WHERE name = 'Coffee' AND user_id = auth.uid())
WHERE user_id = auth.uid()
  AND description ILIKE '%STARBUCKS%'
  AND category_id IS NULL;

-- Groceries → Groceries category
UPDATE transactions
SET category_id = (SELECT id FROM categories WHERE name = 'Groceries' AND user_id = auth.uid())
WHERE user_id = auth.uid()
  AND description ILIKE '%WHOLE FOODS%'
  AND category_id IS NULL;

-- Netflix → Entertainment category
UPDATE transactions
SET category_id = (SELECT id FROM categories WHERE name = 'Entertainment' AND user_id = auth.uid())
WHERE user_id = auth.uid()
  AND description ILIKE '%NETFLIX%'
  AND category_id IS NULL;

-- Repeat for other merchants/categories...
```

### Step 3: Add Income Transactions

The Money Flow visualization needs **income** to show money flowing from income sources to expense categories.

Add income transactions via the **Add Transaction** form:

1. Go to **Finances → Transactions**
2. Click **"Add Transaction"**
3. Fill in:
   - **Account**: Your checking account
   - **Description**: "October Salary" or "Paycheck"
   - **Amount**: Your income amount (e.g., `5000`)
   - **Category**: Create an "Income" or "Salary" category
   - **Date**: October 1, 2025
   - **Type**: **Credit (Income)** ⬅️ IMPORTANT!
   - **Notes**: Optional

4. Click **Add Transaction**

### Step 4: Set Budgets (Optional but Recommended)

For the "Top Categories vs Budget" section:

1. Go to **Finances → Budgets**
2. Click **"Set Budget"** for each category
3. Enter monthly budget amounts:
   - Coffee: $150
   - Groceries: $600
   - Dining Out: $300
   - Entertainment: $100
   - etc.

## Expected Results

After adding categories and income:

### ✅ Top Categories vs Budget
Shows your top 5 spending categories with progress bars:
```
Coffee              ████████░░  $127 / $150
Groceries          ███████████  $650 / $600 (over budget!)
Dining Out          █████░░░░░  $150 / $300
```

### ✅ Money Flow Visualization
Shows income flowing to expense categories:
```
[Salary $5,000] ──→ [Coffee $127]
                ──→ [Groceries $650]
                ──→ [Dining Out $150]
                ──→ [Other expenses]
```

### ✅ Recent Spending Trends
Shows stacked bar chart of last 6 months:
```
Oct: [Coffee][Groceries][Dining][Other]
Sep: [Coffee][Groceries][Dining][Other]
Aug: [Coffee][Groceries][Dining][Other]
...
```

### ✅ Full Spending History
Shows all-time spending by category

## Quick Start Example

Here's SQL to set up a basic example for October 2025:

```sql
-- 1. Make sure you have categories (run the add_categories.sql if needed)

-- 2. Update existing October transactions with categories
-- This assumes you have transactions from October that need categorizing
UPDATE transactions t
SET category_id = (
  SELECT id FROM categories c
  WHERE c.user_id = auth.uid()
  AND c.name = 'Miscellaneous'
  LIMIT 1
)
WHERE t.user_id = auth.uid()
  AND t.date >= '2025-10-01'
  AND t.date < '2025-11-01'
  AND t.category_id IS NULL;

-- 3. Add an income transaction for October
INSERT INTO transactions (user_id, account_id, date, description, amount, type, category_id)
SELECT
  auth.uid(),
  (SELECT id FROM accounts WHERE user_id = auth.uid() AND type = 'checking' LIMIT 1),
  '2025-10-01',
  'October Salary',
  5000.00,
  'credit',
  (SELECT id FROM categories WHERE user_id = auth.uid() AND name = 'Miscellaneous' LIMIT 1);
```

## Troubleshooting

### "Still no data showing"
- ✅ Make sure you're viewing **October 2025** in the month dropdown
- ✅ Check that categories are assigned (not null)
- ✅ Verify you have both income AND expense transactions
- ✅ Refresh the page after making changes

### "Money Flow is empty"
- ✅ You MUST have **income (credit) transactions** with categories
- ✅ You MUST have **expense (debit) transactions** with categories
- Both are required for the Sankey diagram to work

### "Top Categories is empty"
- ✅ Assign categories to your transactions
- ✅ Optionally set budgets for those categories

## Summary Checklist

- [ ] Run `check_dashboard_data.sql` to see current state
- [ ] Assign categories to October transactions
- [ ] Add at least one income transaction (type = 'credit')
- [ ] Set budgets for top categories (optional)
- [ ] Refresh dashboard and select October 2025
- [ ] Visualizations should now populate!

## Need Help?

If visualizations are still empty after following these steps:
1. Run `check_dashboard_data.sql` and share the results
2. Check browser console for any errors
3. Verify the month filter is set to October 2025
