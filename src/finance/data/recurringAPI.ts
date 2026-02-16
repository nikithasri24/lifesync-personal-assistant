/**
 * Recurring Transactions API
 * Handles recurring transactions and pending transaction generation
 */

import { supabase } from '../../lib/supabase';
import { AuthenticationError, DatabaseError, NotFoundError, ValidationError } from '../../lib/errors';
import { logger } from '../../services/logger';
import type {
  RecurringTransaction,
  RecurringTransactionInput,
  PendingTransaction,
  PendingTransactionInput,
  RecurringFrequency,
  TransactionInput,
} from '../types';

/**
 * Calculate the next occurrence date for a recurring transaction
 */
function calculateNextOccurrence(
  lastDate: Date,
  frequency: RecurringFrequency,
  dayOfMonth?: number,
  dayOfWeek?: number
): Date {
  const next = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;

    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      if (dayOfMonth !== undefined) {
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth === -1) {
          // Last day of month
          next.setMonth(next.getMonth() + 1, 0);
        } else {
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        }
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      break;

    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;

    default:
      throw new ValidationError(`Unknown frequency: ${frequency}`);
  }

  return next;
}

/**
 * Check if a date should generate a pending transaction based on daysBefore
 */
function shouldGeneratePending(
  scheduledDate: Date,
  currentDate: Date,
  daysBefore: number
): boolean {
  const diffTime = scheduledDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysBefore && diffDays >= 0;
}

/**
 * List all recurring transactions for the current user
 */
export async function listRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'listRecurringTransactions' });
    throw new DatabaseError(error.message, { error });
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type as 'credit' | 'debit',
    categoryId: row.category_id,
    accountId: row.account_id,
    frequency: row.frequency as RecurringFrequency,
    startDate: row.start_date,
    endDate: row.end_date,
    dayOfMonth: row.day_of_month,
    dayOfWeek: row.day_of_week,
    autoCreate: row.auto_create,
    requireApproval: row.require_approval,
    daysBefore: row.days_before,
    active: row.active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastGeneratedDate: row.last_generated_date,
  }));
}

/**
 * Create or update a recurring transaction
 */
export async function upsertRecurringTransaction(
  input: RecurringTransactionInput
): Promise<RecurringTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const payload = {
    user_id: user.id,
    description: input.description,
    amount: input.amount,
    type: input.type,
    category_id: input.categoryId,
    account_id: input.accountId,
    frequency: input.frequency,
    start_date: input.startDate,
    end_date: input.endDate,
    day_of_month: input.dayOfMonth,
    day_of_week: input.dayOfWeek,
    auto_create: input.autoCreate,
    require_approval: input.requireApproval,
    days_before: input.daysBefore,
    active: input.active,
    notes: input.notes,
  };

  let result;
  if (input.id) {
    // Update existing
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'upsertRecurringTransaction.update' });
      throw new DatabaseError(error.message, { error });
    }
    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'upsertRecurringTransaction.insert' });
      throw new DatabaseError(error.message, { error });
    }
    result = data;
  }

  return {
    id: result.id,
    userId: result.user_id,
    description: result.description,
    amount: Number(result.amount),
    type: result.type,
    categoryId: result.category_id,
    accountId: result.account_id,
    frequency: result.frequency,
    startDate: result.start_date,
    endDate: result.end_date,
    dayOfMonth: result.day_of_month,
    dayOfWeek: result.day_of_week,
    autoCreate: result.auto_create,
    requireApproval: result.require_approval,
    daysBefore: result.days_before,
    active: result.active,
    notes: result.notes,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    lastGeneratedDate: result.last_generated_date,
  };
}

/**
 * Delete a recurring transaction
 */
export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'deleteRecurringTransaction' });
    throw new DatabaseError(error.message, { error });
  }
}

/**
 * List all pending transactions for the current user
 */
export async function listPendingTransactions(): Promise<PendingTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const { data, error } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pending', 'edited'])
    .order('scheduled_date', { ascending: true });

  if (error) {
    logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'listPendingTransactions' });
    throw new DatabaseError(error.message, { error });
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    recurringTransactionId: row.recurring_transaction_id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type as 'credit' | 'debit',
    categoryId: row.category_id,
    accountId: row.account_id,
    scheduledDate: row.scheduled_date,
    status: row.status,
    transactionId: row.transaction_id,
    notes: row.notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

/**
 * Approve a pending transaction (create actual transaction)
 */
