/**
 * useBillReminders Hook
 * Schedules reminders for upcoming bill payments based on reminder_days_before
 * Uses API layer for all database access
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/services/logger';
import { getBills } from '@/api/billsAPI';
import { queryKeys } from '@/lib/react-query';
import { reminderService } from '@/services/reminders';
import type { RecurringBill } from '@/services/bills/types';
import { addDays, isBefore, isAfter, startOfDay, differenceInDays, parseISO, setDate, addMonths } from 'date-fns';

/**
 * Calculate the next due date for a bill
 */
function getNextDueDate(bill: RecurringBill): Date | null {
  const today = startOfDay(new Date());
  
  // If bill has a specific due_date, use it
  if (bill.due_date) {
    const dueDate = parseISO(bill.due_date);
    // If due date is in the past, calculate next occurrence based on frequency
    if (isBefore(dueDate, today)) {
      return calculateNextOccurrence(dueDate, bill.frequency);
    }
    return dueDate;
  }
  
  // If bill has a due_day (day of month), calculate next occurrence
  if (bill.due_day) {
    let nextDue = setDate(today, bill.due_day);
    if (isBefore(nextDue, today)) {
      nextDue = addMonths(nextDue, 1);
    }
    return nextDue;
  }
  
  return null;
}

/**
 * Calculate next occurrence based on frequency
 */
function calculateNextOccurrence(fromDate: Date, frequency: string): Date {
  const today = startOfDay(new Date());
  let nextDate = fromDate;
  
  while (isBefore(nextDate, today)) {
    switch (frequency) {
      case 'weekly':
        nextDate = addDays(nextDate, 7);
        break;
      case 'biweekly':
        nextDate = addDays(nextDate, 14);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, 1);
        break;
      case 'quarterly':
        nextDate = addMonths(nextDate, 3);
        break;
      case 'semi_annual':
        nextDate = addMonths(nextDate, 6);
        break;
      case 'annual':
        nextDate = addMonths(nextDate, 12);
        break;
      default:
        nextDate = addMonths(nextDate, 1);
    }
  }
  
  return nextDate;
}

/**
 * Hook to schedule bill payment reminders
 * Checks bills and schedules reminders based on reminder_days_before
 */
export function useBillReminders(enabled: boolean = true) {
  const scheduledRef = useRef<Set<string>>(new Set());
  const lastScheduleDateRef = useRef<string>('');

  const { data: bills } = useQuery({
    queryKey: [...queryKeys.bills.all, 'with-reminders'],
    queryFn: () => getBills(true), // Get active bills only
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  useEffect(() => {
    if (!enabled || !bills || bills.length === 0) return;

    const today = startOfDay(new Date()).toISOString();
    
    // Reset scheduled set if it's a new day
    if (lastScheduleDateRef.current !== today) {
      scheduledRef.current.clear();
      lastScheduleDateRef.current = today;
    }

    const scheduleReminders = async () => {
      const now = new Date();

      for (const bill of bills) {
        const nextDueDate = getNextDueDate(bill);
        if (!nextDueDate) continue;

        const reminderDays = bill.reminder_days_before || [3, 1];
        
        for (const daysBefore of reminderDays) {
          const reminderKey = `${bill.id}-${daysBefore}`;
          if (scheduledRef.current.has(reminderKey)) continue;

          const reminderDate = addDays(nextDueDate, -daysBefore);
          const daysUntilDue = differenceInDays(nextDueDate, now);
          
          // Only schedule if reminder date is today or in the future (within 7 days)
          if (isAfter(reminderDate, now) && differenceInDays(reminderDate, now) <= 7) {
            try {
              const autoPayNote = bill.is_auto_pay ? ' (Auto-pay enabled)' : '';
              await reminderService.scheduleReminder({
                type: 'custom',
                title: `💳 Bill Due ${daysBefore === 1 ? 'Tomorrow' : `in ${daysBefore} days`}`,
                body: `${bill.name}: $${bill.amount.toFixed(2)}${autoPayNote}`,
                scheduledFor: reminderDate,
                priority: daysBefore === 1 ? 'high' : 'normal',
                entityType: 'bill',
                entityId: bill.id,
              });
              scheduledRef.current.add(reminderKey);
            } catch (error) {
              logger.error('Hooks', error instanceof Error ? error : new Error(String(error)), { context: 'scheduleBillReminder', billName: bill.name });
            }
          }
        }
      }
    };

    scheduleReminders();
  }, [enabled, bills]);
}

