import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Account,
  Budget,
  BudgetTemplate,
  BudgetTemplateInput,
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  CardOffer,
  CardOfferInput,
  Category,
  Goal,
  GoalInput,
  GoalProgressPoint,
  Institution,
  NetPoint,
  Paginated,
  Transaction,
  TransactionInput,
  TxnQuery,
  WelcomeBonus,
  WelcomeBonusInput,
} from '../types';
import type { FinanceAPI } from './api';
import { validateGoalInput, validateTransactionInput } from '../utils/validate';

async function getUid(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('No authenticated user');
  return uid;
}

export class SupabaseApi implements FinanceAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async listInstitutions(): Promise<Institution[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('institutions')
      .select('id,name,logo_url')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, logoUrl: r.logo_url ?? undefined }));
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('accounts')
      .update({
        rewards_balance: updates.rewardsBalance,
        rewards_type: updates.rewardsType,
        base_rewards_rate: updates.baseRewardsRate,
        annual_fee: updates.annualFee,
        annual_fee_due_date: updates.annualFeeDueDate,
      })
      .eq('id', accountId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async listAccounts(): Promise<Account[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('accounts')
      .select('id,name,type,balance,liability,last_updated,institution_id,credit_limit,apr,payment_due_day,minimum_payment,statement_balance,statement_date,annual_fee,annual_fee_due_date,rewards_balance,rewards_type,base_rewards_rate')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      balance: Number(r.balance),
      liability: !!r.liability,
      lastUpdatedISO: new Date(r.last_updated).toISOString(),
      institutionId: r.institution_id ?? undefined,
      creditLimit: r.credit_limit ? Number(r.credit_limit) : undefined,
      apr: r.apr ? Number(r.apr) : undefined,
      paymentDueDay: r.payment_due_day ?? undefined,
      minimumPayment: r.minimum_payment ? Number(r.minimum_payment) : undefined,
      statementBalance: r.statement_balance ? Number(r.statement_balance) : undefined,
      statementDate: r.statement_date ? new Date(r.statement_date).toISOString().split('T')[0] : undefined,
      annualFee: r.annual_fee ? Number(r.annual_fee) : undefined,
      annualFeeDueDate: r.annual_fee_due_date ? new Date(r.annual_fee_due_date).toISOString().split('T')[0] : undefined,
      rewardsBalance: r.rewards_balance ? Number(r.rewards_balance) : undefined,
      rewardsType: r.rewards_type ?? undefined,
      baseRewardsRate: r.base_rewards_rate ? Number(r.base_rewards_rate) : undefined,
    }));
  }

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    const uid = await getUid(this.client);
    const limit = params.limit ?? 50;
    let q = this.client.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(limit);
    if (params.fromISO) q = q.gte('date', params.fromISO);
    if (params.toISO) q = q.lte('date', params.toISO);
    if (params.type) q = q.eq('type', params.type);
    if (params.accountIds?.length) q = q.in('account_id', params.accountIds);
    if (params.categoryIds?.length) q = q.in('category_id', params.categoryIds);
    if (params.text) q = q.ilike('description', `%${params.text}%`);
    if (params.cursor) q = q.lt('id', params.cursor); // simple keyset; assumes uuid sort by date desc not ideal
    const { data, error } = await q;
    if (error) throw error;
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      dateISO: new Date(r.date).toISOString(),
      description: r.description,
      categoryId: r.category_id ?? undefined,
      amount: Number(r.amount),
      type: r.type,
      notes: r.notes ?? undefined,
      merchantName: r.merchant_name ?? undefined,
      confidenceScore: r.confidence_score ? Number(r.confidence_score) : undefined,
      suggestedCategoryId: r.suggested_category_id ?? undefined,
      categorizationRuleId: r.categorization_rule_id ?? undefined,
    }));
    const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined;
    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    txn = await validateTransactionInput(txn);
    const uid = await getUid(this.client);

    // Extract merchant name from description
    const merchantName = this.extractMerchantName(txn.description);

    const row: any = {
      id: txn.id,
      user_id: uid,
      account_id: txn.accountId,
      date: txn.dateISO,
      description: txn.description,
      category_id: txn.categoryId ?? null,
      amount: txn.amount,
      type: txn.type,
      notes: txn.notes ?? null,
      merchant_name: merchantName,
    };
    const { error } = await this.client.from('transactions').upsert(row).select('id').single();
    if (error) throw error;
  }

  /**
   * Bulk update transactions with categorization results
   */
  async bulkCategorizeTransactions(
    updates: Array<{
      id: string;
      categoryId: string;
      confidence: number;
      ruleId: string | null;
      merchantName: string | null;
    }>
  ): Promise<void> {
    const uid = await getUid(this.client);

    // Update each transaction
    for (const update of updates) {
      const { error } = await this.client
        .from('transactions')
        .update({
          category_id: update.categoryId,
          confidence_score: update.confidence,
          categorization_rule_id: update.ruleId,
          merchant_name: update.merchantName,
        })
        .eq('id', update.id)
        .eq('user_id', uid);

      if (error) throw error;
    }
  }

  /**
   * Extract merchant name from transaction description
   */
  private extractMerchantName(description: string): string {
    let normalized = description.trim().toUpperCase();

    // Remove common prefixes
    normalized = normalized.replace(/^(DEBIT|CREDIT|PURCHASE|POS|CARD|PAYMENT|PAYPAL|SQ\s+\*|TST\s+\*)\s+/i, '');

    // Remove trailing numbers
    normalized = normalized.replace(/\s+\d+$/, '');

    // Remove company suffixes
    normalized = normalized.replace(/\s+(LLC|INC|CORP|CO|LTD)\.?$/i, '');

    return normalized.trim();
  }

  async deleteTransaction(id: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client.from('transactions').delete().eq('id', id).eq('user_id', uid);
    if (error) throw error;
  }

  async listBudgets(monthISO: string): Promise<Budget[]> {
    const uid = await getUid(this.client);
    // Ensure month is in YYYY-MM format for query
    const monthDate = monthISO.length === 7 ? monthISO : monthISO.slice(0, 7);

    const { data, error } = await this.client
      .from('budgets')
      .select('id,category_id,month,limit_amount')
      .eq('user_id', uid)
      .eq('month', monthDate);

    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      categoryId: r.category_id,
      month: r.month,
      limit: Number(r.limit_amount)
    }));
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!budget.categoryId) {
      throw new Error('Category ID is required');
    }
    if (!budget.month) {
      throw new Error('Month is required');
    }
    if (typeof budget.limit !== 'number' || budget.limit < 0) {
      throw new Error('Budget limit must be a positive number');
    }

    // Ensure month is in YYYY-MM format
    const monthDate = budget.month.length === 7 ? budget.month : budget.month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    /**
     * Clean database schema (after migration):
     * - id: uuid PRIMARY KEY
     * - user_id: uuid NOT NULL
     * - category_id: uuid NOT NULL REFERENCES categories(id)
     * - month: char(7) NOT NULL (format: YYYY-MM)
     * - limit_amount: numeric NOT NULL (the budget limit)
     *
     * UNIQUE constraint on (user_id, category_id, month)
     */
    const row: any = {
      user_id: uid,
      category_id: budget.categoryId,
      month: monthDate,
      limit_amount: budget.limit,
    };

    // Use upsert with the unique constraint on (user_id, category_id, month)
    const { error } = await this.client
      .from('budgets')
      .upsert(row, {
        onConflict: 'user_id,category_id,month'
      });

    if (error) {
      console.error('Budget upsert error:', error);
      console.error('Row data:', row);
      throw new Error(`Failed to save budget: ${error.message}`);
    }
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    if (!month) {
      throw new Error('Month is required');
    }

    // Ensure month is in YYYY-MM format (database column is char(7))
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('user_id', uid)
      .eq('category_id', categoryId)
      .eq('month', monthDate);

    if (error) {
      console.error('Budget delete error:', error);
      throw new Error(`Failed to delete budget: ${error.message}`);
    }
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('budget_templates')
      .select('id,category_id,default_amount')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      categoryId: r.category_id,
      defaultAmount: Number(r.default_amount),
    }));
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!template.categoryId) {
      throw new Error('Category ID is required');
    }
    if (typeof template.defaultAmount !== 'number' || template.defaultAmount < 0) {
      throw new Error('Default amount must be a positive number');
    }

    const row: any = {
      id: template.id,
      user_id: uid,
      category_id: template.categoryId,
      default_amount: template.defaultAmount,
    };

    const { error } = await this.client
      .from('budget_templates')
      .upsert(row, {
        onConflict: 'user_id,category_id'
      });

    if (error) {
      console.error('Budget template upsert error:', error);
      throw new Error(`Failed to save budget template: ${error.message}`);
    }
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    const uid = await getUid(this.client);

    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const { error } = await this.client
      .from('budget_templates')
      .delete()
      .eq('user_id', uid)
      .eq('category_id', categoryId);

    if (error) {
      console.error('Budget template delete error:', error);
      throw new Error(`Failed to delete budget template: ${error.message}`);
    }
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!month) {
      throw new Error('Month is required');
    }

    // Ensure month is in YYYY-MM format
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    // Call the database function to initialize budgets from templates
    const { data, error } = await this.client.rpc('initialize_budgets_from_templates', {
      p_user_id: uid,
      p_month: monthDate,
    });

    if (error) {
      console.error('Initialize budgets from templates error:', error);
      throw new Error(`Failed to initialize budgets: ${error.message}`);
    }

    return Number(data ?? 0);
  }

  async listCategories(): Promise<Category[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('categories')
      .select('id,name,parent_id,icon,color')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, parentId: r.parent_id ?? undefined, icon: r.icon ?? undefined, color: r.color ?? undefined }));
  }

  async listNetWorth(): Promise<NetPoint[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('networth')
      .select('month,assets,liabilities')
      .eq('user_id', uid)
      .order('month', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ month: r.month, assets: Number(r.assets), liabilities: Number(r.liabilities) }));
  }

  async listGoals(): Promise<Goal[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('goals')
      .select('id,name,target_amount,current_amount,starting_amount,due_date,type,linked_category_id,linked_account_id,track_networth,created_at,updated_at')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      startingAmount: Number(r.starting_amount ?? 0),
      dueDateISO: new Date(r.due_date).toISOString(),
      type: r.type,
      linkedCategoryId: r.linked_category_id ?? undefined,
      linkedAccountId: r.linked_account_id ?? undefined,
      trackNetworth: r.track_networth ?? false,
      createdAtISO: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updatedAtISO: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    }));
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    goal = await validateGoalInput(goal);
    const uid = await getUid(this.client);
    const row: any = {
      id: goal.id,
      user_id: uid,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      starting_amount: goal.startingAmount,
      due_date: goal.dueDateISO,
      type: goal.type,
      linked_category_id: goal.linkedCategoryId ?? null,
      linked_account_id: goal.linkedAccountId ?? null,
      track_networth: goal.trackNetworth ?? false,
    };
    const { error } = await this.client.from('goals').upsert(row).select('id').single();
    if (error) throw error;
  }

  async deleteGoal(goalId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('goal_progress_history')
      .select('recorded_at,amount,note')
      .eq('goal_id', goalId)
      .eq('user_id', uid)
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      dateISO: new Date(r.recorded_at).toISOString(),
      amount: Number(r.amount),
      note: r.note ?? undefined,
    }));
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    const { error} = await this.client.rpc('sync_goal_from_account', {
      p_goal_id: goalId,
    });
    if (error) throw error;
  }

  // Credit Card Benefits API Methods
  async listCardBenefits(accountId: string): Promise<CardBenefit[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_benefits')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      benefitType: r.benefit_type,
      name: r.name,
      description: r.description ?? undefined,
      value: r.value ? Number(r.value) : undefined,
      frequency: r.frequency ?? undefined,
      usedAmount: Number(r.used_amount),
      resetDate: r.reset_date ? new Date(r.reset_date).toISOString().split('T')[0] : undefined,
      active: r.active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async upsertCardBenefit(accountId: string, benefit: CardBenefitInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: any = {
      user_id: uid,
      account_id: accountId,
      benefit_type: benefit.benefitType,
      name: benefit.name,
      description: benefit.description,
      value: benefit.value,
      frequency: benefit.frequency,
      used_amount: benefit.usedAmount,
      reset_date: benefit.resetDate,
      active: benefit.active,
    };
    if (benefit.id) row.id = benefit.id;

    const { error } = await this.client.from('card_benefits').upsert(row);
    if (error) throw error;
  }

  async deleteCardBenefit(benefitId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('card_benefits')
      .delete()
      .eq('id', benefitId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async listCategoryBonuses(accountId: string): Promise<CardCategoryBonus[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_category_bonuses')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('rewards_rate', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      category: r.category,
      rewardsRate: Number(r.rewards_rate),
      isRotating: r.is_rotating,
      startDate: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : undefined,
      endDate: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: any = {
      user_id: uid,
      account_id: accountId,
      category: bonus.category,
      rewards_rate: bonus.rewardsRate,
      is_rotating: bonus.isRotating,
      start_date: bonus.startDate,
      end_date: bonus.endDate,
    };
    if (bonus.id) row.id = bonus.id;

    const { error } = await this.client.from('card_category_bonuses').upsert(row);
    if (error) throw error;
  }

  async listWelcomeBonuses(accountId: string): Promise<WelcomeBonus[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_welcome_bonuses')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('deadline', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      bonusAmount: Number(r.bonus_amount),
      requiredSpend: Number(r.required_spend),
      currentSpend: Number(r.current_spend),
      deadline: new Date(r.deadline).toISOString().split('T')[0],
      completed: r.completed,
      completedDate: r.completed_date ? new Date(r.completed_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: any = {
      user_id: uid,
      account_id: accountId,
      bonus_amount: bonus.bonusAmount,
      required_spend: bonus.requiredSpend,
      current_spend: bonus.currentSpend,
      deadline: bonus.deadline,
      completed: bonus.completed,
      completed_date: bonus.completedDate,
    };
    if (bonus.id) row.id = bonus.id;

    const { error } = await this.client.from('card_welcome_bonuses').upsert(row);
    if (error) throw error;
  }

  async listCardOffers(accountId: string): Promise<CardOffer[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_offers')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      merchant: r.merchant,
      offerType: r.offer_type,
      offerAmount: Number(r.offer_amount),
      requiredSpend: r.required_spend ? Number(r.required_spend) : undefined,
      expirationDate: r.expiration_date ? new Date(r.expiration_date).toISOString().split('T')[0] : undefined,
      activated: r.activated,
      activatedDate: r.activated_date ? new Date(r.activated_date).toISOString().split('T')[0] : undefined,
      redeemed: r.redeemed,
      redeemedDate: r.redeemed_date ? new Date(r.redeemed_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async upsertCardOffer(accountId: string, offer: CardOfferInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: any = {
      user_id: uid,
      account_id: accountId,
      merchant: offer.merchant,
      offer_type: offer.offerType,
      offer_amount: offer.offerAmount,
      required_spend: offer.requiredSpend,
      expiration_date: offer.expirationDate,
      activated: offer.activated,
      activated_date: offer.activatedDate,
      redeemed: offer.redeemed,
      redeemed_date: offer.redeemedDate,
    };
    if (offer.id) row.id = offer.id;

    const { error } = await this.client.from('card_offers').upsert(row);
    if (error) throw error;
  }
}