export async function approvePendingTransaction(
  pendingId: string,
  overrides?: Partial<TransactionInput>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  // Get the pending transaction
  const { data: pending, error: fetchError } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('id', pendingId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !pending) {
    throw new NotFoundError('PendingTransaction', pendingId);
  }

  // Create the actual transaction
  const transaction: TransactionInput = {
    description: overrides?.description || pending.description,
    amount: overrides?.amount !== undefined ? overrides.amount : Number(pending.amount),
    type: overrides?.type || pending.type,
    categoryId: overrides?.categoryId !== undefined ? overrides.categoryId : pending.category_id,
    accountId: overrides?.accountId !== undefined ? overrides.accountId : pending.account_id,
    date: overrides?.date || pending.scheduled_date,
    notes: overrides?.notes || pending.notes,
    tags: overrides?.tags || [],
  };

  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.categoryId,
      account_id: transaction.accountId,
      date: transaction.date,
      notes: transaction.notes,
      tags: transaction.tags,
    })
    .select()
    .single();

  if (txnError) {
    logger.error('RecurringAPI', new DatabaseError(txnError.message, { error: txnError }), { context: 'approvePendingTransaction.createTransaction' });
    throw new DatabaseError(txnError.message, { error: txnError });
  }

  // Update pending transaction status
  const { error: updateError } = await supabase
    .from('pending_transactions')
    .update({
      status: 'approved',
      transaction_id: txn.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', pendingId);

  if (updateError) {
    logger.error('RecurringAPI', new DatabaseError(updateError.message, { error: updateError }), { context: 'approvePendingTransaction.updateStatus' });
    throw new DatabaseError(updateError.message, { error: updateError });
  }
}

/**
 * Skip a pending transaction (mark as skipped)
 */
export async function skipPendingTransaction(pendingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const { error } = await supabase
    .from('pending_transactions')
    .update({
      status: 'skipped',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', pendingId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'skipPendingTransaction' });
    throw new DatabaseError(error.message, { error });
  }
}

/**
 * Delete a pending transaction
 */
export async function deletePendingTransaction(pendingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  const { error } = await supabase
    .from('pending_transactions')
    .delete()
    .eq('id', pendingId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('RecurringAPI', new DatabaseError(error.message, { error }), { context: 'deletePendingTransaction' });
    throw new DatabaseError(error.message, { error });
  }
}

/**
 * Generate pending transactions from recurring transactions
 * This should be called periodically (e.g., daily)
 */
export async function generatePendingTransactions(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }

  // Get all active recurring transactions
  const { data: recurring, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true);

  if (fetchError) {
    logger.error('RecurringAPI', new DatabaseError(fetchError.message, { error: fetchError }), { context: 'generatePendingTransactions.fetch' });
    throw new DatabaseError(fetchError.message, { error: fetchError });
  }

  if (!recurring || recurring.length === 0) {
    return 0;
  }

  const now = new Date();
  let generated = 0;

  for (const rec of recurring) {
    try {
      const startDate = new Date(rec.start_date);
      const endDate = rec.end_date ? new Date(rec.end_date) : null;
      const lastGenerated = rec.last_generated_date ? new Date(rec.last_generated_date) : new Date(startDate.getTime() - 1);

      // Calculate next occurrence
      let nextDate = calculateNextOccurrence(
        lastGenerated,
        rec.frequency as RecurringFrequency,
        rec.day_of_month,
        rec.day_of_week
      );

      // Generate all pending transactions up to daysBefore from now
      while (nextDate <= now || shouldGeneratePending(nextDate, now, rec.days_before)) {
        // Check if we've passed the end date
        if (endDate && nextDate > endDate) {
          break;
        }

        // Check if this pending transaction already exists
        const { data: existing } = await supabase
          .from('pending_transactions')
          .select('id')
          .eq('recurring_transaction_id', rec.id)
          .eq('scheduled_date', nextDate.toISOString().split('T')[0])
          .maybeSingle();

        if (!existing) {
          if (rec.auto_create && !rec.require_approval) {
            // Auto-create the transaction directly
            await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                description: rec.description,
                amount: rec.amount,
                type: rec.type,
                category_id: rec.category_id,
                account_id: rec.account_id,
                date: nextDate.toISOString().split('T')[0],
                notes: rec.notes,
                tags: ['auto-recurring'],
              });
          } else {
            // Create pending transaction for review
            await supabase
              .from('pending_transactions')
              .insert({
                user_id: user.id,
                recurring_transaction_id: rec.id,
                description: rec.description,
                amount: rec.amount,
                type: rec.type,
                category_id: rec.category_id,
                account_id: rec.account_id,
                scheduled_date: nextDate.toISOString().split('T')[0],
                status: 'pending',
                notes: rec.notes,
              });
          }

          generated++;
        }

        // Update last generated date
        await supabase
          .from('recurring_transactions')
          .update({ last_generated_date: nextDate.toISOString().split('T')[0] })
          .eq('id', rec.id);

        // Move to next occurrence
        nextDate = calculateNextOccurrence(
          nextDate,
          rec.frequency as RecurringFrequency,
          rec.day_of_month,
          rec.day_of_week
        );

        // Safety check to prevent infinite loops
        if (nextDate > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          break;
        }
      }
    } catch (error) {
      logger.error('RecurringAPI', error instanceof Error ? error : new Error(String(error)), {
        context: 'generatePendingTransactions.loop',
        recurringId: rec.id,
      });
      // Continue with next recurring transaction
    }
  }

  logger.info('RecurringAPI', `Generated ${generated} pending transactions`, { userId: user.id });
  return generated;
}
