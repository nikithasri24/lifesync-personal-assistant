-- Debug script to check planned_meals data and RLS policies
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if RLS is enabled on planned_meals
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'planned_meals';

-- 2. Check RLS policies for planned_meals
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'planned_meals'
ORDER BY policyname;

-- 3. Count total planned_meals (bypassing RLS as admin)
SELECT COUNT(*) as total_planned_meals
FROM planned_meals;

-- 4. Show all planned_meals with their meal_plan info (bypassing RLS as admin)
SELECT 
  pm.id,
  pm.meal_plan_id,
  pm.custom_meal,
  pm.recipe_id,
  pm.date,
  pm.meal_type,
  mp.user_id as meal_plan_user_id,
  mp.name as meal_plan_name
FROM planned_meals pm
LEFT JOIN meal_plans mp ON mp.id = pm.meal_plan_id
ORDER BY pm.created_at DESC
LIMIT 20;

-- 5. Check if there are any orphaned planned_meals (meals without a valid meal_plan)
SELECT 
  pm.id,
  pm.meal_plan_id,
  pm.custom_meal,
  pm.date
FROM planned_meals pm
WHERE NOT EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = pm.meal_plan_id
);

-- 6. Test RLS policy as current user
-- This simulates what the app sees
SELECT
  pm.id,
  pm.meal_plan_id,
  pm.custom_meal,
  pm.date,
  pm.meal_type
FROM planned_meals pm
WHERE EXISTS (
  SELECT 1 FROM meal_plans mp
  WHERE mp.id = pm.meal_plan_id
  AND mp.user_id = auth.uid()
)
LIMIT 10;

-- 7. Find broken meals (NULL custom_meal AND NULL recipe_id)
SELECT
  pm.id,
  pm.custom_meal,
  pm.recipe_id,
  pm.date,
  pm.meal_type,
  pm.status
FROM planned_meals pm
WHERE pm.custom_meal IS NULL AND pm.recipe_id IS NULL
ORDER BY pm.created_at DESC;

-- 8. DELETE broken meals (NULL custom_meal AND NULL recipe_id)
-- CAUTION: This will permanently delete these meals!
-- Uncomment the line below to execute the deletion:
-- DELETE FROM planned_meals WHERE custom_meal IS NULL AND recipe_id IS NULL;

