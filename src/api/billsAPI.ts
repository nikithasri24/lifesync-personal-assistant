/**
 * Bills API
 * CRUD operations for recurring bills and payments
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

// =====================================================
// TYPES
// =====================================================

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type BillStatus = 'active' | 'paused' | 'cancelled';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: BillFrequency;
  due_day: number;
  category?: string;
  auto_pay: boolean;
  reminder_days_before: number;
  status: BillStatus;
  last_paid_date?: string;
  next_due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  user_id: string;
  amount: number;
  paid_date: string;
  confirmation_number?: string;
  notes?: string;
  created_at: string;
}

export interface CreateBillInput {
  name: string;
  amount: number;
  currency?: string;
  frequency: BillFrequency;
  due_day: number;
  category?: string;
  auto_pay?: boolean;
  reminder_days_before?: number;
  notes?: string;
}

// =====================================================
// BILLS CRUD
// =====================================================

/**
 * Get all bills for the current user
 */
export async function getBills(status?: BillStatus): Promise<Bill[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .order('next_due_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('BillsAPI', 'Failed to get bills', { error });
    throw error;
  }
  return data as Bill[];
}

/**
 * Get a single bill by ID
 */
export async function getBill(id: string): Promise<Bill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to get bill', { error });
    throw error;
  }
  return data as Bill;
}

/**
 * Create a new bill
 */
export async function createBill(input: CreateBillInput): Promise<Bill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .insert({
      user_id: user.id,
      name: input.name,
      amount: input.amount,
      currency: input.currency || 'USD',
      frequency: input.frequency,
      due_day: input.due_day,
      category: input.category,
      auto_pay: input.auto_pay ?? false,
      reminder_days_before: input.reminder_days_before ?? 3,
      status: 'active',
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to create bill', { error });
    throw error;
  }
  return data as Bill;
}

/**
 * Update a bill
 */
export async function updateBill(id: string, updates: Partial<CreateBillInput & { status: BillStatus }>): Promise<Bill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to update bill', { error });
    throw error;
  }
  return data as Bill;
}

/**
 * Delete a bill
 */
export async function deleteBill(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('BillsAPI', 'Failed to delete bill', { error });
    throw error;
  }
}

