import type { FinanceAPI } from './api';

export async function getFinanceAPI(): Promise<FinanceAPI> {
  const backend = (import.meta as any).env?.VITE_FINANCE_BACKEND ?? 'mock';
  if (backend === 'supabase') {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL as string;
    const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;
    if (!url || !key) throw new Error('Supabase URL/Anon key missing');
    const [{ createClient }, { SupabaseApi }] = await Promise.all([
      import('@supabase/supabase-js'),
      import('./supabaseApi'),
    ]);
    const client = createClient(url, key);
    return new SupabaseApi(client);
  }
  const { MockApi } = await import('./mockApi');
  return new MockApi();
}

