/**
 * Finance Goals API
 * Handles financial goals, progress tracking, and net worth calculations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Goal, GoalInput, GoalProgressPoint, NetPoint } from '../types';

export class GoalsAPI {
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
  // NET WORTH
  // =====================================================

  async listNetWorth(): Promise<NetPoint[]> {
    // Calculate net worth from accounts
    const { data: accounts, error } = await this.client
      .from('finance_accounts')
      .select('*')
      .order('name');

    if (error) throw error;

    // Group by month and calculate assets/liabilities
    const monthMap = new Map<string, { assets: number; liabilities: number }>();

    for (const account of (accounts || [])) {
      const month = account.last_updated_at.slice(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { assets: 0, liabilities: 0 };
      const balance = parseFloat(account.balance);

      if (account.liability) {
        existing.liabilities += balance;
      } else {
        existing.assets += balance;
      }

      monthMap.set(month, existing);
    }

    return Array.from(monthMap.entries())
      .map(([month, values]) => ({
        month,
        assets: values.assets,
        liabilities: values.liabilities,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // =====================================================
  // GOALS
  // =====================================================

  async listGoals(): Promise<Goal[]> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's goals in merged mode
    const { data, error } = await this.client
      .from('finance_goals')
      .select('*')
      .order('due_date');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      connectionId: row.connection_id,
      name: row.name,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      startingAmount: parseFloat(row.starting_amount),
      dueDateISO: row.due_date,
      type: row.type,
      linkedCategoryId: row.linked_category_id,
      linkedAccountId: row.linked_account_id,
      trackNetworth: row.track_networth,
      isShared: !!row.connection_id, // Helper flag for UI
      createdAtISO: row.created_at,
      updatedAtISO: row.updated_at,
    }));
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    const userId = await this.getUserId();

    if (goal.id) {
      // Update existing
      const { error } = await this.client
        .from('finance_goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          starting_amount: goal.startingAmount,
          due_date: goal.dueDateISO,
          type: goal.type,
          linked_category_id: goal.linkedCategoryId,
          linked_account_id: goal.linkedAccountId,
          track_networth: goal.trackNetworth,
          connection_id: goal.connectionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new - for shared goals, use connectionId
      const { error } = await this.client
        .from('finance_goals')
        .insert({
          user_id: userId,
          connection_id: goal.connectionId,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          starting_amount: goal.startingAmount,
          due_date: goal.dueDateISO,
          type: goal.type,
          linked_category_id: goal.linkedCategoryId,
          linked_account_id: goal.linkedAccountId,
          track_networth: goal.trackNetworth,
        });

      if (error) throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_goal_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      dateISO: row.date,
      amount: parseFloat(row.amount),
      note: row.note,
    }));
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    const userId = await this.getUserId();

    // Get goal
    const { data: goalData, error: goalError } = await this.client
      .from('finance_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalError) throw goalError;
    if (!goalData.linked_account_id) return;

    // Get account balance
    const { data: accountData, error: accountError } = await this.client
      .from('finance_accounts')
      .select('balance')
      .eq('id', goalData.linked_account_id)
      .eq('user_id', userId)
      .single();

    if (accountError) throw accountError;

    // Update goal
    const { error: updateError } = await this.client
      .from('finance_goals')
      .update({
        current_amount: accountData.balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  }
}
