# Nutrition Goals 406 Error Fix Guide

## 🔍 Problem

You're seeing this error in the browser console:
```
GET https://rfwaiijodrowakcpayoa.supabase.co/rest/v1/nutrition_goals?select=*&user_id=eq.86a4967b... 406 (Not Acceptable)
```

**Root Cause**: Row Level Security (RLS) policies on the `nutrition_goals` table are either missing, misconfigured, or conflicting.

---

## ✅ Solution 1: Complete Fix via Supabase Dashboard (Recommended)

### Root Cause Update
The 406 error is caused by **TWO issues**:
1. **UNIQUE constraint** on `(user_id, is_active)` causing conflicts
2. **RLS policies** that may be missing or misconfigured

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `rfwaiijodrowakcpayoa`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Complete Fix Script
Copy and paste the contents of `scripts/fix-nutrition-complete.sql` into the SQL editor and click **Run**.

Or copy this directly:

```sql
-- Fix the UNIQUE constraint issue
ALTER TABLE nutrition_goals
DROP CONSTRAINT IF EXISTS nutrition_goals_user_id_is_active_key;

DROP INDEX IF EXISTS idx_nutrition_goals_active_unique;

CREATE UNIQUE INDEX idx_nutrition_goals_active_unique
ON nutrition_goals(user_id)
WHERE is_active = true;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can view own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own nutrition goals" ON nutrition_goals;

-- Ensure RLS is enabled
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view own nutrition goals"
  ON nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals"
  ON nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
  ON nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition goals"
  ON nutrition_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Test the fix
SELECT id, user_id, calories_target, is_active
FROM nutrition_goals
WHERE user_id = auth.uid() AND is_active = true;
```

### Step 3: Verify
Run this query to verify the policies were created:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'nutrition_goals';
```

You should see 4 policies:
- `Users can view own nutrition goals` (SELECT)
- `Users can insert own nutrition goals` (INSERT)
- `Users can update own nutrition goals` (UPDATE)
- `Users can delete own nutrition goals` (DELETE)

### Step 4: Test
Refresh your app and the 406 error should be gone!

---

## ✅ Solution 2: Temporary Workaround (Already Applied)

I've updated `src/api/nutritionAPI.ts` to gracefully handle RLS errors:
- The app will no longer crash when nutrition goals can't be fetched
- It will log a warning instead and return `null`
- The nutrition tracker will still work, just without saved goals

This is a **temporary fix** - you should still apply Solution 1 for the proper fix.

---

## 🔍 How to Check if RLS is the Issue

### Option 1: Check Browser Console
Look for errors like:
- `406 Not Acceptable`
- `new row violates row-level security policy`
- `permission denied for table nutrition_goals`

### Option 2: Check Supabase Logs
1. Go to Supabase Dashboard → Logs → API
2. Look for failed requests to `nutrition_goals`
3. Check the error message

---

## 📊 Understanding the Error

**406 Not Acceptable** from Supabase usually means:
1. **RLS is enabled** on the table (good for security)
2. **No policy allows the operation** (bad - blocks legitimate requests)
3. **Conflicting policies** exist (rare but possible)

The fix drops all old policies and creates fresh ones with the correct configuration.

---

## 🚀 After Fixing

Once the RLS policies are fixed, you should be able to:
- ✅ View your nutrition goals
- ✅ Create new nutrition goals
- ✅ Update existing goals
- ✅ Delete goals

The nutrition tracker will work properly with saved goals and targets.

---

## 🆘 If the Fix Doesn't Work

1. **Check if RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'nutrition_goals';
   ```
   Should show `rowsecurity = true`

2. **Check if the table exists**:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'nutrition_goals';
   ```

3. **Try disabling RLS temporarily** (NOT recommended for production):
   ```sql
   ALTER TABLE nutrition_goals DISABLE ROW LEVEL SECURITY;
   ```

4. **Check your user authentication**:
   - Make sure you're logged in
   - Check if `auth.uid()` returns your user ID

---

## 📝 Notes

- This fix is safe to run multiple times
- It won't delete any data, only policies
- The migration file is in `supabase/migrations/20251223000005_fix_nutrition_goals_policies.sql`
- The temporary workaround prevents app crashes but doesn't fix the root cause

