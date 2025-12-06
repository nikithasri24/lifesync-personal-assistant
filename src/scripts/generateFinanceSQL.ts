/**
 * Generate SQL INSERT statements from Finance CSV Data
 *
 * Parses CSV files and generates SQL that can be run via psql
 */

import * as fs from 'fs';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  categoryName: string;
}

/**
 * Parse CSV data from the finance tracker
 */
function parseCSV(filePath: string, month: string): ParsedTransaction[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const transactions: ParsedTransaction[] = [];

  // Find the row with category headers (row 26)
  const categoryRowIndex = 25;
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

  // Parse transactions
  for (let rowIndex = categoryRowIndex + 1; rowIndex < lines.length; rowIndex++) {
    const row = lines[rowIndex];
    if (!row || row.trim() === '') continue;

    const rowCells = row.split(',');

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
 * Map CSV category names to database categories
 */
function mapCategory(categoryName: string): string {
  const mapping: Record<string, string> = {
    'Utilities': 'Bills & Utilities',
    'Food': 'Food & Dining',
    'Miscellaneous': 'Shopping',
    'Shopping + Trips': 'Shopping',
    'Groceries': 'Groceries',
    'Groceries ': 'Groceries'
  };
  return mapping[categoryName] || categoryName;
}

/**
 * Escape single quotes for SQL
 */
function sqlEscape(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Generate SQL statements
 */
function generateSQL(transactions: ParsedTransaction[]): string {
  let sql = `-- Finance CSV Import
-- Total transactions: ${transactions.length}

-- First, ensure user has an account
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO v_user_id;

  -- Get or create default account
  SELECT id INTO v_account_id
  FROM accounts
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No account found. Please create an account first.';
  END IF;

  -- Insert transactions
`;

  for (const txn of transactions) {
    const category = mapCategory(txn.categoryName);
    const escapedDesc = sqlEscape(txn.description);
    const merchantName = sqlEscape(txn.description.toUpperCase());

    sql += `
  -- ${escapedDesc} (${category})
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '${txn.date}'::date,
    '${escapedDesc}',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = '${sqlEscape(category)}' LIMIT 1),
    ${txn.amount},
    'debit',
    '${merchantName}'
  );
`;
  }

  sql += `
END $$;

SELECT COUNT(*) as imported_count FROM transactions WHERE user_id = auth.uid();
`;

  return sql;
}

/**
 * Main
 */
function main() {
  const files = [
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Jul 2025.csv', month: '2025-07-15' },
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Aug 2025.csv', month: '2025-08-15' },
    { path: '/Users/sri.nikitha/Downloads/Finance Planning - Sep 2025.csv', month: '2025-09-15' }
  ];

  let allTransactions: ParsedTransaction[] = [];

  for (const file of files) {
    console.log(`Processing ${file.path}...`);
    const transactions = parseCSV(file.path, file.month);
    console.log(`  Parsed ${transactions.length} transactions`);
    allTransactions = allTransactions.concat(transactions);
  }

  console.log(`\nTotal: ${allTransactions.length} transactions`);

  const sql = generateSQL(allTransactions);

  // Write to file
  const outputPath = '/Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant/supabase/migrations/20250117_import_finance_data.sql';
  fs.writeFileSync(outputPath, sql);

  console.log(`\n✓ SQL written to: ${outputPath}`);
  console.log(`\nRun with:`);
  console.log(`PGPASSWORD='AbNY4sCdEa6APPA' psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 -d postgres -U postgres.rfwaiijodrowakcpayoa -f ${outputPath}`);
}

main();
