# 🍽️ Fix Meal Planning Table Not Populating

## Problem
The meal planning table isn't being populated because the required database tables (`meal_plans`, `planned_meals`, `recipes`, `recipe_ingredients`) don't exist in your Supabase database.

## Root Cause
The meal planning table migrations were in the `migrations_archive` folder but were never applied to the active database.

## Solution
Apply the migration file to create the required tables.

---

## 📋 Quick Fix (Recommended)

### Option 1: Apply via Supabase Dashboard (Easiest)

1. **Open the migration file:**
   - File: `supabase/migrations/APPLY_THIS_20251226_meal_planning_tables.sql`

2. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor** (left sidebar)

3. **Run the migration:**
   - Click **"New Query"**
   - Copy the **entire contents** of `APPLY_THIS_20251226_meal_planning_tables.sql`
   - Paste into the SQL editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)

4. **Verify success:**
   - You should see: "Success. No rows returned"
   - Go to **Table Editor** (left sidebar)
   - You should now see these tables:
     - ✅ `recipes`
     - ✅ `recipe_ingredients`
     - ✅ `meal_plans`
     - ✅ `planned_meals`

5. **Refresh your app:**
   - Go back to your LifeSync app
   - Navigate to **Meal Planning** page
   - The table should now work! 🎉

---

### Option 2: Apply via Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're logged in
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

---

## 🔍 What This Migration Creates

### Tables Created:

1. **`recipes`** - Stores recipe information
   - Name, description, cuisine, difficulty
   - Prep time, cook time, servings
   - Instructions, ingredients (JSONB)
   - Tags, favorites, dietary restrictions
   - Source info (URL, YouTube, etc.)

2. **`recipe_ingredients`** - Stores individual ingredients
   - Linked to recipes
   - Quantity, unit, category
   - Optional flag

3. **`meal_plans`** - Stores weekly meal plans
   - Week start date
   - Meal column configuration
   - Shopping list status
   - Notes

4. **`planned_meals`** - Stores individual planned meals
   - Linked to meal plans and recipes
   - Date, meal type (breakfast/lunch/dinner/snack)
   - Servings, people count
   - Status (planned/prepped/cooked/eaten)
   - Tracking timestamps

### Security (RLS Policies):

All tables have Row Level Security (RLS) enabled with policies that ensure:
- ✅ Users can only see their own data
- ✅ Users can only create/update/delete their own data
- ✅ Recipe ingredients inherit permissions from recipes
- ✅ Planned meals inherit permissions from meal plans

---

## 🧪 Testing After Migration

1. **Go to Meal Planning page**
2. **Try adding a recipe:**
   - Click "Add Recipe"
   - Fill in recipe details
   - Save

3. **Try planning a meal:**
   - Click on a day/meal slot in the weekly grid
   - Select or create a meal
   - It should appear in the table!

4. **Check the data:**
   - Go to Supabase Dashboard → Table Editor
   - View `recipes` table - should have your recipe
   - View `meal_plans` table - should have a plan for current week
   - View `planned_meals` table - should have your planned meal

---

## ❓ Troubleshooting

### Issue: "relation 'recipes' does not exist"
**Solution:** The migration wasn't applied. Follow Option 1 above.

### Issue: "permission denied for table recipes"
**Solution:** RLS policies weren't created. Make sure you ran the ENTIRE migration file.

### Issue: "duplicate key value violates unique constraint"
**Solution:** Tables already exist. Check if they have data:
```sql
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM meal_plans;
SELECT COUNT(*) FROM planned_meals;
```

### Issue: Still not seeing meals in the table
**Solution:** 
1. Check browser console for errors (F12 → Console)
2. Check Network tab for failed API calls
3. Verify you're logged in
4. Try creating a new meal plan for the current week

---

## 📝 Files Created

- ✅ `supabase/migrations/20251226000010_create_meal_planning_tables.sql`
- ✅ `supabase/migrations/20251226000011_meal_planning_rls_policies.sql`
- ✅ `supabase/migrations/APPLY_THIS_20251226_meal_planning_tables.sql` (Combined)
- ✅ `scripts/apply-meal-planning-migrations.js` (Alternative script)
- ✅ `FIX_MEAL_PLANNING_README.md` (This file)

---

## 🎯 Next Steps

After applying the migration:

1. ✅ Meal planning table should populate
2. ✅ You can add recipes
3. ✅ You can plan meals for the week
4. ✅ You can generate shopping lists
5. ✅ You can track meal status (planned → prepped → cooked → eaten)

---

## 🚀 Summary

**Problem:** Meal planning table not populating  
**Cause:** Missing database tables  
**Fix:** Apply migration via Supabase Dashboard  
**Time:** ~2 minutes  
**Result:** Fully functional meal planning! 🎉

