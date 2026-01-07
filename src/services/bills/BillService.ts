/**
 * Bill Service
 * Business logic for recurring bills and subscription tracking
 *
 * This service uses the API layer for data access and provides
 * higher-level business logic operations.
 */

import { addDays, startOfWeek, endOfWeek, isBefore, parseISO } from 'date-fns';
import * as billsAPI from '@/api/billsAPI';
import type {
  RecurringBill,
  BillPayment,
  CreateBillInput,
  UpdateBillInput,
  RecordPaymentInput,
  BillSummary,
  BillCategory
} from './types';

// =====================================================
// RE-EXPORT API FUNCTIONS
// These are pure CRUD operations delegated to the API layer
// =====================================================

export const getBills = billsAPI.getBills;
export const getBillsDueInRange = billsAPI.getBillsDueInRange;
export const createBill = billsAPI.createBill;
export const updateBill = billsAPI.updateBill;
export const deleteBill = billsAPI.deleteBill;
export const recordPayment = billsAPI.recordPayment;
export const getPaymentHistory = billsAPI.getPaymentHistory;

// =====================================================
// BUSINESS LOGIC FUNCTIONS
// These provide higher-level operations with business logic
// =====================================================

/**
 * Get bills due this week
 */
export async function getBillsDueThisWeek(): Promise<RecurringBill[]> {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  return billsAPI.getBillsDueInRange(weekStart, weekEnd);
}

/**
 * Get upcoming bills (next 30 days)
 */
export async function getUpcomingBills(): Promise<RecurringBill[]> {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  return billsAPI.getBillsDueInRange(today, thirtyDaysFromNow);
}

/**
 * Get bill summary statistics
 * This is business logic that aggregates data from the API layer
 */
export async function getBillSummary(): Promise<BillSummary> {
  const bills = await billsAPI.getBills(true);
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
 * Pure business logic helper function
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
