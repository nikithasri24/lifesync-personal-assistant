/**
 * Bill Service
 * Handles recurring bills and subscription tracking
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { addDays, startOfWeek, endOfWeek, isBefore, parseISO } from 'date-fns';
import type { 
  RecurringBill, 
  BillPayment, 
  CreateBillInput, 
  UpdateBillInput, 
  RecordPaymentInput,
  BillSummary,
  BillCategory
} from './types';

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
    logger.error('BillService', error, { operation: 'getBills' });
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
    logger.error('BillService', error, { operation: 'getBillsDueInRange' });
    throw error;
  }

  return (data || []) as RecurringBill[];
}

/**
 * Get bills due this week
 */
export async function getBillsDueThisWeek(): Promise<RecurringBill[]> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  return getBillsDueInRange(weekStart, weekEnd);
}

/**
 * Get upcoming bills (next 30 days)
 */
export async function getUpcomingBills(): Promise<RecurringBill[]> {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  return getBillsDueInRange(today, thirtyDaysFromNow);
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
    logger.error('BillService', error, { operation: 'createBill' });
    throw error;
  }

  return data as RecurringBill;
}

/**
 * Update a bill
 */
export async function updateBill(billId: string, updates: UpdateBillInput): Promise<RecurringBill> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recurring_bills')
    .update(updates)
    .eq('id', billId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('BillService', error, { operation: 'updateBill' });
    throw error;
  }

  return data as RecurringBill;
}

/**
 * Delete a bill
 */
export async function deleteBill(billId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', billId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('BillService', error, { operation: 'deleteBill' });
    throw error;
  }
}

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
    logger.error('BillService', error, { operation: 'recordPayment' });
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
    logger.error('BillService', error, { operation: 'getPaymentHistory' });
    throw error;
  }

  return (data || []) as BillPayment[];
}

/**
 * Get bill summary statistics
 */
export async function getBillSummary(): Promise<BillSummary> {
  const bills = await getBills(true);
  const today = new Date();
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  // Calculate totals
  let totalMonthly = 0;
  let subscriptionTotal = 0;
  const byCategory: Record<BillCategory, number> = {
    housing: 0,
    utilities: 0,
    insurance: 0,
    subscriptions: 0,
    loans: 0,
    credit_cards: 0,
    memberships: 0,
    services: 0,
    other: 0,
  };

  const upcomingThisWeek: RecurringBill[] = [];
  let overdueCount = 0;

  for (const bill of bills) {
    // Convert to monthly equivalent
    const monthlyAmount = getMonthlyEquivalent(bill.amount, bill.frequency);
    totalMonthly += monthlyAmount;
    byCategory[bill.category] += monthlyAmount;

    if (bill.is_subscription) {
      subscriptionTotal += monthlyAmount;
    }

    // Check if due this week
    if (bill.due_date) {
      const dueDate = parseISO(bill.due_date);
      if (dueDate <= weekEnd && dueDate >= today) {
        upcomingThisWeek.push(bill);
      }
      if (isBefore(dueDate, today)) {
        overdueCount++;
      }
    }
  }

  return {
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    upcomingThisWeek,
    overdueCount,
    subscriptionTotal,
    byCategory,
  };
}

/**
 * Convert bill amount to monthly equivalent
 */
function getMonthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'biweekly':
      return amount * 2.17;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'semi_annual':
      return amount / 6;
    case 'annual':
      return amount / 12;
    default:
      return amount;
  }
}

