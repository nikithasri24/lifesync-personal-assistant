/**
 * Quick Add Transaction CLI
 *
 * Commands:
 *   set-account <name>                        Save a default account
 *   accounts                                  List all accounts
 *   transfer <amount> -from <a> -to <b>       Transfer between accounts
 *   recurring "<description>" -f <frequency>  Mark a transaction as recurring
 *   "<description>" <amount>                  Add a transaction
 *
 * Frequencies: daily | weekly | biweekly | monthly | quarterly | yearly
 *
 * Options for recurring:
 *   -f  daily|weekly|biweekly|monthly|quarterly|yearly  Frequency (required)
 *   -a  <account name>          Account (fuzzy match)
 *   -c  <category name>         Category (fuzzy match)
 *   -t  debit|credit            Type (default: debit)
 *   --amount                    Amount (pulled from last matching txn if omitted)
 *   -d  <day 1-31>              Day of month (for monthly)
 *   --start YYYY-MM-DD          Start date (default: today)
 *   -n  <notes>                 Notes
 *   --auto                      Auto-create without approval
 *
 * Examples:
 *   npm run add-txn -- recurring "crossfit" -f monthly -d 1
 *   npm run add-txn -- recurring "Netflix" -f monthly --amount 15.99
 *   npm run add-txn -- recurring "Salary" -f biweekly -t credit
 *   npm run add-txn -- recurring "bilt rent" -f monthly -d 1 --auto
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as fuzzball from 'fuzzball';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const CONFIG_PATH = path.resolve('.finance-cli.json');

// ── Config helpers ────────────────────────────────────────────────────────────

interface CliConfig {
  defaultAccountId?: string;
  defaultAccountName?: string;
}

function loadConfig(): CliConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as CliConfig;
  } catch { /* ignore */ }
  return {};
}

