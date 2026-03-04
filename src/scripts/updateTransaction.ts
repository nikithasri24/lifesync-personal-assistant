/**
 * Update Transaction CLI
 *
 * Usage:
 *   npx tsx src/scripts/updateTransaction.ts <id-or-search> [fields]
 *
 * Examples:
 *   # Update by ID (shown when adding)
 *   npx tsx src/scripts/updateTransaction.ts 980f271f --amount 1200
 *   npx tsx src/scripts/updateTransaction.ts 980f271f --desc "Kaush paycheck" --cat salary
 *
 *   # Search by description, then update
 *   npx tsx src/scripts/updateTransaction.ts --find "kaush paycheck" --amount 1200
 *   npx tsx src/scripts/updateTransaction.ts --find "starbucks" --date 2026-02-28
 *
 *   # Just search (no update) to find the ID
 *   npx tsx src/scripts/updateTransaction.ts --find "kaush"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

interface UpdateFields {
  description?: string;
  amount?: number;
  type?: 'debit' | 'credit';
  date?: string;
  category?: string;
  account?: string;
  notes?: string;
  tags?: string[];       // replaces all tags
  clearTags?: boolean;   // removes all tags
}

interface ParsedArgs {
  idOrSearch: string | undefined;
  find: string | undefined;
  updates: UpdateFields;
}

function showHelp(): void {
  console.log(`
Update Transaction CLI

Usage:
  npx tsx src/scripts/updateTransaction.ts <partial-id> [fields to update]
  npx tsx src/scripts/updateTransaction.ts --find "<description>" [fields to update]

Options (all optional — only specified fields are updated):
  --desc, -d      New description
  --amount, -a    New amount
  --type, -t      New type: debit or credit
  --date          New date YYYY-MM-DD
  --cat, -c       New category (fuzzy match)
  --acc           New account (fuzzy match)
  --notes, -n     New notes
  --tag,  -g      Set tag(s), comma-separated (replaces existing tags)
  --clear-tags    Remove all tags

Examples:
  # Find what you're looking for first
  npx tsx src/scripts/updateTransaction.ts --find "kaush paycheck"

  # Update by partial ID
  npx tsx src/scripts/updateTransaction.ts 980f271f --amount 1200
  npx tsx src/scripts/updateTransaction.ts 980f271f --desc "Kaush paycheck Chase" -t credit

  # Find and update in one command
  npx tsx src/scripts/updateTransaction.ts --find "kaush paycheck" --amount 1200
  npx tsx src/scripts/updateTransaction.ts --find "netflix" --cat entertainment

Shortcut:
  npm run update-txn -- --find "kaush paycheck" --amount 1200
`);
}

function parseArgs(args: string[]): ParsedArgs {
  const shortcuts: Record<string, string> = {
    d: 'desc', a: 'amount', t: 'type', c: 'cat', n: 'notes', g: 'tag',
  };

  const positional: string[] = [];
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) { opts[key] = next; i++; }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = shortcuts[arg[1]] ?? arg[1];
      const next = args[i + 1];
      if (next && !next.startsWith('-')) { opts[key] = next; i++; }
    } else {
      positional.push(arg);
    }
  }

  const updates: UpdateFields = {};
  if (opts.desc)   updates.description = opts.desc;
  if (opts.amount) {
    const n = parseFloat(opts.amount);
    if (isNaN(n) || n <= 0) { console.error('❌ --amount must be a positive number'); process.exit(1); }
    updates.amount = n;
  }
  if (opts.type) {
    const t = opts.type.toLowerCase();
    updates.type = (t === 'credit' || t === 'income') ? 'credit' : 'debit';
  }
  if (opts.date)     updates.date = opts.date;
  if (opts.cat)      updates.category = opts.cat;
  if (opts.category) updates.category = opts.category;
  if (opts.acc)      updates.account = opts.acc;
  if (opts.notes)      updates.notes = opts.notes;
  if (opts.tag)        updates.tags = opts.tag.split(',').map(t => t.trim()).filter(Boolean);
  if ('clear-tags' in opts) updates.clearTags = true;

  return {
    idOrSearch: positional[0],
    find: opts.find,
    updates,
  };
}

function formatTxn(t: Record<string, unknown>): string {
  const type = t.type === 'credit' ? '💚 Income' : '🔴 Expense';
  const id = String(t.id).substring(0, 8);
  return `  [${id}] ${type} — "${t.description}"  $${Number(t.amount).toFixed(2)}  ${t.date}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const { idOrSearch, find, updates } = parseArgs(args);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get user ID
  let userId = process.env.CLI_USER_ID;
  if (!userId) {
    const { data } = await supabase.from('finance_accounts').select('user_id').limit(1);
    userId = data?.[0]?.user_id as string | undefined;
  }
  if (!userId) {
    console.error('❌ Could not determine user. Set CLI_USER_ID in .env.local');
    process.exit(1);
  }

  // Find the transaction
  let transaction: Record<string, unknown> | undefined;

  if (find) {
    // Search by description
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('id, description, amount, type, date, category_id, account_id, notes')
      .eq('user_id', userId)
      .ilike('description', `%${find}%`)
      .order('date', { ascending: false })
      .limit(10);

    if (error) { console.error('❌ Search failed:', error.message); process.exit(1); }
    if (!data?.length) {
      console.error(`❌ No transactions found matching "${find}"`);
      process.exit(1);
    }

    if (data.length === 1) {
      transaction = data[0] as Record<string, unknown>;
    } else {
      console.log(`\nFound ${data.length} transactions matching "${find}":\n`);
      data.forEach(t => console.log(formatTxn(t as Record<string, unknown>)));

      const hasUpdates = Object.keys(updates).length > 0;
      if (!hasUpdates) {
        console.log('\nℹ️  Run with the partial ID to update a specific one:');
        console.log(`   npx tsx src/scripts/updateTransaction.ts <id> [fields]`);
        process.exit(0);
      }

      // If updates specified and multiple matches, take the most recent
      console.log(`\n⚠️  Multiple matches — updating the most recent one.`);
      console.log('   Specify a partial ID to target a specific transaction.\n');
      transaction = data[0] as Record<string, unknown>;
    }
  } else if (idOrSearch) {
    // Search by partial ID
    // Fetch recent transactions and filter by ID prefix client-side (UUID columns don't support text ilike)
    const { data: allData, error } = await supabase
      .from('finance_transactions')
      .select('id, description, amount, type, date, category_id, account_id, notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(200);

    if (error) { console.error('❌ Lookup failed:', error.message); process.exit(1); }

    const data = (allData ?? []).filter(t =>
      String(t.id).startsWith(idOrSearch)
    );

    if (!data.length) {
      console.error(`❌ No transaction found with ID starting with "${idOrSearch}"`);
      process.exit(1);
    }
    if (data.length > 1) {
      console.log(`\nMultiple matches for "${idOrSearch}":\n`);
      data.forEach(t => console.log(formatTxn(t as Record<string, unknown>)));
      console.log('\nProvide more characters of the ID to narrow it down.');
      process.exit(1);
    }
    transaction = data[0] as Record<string, unknown>;
  } else {
    console.error('❌ Provide a transaction ID or use --find "<description>"');
    process.exit(1);
  }

  // Show current state
  console.log('\nCurrent transaction:');
  console.log(formatTxn(transaction));

  const hasUpdates = Object.keys(updates).length > 0;
  if (!hasUpdates) {
    console.log('\nℹ️  No update fields specified. Use --amount, --desc, --type, --date, --cat, --notes to update.');
    process.exit(0);
  }

  // Resolve category if provided
  let categoryId: string | undefined | null = undefined;
  if (updates.category) {
    const { data: cats } = await supabase
      .from('finance_categories')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${updates.category}%`)
      .limit(1);

    if (cats?.[0]) {
      categoryId = cats[0].id as string;
      console.log(`🏷️  Category → ${cats[0].name}`);
    } else {
      console.warn(`⚠️  No category matching "${updates.category}" — category unchanged`);
    }
  }

  // Resolve account if provided
  let accountId: string | undefined = undefined;
  if (updates.account) {
    const { data: accs } = await supabase
      .from('finance_accounts')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${updates.account}%`)
      .limit(1);

    if (accs?.[0]) {
      accountId = accs[0].id as string;
      console.log(`📂 Account → ${accs[0].name}`);
    } else {
      console.warn(`⚠️  No account matching "${updates.account}" — account unchanged`);
    }
  }

  // Build update payload (only changed fields)
  const payload: Record<string, unknown> = {};
  if (updates.description) payload.description = updates.description;
  if (updates.amount)      payload.amount = updates.amount;
  if (updates.type)        payload.type = updates.type;
  if (updates.date)        payload.date = updates.date;
  if (updates.notes)       payload.notes = updates.notes;
  if (updates.clearTags)   payload.tags = [];
  else if (updates.tags)   payload.tags = updates.tags;
  if (categoryId)          payload.category_id = categoryId;
  if (accountId)           payload.account_id = accountId;

  const { error } = await supabase
    .from('finance_transactions')
    .update(payload)
    .eq('id', transaction.id as string);

  if (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Updated!');
  const updatedFields = Object.keys(payload)
    .map(k => `   ${k}: ${payload[k]}`)
    .join('\n');
  console.log(updatedFields);
}

main().catch((err: unknown) => {
  console.error('❌ Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
