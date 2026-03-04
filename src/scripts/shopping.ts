/**
 * Shopping List CLI
 *
 * Commands:
 *   lists                          — show all shopping lists
 *   add <item> [options]           — add item to a list
 *   done <item> [--list <name>]    — mark item as purchased
 *   show [--list <name>]           — show items in a list
 *   new-list <name>                — create a new shopping list
 *
 * Examples:
 *   npx tsx src/scripts/shopping.ts lists
 *   npx tsx src/scripts/shopping.ts add "Milk" --qty 2 --unit gallons
 *   npx tsx src/scripts/shopping.ts add "Chicken breast" --list "weekly" --cat Meat --qty 2
 *   npx tsx src/scripts/shopping.ts done "Milk"
 *   npx tsx src/scripts/shopping.ts show
 *   npx tsx src/scripts/shopping.ts show --list "Costco"
 *   npx tsx src/scripts/shopping.ts new-list "Costco Run"
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function showHelp(): void {
  console.log(`
Shopping List CLI

Commands:
  lists                        Show all shopping lists
  add <item> [options]         Add item to a list
  done <item> [options]        Mark item as purchased
  show [options]               Show items in a list
  new-list <name>              Create a new shopping list

Add options:
  --list, -l    List name (fuzzy, defaults to most recent active list)
  --qty,  -q    Quantity (e.g. 2)
  --unit, -u    Unit (e.g. gallons, lbs, packs)
  --cat,  -c    Category (e.g. Dairy, Meat, Produce)
  --price       Estimated price
  --notes,-n    Notes

Examples:
  npm run shopping -- lists
  npm run shopping -- add "Milk" --qty 2 --unit gallons
  npm run shopping -- add "Chicken" --list "weekly" --cat Meat --qty 1.5 --unit lbs
  npm run shopping -- done "Milk"
  npm run shopping -- done "Milk" --list "weekly"
  npm run shopping -- show
  npm run shopping -- show --list "Costco"
  npm run shopping -- new-list "Costco Run"
`);
}

function parseOpts(args: string[]): { positional: string[]; opts: Record<string, string> } {
  const shortcuts: Record<string, string> = {
    l: 'list', q: 'qty', u: 'unit', c: 'cat', n: 'notes',
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
  return { positional, opts };
}

async function getUserId(supabase: SupabaseClient): Promise<string> {
  const userId = process.env.CLI_USER_ID;
  if (userId) return userId;
  const { data } = await supabase.from('shopping_lists').select('user_id').limit(1);
  const id = data?.[0]?.user_id as string | undefined;
  if (!id) {
    console.error('❌ Could not determine user. Set CLI_USER_ID in .env.local');
    process.exit(1);
  }
  return id;
}

async function findList(
  supabase: SupabaseClient,
  userId: string,
  nameHint?: string
): Promise<{ id: string; name: string }> {
  let query = supabase
    .from('shopping_lists')
    .select('id, name, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (nameHint) query = query.ilike('name', `%${nameHint}%`);

  const { data, error } = await query.limit(5);
  if (error) { console.error('❌ Failed to fetch lists:', error.message); process.exit(1); }
  if (!data?.length) {
    const msg = nameHint ? `No list matching "${nameHint}"` : 'No shopping lists found. Create one with: new-list "<name>"';
    console.error(`❌ ${msg}`);
    process.exit(1);
  }
  // Prefer active list
  const active = data.find(l => l.status !== 'completed') ?? data[0];
  return { id: active.id as string, name: active.name as string };
}

async function cmdLists(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('id, name, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) { console.error('❌', error.message); process.exit(1); }
  if (!data?.length) { console.log('No shopping lists yet. Create one with: new-list "<name>"'); return; }

  console.log('\n📋 Shopping Lists:\n');
  data.forEach(l => {
    const status = l.status === 'completed' ? '✅' : '🛒';
    console.log(`  ${status} ${l.name}  [${String(l.id).substring(0, 8)}]`);
  });
  console.log();
}

async function cmdShow(supabase: SupabaseClient, userId: string, listHint?: string): Promise<void> {
  const list = await findList(supabase, userId, listHint);

  const { data, error } = await supabase
    .from('shopping_items')
    .select('id, name, quantity, unit, category, is_purchased, notes, estimated_price')
    .eq('shopping_list_id', list.id)
    .order('is_purchased', { ascending: true })
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) { console.error('❌', error.message); process.exit(1); }

  console.log(`\n🛒 ${list.name}:\n`);
  if (!data?.length) { console.log('  (empty)'); return; }

  let lastCat = '';
  data.forEach(item => {
    const cat = String(item.category ?? 'Uncategorized');
    if (cat !== lastCat) { console.log(`\n  ${cat}`); lastCat = cat; }
    const check = item.is_purchased ? '☑' : '☐';
    const qty = item.quantity ? ` ×${item.quantity}${item.unit ? ' ' + item.unit : ''}` : '';
    const price = item.estimated_price ? `  ~$${Number(item.estimated_price).toFixed(2)}` : '';
    console.log(`    ${check} ${item.name}${qty}${price}`);
  });
  console.log();
}

async function cmdAdd(
  supabase: SupabaseClient,
  userId: string,
  itemName: string,
  opts: Record<string, string>
): Promise<void> {
  const list = await findList(supabase, userId, opts.list);

  const payload: Record<string, unknown> = {
    user_id: userId,
    shopping_list_id: list.id,
    name: itemName,
    is_purchased: false,
  };
  if (opts.qty)   payload.quantity = parseFloat(opts.qty);
  if (opts.unit)  payload.unit = opts.unit;
  if (opts.cat)   payload.category = opts.cat;
  if (opts.price) payload.estimated_price = parseFloat(opts.price);
  if (opts.notes) payload.notes = opts.notes;

  const { error } = await supabase.from('shopping_items').insert(payload);
  if (error) { console.error('❌ Failed to add item:', error.message); process.exit(1); }

  const qty = opts.qty ? ` ×${opts.qty}${opts.unit ? ' ' + opts.unit : ''}` : '';
  console.log(`\n✅ Added "${itemName}"${qty} → ${list.name}\n`);
}

async function cmdDone(
  supabase: SupabaseClient,
  userId: string,
  itemName: string,
  listHint?: string
): Promise<void> {
  const list = await findList(supabase, userId, listHint);

  const { data, error } = await supabase
    .from('shopping_items')
    .select('id, name')
    .eq('shopping_list_id', list.id)
    .eq('user_id', userId)
    .ilike('name', `%${itemName}%`)
    .eq('is_purchased', false)
    .limit(5);

  if (error) { console.error('❌', error.message); process.exit(1); }
  if (!data?.length) {
    console.error(`❌ No unpurchased item matching "${itemName}" in "${list.name}"`);
    process.exit(1);
  }

  const item = data[0];
  await supabase
    .from('shopping_items')
    .update({ is_purchased: true, purchased_at: new Date().toISOString() })
    .eq('id', item.id);

  console.log(`\n☑  Marked "${item.name}" as purchased in ${list.name}\n`);
}

async function cmdNewList(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<void> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: userId, name, status: 'active' })
    .select('id, name')
    .single();

  if (error) { console.error('❌ Failed to create list:', error.message); process.exit(1); }
  console.log(`\n✅ Created list "${(data as { name: string }).name}"\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') { showHelp(); process.exit(0); }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userId = await getUserId(supabase);
  const { positional, opts } = parseOpts(args.slice(1));

  switch (cmd) {
    case 'lists':
      await cmdLists(supabase, userId);
      break;

    case 'show':
      await cmdShow(supabase, userId, opts.list ?? opts.l);
      break;

    case 'add': {
      const itemName = positional[0];
      if (!itemName) { console.error('❌ Usage: shopping add "<item name>" [options]'); process.exit(1); }
      await cmdAdd(supabase, userId, itemName, opts);
      break;
    }

    case 'done': {
      const itemName = positional[0];
      if (!itemName) { console.error('❌ Usage: shopping done "<item name>" [--list <name>]'); process.exit(1); }
      await cmdDone(supabase, userId, itemName, opts.list);
      break;
    }

    case 'new-list': {
      const name = positional[0];
      if (!name) { console.error('❌ Usage: shopping new-list "<list name>"'); process.exit(1); }
      await cmdNewList(supabase, userId, name);
      break;
    }

    default:
      console.error(`❌ Unknown command "${cmd}". Run with --help for usage.`);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('❌ Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
