# Fix for Duplicate Transactions Issue

## Problem
Total Income shows **$25,400** but there's only one Salary entry of **$12,700** - the income is being doubled due to duplicate transactions in the database.

## Solution Overview
1. Find and identify duplicate transactions
2. Remove duplicates (keeping the oldest entry)
3. Add a unique constraint to prevent future duplicates

## Step-by-Step Instructions

### Option A: Apply Migration to Remote Database (Recommended)

1. **First, check for duplicates** (optional but recommended):
   - Go to your Supabase Dashboard → SQL Editor
   - Run the query from `scripts/check-duplicate-transactions.sql`
   - Review the results to see what duplicates exist

2. **Apply the migration**:
   ```bash
   npx supabase db push
   ```
   This will apply the migration `20251209_remove_duplicate_transactions.sql` to your remote database.

3. **Review the output**:
   - The migration will show you a report of duplicates found
   - It will show which transactions were removed
   - It will confirm the unique constraint was added

4. **Verify the fix**:
   - Refresh your Finance Reports page
   - Check that Total Income now shows the correct amount ($12,700 instead of $25,400)

### Option B: Manual Cleanup via Supabase Dashboard

If you prefer to manually review and delete duplicates:

1. **Go to Supabase Dashboard** → Table Editor → `transactions` table

2. **Filter for income transactions**:
   - Add filter: `type` = `credit`

3. **Look for duplicates**:
   - Sort by `description` and `amount`
   - Look for identical entries with the same:
     - Description (e.g., "Salary")
     - Amount (e.g., 12700)
     - Date
     - Account

4. **Delete duplicate rows**:
   - Keep the oldest entry (check `created_at` timestamp)
   - Delete the newer duplicate(s)

5. **Apply the unique constraint** (still recommended):
   - Run just the constraint part from the migration in SQL Editor:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS transactions_unique_constraint
   ON transactions (user_id, account_id, date, description, amount, type, category_id);
   ```

## What the Migration Does

### 1. **Reports Duplicates**
Before making changes, it creates a detailed report showing:
- Which transactions are duplicated
- How many duplicates exist
- Which one will be kept (the oldest)

### 2. **Removes Duplicates**
- Keeps the oldest transaction (by `created_at` timestamp)
- Deletes all newer duplicates
- Reports how many were removed

### 3. **Prevents Future Duplicates**
Adds a unique constraint that prevents inserting:
- Same user
- Same account
- Same date
- Same description
- Same amount
- Same type
- Same category

This means you **cannot accidentally create a duplicate** transaction in the future.

### 4. **Provides Helper Function**
Creates `find_potential_duplicate_transactions()` function to help find near-duplicates (transactions that are similar but not exactly the same).

## Using the Helper Function

After the migration, you can find potential near-duplicates:

```sql
-- Find all potential duplicates
SELECT * FROM find_potential_duplicate_transactions();

-- Find potential duplicates for specific user
SELECT * FROM find_potential_duplicate_transactions(
  p_user_id := 'your-user-id'::uuid
);

-- Find transactions within 1 day window
SELECT * FROM find_potential_duplicate_transactions(
  p_days_window := 1
);
```

## Verification

After applying the fix:

1. **Check the Total Income**:
   - Go to Finance → Reports → Income tab
   - Total Income should now show $12,700 (not $25,400)

2. **Verify no duplicates remain**:
   ```sql
   SELECT
     description,
     amount,
     date,
     COUNT(*) as count
   FROM transactions
   WHERE type = 'credit'
   GROUP BY description, amount, date, user_id, account_id, category_id
   HAVING COUNT(*) > 1;
   ```
   This should return 0 rows.

3. **Test duplicate prevention**:
   - Try to add the same transaction twice
   - The second attempt should fail with a unique constraint error

## Rollback (if needed)

If something goes wrong, you can remove the unique constraint:

```sql
DROP INDEX IF EXISTS transactions_unique_constraint;
```

## Notes

- **Backup**: The migration doesn't create a backup, but Supabase keeps automatic backups
- **Performance**: The unique index may slightly slow down inserts, but will prevent duplicates
- **Legitimate Duplicates**: If you legitimately need identical transactions (rare), you'll need to slightly modify one (e.g., add a note or change the description slightly)

## Questions?

- Check migration output for detailed report of what was changed
- Use `find_potential_duplicate_transactions()` to investigate suspicious transactions
- Review the migration file: `supabase/migrations/20251209_remove_duplicate_transactions.sql`
