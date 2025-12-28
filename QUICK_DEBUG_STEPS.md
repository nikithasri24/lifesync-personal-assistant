# 🔍 Quick Debug Steps - Meal Not Appearing

## ✅ Step 1: Check Browser Console (DO THIS FIRST!)

1. **Open your browser** where the app is running
2. **Press F12** → Click "Console" tab
3. **Clear the console** (click the 🚫 icon)
4. **Try adding a meal:**
   - Click "+ Add breakfast (default)"
   - Type "Test Meal"
   - Press Enter
5. **Look for these messages:**

### ✅ **Expected (Good) Messages:**
```
[AddMeal] Creating meal: {planId: "...", date: ..., mealType: "breakfast", customMeal: "Test Meal"}
[AddMeal] Meal created successfully!
```

### ❌ **Error Messages (Bad):**

**If you see:**
```
[AddMeal] No active plan found!
```
→ **Problem:** No meal plan exists for this week
→ **Fix:** See Step 2 below

**If you see:**
```
[AddMeal] Failed to create meal: Error: permission denied for table planned_meals
```
→ **Problem:** RLS policies are blocking access
→ **Fix:** See Step 3 below

**If you see:**
```
[AddMeal] Failed to create meal: Error: Meal plan not found or access denied
```
→ **Problem:** Meal plan doesn't exist or doesn't belong to you
→ **Fix:** See Step 2 below

---

## 🔧 Step 2: Create a Meal Plan Manually

If you see "No active plan found", create one manually:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql/new

2. **Get your user ID:**
   ```sql
   SELECT id, email FROM auth.users LIMIT 5;
   ```
   Copy your user ID (looks like: `12345678-1234-1234-1234-123456789012`)

3. **Create a meal plan for this week:**
   ```sql
   -- Replace YOUR_USER_ID with your actual ID from step 2
   INSERT INTO meal_plans (user_id, name, week_start_date, meal_columns)
   VALUES (
     'YOUR_USER_ID',
     'This Week',
     '2025-12-22',  -- Adjust to your current week's Monday
     '[
       {"id":"breakfast","name":"Breakfast","defaultServings":2,"defaultPeopleCount":2,"color":"#fbbf24","order":0},
       {"id":"lunch","name":"Lunch","defaultServings":2,"defaultPeopleCount":2,"color":"#34d399","order":1},
       {"id":"dinner","name":"Dinner","defaultServings":4,"defaultPeopleCount":4,"color":"#60a5fa","order":2},
       {"id":"snack","name":"Snack","defaultServings":1,"defaultPeopleCount":1,"color":"#a78bfa","order":3}
     ]'::jsonb
   )
   RETURNING *;
   ```

4. **Refresh your app** and try adding a meal again

---

## 🔐 Step 3: Fix RLS Policies

If you see "permission denied", apply RLS policies:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql/new

2. **Copy and paste this SQL:**
   ```sql
   -- Enable RLS
   ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
   ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

   -- Drop old policies
   DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
   DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
   DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
   DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;

   DROP POLICY IF EXISTS "Users can view own planned meals" ON planned_meals;
   DROP POLICY IF EXISTS "Users can insert own planned meals" ON planned_meals;
   DROP POLICY IF EXISTS "Users can update own planned meals" ON planned_meals;
   DROP POLICY IF EXISTS "Users can delete own planned meals" ON planned_meals;

   -- Create meal_plans policies
   CREATE POLICY "Users can view own meal plans"
     ON meal_plans FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own meal plans"
     ON meal_plans FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own meal plans"
     ON meal_plans FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own meal plans"
     ON meal_plans FOR DELETE
     USING (auth.uid() = user_id);

   -- Create planned_meals policies
   CREATE POLICY "Users can view own planned meals"
     ON planned_meals FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM meal_plans
         WHERE meal_plans.id = planned_meals.meal_plan_id
         AND meal_plans.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can insert own planned meals"
     ON planned_meals FOR INSERT
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM meal_plans
         WHERE meal_plans.id = planned_meals.meal_plan_id
         AND meal_plans.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can update own planned meals"
     ON planned_meals FOR UPDATE
     USING (
       EXISTS (
         SELECT 1 FROM meal_plans
         WHERE meal_plans.id = planned_meals.meal_plan_id
         AND meal_plans.user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can delete own planned meals"
     ON planned_meals FOR DELETE
     USING (
       EXISTS (
         SELECT 1 FROM meal_plans
         WHERE meal_plans.id = planned_meals.meal_plan_id
         AND meal_plans.user_id = auth.uid()
       )
     );
   ```

3. **Click "Run"**

4. **Refresh your app** and try again

---

## 📊 Step 4: Verify Data Was Created

After adding a meal, check if it was saved:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/editor

2. **Click "planned_meals" table**

3. **Look for your meal** (should show "Test Meal" in custom_meal column)

4. **If you see it:** The meal was created but not showing in UI (React Query cache issue)
   - Try refreshing the page (Cmd+R)

5. **If you don't see it:** The creation failed (check console errors)

---

## 🎯 Summary

**Most likely issues:**
1. ❌ **No meal plan exists** → Create one (Step 2)
2. ❌ **RLS policies missing** → Apply them (Step 3)
3. ❌ **React Query cache not updating** → Refresh page

**After each fix, try adding a meal again and check the console!**

---

## 📝 What to Share With Me

After trying these steps, tell me:
1. ✅ What console messages you see
2. ✅ Which step fixed it (or if it's still broken)
3. ✅ Any error messages from Supabase SQL Editor

