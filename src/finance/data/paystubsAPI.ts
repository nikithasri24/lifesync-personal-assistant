/**
 * Paystubs API
 * Fetch paystub data for a given pay period to enrich the Sankey chart
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';

export interface PaystubDeduction {
  name: string;
  amount: number;
  type: 'pretax' | 'tax' | 'posttax';
}

export interface Paystub {
  id: string;
  userId: string;
  payPeriod: string; // 'YYYY-MM'
  employer?: string;
  grossPay: number;
  netPay: number;
  deductions: PaystubDeduction[];
}

export class PaystubsAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getPaystub(payPeriod: string): Promise<Paystub | null> {
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) throw new AuthenticationError('Not authenticated');

    const { data, error } = await this.client
      .from('finance_paystubs')
      .select('*')
      .eq('user_id', user.id)
      .eq('pay_period', payPeriod)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      payPeriod: data.pay_period,
      employer: data.employer,
      grossPay: parseFloat(data.gross_pay),
      netPay: parseFloat(data.net_pay),
      deductions: (data.deductions as PaystubDeduction[]) || [],
    };
  }
}
