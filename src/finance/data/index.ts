import type { FinanceAPI } from './api';

export async function getFinanceAPI(): Promise<FinanceAPI> {
  const url = typeof import.meta.env?.VITE_SUPABASE_URL === 'string'
    ? import.meta.env.VITE_SUPABASE_URL
    : undefined;

  const key = typeof import.meta.env?.VITE_SUPABASE_ANON_KEY === 'string'
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : undefined;

  if (!url || !key) throw new Error('Supabase URL/Anon key missing');

  const [{ createClient }, { SupabaseApi }] = await Promise.all([
    import('@supabase/supabase-js'),
    import('./supabaseApi'),
  ]);

  const client = createClient(url, key);
  return new SupabaseApi(client);
}

