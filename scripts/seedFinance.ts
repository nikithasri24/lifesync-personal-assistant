/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type Any = any;

function readJSON(rel: string) {
  const p = path.join(process.cwd(), 'src/finance/data/seed', rel);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function uuid(): string {
  return crypto.randomUUID();
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.USER_ID || process.argv.find((a) => a.startsWith('--user='))?.split('=')[1];
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  if (!userId) throw new Error('Provide USER_ID env or --user=<uuid>');
  const client = createClient(url, key);

  const institutions: Any[] = readJSON('institutions.json');
  const accounts: Any[] = readJSON('accounts.json');
  const categories: Any[] = readJSON('categories.json');
  const transactions: Any[] = readJSON('transactions.json');
  const budgets: Any[] = readJSON('budgets.json');
  const networth: Any[] = readJSON('networth.json');
  const goals: Any[] = readJSON('goals.json');

  const idMap = new Map<string, string>();
  const mapId = (id?: string) => (id ? (idMap.get(id) || (idMap.set(id, uuid()), idMap.get(id)!)) : undefined);

  // Institutions
  if (institutions.length) {
    const rows = institutions.map((i) => ({ id: mapId(i.id), user_id: userId, name: i.name, logo_url: i.logoUrl ?? null }));
    const { error } = await client.from('institutions').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} institutions`);
  }

  // Categories
  if (categories.length) {
    const rows = categories.map((c) => ({ id: mapId(c.id), user_id: userId, name: c.name, parent_id: mapId(c.parentId) ?? null, icon: c.icon ?? null, color: c.color ?? null }));
    const { error } = await client.from('categories').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} categories`);
  }

  // Accounts
  if (accounts.length) {
    const rows = accounts.map((a) => ({
      id: mapId(a.id),
      user_id: userId,
      institution_id: mapId(a.institutionId) ?? null,
      name: a.name,
      type: a.type,
      balance: a.balance,
      liability: !!a.liability,
      last_updated: a.lastUpdatedISO ?? new Date().toISOString(),
    }));
    const { error } = await client.from('accounts').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} accounts`);
  }

  // Transactions
  if (transactions.length) {
    const rows = transactions.map((t) => ({
      id: mapId(t.id),
      user_id: userId,
      account_id: mapId(t.accountId),
      date: t.dateISO,
      description: t.description,
      category_id: mapId(t.categoryId) ?? null,
      amount: t.amount,
      type: t.type,
      notes: t.notes ?? null,
    }));
    const { error } = await client.from('transactions').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} transactions`);
  }

  // Budgets
  if (budgets.length) {
    const rows = budgets.map((b) => ({
      id: mapId(b.id),
      user_id: userId,
      category_id: mapId(b.categoryId),
      month: b.month,
      limit_amount: b.limit,
    }));
    const { error } = await client.from('budgets').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} budgets`);
  }

  // Net worth
  if (networth.length) {
    const rows = networth.map((n) => ({ user_id: userId, month: n.month, assets: n.assets, liabilities: n.liabilities }));
    const { error } = await client.from('networth').upsert(rows, { onConflict: 'user_id,month' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} networth rows`);
  }

  // Goals
  if (goals.length) {
    const rows = goals.map((g) => ({
      id: mapId(g.id),
      user_id: userId,
      name: g.name,
      target_amount: g.targetAmount,
      current_amount: g.currentAmount,
      due_date: g.dueDateISO.slice(0, 10),
      type: g.type,
      linked_category_id: mapId(g.linkedCategoryId) ?? null,
    }));
    const { error } = await client.from('goals').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    logger.info('SeedFinance', `Inserted ${rows.length} goals`);
  }

  logger.info('SeedFinance', 'Finance seed complete for user:', userId);
}

main().catch((e) => {
  logger.error('SeedFinance', e);
  process.exit(1);
});

