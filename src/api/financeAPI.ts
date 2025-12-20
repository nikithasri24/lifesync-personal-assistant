/**
 * Finance API
 * CRUD operations for financial accounts and transactions with Supabase
 */

import { supabase } from '../lib/supabase';
import type { FinancialAccountData, FinancialTransactionData } from '../services/types';

// =====================================================
// FINANCIAL ACCOUNTS CRUD OPERATIONS
// =====================================================

/**
 * Get all financial accounts for the current user
 */
export async function getFinancialAccounts(): Promise<FinancialAccountData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as FinancialAccountData[];
}

/**
 * Create a new financial account
 */
export async function createFinancialAccount(
  account: Omit<FinancialAccountData, 'id' | 'created_at' | 'updated_at'>
): Promise<FinancialAccountData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_accounts')
    .insert({
      user_id: user.id,
      ...account,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create financial account');
  return data as FinancialAccountData;
}

/**
 * Update a financial account
 */
export async function updateFinancialAccount(
  id: string,
  updates: Partial<FinancialAccountData>
): Promise<FinancialAccountData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Financial account not found or update failed');
  return data as FinancialAccountData;
}

/**
 * Delete a financial account
 */
export async function deleteFinancialAccount(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('financial_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Create a new financial transaction
 */
export async function createFinancialTransaction(
  transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>
): Promise<FinancialTransactionData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      user_id: user.id,
      ...transaction,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create financial transaction');
  return data as FinancialTransactionData;
}

/**
 * Update a financial transaction
 */
export async function updateFinancialTransaction(
  id: string,
  updates: Partial<FinancialTransactionData>
): Promise<FinancialTransactionData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Financial transaction not found or update failed');
  return data as FinancialTransactionData;
}

/**
 * Delete a financial transaction
 */
export async function deleteFinancialTransaction(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

