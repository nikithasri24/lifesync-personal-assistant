# Meal Planning Database Setup

This guide explains how to set up the meal planning feature database tables and RLS policies.

## Quick Start

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `20260106000001_meal_planning_complete.sql`
4. Click **Run**

## What Gets Created

### Tables

| Table | Description |
|-------|-------------|
| `recipes` | User's saved recipes with ingredients, instructions, and metadata |
| `recipe_ingredients` | Normalized ingredients for recipes (optional, recipes can use JSONB) |
| `meal_plans` | Weekly meal plans with configuration |
| `planned_meals` | Individual meals scheduled within a meal plan |
| `pantry_items` | User's pantry inventory for ingredient tracking |

### RLS Policies

All tables have Row Level Security enabled with the following policies:

- **Users can view own [items]** - SELECT policy
- **Users can insert own [items]** - INSERT policy  
- **Users can update own [items]** - UPDATE policy
- **Users can delete own [items]** - DELETE policy

### Relationship-Based RLS

For `planned_meals` and `recipe_ingredients`, access is controlled through their parent tables:
- `planned_meals` → checks ownership via `meal_plans.user_id`
- `recipe_ingredients` → checks ownership via `recipes.user_id`

This ensures users can only access child records if they own the parent record.

## Verification

After running the migration, verify setup with these queries:

```sql
-- Check tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals', 'pantry_items');

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals', 'pantry_items');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals', 'pantry_items');
```

## Testing RLS

To test that RLS is working correctly:

1. **Create a test user** and sign in
2. **Create a recipe** - should succeed
3. **Query recipes** - should only see your own
4. **Try to access another user's recipe** - should fail silently (return empty)

```sql
-- As authenticated user, this should only return your recipes
SELECT * FROM recipes;

-- This should fail (RLS prevents access)
SELECT * FROM recipes WHERE user_id = 'other-user-uuid';
```

## Troubleshooting

### Tables already exist
If you get "relation already exists" errors, the tables were created by a previous migration. You can:
- Skip to just running the RLS policies section
- Or use `CREATE TABLE IF NOT EXISTS` (already used in the migration)

### RLS blocking all access
If you can't access any data:
1. Check you're authenticated with `auth.uid()`
2. Verify the `user_id` column matches your auth user ID
3. Check policies with `SELECT * FROM pg_policies WHERE tablename = 'your_table'`

### Performance issues
If queries are slow:
1. Check indexes are created (the migration includes them)
2. Consider adding more specific indexes for your query patterns

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (React)                           │
│   MealPlanning.tsx → useMealPlanningQuery.ts                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer                                   │
│   src/api/mealPlanningAPI.ts                                    │
│   - getMealPlans(), getRecipes(), getPantryItems()              │
│   - createMealPlan(), createRecipe(), createPantryItem()        │
│   - updatePlannedMeal(), deleteRecipe(), etc.                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                            │
│   Tables: recipes, recipe_ingredients, meal_plans,              │
│           planned_meals, pantry_items                           │
│   RLS: All tables protected by user_id policies                 │
└─────────────────────────────────────────────────────────────────┘
```

## Related Files

- `src/api/mealPlanningAPI.ts` - API layer functions
- `src/hooks/useMealPlanningQuery.ts` - React Query hooks
- `src/pages/MealPlanning.tsx` - Main UI page
- `src/mealPlanning/` - Components, hooks, and utilities

