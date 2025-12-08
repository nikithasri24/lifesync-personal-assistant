/**
 * Test Transaction Flow
 *
 * This script tests the complete transaction creation flow to identify issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testTransactionFlow() {
  console.log('🔍 Testing Transaction Flow...\n');

  // Step 1: Check Supabase connection
  console.log('Step 1: Checking Supabase connection...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ Failed to get user:', userError.message);
      console.log('💡 Make sure you are logged in to the app');
      return;
    }

    if (!userData.user) {
      console.error('❌ No user found - you need to be logged in');
      console.log('💡 Please log in to the app first');
      return;
    }

    const userId = userData.user.id;
    console.log('✅ User authenticated:', userId);
    console.log('');

    // Step 2: Check for accounts
    console.log('Step 2: Checking for accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, type')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('❌ Failed to fetch accounts:', accountsError.message);
      return;
    }

    if (!accounts || accounts.length === 0) {
      console.error('❌ No accounts found');
      console.log('💡 You need to create an account first in the Finance section');
      return;
    }

    console.log(`✅ Found ${accounts.length} account(s):`);
    accounts.forEach(acc => console.log(`   - ${acc.name} (${acc.type})`));
    console.log('');

    // Step 3: Try to create a test transaction
    console.log('Step 3: Creating test transaction...');
    const testTransaction = {
      user_id: userId,
      account_id: accounts[0].id,
      date: new Date().toISOString(),
      description: 'TEST TRANSACTION - Debug Script',
      amount: 10.50,
      type: 'debit',
      notes: 'This is a test transaction created by the debug script',
      merchant_name: 'TEST MERCHANT'
    };

    console.log('Transaction data:', JSON.stringify(testTransaction, null, 2));

    const { data: insertedTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert transaction:', insertError.message);
      console.error('Error details:', insertError);
      return;
    }

    console.log('✅ Transaction created successfully!');
    console.log('Transaction ID:', insertedTransaction.id);
    console.log('');

    // Step 4: Verify the transaction was saved
    console.log('Step 4: Verifying transaction in database...');
    const { data: verifyTransaction, error: verifyError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', insertedTransaction.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify transaction:', verifyError.message);
      return;
    }

    console.log('✅ Transaction verified in database!');
    console.log('Transaction details:', JSON.stringify(verifyTransaction, null, 2));
    console.log('');

    // Step 5: Check total transaction count
    console.log('Step 5: Checking total transactions for user...');
    const { data: allTransactions, error: countError } = await supabase
      .from('transactions')
      .select('id, description, amount, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (countError) {
      console.error('❌ Failed to count transactions:', countError.message);
      return;
    }

    console.log(`✅ Found ${allTransactions?.length || 0} recent transaction(s):`);
    allTransactions?.forEach(txn => {
      console.log(`   - ${txn.description}: $${txn.amount} on ${new Date(txn.date).toLocaleDateString()}`);
    });
    console.log('');

    console.log('✅ All tests passed! Transactions are being saved correctly.');
    console.log('');
    console.log('💡 If you still don\'t see transactions in the UI:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Make sure you\'re using the correct finance page');
    console.log('   3. Try refreshing the page');
    console.log('   4. Check the filters on the transactions page');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testTransactionFlow().catch(console.error);
