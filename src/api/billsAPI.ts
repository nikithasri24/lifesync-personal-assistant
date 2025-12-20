/**
 * Bills API
 * CRUD operations for recurring bills and payments
 *
 * This is the ONLY place that should access the recurring_bills and bill_payments tables.
 * Services should use these functions instead of direct Supabase access.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import type {
  RecurringBill,
  BillPayment,
  CreateBillInput,
  UpdateBillInput,
  RecordPaymentInput
} from '../services/bills/types';

// Re-export types for convenience
export type {
  RecurringBill,
  BillPayment,
  CreateBillInput,
  UpdateBillInput,
  RecordPaymentInput,
  BillFrequency,
  BillCategory,
  PaymentStatus
} from '../services/bills/types';

// =====================================================
// BILLS CRUD
// =====================================================

/**
 * Get all bills for the current user
 */
export async function getBills(activeOnly = true): Promise<RecurringBill[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('recurring_bills')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('BillsAPI', 'Failed to get bills', { error });
    throw error;
  }
  return (data || []) as RecurringBill[];
}

/**
 * Get bills due within a date range
 */
export async function getBillsDueInRange(startDate: Date, endDate: Date): Promise<RecurringBill[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('due_date', startDate.toISOString().split('T')[0])
    .lte('due_date', endDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) {
    logger.error('BillsAPI', 'Failed to get bills in range', { error });
    throw error;
  }
  return (data || []) as RecurringBill[];
}

/**
 * Get a single bill by ID
 */
export async function getBill(id: string): Promise<RecurringBill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to get bill', { error });
    throw error;
  }
  return data as RecurringBill;
}

/**
 * Create a new bill
 */
export async function createBill(input: CreateBillInput): Promise<RecurringBill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recurring_bills')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'USD',
      frequency: input.frequency,
      due_day: input.due_day,
      due_date: input.due_date,
      category: input.category || 'other',
      is_auto_pay: input.is_auto_pay || false,
      payment_method: input.payment_method,
      is_subscription: input.is_subscription || false,
      subscription_service: input.subscription_service,
      cancellation_url: input.cancellation_url,
      reminder_days_before: input.reminder_days_before || [3, 1],
    })
    .select()
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to create bill', { error });
    throw error;
  }
  return data as RecurringBill;
}

/**
 * Update a bill
 */
export async function updateBill(id: string, updates: UpdateBillInput): Promise<RecurringBill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recurring_bills')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to update bill', { error });
    throw error;
  }
  return data as RecurringBill;
}

/**
 * Delete a bill
 */
export async function deleteBill(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('BillsAPI', 'Failed to delete bill', { error });
    throw error;
  }
}

// =====================================================
// BILL PAYMENTS CRUD
// =====================================================

/**
 * Record a payment for a bill
 */
export async function recordPayment(input: RecordPaymentInput): Promise<BillPayment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bill_payments')
    .insert({
      user_id: user.id,
      bill_id: input.bill_id,
      amount_paid: input.amount_paid,
      paid_date: input.paid_date,
      due_date: input.due_date,
      status: input.status || 'paid',
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    logger.error('BillsAPI', 'Failed to record payment', { error });
    throw error;
  }
  return data as BillPayment;
}

/**
 * Get payment history for a bill
 */
export async function getPaymentHistory(billId: string): Promise<BillPayment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bill_payments')
    .select('*')
    .eq('bill_id', billId)
    .eq('user_id', user.id)
    .order('paid_date', { ascending: false });

  if (error) {
    logger.error('BillsAPI', 'Failed to get payment history', { error });
    throw error;
  }
  return (data || []) as BillPayment[];
}
