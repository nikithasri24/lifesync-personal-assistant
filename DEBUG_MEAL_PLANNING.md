# 🔍 Debug: Meal Planning Schedule Not Populating

## Problem
The meal planning schedule grid is empty and you can't populate it.

---

## 🧪 Step-by-Step Debugging

### **Step 1: Check Browser Console Errors**

1. **Open your app** in the browser
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Navigate to Meal Planning page**
5. **Look for RED errors**

**What to look for:**
- ❌ `relation "meal_plans" does not exist` → Table missing (but we verified it exists)
- ❌ `permission denied for table meal_plans` → **RLS ISSUE** ← Most likely!
- ❌ `new row violates row-level security policy` → **RLS ISSUE**
- ❌ `Failed to create meal plan` → Creation error
- ⚠️ `Cloud create failed; falling back to local-only plan` → Working offline mode

**→ Copy any errors you see and share them with me!**

---

### **Step 2: Check Network Requests**

1. **In DevTools, go to Network tab**
2. **Refresh the Meal Planning page**
3. **Look for requests to Supabase** (filter by "supabase")
4. **Click on the meal_plans request**
5. **Check the Response**

**What to look for:**
- ✅ Status 200 with data → Working!
- ❌ Status 403 → Permission denied (RLS issue)
- ❌ Status 500 → Server error
- ❌ Empty array `[]` → No data (need to create meal plan)

**→ Tell me what status code you see!**

---

### **Step 3: Check Database Directly**

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/editor

2. **Click on "meal_plans" table**

3. **Check if there are any rows:**
   - ✅ **Has rows** → RLS is blocking access
   - ❌ **No rows** → Need to create a meal plan

4. **If no rows, click "Insert row" and add:**
   ```
   user_id: [Your user ID - get from auth.users table]
   name: "Test Week"
   week_start_date: "2025-12-22"
   meal_columns: [{"id":"breakfast","name":"Breakfast","defaultServings":2,"defaultPeopleCount":2,"color":"#fbbf24","order":0},{"id":"lunch","name":"Lunch","defaultServings":2,"defaultPeopleCount":2,"color":"#34d399","order":1},{"id":"dinner","name":"Dinner","defaultServings":4,"defaultPeopleCount":4,"color":"#60a5fa","order":2},{"id":"snack","name":"Snack","defaultServings":1,"defaultPeopleCount":1,"color":"#a78bfa","order":3}]
   ```

5. **Refresh your app** and check if the grid populates

---

### **Step 4: Check RLS Policies**

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste this SQL:**
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('meal_plans', 'planned_meals', 'recipes');

   -- Check policies
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename IN ('meal_plans', 'planned_meals', 'recipes');
   ```

3. **Click Run**

**Expected results:**
- `meal_plans` should have `rowsecurity = true`
- Should have policies like:
  - `Users can view own meal plans` (SELECT)
  - `Users can insert own meal plans` (INSERT)
  - `Users can update own meal plans` (UPDATE)
  - `Users can delete own meal plans` (DELETE)

**→ If policies are missing, we need to add them!**

---

### **Step 5: Test Creating a Meal Plan Manually**

1. **Go to Supabase Dashboard → SQL Editor**
2. **First, get your user ID:**
   ```sql
   SELECT id, email FROM auth.users LIMIT 5;
   ```

3. **Copy your user ID, then run:**
   ```sql
   -- Replace YOUR_USER_ID with your actual ID
   INSERT INTO meal_plans (user_id, name, week_start_date, meal_columns)
   VALUES (
     'YOUR_USER_ID',
     'Test Week',
     '2025-12-22',
     '[
       {"id":"breakfast","name":"Breakfast","defaultServings":2,"defaultPeopleCount":2,"color":"#fbbf24","order":0},
       {"id":"lunch","name":"Lunch","defaultServings":2,"defaultPeopleCount":2,"color":"#34d399","order":1},
       {"id":"dinner","name":"Dinner","defaultServings":4,"defaultPeopleCount":4,"color":"#60a5fa","order":2},
       {"id":"snack","name":"Snack","defaultServings":1,"defaultPeopleCount":1,"color":"#a78bfa","order":3}
     ]'::jsonb
   );
   ```

4. **Verify it was created:**
   ```sql
   SELECT * FROM meal_plans ORDER BY created_at DESC LIMIT 1;
   ```

5. **Refresh your app** → Grid should populate!

---

## 🎯 Most Likely Issues

### **Issue 1: RLS Policies Missing or Incorrect**

**Symptoms:**
- Console error: `permission denied`
- Network request returns 403
- Can't read/write to tables

**Fix:**
Run this SQL in Supabase Dashboard:

```sql
-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;

-- Create new policies
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);
```

---

### **Issue 2: No Meal Plan Exists for Current Week**

**Symptoms:**
- No errors in console
- Network request returns empty array `[]`
- Grid is empty

**Fix:**
The app should auto-create a meal plan, but if it's not working, create one manually (see Step 5 above).

---

### **Issue 3: Frontend Not Creating Meal Plan**

**Symptoms:**
- Warning: `Cloud create failed; falling back to local-only plan`
- Grid shows data but doesn't persist

**Fix:**
Check the `useMealPlanForWeek` hook in the code - it might be failing silently.

---

## 📝 Quick Checklist

- [ ] Checked browser console for errors
- [ ] Checked Network tab for failed requests
- [ ] Checked if meal_plans table has data
- [ ] Checked if RLS policies exist
- [ ] Tried creating meal plan manually
- [ ] Refreshed app after creating data

---

## 🆘 Need Help?

**Share with me:**
1. ✅ Browser console errors (screenshot or copy-paste)
2. ✅ Network request status (200, 403, 500, etc.)
3. ✅ Whether meal_plans table has data
4. ✅ Whether RLS policies exist

Then I can provide the exact fix!

