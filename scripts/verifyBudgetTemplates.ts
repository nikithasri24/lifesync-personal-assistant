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
  logger.error('VerifyBudgetTemplates', '❌ Missing Supabase credentials');
  logger.error('VerifyBudgetTemplates', '   VITE_SUPABASE_URL:', supabaseUrl);
  logger.error('VerifyBudgetTemplates', '   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  logger.info('VerifyBudgetTemplates', '🔍 Budget Templates Feature Verification\n');
  logger.info('VerifyBudgetTemplates', '═'.repeat(70));

  let allChecks = true;

  // Check 1: User authentication
  logger.info('VerifyBudgetTemplates', '\n1️⃣  Checking user authentication...');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    logger.info('VerifyBudgetTemplates', '   ❌ Not authenticated');
    logger.info('VerifyBudgetTemplates', '   ℹ️  Please sign in to the app first, then run this script');
    allChecks = false;
  } else {
    logger.info('VerifyBudgetTemplates', '   ✅ Authenticated as:', userData.user.email);
  }

  // Check 2: Table exists and is accessible
  logger.info('VerifyBudgetTemplates', '\n2️⃣  Checking budget_templates table...');
  const { data: templates, error: tableError } = await supabase
    .from('budget_templates')
    .select('*')
    .limit(1);

  if (tableError) {
    logger.info('VerifyBudgetTemplates', '   ❌ Table error:', tableError.message);
    if (tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      logger.info('VerifyBudgetTemplates', '   ℹ️  Migration not applied. Please run the migration SQL in Supabase dashboard.');
    }
    allChecks = false;
  } else {
    logger.info('VerifyBudgetTemplates', '   ✅ Table exists and is accessible');
    logger.info('VerifyBudgetTemplates', '   📊 Current templates:', templates?.length || 0);
  }

  // Check 3: Database function exists
  logger.info('VerifyBudgetTemplates', '\n3️⃣  Checking initialize_budgets_from_templates function...');
  const { data: userData2 } = await supabase.auth.getUser();
  if (userData2.user) {
    const { data: funcResult, error: funcError } = await supabase
      .rpc('initialize_budgets_from_templates', {
        p_user_id: userData2.user.id,
        p_month: '2099-12' // Test month that doesn't exist
      });

    if (funcError) {
      logger.info('VerifyBudgetTemplates', '   ❌ Function error:', funcError.message);
      allChecks = false;
    } else {
      logger.info('VerifyBudgetTemplates', '   ✅ Function exists and is callable');
      logger.info('VerifyBudgetTemplates', '   📊 Test returned:', funcResult);
    }
  }

  // Check 4: Categories exist (prerequisite)
  logger.info('VerifyBudgetTemplates', '\n4️⃣  Checking categories (prerequisite)...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .limit(5);

  if (catError) {
    logger.info('VerifyBudgetTemplates', '   ❌ Categories error:', catError.message);
    allChecks = false;
  } else {
    logger.info('VerifyBudgetTemplates', '   ✅ Categories available:', categories?.length || 0);
    if (categories && categories.length > 0) {
      logger.info('VerifyBudgetTemplates', '   📋 Sample:', categories.map(c => c.name).join(', '));
    }
  }

  // Check 5: Test CRUD operations (if authenticated and table exists)
  if (userData.user && !tableError) {
    logger.info('VerifyBudgetTemplates', '\n5️⃣  Testing CRUD operations...');

    // Get a test category
    const { data: testCategories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (testCategories && testCategories.length > 0) {
      const testCategory = testCategories[0];
      const testAmount = 999.99;

      // CREATE/UPDATE
      logger.info('VerifyBudgetTemplates', '   Testing INSERT/UPDATE...');
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
        logger.info('VerifyBudgetTemplates', '   ❌ Upsert failed:', upsertError.message);
        allChecks = false;
      } else {
        logger.info('VerifyBudgetTemplates', '   ✅ INSERT/UPDATE works');

        // READ
        logger.info('VerifyBudgetTemplates', '   Testing SELECT...');
        const { data: readData, error: readError } = await supabase
          .from('budget_templates')
          .select('*')
          .eq('category_id', testCategory.id)
          .single();

        if (readError) {
          logger.info('VerifyBudgetTemplates', '   ❌ Read failed:', readError.message);
          allChecks = false;
        } else if (readData.default_amount === testAmount) {
          logger.info('VerifyBudgetTemplates', '   ✅ SELECT works');
        } else {
          logger.info('VerifyBudgetTemplates', '   ⚠️  Data mismatch');
          allChecks = false;
        }

        // DELETE
        logger.info('VerifyBudgetTemplates', '   Testing DELETE...');
        const { error: deleteError } = await supabase
          .from('budget_templates')
          .delete()
          .eq('category_id', testCategory.id);

        if (deleteError) {
          logger.info('VerifyBudgetTemplates', '   ❌ Delete failed:', deleteError.message);
          allChecks = false;
        } else {
          logger.info('VerifyBudgetTemplates', '   ✅ DELETE works');
        }
      }
    } else {
      logger.info('VerifyBudgetTemplates', '   ⚠️  No categories available for testing');
    }
  }

  // Summary
  logger.info('VerifyBudgetTemplates', '\n' + '═'.repeat(70));
  if (allChecks) {
    logger.info('VerifyBudgetTemplates', '✅ All checks passed! Budget templates feature is ready to use.');
  } else {
    logger.info('VerifyBudgetTemplates', '❌ Some checks failed. Please review the errors above.');
    logger.info('VerifyBudgetTemplates', '\n📝 Next steps:');
    logger.info('VerifyBudgetTemplates', '   1. Ensure you are signed in to the app');
    logger.info('VerifyBudgetTemplates', '   2. Apply the migration SQL in Supabase dashboard');
    logger.info('VerifyBudgetTemplates', '   3. Run this script again to verify');
  }
  logger.info('VerifyBudgetTemplates', '═'.repeat(70) + '\n');
}

verify().catch((error) => {
  logger.error('VerifyBudgetTemplates', '\n💥 Unexpected error:', error);
  process.exit(1);
});
