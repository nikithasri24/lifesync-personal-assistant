/**
 * Finance Budgets API
 * Handles budget and budget template operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type { Budget, BudgetTemplate, BudgetTemplateInput } from '../types';

export class BudgetsAPI {
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
  // BUDGETS
  // =====================================================

  async listBudgets(monthISO: string): Promise<Budget[]> {
    const userId = await this.getUserId();
    const month = monthISO.slice(0, 7); // YYYY-MM

    const { data, error } = await this.client
      .from('finance_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month);

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      month: row.month,
      limit: parseFloat(row.limit_amount),
    }));
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    const userId = await this.getUserId();
    const month = budget.month.slice(0, 7); // YYYY-MM

    const { error } = await this.client
      .from('finance_budgets')
      .upsert({
        user_id: userId,
        category_id: budget.categoryId,
        month,
        limit_amount: budget.limit,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category_id,month',
      });

    if (error) throw error;
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    const userId = await this.getUserId();
    const monthStr = month.slice(0, 7); // YYYY-MM

    const { error } = await this.client
      .from('finance_budgets')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('month', monthStr);

    if (error) throw error;
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_budget_templates')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      defaultAmount: parseFloat(row.default_amount),
    }));
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await this.client
      .from('finance_budget_templates')
      .upsert({
        id: template.id,
        user_id: userId,
        category_id: template.categoryId,
        default_amount: template.defaultAmount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category_id',
      });

    if (error) throw error;
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_budget_templates')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId);

    if (error) throw error;
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    const templates = await this.listBudgetTemplates();
    const monthStr = month.slice(0, 7); // YYYY-MM

    let count = 0;
    for (const template of templates) {
      try {
        await this.upsertBudget({
          categoryId: template.categoryId,
          month: monthStr,
          limit: template.defaultAmount,
        });
        count++;
      } catch (error) {
        // Skip if budget already exists
      }
    }

    return count;
  }
}
