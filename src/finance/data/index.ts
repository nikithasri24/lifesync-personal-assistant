import type { FinanceAPI } from './api';
import { ensureSupabase } from '@/lib/supabase';
import { SupabaseApi } from './supabaseApi';

export async function getFinanceAPI(): Promise<FinanceAPI> {
  // Use the singleton Supabase client to avoid multiple GoTrueClient instances
  const client = ensureSupabase();
  return new SupabaseApi(client);
}

