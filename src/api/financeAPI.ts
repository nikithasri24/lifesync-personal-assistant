/**
 * Finance API
 * CRUD operations for financial accounts and transactions with Supabase
 */

import { supabase } from '../lib/supabase';
import type { FinancialAccountData, FinancialTransactionData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// =====================================================
// FINANCIAL ACCOUNTS CRUD OPERATIONS
// =====================================================

/**
 * Get all financial accounts for the current user
 */
export async function getFinancialAccounts(): Promise<FinancialAccountData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as FinancialAccountData[];
    },
    { domain: 'FinanceAPI', operation: 'getFinancialAccounts' }
  );
}

/**
 * Create a new financial account
 */
export async function createFinancialAccount(
  account: Omit<FinancialAccountData, 'id' | 'created_at' | 'updated_at'>
): Promise<FinancialAccountData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('financial_accounts')
        .insert({
          user_id: user.id,
          ...account,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Account');
      return data as FinancialAccountData;
    },
    { domain: 'FinanceAPI', operation: 'createFinancialAccount', data: { name: account.name } }
  );
}

/**
 * Update a financial account
 */
export async function updateFinancialAccount(
  id: string,
  updates: Partial<FinancialAccountData>
): Promise<FinancialAccountData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('financial_accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Account', id);
      return data as FinancialAccountData;
    },
    { domain: 'FinanceAPI', operation: 'updateFinancialAccount', data: { id } }
  );
}

/**
 * Delete a financial account
 */
export async function deleteFinancialAccount(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'FinanceAPI', operation: 'deleteFinancialAccount', data: { id } }
  );
}

// =====================================================
// FINANCIAL TRANSACTIONS CRUD OPERATIONS
// =====================================================

/**
 * Get all financial transactions for the current user
 */
export async function getFinancialTransactions(filters?: {
  accountId?: string;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialTransactionData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.accountId) query = query.eq('account_id', filters.accountId);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FinancialTransactionData[];
    },
    { domain: 'FinanceAPI', operation: 'getFinancialTransactions', data: { filters } }
  );
}

/**
 * Create a new financial transaction
 */
export async function createFinancialTransaction(
  transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>
): Promise<FinancialTransactionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          ...transaction,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Transaction');
      return data as FinancialTransactionData;
    },
    { domain: 'FinanceAPI', operation: 'createFinancialTransaction', data: { type: transaction.type, amount: transaction.amount } }
  );
}

/**
 * Update a financial transaction
 */
export async function updateFinancialTransaction(
  id: string,
  updates: Partial<FinancialTransactionData>
): Promise<FinancialTransactionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Transaction', id);
      return data as FinancialTransactionData;
    },
    { domain: 'FinanceAPI', operation: 'updateFinancialTransaction', data: { id } }
  );
}

/**
 * Delete a financial transaction
 */
export async function deleteFinancialTransaction(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'FinanceAPI', operation: 'deleteFinancialTransaction', data: { id } }
  );
}

