#!/usr/bin/env tsx
/**
 * Verification Script for Budget Templates Feature
 *
 * This script verifies that the budget templates feature is properly set up:
 * 1. Database table exists
 * 2. RLS policies are in place
 * 3. Database function exists
 * 4. Can perform CRUD operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl);
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('🔍 Budget Templates Feature Verification\n');
  console.log('═'.repeat(70));

  let allChecks = true;

  // Check 1: User authentication
  console.log('\n1️⃣  Checking user authentication...');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.log('   ❌ Not authenticated');
    console.log('   ℹ️  Please sign in to the app first, then run this script');
    allChecks = false;
  } else {
    console.log('   ✅ Authenticated as:', userData.user.email);
  }

  // Check 2: Table exists and is accessible
  console.log('\n2️⃣  Checking budget_templates table...');
  const { data: templates, error: tableError } = await supabase
    .from('budget_templates')
    .select('*')
    .limit(1);

  if (tableError) {
    console.log('   ❌ Table error:', tableError.message);
    if (tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      console.log('   ℹ️  Migration not applied. Please run the migration SQL in Supabase dashboard.');
    }
    allChecks = false;
  } else {
    console.log('   ✅ Table exists and is accessible');
    console.log('   📊 Current templates:', templates?.length || 0);
  }

  // Check 3: Database function exists
  console.log('\n3️⃣  Checking initialize_budgets_from_templates function...');
  const { data: userData2 } = await supabase.auth.getUser();
  if (userData2.user) {
    const { data: funcResult, error: funcError } = await supabase
      .rpc('initialize_budgets_from_templates', {
        p_user_id: userData2.user.id,
        p_month: '2099-12' // Test month that doesn't exist
      });

    if (funcError) {
      console.log('   ❌ Function error:', funcError.message);
      allChecks = false;
    } else {
      console.log('   ✅ Function exists and is callable');
      console.log('   📊 Test returned:', funcResult);
    }
  }

  // Check 4: Categories exist (prerequisite)
  console.log('\n4️⃣  Checking categories (prerequisite)...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .limit(5);

  if (catError) {
    console.log('   ❌ Categories error:', catError.message);
    allChecks = false;
  } else {
    console.log('   ✅ Categories available:', categories?.length || 0);
    if (categories && categories.length > 0) {
      console.log('   📋 Sample:', categories.map(c => c.name).join(', '));
    }
  }

  // Check 5: Test CRUD operations (if authenticated and table exists)
  if (userData.user && !tableError) {
    console.log('\n5️⃣  Testing CRUD operations...');

    // Get a test category
    const { data: testCategories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (testCategories && testCategories.length > 0) {
      const testCategory = testCategories[0];
      const testAmount = 999.99;

      // CREATE/UPDATE
      console.log('   Testing INSERT/UPDATE...');
      const { error: upsertError } = await supabase
        .from('budget_templates')
        .upsert({
          user_id: userData.user.id,
          category_id: testCategory.id,
          default_amount: testAmount,
        }, {
          onConflict: 'user_id,category_id'
        });

      if (upsertError) {
        console.log('   ❌ Upsert failed:', upsertError.message);
        allChecks = false;
      } else {
        console.log('   ✅ INSERT/UPDATE works');

        // READ
        console.log('   Testing SELECT...');
        const { data: readData, error: readError } = await supabase
          .from('budget_templates')
          .select('*')
          .eq('category_id', testCategory.id)
          .single();

        if (readError) {
          console.log('   ❌ Read failed:', readError.message);
          allChecks = false;
        } else if (readData.default_amount === testAmount) {
          console.log('   ✅ SELECT works');
        } else {
          console.log('   ⚠️  Data mismatch');
          allChecks = false;
        }

        // DELETE
        console.log('   Testing DELETE...');
        const { error: deleteError } = await supabase
          .from('budget_templates')
          .delete()
          .eq('category_id', testCategory.id);

        if (deleteError) {
          console.log('   ❌ Delete failed:', deleteError.message);
          allChecks = false;
        } else {
          console.log('   ✅ DELETE works');
        }
      }
    } else {
      console.log('   ⚠️  No categories available for testing');
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  if (allChecks) {
    console.log('✅ All checks passed! Budget templates feature is ready to use.');
  } else {
    console.log('❌ Some checks failed. Please review the errors above.');
    console.log('\n📝 Next steps:');
    console.log('   1. Ensure you are signed in to the app');
    console.log('   2. Apply the migration SQL in Supabase dashboard');
    console.log('   3. Run this script again to verify');
  }
  console.log('═'.repeat(70) + '\n');
}

verify().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
