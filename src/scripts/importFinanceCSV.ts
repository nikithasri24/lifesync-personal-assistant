/**
 * Import Finance CSV Data
 *
 * Parses CSV files from user's finance tracker and imports them as transactions
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  categoryName: string;
}

/**
 * Parse CSV data from the finance tracker
 * Format: Category header rows, then item,amount pairs in columns
 */
function parseCSV(filePath: string, month: string): ParsedTransaction[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const transactions: ParsedTransaction[] = [];

  // Find the row with category headers (row 26 based on the pattern)
  const categoryRowIndex = 25; // 0-indexed, so row 26
  const categoryRow = lines[categoryRowIndex];

  if (!categoryRow) {
    console.error('Category row not found');
    return transactions;
  }

  const cells = categoryRow.split(',');

  // Extract category names and their column positions
  const categories: Array<{ name: string; itemCol: number; amountCol: number }> = [];

  for (let i = 0; i < cells.length - 1; i++) {
    const cell = cells[i]?.trim();
    if (cell && cell !== 'Total') {
      categories.push({
        name: cell,
        itemCol: i,
        amountCol: i + 1
      });
    }
  }

  console.log(`Found categories:`, categories.map(c => c.name));

  // Parse transactions starting from row after category headers
  for (let rowIndex = categoryRowIndex + 1; rowIndex < lines.length; rowIndex++) {
    const row = lines[rowIndex];
    if (!row || row.trim() === '') continue;

    const rowCells = row.split(',');

    // Process each category column pair
    for (const category of categories) {
      const description = rowCells[category.itemCol]?.trim();
      const amountStr = rowCells[category.amountCol]?.trim();

      if (description && amountStr) {
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          transactions.push({
            date: month,
            description,
            amount,
            categoryName: category.name
          });
        }
      }
    }
  }

  return transactions;
}

/**
 * Get or create category by name
 */
async function getOrCreateCategory(
  supabase: any,
  userId: string,
  categoryName: string
): Promise<string> {
  // Map CSV category names to our standard categories
  const categoryMapping: Record<string, string> = {
    'Utilities': 'Bills & Utilities',
    'Food': 'Food & Dining',
    'Miscellaneous': 'Shopping',
    'Shopping + Trips': 'Shopping',
    'Groceries': 'Groceries',
    'Groceries ': 'Groceries' // Handle trailing space
  };

  const mappedName = categoryMapping[categoryName] || categoryName;

  // Check if category exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', mappedName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new category
  const { data: newCat, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: mappedName
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create category ${mappedName}:`, error);
    throw error;
  }

  return newCat.id;
}

/**
 * Get user's default account ID
 */
async function getDefaultAccount(supabase: any, userId: string): Promise<string> {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!accounts || accounts.length === 0) {
    throw new Error('No account found. Please create an account first.');
  }

  return accounts[0].id;
}

/**
 * Import transactions to database
 */
async function importTransactions(
  supabase: any,
  userId: string,
  accountId: string,
  transactions: ParsedTransaction[]
): Promise<void> {
  console.log(`Importing ${transactions.length} transactions...`);

  let imported = 0;
  let skipped = 0;

  for (const txn of transactions) {
    try {
      // Get category ID
      const categoryId = await getOrCreateCategory(supabase, userId, txn.categoryName);

      // Insert transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          account_id: accountId,
          date: txn.date,
          description: txn.description,
          category_id: categoryId,
          amount: txn.amount,
          type: 'debit', // All expenses are debits
          merchant_name: txn.description.toUpperCase()
        });

      if (error) {
        console.error(`Failed to import ${txn.description}:`, error);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`Error processing ${txn.description}:`, err);
      skipped++;
    }
  }

  console.log(`✓ Imported: ${imported}, Skipped: ${skipped}`);
}

/**
 * Main import function
 */
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get user ID
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Not authenticated');
    process.exit(1);
  }

  const userId = user.id;
  console.log(`User ID: ${userId}`);

  // Get default account
  const accountId = await getDefaultAccount(supabase, userId);
  console.log(`Account ID: ${accountId}`);

  // Parse and import each month
  const files = [
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Jul 2025.csv', month: '2025-07-15' },
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Aug 2025.csv', month: '2025-08-15' },
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Sep 2025.csv', month: '2025-09-15' }
  ];

  for (const file of files) {
    console.log(`\nProcessing ${file.path}...`);
    const transactions = parseCSV(file.path, file.month);
    console.log(`Parsed ${transactions.length} transactions`);

    await importTransactions(supabase, userId, accountId, transactions);
  }

  console.log('\n✓ Import complete!');
}

main().catch(console.error);
