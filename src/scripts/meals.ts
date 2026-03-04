/**
 * Meal Planning CLI
 *
 * Commands:
 *   plan <meal> --date <date> --type <type>   — plan a meal for a day
 *   week [--date <date>]                       — show the week's meal plan
 *   done <meal> [--date <date>]                — mark a meal as eaten
 *
 * Examples:
 *   npx tsx src/scripts/meals.ts plan "Oatmeal" --type breakfast
 *   npx tsx src/scripts/meals.ts plan "Chicken rice bowl" --date 2026-03-03 --type dinner
 *   npx tsx src/scripts/meals.ts plan "Leftovers" --type lunch --notes "from last night"
 *   npx tsx src/scripts/meals.ts week
 *   npx tsx src/scripts/meals.ts week --date 2026-03-10
 *   npx tsx src/scripts/meals.ts done "Oatmeal"
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function showHelp(): void {
  console.log(`
Meal Planning CLI

Commands:
  plan <meal> [options]    Plan a meal for a specific day
  week [--date <date>]     Show the week's meal plan
  done <meal> [options]    Mark a meal as eaten

Plan options:
  --type, -t    Meal type: breakfast, lunch, dinner, snack (default: dinner)
  --date, -d    Date YYYY-MM-DD (default: today)
  --notes,-n    Notes
  --servings,-s Number of servings (default: 1)

Examples:
  npm run meals -- plan "Oatmeal" -t breakfast
  npm run meals -- plan "Chicken rice bowl" -d 2026-03-03 -t dinner
  npm run meals -- plan "Leftovers" -t lunch -n "from last night"
  npm run meals -- week
  npm run meals -- week -d 2026-03-10
  npm run meals -- done "Oatmeal"
  npm run meals -- done "Oatmeal" -d 2026-03-01
`);
}

function parseOpts(args: string[]): { positional: string[]; opts: Record<string, string> } {
  const shortcuts: Record<string, string> = {
    t: 'type', d: 'date', n: 'notes', s: 'servings',
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

/** Get Monday of the week containing the given date */
function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

async function getUserId(supabase: SupabaseClient): Promise<string> {
  const userId = process.env.CLI_USER_ID;
  if (userId) return userId;
  // Fall back to any table that has user data
  const { data } = await supabase.from('shopping_lists').select('user_id').limit(1);
  const id = data?.[0]?.user_id as string | undefined;
  if (!id) {
    console.error('❌ Could not determine user. Set CLI_USER_ID in .env.local');
    process.exit(1);
  }
  return id;
}

/** Find or create a meal plan for the week containing the date */
async function getOrCreatePlan(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<string> {
  const weekStartDate = weekStart(date);

  const { data: existing } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .limit(1);

  if (existing?.[0]) return existing[0].id as string;

  // Create a new plan for this week
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      name: `Week of ${weekStartDate}`,
      week_start_date: weekStartDate,
    })
    .select('id')
    .single();

  if (error) { console.error('❌ Failed to create meal plan:', error.message); process.exit(1); }
  return (data as { id: string }).id;
}

async function cmdPlan(
  supabase: SupabaseClient,
  userId: string,
  mealName: string,
  opts: Record<string, string>
): Promise<void> {
  const date = opts.date ?? new Date().toISOString().split('T')[0];
  const rawType = opts.type?.toLowerCase() ?? 'dinner';
  const meal_type = MEAL_TYPES.includes(rawType) ? rawType : 'dinner';

  const planId = await getOrCreatePlan(supabase, userId, date);

  const payload: Record<string, unknown> = {
    meal_plan_id: planId,
    meal_type,
    date,
    custom_meal: mealName,
    status: 'planned',
  };
  if (opts.notes)    payload.notes = opts.notes;
  if (opts.servings) payload.servings = parseInt(opts.servings, 10);

  const { error } = await supabase.from('planned_meals').insert(payload);
  if (error) { console.error('❌ Failed to plan meal:', error.message); process.exit(1); }

  const dayName = DAY_NAMES[new Date(date + 'T12:00:00').getDay()];
  const typeLabel = meal_type.charAt(0).toUpperCase() + meal_type.slice(1);
  console.log(`\n🍽️  Planned: ${typeLabel} — "${mealName}" on ${dayName} ${date}\n`);
}

