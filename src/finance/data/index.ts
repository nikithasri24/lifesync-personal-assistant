import type { FinanceAPI } from './api';
import { ValidationError } from '@/lib/errors';

export async function getFinanceAPI(): Promise<FinanceAPI> {
  const url = typeof import.meta.env?.VITE_SUPABASE_URL === 'string'
    ? import.meta.env.VITE_SUPABASE_URL
    : undefined;

  const key = typeof import.meta.env?.VITE_SUPABASE_ANON_KEY === 'string'
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : undefined;

  if (!url || !key) throw new ValidationError('Supabase URL/Anon key missing - check environment configuration');

  const [{ createClient }, { SupabaseApi }] = await Promise.all([
    import('@supabase/supabase-js'),
    import('./supabaseApi'),
  ]);

  const client = createClient(url, key);
  return new SupabaseApi(client);
}

