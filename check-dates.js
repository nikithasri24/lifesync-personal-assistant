#!/usr/bin/env node

/**
 * Check all transaction dates to find the issue
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

async function checkDates() {
  console.log('🔍 Fetching all transaction dates...\n');

  const { data: transactions, error } = await supabase
    .from('finance_transactions')
    .select('id, date, description, amount')
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching transactions:', error);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log('No transactions found.');
    return;
  }

  console.log(`Found ${transactions.length} transaction(s)\n`);

  // Group by month
  const monthsMap = new Map();

  transactions.forEach(txn => {
    const dateObj = new Date(txn.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 0-indexed
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, []);
    }
    monthsMap.get(monthKey).push(txn);
  });

  console.log('📅 Transactions by month:\n');

  const sortedMonths = Array.from(monthsMap.keys()).sort();

  sortedMonths.forEach(monthKey => {
    const txns = monthsMap.get(monthKey);
    console.log(`${monthKey}: ${txns.length} transaction(s)`);

    // Show first transaction as example
    if (txns.length > 0) {
      const example = txns[0];
      console.log(`  Example: ${example.description} - ${example.date}`);
    }
    console.log('');
  });

  // Check for suspicious years
  const suspiciousYears = sortedMonths.filter(m => {
    const year = parseInt(m.split('-')[0]);
    return year < 2000 || year > 2030;
  });

  if (suspiciousYears.length > 0) {
    console.log('⚠️  Found suspicious years:');
    suspiciousYears.forEach(m => {
      const txns = monthsMap.get(m);
      console.log(`\n${m}:`);
      txns.forEach(txn => {
        console.log(`  - ${txn.id}: ${txn.description} (${txn.date})`);
      });
    });
  } else {
    console.log('✅ All years look reasonable (2000-2030)');
  }
}

checkDates().catch(console.error);
