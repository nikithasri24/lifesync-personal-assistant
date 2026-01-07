/**
 * Bills API
 * CRUD operations for recurring bills and payments
 *
 * This is the ONLY place that should access the recurring_bills and bill_payments tables.
 * Services should use these functions instead of direct Supabase access.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from '../api/apiWrapper';
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
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RecurringBill[];
    },
    { domain: 'BillsAPI', operation: 'getBills', data: { activeOnly } }
  );
}

/**
 * Get bills due within a date range
 */
export async function getBillsDueInRange(startDate: Date, endDate: Date): Promise<RecurringBill[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as RecurringBill[];
    },
    { domain: 'BillsAPI', operation: 'getBillsDueInRange', data: { startDate, endDate } }
  );
}

/**
 * Get a single bill by ID
 */
export async function getBill(id: string): Promise<RecurringBill> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Bill', id);
      return data as RecurringBill;
    },
    { domain: 'BillsAPI', operation: 'getBill', data: { id } }
  );
}

/**
 * Create a new bill
 */
export async function createBill(input: CreateBillInput): Promise<RecurringBill> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'Bill');
      logger.info('BillsAPI', 'Bill created', { name: input.name });
      return data as RecurringBill;
    },
    { domain: 'BillsAPI', operation: 'createBill', data: { name: input.name } }
  );
}

/**
 * Update a bill
 */
export async function updateBill(id: string, updates: UpdateBillInput): Promise<RecurringBill> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('recurring_bills')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Bill', id);
      logger.info('BillsAPI', 'Bill updated', { id });
      return data as RecurringBill;
    },
    { domain: 'BillsAPI', operation: 'updateBill', data: { id } }
  );
}

/**
 * Delete a bill
 */
export async function deleteBill(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('recurring_bills')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('BillsAPI', 'Bill deleted', { id });
    },
    { domain: 'BillsAPI', operation: 'deleteBill', data: { id } }
  );
}

// =====================================================
// BILL PAYMENTS CRUD
// =====================================================

/**
 * Record a payment for a bill
 */
export async function recordPayment(input: RecordPaymentInput): Promise<BillPayment> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'Bill Payment');
      logger.info('BillsAPI', 'Payment recorded', { bill_id: input.bill_id });
      return data as BillPayment;
    },
    { domain: 'BillsAPI', operation: 'recordPayment', data: { bill_id: input.bill_id } }
  );
}

/**
 * Get payment history for a bill
 */
export async function getPaymentHistory(billId: string): Promise<BillPayment[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('bill_id', billId)
        .eq('user_id', user.id)
        .order('paid_date', { ascending: false });

      if (error) throw error;
      return (data || []) as BillPayment[];
    },
    { domain: 'BillsAPI', operation: 'getPaymentHistory', data: { billId } }
  );
}
