import type { FinanceAPI } from './api';
import { ensureSupabase } from '@/lib/supabase';
import { SupabaseApi } from './supabaseApi';
import { PaystubsAPI } from './paystubsAPI';
export type { Paystub, PaystubDeduction } from './paystubsAPI';

export async function getFinanceAPI(): Promise<FinanceAPI> {
  const client = ensureSupabase();
  return new SupabaseApi(client);
}

export function getPaystubsAPI(): PaystubsAPI {
  const client = ensureSupabase();
  return new PaystubsAPI(client);
}

