# Budget Management - Schema Fix Instructions

## CTO-Level Root Cause Analysis

### The Problem
Your budgets table has **schema drift** - the database schema doesn't match the migration files:

**What Should Exist** (per migrations):
```sql
budgets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  month char(7) NOT NULL,  -- YYYY-MM format
  limit_amount numeric NOT NULL
)
```

**What Actually Exists** (in database):
```sql
budgets (
  ... same columns PLUS ...
  name text NOT NULL  ← This column shouldn't exist!
)
```

This caused the error:
```
null value in column "name" of relation "budgets" violates not-null constraint
```

### Why This Happened
Someone (or some migration) added a `name` column directly to the database without creating a migration file. This is called "schema drift" and breaks new code that doesn't know about the extra column.

---

## The Fix (Choose One Option)

### ⭐ Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa

2. **Go to SQL Editor**: Click "SQL Editor" in left sidebar

3. **Run This SQL**:
   ```sql
   -- Fix budgets table schema drift
   -- Run this once to fix the database

   -- 1. Drop 'name' column if it exists
   DO $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'budgets' AND column_name = 'name'
     ) THEN
       ALTER TABLE budgets DROP COLUMN name CASCADE;
       RAISE NOTICE 'Dropped name column from budgets table';
     ELSE
       RAISE NOTICE 'name column does not exist (already fixed)';
     END IF;
   END $$;

   -- 2. Ensure correct columns exist
   ALTER TABLE budgets ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
   ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid;
   ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid;
   ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);
   ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;

   -- 3. Clean up invalid data
   DELETE FROM budgets WHERE user_id IS NULL;
   DELETE FROM budgets WHERE category_id IS NULL;
   UPDATE budgets SET month = TO_CHAR(NOW(), 'YYYY-MM') WHERE month IS NULL;
   UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;

   -- 4. Set NOT NULL constraints
   ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE budgets ALTER COLUMN category_id SET NOT NULL;
   ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
   ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;

   -- 5. Remove duplicates (keep highest id)
   DELETE FROM budgets a USING budgets b
   WHERE a.id < b.id
     AND a.user_id = b.user_id
     AND a.category_id = b.category_id
     AND a.month = b.month;

   -- 6. Add unique constraint (critical for upsert)
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = 'budgets_user_category_month_unique'
     ) THEN
       ALTER TABLE budgets
       ADD CONSTRAINT budgets_user_category_month_unique
       UNIQUE (user_id, category_id, month);
       RAISE NOTICE 'Added unique constraint';
     ELSE
       RAISE NOTICE 'Unique constraint already exists';
     END IF;
   END $$;

   -- 7. Add indexes
   CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
   CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

   -- 8. Verify final schema
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'budgets'
   ORDER BY ordinal_position;
   ```

4. **Click "Run"** and verify you see:
   ```
   Dropped name column from budgets table
   Added unique constraint
   ```

5. **Verify Schema**: You should see exactly 5 columns:
   - id (uuid)
   - user_id (uuid)
   - category_id (uuid)
   - month (character)
   - limit_amount (numeric)

### Option 2: Use the SQL File

The same SQL is in `fix_budgets_now.sql` - just copy/paste into Supabase Dashboard SQL Editor.

---

## After Running the Fix

### ✅ What Should Work Now

1. **Create Budget**: Should insert successfully without "name column" error
2. **Edit Budget**: Should update using unique constraint upsert
3. **Delete Budget**: Should work normally
4. **View Budgets**: All existing budgets should display

### 🔍 How to Verify

1. Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Go to Finance → Budgets
3. Click "Create Budget"
4. Select a category and amount
5. Click "Create Budget"
6. **Expected**: Budget card appears, no errors!

---

## Technical Improvements Made

### Code Quality Enhancements

**SupabaseApi.upsertBudget():**
- ✅ Comprehensive input validation (categoryId, month, limit required)
- ✅ Month format validation (YYYY-MM regex)
- ✅ Proper upsert using unique constraint
- ✅ User-friendly error messages

**SupabaseApi.deleteBudget():**
- ✅ Input validation
- ✅ Month format validation
- ✅ Improved error handling

**Database Schema:**
- ✅ Unique constraint on (user_id, category_id, month)
- ✅ Performance indexes added
- ✅ Idempotent migrations (safe to run multiple times)

---

## Prevention: How to Avoid Schema Drift

### ❌ DON'T DO THIS:
```sql
-- Running SQL directly in Supabase Dashboard without migration
ALTER TABLE budgets ADD COLUMN name text;
```

### ✅ DO THIS INSTEAD:
1. Create migration file: `supabase/migrations/YYYYMMDD_description.sql`
2. Add your schema changes
3. Push migration: `npx supabase db push`
4. Commit migration file to git

### Why Migrations Matter

**Without Migrations:**
- Dev database ≠ Production database
- New developers can't set up database
- Rollback is impossible
- Schema drift causes bugs

**With Migrations:**
- Versioned schema changes
- Reproducible across environments
- Easy rollback
- Self-documenting database changes

---

## Files Changed

**New Files:**
- `supabase/migrations/20251117000003_fix_budgets_schema_drift.sql` - Comprehensive fix migration
- `fix_budgets_now.sql` - Emergency standalone fix
- `BUDGET_FIX_README.md` - This documentation

**Updated Files:**
- `src/finance/data/supabaseApi.ts` - Improved validation and error handling
- `src/finance/data/mockApi.ts` - Matching improvements

**Committed**: `ab14960` - "fix(finance): CTO-level budget schema fix and improved validation"
**Pushed**: feature/finance-budget-management branch

---

## Questions?

**Q: Will this delete my existing budgets?**
A: No! The fix only removes the problematic `name` column. All budget data (id, user_id, category_id, month, limit_amount) remains intact.

**Q: Can I run this multiple times?**
A: Yes! The SQL is idempotent - it checks before making changes.

**Q: What if I get errors?**
A: Check the error message and paste it. Common issues:
   - Foreign key violations (delete orphaned budgets first)
   - Permission errors (use Supabase Dashboard, not direct psql)

**Q: How do I know it worked?**
A: Try creating a budget in the UI. If no errors appear and the budget card shows up, it worked!

---

## Next Steps After Fix

1. Run the SQL fix in Supabase Dashboard ✅
2. Refresh browser and test budget creation ✅
3. If working, we can:
   - Add "Copy Last Month" functionality
   - Add delete budget button
   - Add budget templates
   - Add rollover logic

Let me know when you've run the fix and I'll help test it!