async function cmdWeek(
  supabase: SupabaseClient,
  userId: string,
  dateHint?: string
): Promise<void> {
  const date = dateHint ?? new Date().toISOString().split('T')[0];
  const weekStartDate = weekStart(date);

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id, name, week_start_date')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .limit(1);

  if (!plans?.length) {
    console.log(`\nNo meal plan for week of ${weekStartDate}. Use "plan" to add meals.\n`);
    return;
  }

  const plan = plans[0];
  const { data: meals } = await supabase
    .from('planned_meals')
    .select('id, meal_type, date, custom_meal, status, notes')
    .eq('meal_plan_id', plan.id)
    .order('date', { ascending: true })
    .order('meal_type', { ascending: true });

  console.log(`\n📅 ${plan.name}:\n`);

  if (!meals?.length) { console.log('  (no meals planned yet)\n'); return; }

  // Group by date
  const byDate: Record<string, typeof meals> = {};
  meals.forEach(m => {
    const d = String(m.date).split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(m);
  });

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  Object.keys(byDate).sort().forEach(d => {
    const dayName = DAY_NAMES[new Date(d + 'T12:00:00').getDay()];
    console.log(`  ${dayName} ${d}`);
    const dayMeals = byDate[d].sort((a, b) =>
      mealOrder.indexOf(String(a.meal_type)) - mealOrder.indexOf(String(b.meal_type))
    );
    dayMeals.forEach(m => {
      const statusIcon = m.status === 'eaten' ? '✅' : m.status === 'cooked' ? '🔥' : '🍽️';
      const type = String(m.meal_type).padEnd(9);
      console.log(`    ${statusIcon} ${type}  ${m.custom_meal ?? '—'}`);
    });
  });
  console.log();
}

async function cmdDone(
  supabase: SupabaseClient,
  userId: string,
  mealName: string,
  opts: Record<string, string>
): Promise<void> {
  const date = opts.date ?? new Date().toISOString().split('T')[0];

  // Find the planned meal by name and date
  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId);

  if (!plans?.length) { console.error('❌ No meal plans found.'); process.exit(1); }

  const planIds = plans.map(p => p.id);
  const { data, error } = await supabase
    .from('planned_meals')
    .select('id, custom_meal, meal_type, date')
    .in('meal_plan_id', planIds)
    .ilike('custom_meal', `%${mealName}%`)
    .eq('date', date)
    .neq('status', 'eaten')
    .limit(5);

  if (error) { console.error('❌', error.message); process.exit(1); }
  if (!data?.length) {
    console.error(`❌ No planned meal matching "${mealName}" on ${date}`);
    process.exit(1);
  }

  const meal = data[0];
  await supabase
    .from('planned_meals')
    .update({ status: 'eaten', consumed_at: new Date().toISOString() })
    .eq('id', meal.id);

  console.log(`\n✅ Marked "${meal.custom_meal}" (${meal.meal_type}) as eaten!\n`);
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
    case 'plan': {
      const mealName = positional[0];
      if (!mealName) { console.error('❌ Usage: meals plan "<meal name>" [options]'); process.exit(1); }
      await cmdPlan(supabase, userId, mealName, opts);
      break;
    }

    case 'week':
      await cmdWeek(supabase, userId, opts.date ?? opts.d);
      break;

    case 'done': {
      const mealName = positional[0];
      if (!mealName) { console.error('❌ Usage: meals done "<meal name>" [--date <date>]'); process.exit(1); }
      await cmdDone(supabase, userId, mealName, opts);
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
