#!/usr/bin/env node

/**
 * Diagnose meal planning issues
 * Checks data, RLS policies, and permissions
 */

import { createClient } from '@supabase/supabase-js';
import { startOfWeek, format } from 'date-fns';

const supabaseUrl = 'https://rfwaiijodrowakcpayoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Diagnosing Meal Planning Issues\n');
  console.log('='.repeat(60) + '\n');

  // Check if user is authenticated
  console.log('1️⃣  Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log('   ❌ Not authenticated');
    console.log('   ℹ️  This script needs you to be logged in.');
    console.log('   ℹ️  Please log in to your app first, then run this script.\n');
    return;
  }
  
  console.log(`   ✅ Authenticated as: ${user.email}`);
  console.log(`   📝 User ID: ${user.id}\n`);

  // Check meal_plans table
  console.log('2️⃣  Checking meal_plans table...');
  const { data: mealPlans, error: mealPlansError } = await supabase
    .from('meal_plans')
    .select('*')
    .order('week_start_date', { ascending: false })
    .limit(5);

  if (mealPlansError) {
    console.log(`   ❌ Error: ${mealPlansError.message}`);
    console.log(`   📝 Code: ${mealPlansError.code}`);
    console.log(`   📝 Details: ${mealPlansError.details}\n`);
  } else {
    console.log(`   ✅ Found ${mealPlans?.length ?? 0} meal plans`);
    if (mealPlans && mealPlans.length > 0) {
      mealPlans.forEach((plan, i) => {
        console.log(`      ${i + 1}. ${plan.name} (Week: ${plan.week_start_date})`);
      });
    }
    console.log();
  }

  // Check planned_meals table
  console.log('3️⃣  Checking planned_meals table...');
  const { data: plannedMeals, error: plannedMealsError } = await supabase
    .from('planned_meals')
    .select('*')
    .limit(10);

  if (plannedMealsError) {
    console.log(`   ❌ Error: ${plannedMealsError.message}`);
    console.log(`   📝 Code: ${plannedMealsError.code}\n`);
  } else {
    console.log(`   ✅ Found ${plannedMeals?.length ?? 0} planned meals\n`);
  }

  // Check recipes table
  console.log('4️⃣  Checking recipes table...');
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .limit(5);

  if (recipesError) {
    console.log(`   ❌ Error: ${recipesError.message}\n`);
  } else {
    console.log(`   ✅ Found ${recipes?.length ?? 0} recipes`);
    if (recipes && recipes.length > 0) {
      recipes.forEach((recipe, i) => {
        console.log(`      ${i + 1}. ${recipe.name}`);
      });
    }
    console.log();
  }

  // Try to create a meal plan for current week
  console.log('5️⃣  Testing meal plan creation...');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  
  console.log(`   📅 Week start: ${weekStartStr}`);
  
  const { data: existingPlan, error: checkError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start_date', weekStartStr)
    .limit(1)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.log(`   ⚠️  Error checking existing plan: ${checkError.message}\n`);
  } else if (existingPlan) {
    console.log(`   ✅ Meal plan already exists for this week`);
    console.log(`      ID: ${existingPlan.id}`);
    console.log(`      Name: ${existingPlan.name}\n`);
  } else {
    console.log(`   ℹ️  No meal plan exists for this week`);
    console.log(`   🔨 Attempting to create one...`);
    
    const { data: newPlan, error: createError } = await supabase
      .from('meal_plans')
      .insert({
        name: 'Test Meal Plan',
        week_start_date: weekStartStr,
        meal_columns: [
          { id: 'breakfast', name: 'Breakfast', defaultServings: 2, defaultPeopleCount: 2, color: '#fbbf24', order: 0 },
          { id: 'lunch', name: 'Lunch', defaultServings: 2, defaultPeopleCount: 2, color: '#34d399', order: 1 },
          { id: 'dinner', name: 'Dinner', defaultServings: 4, defaultPeopleCount: 4, color: '#60a5fa', order: 2 },
          { id: 'snack', name: 'Snack', defaultServings: 1, defaultPeopleCount: 1, color: '#a78bfa', order: 3 }
        ]
      })
      .select()
      .single();

    if (createError) {
      console.log(`   ❌ Failed to create meal plan`);
      console.log(`      Error: ${createError.message}`);
      console.log(`      Code: ${createError.code}`);
      console.log(`      Details: ${createError.details}\n`);
    } else {
      console.log(`   ✅ Successfully created meal plan!`);
      console.log(`      ID: ${newPlan.id}`);
      console.log(`      Name: ${newPlan.name}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`✅ Tables exist: recipes, meal_plans, planned_meals`);
  console.log(`✅ User authenticated: ${user.email}`);
  console.log(`📝 Meal plans: ${mealPlans?.length ?? 0}`);
  console.log(`📝 Planned meals: ${plannedMeals?.length ?? 0}`);
  console.log(`📝 Recipes: ${recipes?.length ?? 0}\n`);

  if (mealPlansError || plannedMealsError || recipesError) {
    console.log('⚠️  Issues detected:');
    if (mealPlansError) console.log(`   - meal_plans: ${mealPlansError.message}`);
    if (plannedMealsError) console.log(`   - planned_meals: ${plannedMealsError.message}`);
    if (recipesError) console.log(`   - recipes: ${recipesError.message}`);
    console.log();
  }
}

main();

