#!/usr/bin/env node

/**
 * Quick script to fix bad transaction dates
 * Fixes year 0049 -> 2025
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBadDates() {
  console.log('🔍 Checking for transactions with bad dates...\n');

  // First, check what we have
  const { data: badDates, error: checkError } = await supabase
    .from('finance_transactions')
    .select('id, date, description, amount')
    .lt('date', '2000-01-01')
    .order('date');

  if (checkError) {
    console.error('❌ Error checking dates:', checkError);
    return;
  }

  if (!badDates || badDates.length === 0) {
    console.log('✅ No bad dates found! All transactions have valid years.');
    return;
  }

  console.log(`Found ${badDates.length} transaction(s) with bad dates:\n`);
  badDates.forEach((txn, i) => {
    console.log(`${i + 1}. ID: ${txn.id}`);
    console.log(`   Date: ${txn.date}`);
    console.log(`   Description: ${txn.description}`);
    console.log(`   Amount: $${txn.amount}`);
    console.log('');
  });

  console.log('🔧 Fixing dates (year 0049 -> 2025)...\n');

  // Fix each transaction
  for (const txn of badDates) {
    const oldDate = new Date(txn.date);
    const year = oldDate.getFullYear();

    if (year === 49 || year === 50) {
      // Add years to get to 2025
      const yearsToAdd = 2025 - year;
      const newDate = new Date(oldDate);
      newDate.setFullYear(2025);

      const { error: updateError } = await supabase
        .from('finance_transactions')
        .update({ date: newDate.toISOString() })
        .eq('id', txn.id);

      if (updateError) {
        console.error(`❌ Error fixing transaction ${txn.id}:`, updateError);
      } else {
        console.log(`✅ Fixed: ${txn.description}`);
        console.log(`   Old date: ${oldDate.toISOString()}`);
        console.log(`   New date: ${newDate.toISOString()}\n`);
      }
    }
  }

  // Verify the fix
  const { data: remainingBad } = await supabase
    .from('finance_transactions')
    .select('id')
    .lt('date', '2000-01-01');

  if (remainingBad && remainingBad.length > 0) {
    console.log(`⚠️  Still ${remainingBad.length} transaction(s) with bad dates remaining.`);
  } else {
    console.log('✅ All bad dates fixed successfully!');
    console.log('\n🎉 Please refresh your Finance dashboard to see the corrected dates.');
  }
}

fixBadDates().catch(console.error);