function saveConfig(config: CliConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ── Fuzzy category resolver ───────────────────────────────────────────────────

async function resolveCategory(
  supabase: ReturnType<typeof createClient>,
  query: string
): Promise<{ id: string; name: string } | null> {
  const { data: cats } = await supabase
    .from('finance_categories')
    .select('id, name');

  if (!cats?.length) return null;

  // Score each category against the query using token_set_ratio (handles word order + partial)
  const scored = cats.map(c => ({
    ...c,
    score: fuzzball.token_set_ratio(query.toLowerCase(), (c.name as string).toLowerCase()),
  }));

  const best = scored.sort((a, b) => b.score - a.score)[0];

  // Require at least 60% match
  if (best.score < 60) return null;
  return { id: best.id as string, name: best.name as string };
}

// ── History-based auto-categorizer ───────────────────────────────────────────

async function inferCategoryFromHistory(
  supabase: ReturnType<typeof createClient>,
  description: string
): Promise<{ id: string; name: string } | null> {
  // Find the most recent transaction with a similar description that has a category
  const { data: cats } = await supabase.from('finance_categories').select('id, name');
  const { data: txns } = await supabase
    .from('finance_transactions')
    .select('description, category_id')
    .not('category_id', 'is', null)
    .limit(500);

  if (!txns?.length || !cats?.length) return null;

  // Score past transactions by description similarity
  const scored = txns
    .map(t => ({
      ...t,
      score: fuzzball.token_set_ratio(description.toLowerCase(), (t.description as string).toLowerCase()),
    }))
    .filter(t => t.score >= 70)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  const cat = cats.find(c => c.id === best.category_id);
  if (!cat) return null;

  return { id: cat.id as string, name: cat.name as string };
}

// ── Arg parsing ───────────────────────────────────────────────────────────────

interface TxnArgs {
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  account?: string;
  date: string;
  notes?: string;
  tags?: string[];
}

function parseArgs(args: string[]): TxnArgs {
  const shortcuts: Record<string, string> = {
    t: 'type', c: 'cat', a: 'acc', d: 'date', n: 'notes', g: 'tag',
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

  if (positional.length < 2) {
    console.error('❌ Usage: add-txn -- <description> <amount> [options]');
    process.exit(1);
  }

  const amount = parseFloat(positional[1]);
  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Amount must be a positive number');
    process.exit(1);
  }

  const rawType = opts.type?.toLowerCase();
  const type: 'debit' | 'credit' =
    rawType === 'credit' || rawType === 'income' ? 'credit' : 'debit';

  return {
    description: positional[0],
    amount,
    type,
    category: opts.cat ?? opts.category,
    account: opts.acc ?? opts.account,
    date: opts.date ?? new Date().toISOString().split('T')[0],
    notes: opts.notes,
    tags: opts.tag ? opts.tag.split(',').map(t => t.trim()).filter(Boolean) : undefined,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
Usage:
  npm run add-txn -- set-account "<name>"                         Set default account
  npm run add-txn -- accounts                                     List all accounts
  npm run add-txn -- transfer <amount> -from "<a>" -to "<b>"      Transfer between accounts
  npm run add-txn -- recurring "<desc>" -f <freq> [options]       Mark as recurring
  npm run add-txn -- "<description>" <amount> [options]           Add a transaction

Frequencies: daily | weekly | biweekly | monthly | quarterly | yearly
Options:     -t debit|credit  -c category  -a account  -d day  -n notes  --amount  --auto
    `);
    process.exit(0);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve user ID
  let userId = process.env.CLI_USER_ID;
  if (!userId) {
    const { data } = await supabase.from('finance_accounts').select('user_id').limit(1);
    userId = data?.[0]?.user_id as string | undefined;
  }
  if (!userId) {
    console.error('❌ Could not determine user. Set CLI_USER_ID in .env.local');
    process.exit(1);
  }

  // ── recurring ─────────────────────────────────────────────────────────────
  if (cmd === 'recurring') {
    const description = args[1];
    if (!description) {
      console.error('❌ Usage: add-txn -- recurring "<description>" -f <frequency> [options]');
      process.exit(1);
    }

    const opts: Record<string, string> = {};
    for (let i = 2; i < args.length; i++) {
      const a = args[i];
      if ((a === '-f' || a === '--freq') && args[i + 1])          { opts.freq = args[++i]; }
      else if ((a === '-a' || a === '--acc') && args[i + 1])       { opts.acc = args[++i]; }
      else if ((a === '-c' || a === '--cat') && args[i + 1])       { opts.cat = args[++i]; }
      else if ((a === '-t' || a === '--type') && args[i + 1])      { opts.type = args[++i]; }
      else if ((a === '-d' || a === '--day') && args[i + 1])       { opts.day = args[++i]; }
      else if ((a === '-n' || a === '--notes') && args[i + 1])     { opts.notes = args[++i]; }
      else if (a === '--amount' && args[i + 1])                    { opts.amount = args[++i]; }
      else if (a === '--start' && args[i + 1])                     { opts.start = args[++i]; }
      else if (a === '--auto')                                      { opts.auto = 'true'; }
    }

    const freq = opts.freq;
    const validFreqs = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!freq || !validFreqs.includes(freq)) {
      console.error(`❌ -f <frequency> required. Options: ${validFreqs.join(' | ')}`);
      process.exit(1);
    }

    // Pull defaults from most recent matching transaction
    const { data: matches } = await supabase
      .from('finance_transactions')
      .select('id, description, amount, type, account_id, category_id')
      .eq('user_id', userId)
      .ilike('description', `%${description}%`)
      .order('date', { ascending: false })
      .limit(1);

    const match = matches?.[0];
    if (match) {
      console.log(`\n📋 Found matching transaction: "${match.description}" — $${match.amount} (${match.type})`);
    } else {
      console.log(`\n⚠️  No existing transaction matching "${description}" — using provided options`);
    }

    // Resolve amount
    const amount = opts.amount ? parseFloat(opts.amount) : (match ? parseFloat(match.amount) : 0);
    if (!amount) {
      console.error('❌ Could not determine amount. Pass --amount <value>');
      process.exit(1);
    }

    // Resolve type
    const txnType = opts.type === 'credit' ? 'credit' : (match?.type ?? 'debit');

    // Resolve account
    let accountId: string | null = match?.account_id ?? null;
    if (opts.acc) {
      const { data: accData } = await supabase
        .from('finance_accounts').select('id, name').eq('user_id', userId).ilike('name', `%${opts.acc}%`).limit(1);
      if (accData?.[0]) accountId = accData[0].id as string;
    } else if (!accountId && config.defaultAccountId) {
      accountId = config.defaultAccountId;
    }

    // Resolve category
    let categoryId: string | null = match?.category_id ?? null;
    if (opts.cat) {
      const catMatch = await resolveCategory(supabase, opts.cat);
      if (catMatch) categoryId = catMatch.id;
    }

    const startDate = opts.start ?? new Date().toISOString().split('T')[0];
    const dayOfMonth = opts.day ? parseInt(opts.day) : (freq === 'monthly' ? new Date().getDate() : null);

    const { data: inserted, error } = await supabase
      .from('finance_recurring_transactions')
      .insert({
        user_id: userId,
        description: match?.description ?? description,
        amount,
        type: txnType,
        account_id: accountId,
        category_id: categoryId,
        frequency: freq,
        start_date: startDate,
        day_of_month: dayOfMonth,
        auto_create: opts.auto === 'true',
        require_approval: opts.auto !== 'true',
        days_before: 3,
        active: true,
        notes: opts.notes ?? null,
      })
      .select('id')
      .single();

    if (error) { console.error('❌ Failed:', error.message); process.exit(1); }

    const freqLabel: Record<string, string> = {
      daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks',
      monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
    };

    console.log(`\n🔄 Recurring transaction created!`);
    console.log(`   📝 Description: ${match?.description ?? description}`);
    console.log(`   💰 Amount:      $${amount.toFixed(2)} (${txnType})`);
    console.log(`   🔁 Frequency:   ${freqLabel[freq]}${dayOfMonth ? ` on day ${dayOfMonth}` : ''}`);
    console.log(`   📅 Starts:      ${startDate}`);
    console.log(`   ✅ Auto-create: ${opts.auto === 'true' ? 'Yes' : 'No (requires approval)'}`);
    console.log(`   🔑 ID: ${(inserted as { id: string }).id}\n`);
    process.exit(0);
  }

  // ── transfer ──────────────────────────────────────────────────────────────
  if (cmd === 'transfer') {
    // Usage: transfer <amount> -from <account> -to <account> [-d date] [-n notes]
    const opts: Record<string, string> = {};
    let amount = 0;

    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if ((a === '-from' || a === '--from') && args[i + 1]) { opts.from = args[++i]; }
      else if ((a === '-to' || a === '--to') && args[i + 1]) { opts.to = args[++i]; }
      else if ((a === '-d' || a === '--date') && args[i + 1]) { opts.date = args[++i]; }
      else if ((a === '-n' || a === '--notes') && args[i + 1]) { opts.notes = args[++i]; }
      else if (!isNaN(parseFloat(a))) { amount = parseFloat(a); }
    }

    if (!amount || !opts.from || !opts.to) {
      console.error('❌ Usage: add-txn -- transfer <amount> -from "<account>" -to "<account>"');
      console.error('   Example: add-txn -- transfer 500 -from "Chase" -to "Savings"');
      process.exit(1);
    }

    const date = opts.date ?? new Date().toISOString().split('T')[0];

    const resolveAccount = async (name: string) => {
      const { data } = await supabase
        .from('finance_accounts')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${name}%`)
        .limit(1);
      if (!data?.[0]) { console.error(`❌ No account matching "${name}"`); process.exit(1); }
      return data[0] as { id: string; name: string };
    };

    const fromAcc = await resolveAccount(opts.from);
    const toAcc = await resolveAccount(opts.to);
    const transferId = randomUUID();

    const { error } = await supabase.from('finance_transactions').insert([
      {
        user_id: userId,
        account_id: fromAcc.id,
        description: `Transfer to ${toAcc.name}`,
        amount,
        type: 'debit',
        date,
        transfer_id: transferId,
        notes: opts.notes ?? null,
        tags: [],
        merchant_name: `TRANSFER TO ${toAcc.name.toUpperCase()}`,
      },
      {
        user_id: userId,
        account_id: toAcc.id,
        description: `Transfer from ${fromAcc.name}`,
        amount,
        type: 'credit',
        date,
        transfer_id: transferId,
        notes: opts.notes ?? null,
        tags: [],
        merchant_name: `TRANSFER FROM ${fromAcc.name.toUpperCase()}`,
      },
    ]);

    if (error) { console.error('❌ Failed:', error.message); process.exit(1); }

    console.log(`\n↔️  Transfer: $${amount.toFixed(2)}`);
    console.log(`   📤 From: ${fromAcc.name}`);
    console.log(`   📥 To:   ${toAcc.name}`);
    console.log(`   📅 Date: ${date}`);
    if (opts.notes) console.log(`   📝 Notes: ${opts.notes}`);
    console.log(`   🔗 Transfer ID: ${transferId}`);
    console.log(`   ✅ Both legs recorded — excluded from income/expense totals\n`);
    process.exit(0);
  }

  // ── accounts ─────────────────────────────────────────────────────────────
  if (cmd === 'accounts') {
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('id, name, type, balance')
      .eq('user_id', userId)
      .order('name');

    if (error || !data?.length) {
      console.log('No accounts found.');
      process.exit(0);
    }

    const config = loadConfig();
    console.log('\n🏦 Your accounts:\n');
    for (const acc of data) {
      const isDefault = acc.id === config.defaultAccountId;
      const marker = isDefault ? ' ← default' : '';
      console.log(`  ${isDefault ? '✅' : '  '} ${acc.name} (${acc.type})  $${Number(acc.balance).toFixed(2)}${marker}`);
    }
    console.log(`\nTo set default: npm run add-txn -- set-account "<name>"\n`);
    process.exit(0);
  }

  // ── set-account ───────────────────────────────────────────────────────────
  if (cmd === 'set-account') {
    const name = args[1];
    if (!name) {
      console.error('❌ Usage: add-txn -- set-account "<account name>"');
      process.exit(1);
    }

    const { data, error } = await supabase
      .from('finance_accounts')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${name}%`)
      .limit(5);

    if (error || !data?.length) {
      console.error(`❌ No account matching "${name}"`);
      process.exit(1);
    }

    const acc = data[0];
    saveConfig({ defaultAccountId: acc.id as string, defaultAccountName: acc.name as string });
    console.log(`\n✅ Default account set to: ${acc.name}\n`);
    console.log(`   All future transactions will use this account unless you pass -a\n`);
    process.exit(0);
  }

  // ── add transaction ───────────────────────────────────────────────────────
  const txn = parseArgs(args);
  const config = loadConfig();

  // Resolve account: -a flag > saved default > first account
  let accountId: string;
  let accountName: string;

  if (txn.account) {
    const { data } = await supabase
      .from('finance_accounts')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${txn.account}%`)
      .limit(1);

    if (!data?.[0]) {
      console.error(`❌ No account matching "${txn.account}"`);
      process.exit(1);
    }
    accountId = data[0].id as string;
    accountName = data[0].name as string;
  } else if (config.defaultAccountId) {
    // Validate default account still exists
    const { data: accCheck } = await supabase
      .from('finance_accounts').select('id, name').eq('id', config.defaultAccountId).limit(1);
    if (!accCheck?.[0]) {
      console.error(`❌ Saved default account "${config.defaultAccountName}" no longer exists. Run: add-txn -- set-account "<name>"`);
      process.exit(1);
    }
    accountId = accCheck[0].id as string;
    accountName = accCheck[0].name as string;
  } else {
    const { data } = await supabase
      .from('finance_accounts')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1);

    if (!data?.[0]) {
      console.error('❌ No accounts found. Create one in the app first.');
      process.exit(1);
    }
    accountId = data[0].id as string;
    accountName = data[0].name as string;
    console.log(`💡 Tip: run "add-txn -- set-account \\"${accountName}\\"" to make this permanent`);
  }

  // Resolve category: explicit -c flag (fuzzy) → history inference → uncategorized
  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categorySource = '';

  if (txn.category) {
    const match = await resolveCategory(supabase, txn.category);
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
      categorySource = 'matched';
    } else {
      console.warn(`⚠️  No category matching "${txn.category}" — leaving uncategorized`);
    }
  } else {
    // No -c flag: try to infer from transaction history
    const inferred = await inferCategoryFromHistory(supabase, txn.description);
    if (inferred) {
      categoryId = inferred.id;
      categoryName = inferred.name;
      categorySource = 'auto';
    }
  }

  // Insert
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: userId,
      account_id: accountId,
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      date: txn.date,
      category_id: categoryId ?? null,
      notes: txn.notes ?? null,
      tags: txn.tags ?? [],
      merchant_name: txn.description.toUpperCase(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }

  const emoji = txn.type === 'credit' ? '💚' : '🔴';
  const label = txn.type === 'credit' ? 'Income' : 'Expense';

  console.log(`\n${emoji} ${label}: "${txn.description}" — $${txn.amount.toFixed(2)}`);
  console.log(`   📅 Date:    ${txn.date}`);
  console.log(`   📂 Account: ${accountName}`);
  if (categoryName)     console.log(`   🏷️  Category: ${categoryName}${categorySource === 'auto' ? ' (auto from history)' : ''}`);
  if (txn.notes)        console.log(`   📝 Notes:   ${txn.notes}`);
  if (txn.tags?.length) console.log(`   🔖 Tags:    ${txn.tags.map(t => `#${t}`).join(' ')}`);
  console.log(`   ✅ ID: ${(data as { id: string }).id}\n`);
}

main().catch((err: unknown) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
