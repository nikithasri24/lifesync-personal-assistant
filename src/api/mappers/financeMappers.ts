/**
 * Type mappers for finance data
 * Converts between database types and application types
 */

import type { Database } from '@/types/database.types';
import type { FinancialAccountData, FinancialTransactionData } from '@/services/types';

type FinanceAccountRow = Database['public']['Tables']['finance_accounts']['Row'];
type FinanceAccountInsert = Database['public']['Tables']['finance_accounts']['Insert'];
type FinanceAccountUpdate = Database['public']['Tables']['finance_accounts']['Update'];

type FinanceTransactionRow = Database['public']['Tables']['finance_transactions']['Row'];
type FinanceTransactionInsert = Database['public']['Tables']['finance_transactions']['Insert'];
type FinanceTransactionUpdate = Database['public']['Tables']['finance_transactions']['Update'];

/**
 * Converts database row to application FinancialAccountData type
 */
export function mapRowToFinancialAccount(row: FinanceAccountRow): FinancialAccountData {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    last_updated_at: row.last_updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    credit_limit: row.credit_limit,
    apr: row.apr,
    payment_due_day: row.payment_due_day,
    minimum_payment: row.minimum_payment,
    statement_balance: row.statement_balance,
    statement_date: row.statement_date,
    annual_fee: row.annual_fee,
    annual_fee_due_date: row.annual_fee_due_date,
    rewards_balance: row.rewards_balance,
    rewards_type: row.rewards_type,
    base_rewards_rate: row.base_rewards_rate,
    liability: row.liability,
    institution_id: row.institution_id,
    connection_id: row.connection_id,
  };
}

/**
 * Converts application FinancialAccountData to database insert format
 */
export function mapFinancialAccountToInsert(
  account: Omit<FinancialAccountData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Omit<FinanceAccountInsert, 'user_id'> {
  return {
    name: account.name,
    type: account.type as FinanceAccountInsert['type'],
    balance: account.balance,
    last_updated_at: account.last_updated_at,
    credit_limit: account.credit_limit,
    apr: account.apr,
    payment_due_day: account.payment_due_day,
    minimum_payment: account.minimum_payment,
    statement_balance: account.statement_balance,
    statement_date: account.statement_date,
    annual_fee: account.annual_fee,
    annual_fee_due_date: account.annual_fee_due_date,
    rewards_balance: account.rewards_balance,
    rewards_type: account.rewards_type as FinanceAccountInsert['rewards_type'],
    base_rewards_rate: account.base_rewards_rate,
    liability: account.liability,
    institution_id: account.institution_id,
    connection_id: account.connection_id,
  };
}

/**
 * Converts partial FinancialAccountData update to database update format
 */
export function mapFinancialAccountToUpdate(
  updates: Partial<Omit<FinancialAccountData, 'id' | 'user_id' | 'created_at'>>
): FinanceAccountUpdate {
  const dbUpdate: FinanceAccountUpdate = {};

  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.type !== undefined) dbUpdate.type = updates.type as FinanceAccountUpdate['type'];
  if (updates.balance !== undefined) dbUpdate.balance = updates.balance;
  if (updates.last_updated_at !== undefined) dbUpdate.last_updated_at = updates.last_updated_at;
  if (updates.updated_at !== undefined) dbUpdate.updated_at = updates.updated_at;
  if (updates.credit_limit !== undefined) dbUpdate.credit_limit = updates.credit_limit;
  if (updates.apr !== undefined) dbUpdate.apr = updates.apr;
  if (updates.payment_due_day !== undefined) dbUpdate.payment_due_day = updates.payment_due_day;
  if (updates.minimum_payment !== undefined) dbUpdate.minimum_payment = updates.minimum_payment;
  if (updates.statement_balance !== undefined) dbUpdate.statement_balance = updates.statement_balance;
  if (updates.statement_date !== undefined) dbUpdate.statement_date = updates.statement_date;
  if (updates.annual_fee !== undefined) dbUpdate.annual_fee = updates.annual_fee;
  if (updates.annual_fee_due_date !== undefined) dbUpdate.annual_fee_due_date = updates.annual_fee_due_date;
  if (updates.rewards_balance !== undefined) dbUpdate.rewards_balance = updates.rewards_balance;
  if (updates.rewards_type !== undefined) dbUpdate.rewards_type = updates.rewards_type as FinanceAccountUpdate['rewards_type'];
  if (updates.base_rewards_rate !== undefined) dbUpdate.base_rewards_rate = updates.base_rewards_rate;
  if (updates.liability !== undefined) dbUpdate.liability = updates.liability;
  if (updates.institution_id !== undefined) dbUpdate.institution_id = updates.institution_id;
  if (updates.connection_id !== undefined) dbUpdate.connection_id = updates.connection_id;

  return dbUpdate;
}

/**
 * Converts database row to application FinancialTransactionData type
 */
export function mapRowToFinancialTransaction(row: FinanceTransactionRow): FinancialTransactionData {
  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    amount: row.amount,
    description: row.description,
    date: row.date,
    type: row.type,
    category_id: row.category_id,
    notes: row.notes,
    merchant_name: row.merchant_name,
    confidence_score: row.confidence_score,
    suggested_category_id: row.suggested_category_id,
    categorization_rule_id: row.categorization_rule_id,
    connection_id: row.connection_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Converts application FinancialTransactionData to database insert format
 */
export function mapFinancialTransactionToInsert(
  transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Omit<FinanceTransactionInsert, 'user_id'> {
  return {
    account_id: transaction.account_id,
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
    type: transaction.type as FinanceTransactionInsert['type'],
    category_id: transaction.category_id,
    notes: transaction.notes,
    merchant_name: transaction.merchant_name,
    confidence_score: transaction.confidence_score,
    suggested_category_id: transaction.suggested_category_id,
    categorization_rule_id: transaction.categorization_rule_id,
    connection_id: transaction.connection_id,
  };
}

/**
 * Converts partial FinancialTransactionData update to database update format
 */
export function mapFinancialTransactionToUpdate(
  updates: Partial<Omit<FinancialTransactionData, 'id' | 'user_id' | 'created_at'>>
): FinanceTransactionUpdate {
  const dbUpdate: FinanceTransactionUpdate = {};

  if (updates.account_id !== undefined) dbUpdate.account_id = updates.account_id;
  if (updates.amount !== undefined) dbUpdate.amount = updates.amount;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.date !== undefined) dbUpdate.date = updates.date;
  if (updates.type !== undefined) dbUpdate.type = updates.type as FinanceTransactionUpdate['type'];
  if (updates.category_id !== undefined) dbUpdate.category_id = updates.category_id;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.merchant_name !== undefined) dbUpdate.merchant_name = updates.merchant_name;
  if (updates.confidence_score !== undefined) dbUpdate.confidence_score = updates.confidence_score;
  if (updates.suggested_category_id !== undefined) dbUpdate.suggested_category_id = updates.suggested_category_id;
  if (updates.categorization_rule_id !== undefined) dbUpdate.categorization_rule_id = updates.categorization_rule_id;
  if (updates.connection_id !== undefined) dbUpdate.connection_id = updates.connection_id;
  if (updates.updated_at !== undefined) dbUpdate.updated_at = updates.updated_at;

  return dbUpdate;
}
