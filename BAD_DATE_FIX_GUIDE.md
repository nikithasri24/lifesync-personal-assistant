# Fix Bad Transaction Dates - "0049-12" Issue

## Problem

You're seeing "0049-12" (or similar) in the month filter dropdown on the Finance dashboard instead of "December 2025".

## Root Cause

One or more transactions in your database have malformed dates where the year is "0049" instead of "2025". This likely happened due to:
- Manual data entry mistake (entering "49" instead of "2025")
- Date parsing error during import
- Database migration issue

## How to Fix

### Option 1: Use the SQL Script (Recommended)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Open the file `FIX_BAD_DATES.sql` in this directory
4. Run the query in **Step 1** to see all bad dates
5. Review the results
6. If the dates look wrong, uncomment and run the UPDATE query in **Step 2**
7. Run **Step 4** to verify the fix

### Option 2: Manual Fix via Supabase UI

1. Go to Supabase Dashboard → Table Editor → `finance_transactions`
2. Filter by year < 2000:
   ```sql
   EXTRACT(YEAR FROM date) < 2000
   ```
3. Find the bad transactions
4. Edit each one manually to fix the year

### Option 3: Create a Migration

Run this migration to fix automatically:

```bash
cd supabase
npx supabase migration new fix_bad_transaction_dates
# Edit the new migration file and add the SQL from FIX_BAD_DATES.sql
npx supabase db push
```

## What Changed in the Code

I've also improved the UI to show formatted month names:

- **Before**: `2025-01` in dropdown
- **After**: `January 2025` in dropdown

This makes it easier to spot bad data like "December 0049" instead of just seeing "0049-12".

**Files Changed**:
- `src/finance/utils/date.ts` - Added `formatMonth()` function
- `src/finance/pages/DashboardPage.tsx` - Updated month dropdown to use formatted display

## Prevention

To prevent this in the future:
1. Always use date pickers for date entry (not manual text input)
2. Add database constraints to ensure year is reasonable (e.g., between 2000 and 2100)
3. Add frontend validation for date inputs

## Verification

After fixing, you should see:
- Month dropdown shows "January 2025", "February 2025", etc.
- No more "0049-12" or similar weird dates
- All transactions appear in the correct month

## Need Help?

If you're unsure which dates to fix, share the output of Step 1 from `FIX_BAD_DATES.sql` and I can help identify the correct dates.
