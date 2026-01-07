-- Check RLS policies for meal planning tables
-- Run this in Supabase Dashboard → SQL Editor

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals')
ORDER BY tablename;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals')
ORDER BY tablename, policyname;

-- Check if tables have data (count rows)
SELECT 'recipes' as table_name, COUNT(*) as row_count FROM recipes
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'meal_plans', COUNT(*) FROM meal_plans
UNION ALL
SELECT 'planned_meals', COUNT(*) FROM planned_meals;

-- Check current user
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- Try to select from meal_plans (will show if RLS is blocking)
SELECT 
  id,
  user_id,
  name,
  week_start_date,
  created_at
FROM meal_plans
ORDER BY created_at DESC
LIMIT 5;

