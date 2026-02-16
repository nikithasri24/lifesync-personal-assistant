/**
 * Finance API
 * CRUD operations for financial accounts and transactions with Supabase
 */

import { supabase } from '../lib/supabase';
import type { FinancialAccountData, FinancialTransactionData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { validateApiResponse } from '../lib/validation';
import {
  FinancialAccountDataSchema,
  FinancialAccountDataArraySchema,
  FinancialTransactionDataSchema,
  FinancialTransactionDataArraySchema,
} from '../finance/schemas';
import {
  mapRowToFinancialAccount,
  mapFinancialAccountToInsert,
  mapFinancialAccountToUpdate,
  mapRowToFinancialTransaction,
  mapFinancialTransactionToInsert,
  mapFinancialTransactionToUpdate,
} from './mappers/financeMappers';

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

      const { data, error} = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const accounts = (data ?? []).map(mapRowToFinancialAccount);
      return validateApiResponse(
        FinancialAccountDataArraySchema,
        accounts,
        'getFinancialAccounts'
      );
    },
    { domain: 'FinanceAPI', operation: 'getFinancialAccounts' }
  );
}

/**
 * Create a new financial account
 */
export async function createFinancialAccount(
  account: Omit<FinancialAccountData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<FinancialAccountData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbAccount = mapFinancialAccountToInsert(account);

      const result = await supabase
        .from('finance_accounts')
        .insert({
          ...dbAccount,
          user_id: user.id,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Account');
      const mappedData = mapRowToFinancialAccount(data);
      return validateApiResponse(
        FinancialAccountDataSchema,
        mappedData,
        'createFinancialAccount'
      );
    },
    { domain: 'FinanceAPI', operation: 'createFinancialAccount', data: { name: account.name } }
  );
}

/**
 * Update a financial account
 */
export async function updateFinancialAccount(
  id: string,
  updates: Partial<Omit<FinancialAccountData, 'id' | 'user_id' | 'created_at'>>
): Promise<FinancialAccountData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates = mapFinancialAccountToUpdate(updates);

      const result = await supabase
        .from('finance_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Account', id);
      const mappedData = mapRowToFinancialAccount(data);
      return validateApiResponse(
        FinancialAccountDataSchema,
        mappedData,
        'updateFinancialAccount'
      );
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
        .from('finance_accounts')
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
  type?: 'credit' | 'debit';
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialTransactionData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.accountId) query = query.eq('account_id', filters.accountId);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.category) query = query.eq('category_id', filters.category);
        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      const transactions = (data ?? []).map(mapRowToFinancialTransaction);
      return validateApiResponse(
        FinancialTransactionDataArraySchema,
        transactions,
        'getFinancialTransactions'
      );
    },
    { domain: 'FinanceAPI', operation: 'getFinancialTransactions', data: { filters } }
  );
}

/**
 * Create a new financial transaction
 */
export async function createFinancialTransaction(
  transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<FinancialTransactionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbTransaction = mapFinancialTransactionToInsert(transaction);

      const result = await supabase
        .from('finance_transactions')
        .insert({
          ...dbTransaction,
          user_id: user.id,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Transaction');
      const mappedData = mapRowToFinancialTransaction(data);
      return validateApiResponse(
        FinancialTransactionDataSchema,
        mappedData,
        'createFinancialTransaction'
      );
    },
    { domain: 'FinanceAPI', operation: 'createFinancialTransaction', data: { type: transaction.type, amount: transaction.amount } }
  );
}

/**
 * Update a financial transaction
 */
export async function updateFinancialTransaction(
  id: string,
  updates: Partial<Omit<FinancialTransactionData, 'id' | 'user_id' | 'created_at'>>
): Promise<FinancialTransactionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates = mapFinancialTransactionToUpdate(updates);

      const result = await supabase
        .from('finance_transactions')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Financial Transaction', id);
      const mappedData = mapRowToFinancialTransaction(data);
      return validateApiResponse(
        FinancialTransactionDataSchema,
        mappedData,
        'updateFinancialTransaction'
      );
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
        .from('finance_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'FinanceAPI', operation: 'deleteFinancialTransaction', data: { id } }
  );
}

