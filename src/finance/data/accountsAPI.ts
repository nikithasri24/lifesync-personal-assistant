/**
 * Finance Accounts API
 * Handles account management (checking, savings, credit cards, investments, etc.)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Account } from '../types';

export class AccountsAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error || !user) throw new AuthenticationError('Not authenticated', { error });
    return user.id;
  }

  // =====================================================
  // ACCOUNTS
  // =====================================================

  async listAccounts(): Promise<Account[]> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's accounts in merged mode
    const { data, error } = await this.client
      .from('finance_accounts')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      institutionId: row.institution_id,
      name: row.name,
      type: row.type,
      balance: parseFloat(row.balance),
      lastUpdatedISO: row.last_updated_at,
      liability: row.liability,
      creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
      apr: row.apr ? parseFloat(row.apr) : undefined,
      paymentDueDay: row.payment_due_day,
      minimumPayment: row.minimum_payment ? parseFloat(row.minimum_payment) : undefined,
      statementBalance: row.statement_balance ? parseFloat(row.statement_balance) : undefined,
      statementDate: row.statement_date,
      annualFee: row.annual_fee ? parseFloat(row.annual_fee) : undefined,
      annualFeeDueDate: row.annual_fee_due_date,
      rewardsBalance: row.rewards_balance ? parseFloat(row.rewards_balance) : undefined,
      rewardsType: row.rewards_type,
      baseRewardsRate: row.base_rewards_rate ? parseFloat(row.base_rewards_rate) : undefined,
    }));
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const userId = await this.getUserId();
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.institutionId !== undefined) dbUpdates.institution_id = updates.institutionId;
    if (updates.userId !== undefined) dbUpdates.user_id = updates.userId; // Allow ownership transfer
    if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
    if (updates.apr !== undefined) dbUpdates.apr = updates.apr;
    if (updates.paymentDueDay !== undefined) dbUpdates.payment_due_day = updates.paymentDueDay;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
    if (updates.statementBalance !== undefined) dbUpdates.statement_balance = updates.statementBalance;
    if (updates.statementDate !== undefined) dbUpdates.statement_date = updates.statementDate;
    if (updates.annualFee !== undefined) dbUpdates.annual_fee = updates.annualFee;
    if (updates.annualFeeDueDate !== undefined) dbUpdates.annual_fee_due_date = updates.annualFeeDueDate;
    if (updates.rewardsBalance !== undefined) dbUpdates.rewards_balance = updates.rewardsBalance;
    if (updates.rewardsType !== undefined) dbUpdates.rewards_type = updates.rewardsType;
    if (updates.baseRewardsRate !== undefined) dbUpdates.base_rewards_rate = updates.baseRewardsRate;

    dbUpdates.updated_at = new Date().toISOString();

    // Don't filter by user_id when updating - allow updating partner's accounts in merged mode
    // RLS will handle access control
    const { error } = await this.client
      .from('finance_accounts')
      .update(dbUpdates)
      .eq('id', accountId);

    if (error) throw error;
  }

  async upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string; userId?: string }): Promise<void> {
    const currentUserId = await this.getUserId();

    if (account.id) {
      // Update existing
      await this.updateAccount(account.id, {
        name: account.name,
        balance: account.balance,
        institutionId: account.institutionId,
        userId: account.userId, // Allow ownership transfer
      });
    } else {
      // Insert new - use provided userId or default to current user
      const { error } = await this.client
        .from('finance_accounts')
        .insert({
          user_id: account.userId ?? currentUserId,
          name: account.name,
          type: account.type,
          balance: account.balance,
          institution_id: account.institutionId,
        });

      if (error) throw error;
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
